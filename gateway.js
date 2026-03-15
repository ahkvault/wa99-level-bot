// gateway.js — batches XP every 60s to save Cloudflare Worker requests
import { Client, GatewayIntentBits } from "discord.js";

const WORKER_URL       = process.env.WORKER_URL;
const BOT_TOKEN        = process.env.DISCORD_BOT_TOKEN;
const GATEWAY_SECRET   = process.env.GATEWAY_SECRET;
const FLUSH_INTERVAL_MS = 60_000;

// All level-up / streak / weekly announcements go here
const LEVELUP_CHANNEL_ID = "1482536684557045963";

const IGNORED_CHANNELS = (process.env.IGNORED_CHANNELS ?? "").split(",").filter(Boolean);

if (!WORKER_URL || !BOT_TOKEN || !GATEWAY_SECRET) {
  console.error("❌ Missing env vars: WORKER_URL, DISCORD_BOT_TOKEN, GATEWAY_SECRET");
  process.exit(1);
}

// In-memory accumulator: userId → { count, channelId, guildId, userData }
const pending = new Map();

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
});

client.once("ready", () => {
  console.log(`✅ WA99 Level Gateway connected as ${client.user.tag}`);
  console.log(`⏱️  Flushing XP every ${FLUSH_INTERVAL_MS / 1000}s`);
  console.log(`📣 Announcements → #${LEVELUP_CHANNEL_ID}`);
});

client.on("messageCreate", (message) => {
  if (message.author.bot) return;
  if (!message.guildId)   return;
  if (IGNORED_CHANNELS.includes(message.channelId)) return;
  if (message.content.length < 2) return;

  const uid      = message.author.id;
  const existing = pending.get(uid);
  if (existing) {
    existing.count++;
  } else {
    pending.set(uid, {
      count: 1,
      channelId: message.channelId,
      guildId:   message.guildId,
      userData: {
        id:       message.author.id,
        username: message.author.username,
        avatar:   message.author.avatar,
      },
    });
  }
});

// Helper — get the announcement channel, fall back to null
function getAnnounceChannel() {
  return client.channels.cache.get(LEVELUP_CHANNEL_ID) ?? null;
}

// Check if the worker has a pending weekly winner announcement
async function checkWeeklyAnnouncement() {
  try {
    const res = await fetch(`${WORKER_URL}/weekly-announcement`, {
      headers: { "x-secret": GATEWAY_SECRET },
    });
    if (!res.ok) return;
    const { announcement } = await res.json();
    if (!announcement) return;
    const channel = getAnnounceChannel();
    if (channel) {
      await channel.send(announcement.embed);
      console.log("📅 Posted weekly winner announcement.");
    }
  } catch (err) {
    console.error("Weekly announcement check failed:", err.message);
  }
}

// Check if an admin queued an announcement via /announce
async function checkAdminAnnouncement() {
  try {
    const res = await fetch(`${WORKER_URL}/admin-announcement`, {
      headers: { "x-secret": GATEWAY_SECRET },
    });
    if (!res.ok) return;
    const { announcement } = await res.json();
    if (!announcement) return;
    const channel = getAnnounceChannel();
    if (channel) {
      await channel.send(announcement);
      console.log("📣 Posted admin announcement.");
    }
  } catch (err) {
    console.error("Admin announcement check failed:", err.message);
  }
}

async function flush() {
  // Check for weekly winner and admin announcements each flush cycle
  await checkWeeklyAnnouncement();
  await checkAdminAnnouncement();

  if (pending.size === 0) return;

  const snapshot = [...pending.entries()];
  pending.clear();
  console.log(`🔄 Flushing XP for ${snapshot.length} user(s)...`);

  const channel = getAnnounceChannel();

  for (const [userId, data] of snapshot) {
    try {
      const res = await fetch(`${WORKER_URL}/message-xp`, {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          secret:       GATEWAY_SECRET,
          userId,
          channelId:    data.channelId,
          guildId:      data.guildId,
          userData:     data.userData,
          messageCount: data.count,
        }),
      });

      if (!res.ok) {
        console.error(`Worker error for ${userId}:`, res.status, await res.text());
        continue;
      }

      const result = await res.json();

      // Level-up embed
      if (result.levelUp && result.embed && channel) {
        await channel.send({ content: `<@${userId}>`, ...result.embed });
      }

      // Streak bonus embed (only on the first message of a new day)
      if (result.streakEmbed && channel) {
        await channel.send(result.streakEmbed);
      }

    } catch (err) {
      console.error(`Flush error for ${userId}:`, err.message);
    }
  }
}

// Ping the worker every 5 minutes to keep it warm and avoid cold start timeouts
async function keepAlive() {
  try {
    const res = await fetch(WORKER_URL);
    if (res.ok) console.log("🏓 Worker keepalive ping sent.");
  } catch (err) {
    console.error("Keepalive ping failed:", err.message);
  }
}

setInterval(keepAlive, 30 * 1000); // every 30 seconds — Cloudflare goes cold fast
setInterval(flush, FLUSH_INTERVAL_MS);

client.login(BOT_TOKEN);