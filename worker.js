import { verifyKey } from "discord-interactions";

// ─── Constants ──────────────────────────────────────────────────────────────
const XP_PER_MESSAGE = 15;
const XP_COOLDOWN_MS = 60_000; // 1 message/min counts for XP
const LEVEL_BASE = 100;
const LEVEL_SCALE = 1.35;

const LEVEL_ROLES = {
  5: "🥉 Recruit",
  10: "🥈 Soldier",
  20: "🥇 Veteran",
  35: "💎 Elite",
  50: "👑 Legend",
};

const LEVELUP_MESSAGES = [
  "Going up! The grind is paying off.",
  "Another level, another W. Keep it up!",
  "WA99 recognizes the dedication. 💪",
  "From the bottom to the top. Let's go!",
  "The clan is watching. Don't stop now.",
  "Level up! You're built different fr.",
  "We don't stop, we level up. 🔥",
];

const RANK_COLORS = [
  0x5865f2, // blurple  (lv 1–9)
  0x57f287, // green    (lv 10–19)
  0xfee75c, // yellow   (lv 20–34)
  0xeb459e, // pink     (lv 35–49)
  0xf7b731, // gold     (lv 50+)
];

// ─── XP Math ────────────────────────────────────────────────────────────────
function xpForLevel(level) {
  return Math.floor(LEVEL_BASE * Math.pow(level, LEVEL_SCALE));
}

function getLevelFromXP(xp) {
  let level = 0;
  while (xp >= xpForLevel(level + 1)) level++;
  return level;
}

function getProgressBar(current, total, length = 16) {
  const filled = Math.round((current / total) * length);
  const empty = length - filled;
  const bar =
    "█".repeat(filled) + "░".repeat(empty);
  return `\`${bar}\``;
}

function getRankColor(level) {
  if (level >= 50) return RANK_COLORS[4];
  if (level >= 35) return RANK_COLORS[3];
  if (level >= 20) return RANK_COLORS[2];
  if (level >= 10) return RANK_COLORS[1];
  return RANK_COLORS[0];
}

function getTierLabel(level) {
  const tiers = Object.entries(LEVEL_ROLES).reverse();
  for (const [threshold, label] of tiers) {
    if (level >= Number(threshold)) return label;
  }
  return "🌱 Newcomer";
}

// ─── KV Helpers ─────────────────────────────────────────────────────────────
async function getUserData(kv, userId) {
  const raw = await kv.get(`user:${userId}`);
  return raw
    ? JSON.parse(raw)
    : { xp: 0, level: 0, messages: 0, lastXpAt: 0 };
}

async function setUserData(kv, userId, data) {
  await kv.put(`user:${userId}`, JSON.stringify(data));
}

async function getLeaderboard(kv) {
  const list = await kv.list({ prefix: "user:" });
  const users = await Promise.all(
    list.keys.map(async ({ name }) => {
      const data = JSON.parse(await kv.get(name));
      return { id: name.replace("user:", ""), ...data };
    })
  );
  return users.sort((a, b) => b.xp - a.xp).slice(0, 10);
}

// ─── Embed Builders ─────────────────────────────────────────────────────────
function buildRankEmbed(user, data, rank) {
  const level = getLevelFromXP(data.xp);
  const currentLevelXP = xpForLevel(level);
  const nextLevelXP = xpForLevel(level + 1);
  const progressXP = data.xp - currentLevelXP;
  const neededXP = nextLevelXP - currentLevelXP;
  const progressPct = Math.floor((progressXP / neededXP) * 100);
  const bar = getProgressBar(progressXP, neededXP);
  const tier = getTierLabel(level);
  const color = getRankColor(level);

  return {
    embeds: [
      {
        color,
        author: {
          name: `${user.username}'s Rank Card`,
          icon_url: user.avatar
            ? `https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}.png`
            : `https://cdn.discordapp.com/embed/avatars/${Number(user.id) % 5}.png`,
        },
        thumbnail: {
          url: user.avatar
            ? `https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}.png?size=256`
            : `https://cdn.discordapp.com/embed/avatars/${Number(user.id) % 5}.png`,
        },
        fields: [
          {
            name: "🏅 Server Rank",
            value: `**#${rank}**`,
            inline: true,
          },
          {
            name: "⚡ Level",
            value: `**${level}**`,
            inline: true,
          },
          {
            name: "🎖️ Tier",
            value: tier,
            inline: true,
          },
          {
            name: "✨ Total XP",
            value: `**${data.xp.toLocaleString()}** XP`,
            inline: true,
          },
          {
            name: "💬 Messages",
            value: `**${data.messages.toLocaleString()}**`,
            inline: true,
          },
          {
            name: "📈 Next Level",
            value: `**${(neededXP - progressXP).toLocaleString()}** XP away`,
            inline: true,
          },
          {
            name: `Progress to Level ${level + 1} — ${progressPct}%`,
            value: `${bar}  **${progressXP.toLocaleString()} / ${neededXP.toLocaleString()}**`,
            inline: false,
          },
        ],
        footer: {
          text: "WA99 Clan • Keep grinding 🔥",
        },
        timestamp: new Date().toISOString(),
      },
    ],
  };
}

