// gateway.js — batches XP every 60s to save Cloudflare Worker requests
import { Client, GatewayIntentBits } from "discord.js";

const WORKER_URL = process.env.WORKER_URL;
const BOT_TOKEN = process.env.DISCORD_BOT_TOKEN;
const GATEWAY_SECRET = process.env.GATEWAY_SECRET;
const FLUSH_INTERVAL_MS = 60_000; // flush every 60 seconds

// ✅ All level-up announcements go here
const LEVELUP_CHANNEL_ID = "1482536684557045963";

const IGNORED_CHANNELS = (process.env.IGNORED_CHANNELS ?? "").split(",").filter(Boolean);

if (!WORKER_URL || !BOT_TOKEN || !GATEWAY_SECRET) {
  console.error("❌ Missing env vars: WORKER_URL, DISCORD_BOT_TOKEN, GATEWAY_SECRET");
  process.exit(1);
}

// In-memory accumulator: userId → { count, channelId, userData }
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
  console.log(`📣 Level-up announcements → #${LEVELUP_CHANNEL_ID}`);
});

// Count messages in memory — zero Worker requests here
client.on("messageCreate", (message) => {
  if (message.author.bot) return;
  if (!message.guildId) return;
  if (IGNORED_CHANNELS.includes(message.channelId)) return;
  if (message.content.length < 2) return;

  const uid = message.author.id;
  const existing = pending.get(uid);

  if (existing) {
    existing.count++;
  } else {
    pending.set(uid, {
      count: 1,
      channelId: message.channelId,
      guildId: message.guildId,
      userData: {
        id: message.author.id,
        username: message.author.username,
        avatar: message.author.avatar,
      },
    });
  }
});

// Flush accumulated XP to the Worker every 60s — ONE request per active user
async function flush() {
  if (pending.size === 0) return;

  const snapshot = [...pending.entries()];
  pending.clear();

  console.log(`🔄 Flushing XP for ${snapshot.length} user(s)...`);

  for (const [userId, data] of snapshot) {
    try {
      const res = await fetch(`${WORKER_URL}/message-xp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          secret: GATEWAY_SECRET,
          userId,
          channelId: data.channelId,
          guildId: data.guildId,
          userData: data.userData,
          messageCount: data.count,
        }),
      });

      if (!res.ok) {
        console.error(`Worker error for ${userId}:`, res.status, await res.text());
        continue;
      }

      const result = await res.json();

      if (result.levelUp && result.embed) {
        // Always post to the dedicated level-up channel, fall back to origin channel
        const announceChannel =
          client.channels.cache.get(LEVELUP_CHANNEL_ID) ??
          client.channels.cache.get(data.channelId);

        if (announceChannel) {
          // Send the ping as plain content so the mention actually notifies,
          // then the rich embed sits right below it
          await announceChannel.send({
            content: `<@${userId}>`,
            ...result.embed,
          });
        }
      }
    } catch (err) {
      console.error(`Flush error for ${userId}:`, err.message);
    }
  }
}

setInterval(flush, FLUSH_INTERVAL_MS);

client.login(BOT_TOKEN);