function buildLevelUpEmbed(user, newLevel) {
  const msg = LEVELUP_MESSAGES[Math.floor(Math.random() * LEVELUP_MESSAGES.length)];
  const tier = getTierLabel(newLevel);
  const color = getRankColor(newLevel);
  const xpNext = xpForLevel(newLevel + 1) - xpForLevel(newLevel);

  const milestoneRole = LEVEL_ROLES[newLevel];

  return {
    embeds: [
      {
        color,
        title: `⬆️  LEVEL UP!`,
        description: `<@${user.id}> just hit **Level ${newLevel}**! ${msg}`,
        thumbnail: {
          url: user.avatar
            ? `https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}.png?size=256`
            : `https://cdn.discordapp.com/embed/avatars/${Number(user.id) % 5}.png`,
        },
        fields: [
          {
            name: "🎖️ Current Tier",
            value: tier,
            inline: true,
          },
          {
            name: "⚡ New Level",
            value: `**${newLevel}**`,
            inline: true,
          },
          {
            name: "🎯 Next Milestone",
            value: `${xpNext.toLocaleString()} XP to Level ${newLevel + 1}`,
            inline: true,
          },
          ...(milestoneRole
            ? [
                {
                  name: "🏆 Role Unlocked!",
                  value: milestoneRole,
                  inline: false,
                },
              ]
            : []),
        ],
        footer: {
          text: "WA99 Clan • The grind never stops",
        },
        timestamp: new Date().toISOString(),
      },
    ],
  };
}

function buildLeaderboardEmbed(entries, guildName) {
  const medals = ["🥇", "🥈", "🥉"];
  const rows = entries.map((e, i) => {
    const level = getLevelFromXP(e.xp);
    const icon = medals[i] ?? `**${i + 1}.**`;
    return `${icon} <@${e.id}> — **Lv ${level}** · ${e.xp.toLocaleString()} XP`;
  });

  return {
    embeds: [
      {
        color: 0xf7b731,
        title: "🏆  WA99 Clan Leaderboard",
        description:
          rows.join("\n") || "No members ranked yet. Start chatting!",
        footer: {
          text: `Top ${entries.length} members • WA99 Clan`,
        },
        timestamp: new Date().toISOString(),
      },
    ],
  };
}

// ─── Slash Command Handlers ──────────────────────────────────────────────────
async function handleRank(interaction, kv) {
  const targetUser =
    interaction.data.resolved?.users?.[
      interaction.data.options?.[0]?.value
    ] ?? interaction.member?.user ?? interaction.user;

  const data = await getUserData(kv, targetUser.id);
  const leaderboard = await getLeaderboard(kv);
  const rank = leaderboard.findIndex((e) => e.id === targetUser.id) + 1;

  return new Response(
    JSON.stringify({
      type: 4,
      data: buildRankEmbed(targetUser, data, rank || "?"),
    }),
    { headers: { "Content-Type": "application/json" } }
  );
}

async function handleLeaderboard(interaction, kv) {
  const entries = await getLeaderboard(kv);
  return new Response(
    JSON.stringify({
      type: 4,
      data: buildLeaderboardEmbed(entries),
    }),
    { headers: { "Content-Type": "application/json" } }
  );
}

async function handleAddXP(interaction, kv) {
  // Admin only — check role in guild
  const memberRoles = interaction.member?.roles ?? [];
  const adminRoleId = interaction.data.options?.find(
    (o) => o.name === "admin_role"
  )?.value;

  // Basic permission check — user must have MANAGE_GUILD (0x20) or ADMINISTRATOR (0x8)
  const perms = BigInt(interaction.member?.permissions ?? "0");
  const isAdmin =
    (perms & BigInt(0x8)) !== BigInt(0) ||
    (perms & BigInt(0x20)) !== BigInt(0);

  if (!isAdmin) {
    return new Response(
      JSON.stringify({
        type: 4,
        data: {
          content: "❌ You need **Manage Server** permissions to use this command.",
          flags: 64,
        },
      }),
      { headers: { "Content-Type": "application/json" } }
    );
  }

  const targetId = interaction.data.options.find((o) => o.name === "user")?.value;
  const amount = interaction.data.options.find((o) => o.name === "amount")?.value ?? 100;
  const targetUser = interaction.data.resolved?.users?.[targetId];

  const data = await getUserData(kv, targetId);
  const oldLevel = getLevelFromXP(data.xp);
  data.xp = Math.max(0, data.xp + Number(amount));
  const newLevel = getLevelFromXP(data.xp);
  data.level = newLevel;
  await setUserData(kv, targetId, data);

  return new Response(
    JSON.stringify({
      type: 4,
      data: {
        embeds: [
          {
            color: amount > 0 ? 0x57f287 : 0xed4245,
            description: `${amount > 0 ? "✅ Added" : "✅ Removed"} **${Math.abs(amount)} XP** ${amount > 0 ? "to" : "from"} <@${targetId}>.\nThey now have **${data.xp.toLocaleString()} XP** (Level **${newLevel}**).`,
            footer: { text: "WA99 Clan Admin" },
          },
        ],
      },
    }),
    { headers: { "Content-Type": "application/json" } }
  );
}

async function handleResetXP(interaction, kv) {
  const perms = BigInt(interaction.member?.permissions ?? "0");
  const isAdmin =
    (perms & BigInt(0x8)) !== BigInt(0) ||
    (perms & BigInt(0x20)) !== BigInt(0);

  if (!isAdmin) {
    return new Response(
      JSON.stringify({
        type: 4,
        data: { content: "❌ Admin only.", flags: 64 },
      }),
      { headers: { "Content-Type": "application/json" } }
    );
  }

  const targetId = interaction.data.options.find((o) => o.name === "user")?.value;
  await setUserData(kv, targetId, { xp: 0, level: 0, messages: 0, lastXpAt: 0 });

  return new Response(
    JSON.stringify({
      type: 4,
      data: {
        embeds: [
          {
            color: 0xed4245,
            description: `🔄 Reset all XP for <@${targetId}>.`,
            footer: { text: "WA99 Clan Admin" },
          },
        ],
      },
    }),
    { headers: { "Content-Type": "application/json" } }
  );
}

// ─── Message XP Handler (called by gateway forwarder) ───────────────────────
async function handleMessageXP(body, kv, secret) {
  // Validate the shared secret from gateway forwarder
  if (body.secret !== secret) {
    return new Response("Unauthorized", { status: 401 });
  }

  const { userId, channelId, guildId, userData: discordUser, messageCount = 1 } = body;
  const now = Date.now();

  const data = await getUserData(kv, userId);
  const oldLevel = getLevelFromXP(data.xp);

  // Cap at 10 messages per flush to prevent spam abuse
  const countCapped = Math.min(messageCount, 10);
  data.xp += XP_PER_MESSAGE * countCapped;
  data.messages += messageCount;
  data.lastXpAt = now;
  const newLevel = getLevelFromXP(data.xp);
  data.level = newLevel;

  await setUserData(kv, userId, data);

  const leveledUp = newLevel > oldLevel;

  return new Response(
    JSON.stringify({
      levelUp: leveledUp,
      newLevel,
      channelId,
      embed: leveledUp ? buildLevelUpEmbed(discordUser, newLevel) : null,
    }),
    { headers: { "Content-Type": "application/json" } }
  );
}

// ─── Main Handler ────────────────────────────────────────────────────────────
export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    // Gateway forwarder endpoint
    if (url.pathname === "/message-xp" && request.method === "POST") {
      const body = await request.json();
      return handleMessageXP(body, env.LEVELS_KV, env.GATEWAY_SECRET);
    }

    // Discord interactions endpoint
    if (url.pathname === "/interactions" && request.method === "POST") {
      const signature = request.headers.get("x-signature-ed25519");
      const timestamp = request.headers.get("x-signature-timestamp");
      const rawBody = await request.text();

      // Verify Discord signature
      const isValid = await verifyKey(
        rawBody,
        signature,
        timestamp,
        env.DISCORD_PUBLIC_KEY
      );

      if (!isValid) {
        return new Response("Invalid signature", { status: 401 });
      }

      const interaction = JSON.parse(rawBody);

      // PING
      if (interaction.type === 1) {
        return new Response(JSON.stringify({ type: 1 }), {
          headers: { "Content-Type": "application/json" },
        });
      }

      // Slash commands
      if (interaction.type === 2) {
        const commandName = interaction.data.name;

        if (commandName === "rank") return handleRank(interaction, env.LEVELS_KV);
        if (commandName === "leaderboard") return handleLeaderboard(interaction, env.LEVELS_KV);
        if (commandName === "addxp") return handleAddXP(interaction, env.LEVELS_KV);
        if (commandName === "resetxp") return handleResetXP(interaction, env.LEVELS_KV);
      }

      return new Response("Unknown interaction", { status: 400 });
    }

    return new Response("WA99 Level Bot is online 🔥", { status: 200 });
  },
};