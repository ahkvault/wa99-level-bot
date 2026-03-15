import { verifyKey } from "discord-interactions";

// ─── Constants ───────────────────────────────────────────────────────────────
const XP_PER_MESSAGE    = 15;
const LEVEL_BASE        = 100;
const LEVEL_SCALE       = 1.35;
const STREAK_BONUS_XP   = 50;   // base daily streak bonus
const GIVE_XP_DAILY_CAP = 200;  // max XP a member can gift per day
const DECAY_AFTER_DAYS  = 30;   // inactivity days before decay kicks in
const DECAY_RATE        = 0.05; // 5% XP lost per day beyond threshold

const LEVEL_ROLES = {
  5:  "🥉 Recruit",
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
  "Consistency is a superpower. 🧠",
  "The bag keeps growing. So does the rank. 💰",
  "You showed up. Now show out. 🔱",
];

const LEVELUP_BANNERS = [
  "▬▬▬▬▬▬▬▬ ⬆️  LEVEL UP ⬆️ ▬▬▬▬▬▬▬▬",
  "━━━━━━━━━━ 🔥 RANK UP 🔥 ━━━━━━━━━━",
  "▰▰▰▰▰▰▰ ⚡ POWER SURGE ⚡ ▰▰▰▰▰▰▰",
  "══════════ 🏆 MILESTONE 🏆 ══════════",
];

const RANK_COLORS = [
  0x5865f2, // blurple  (lv 1–9)
  0x57f287, // green    (lv 10–19)
  0xfee75c, // yellow   (lv 20–34)
  0xeb459e, // pink     (lv 35–49)
  0xf7b731, // gold     (lv 50+)
];

// ─── XP Math ─────────────────────────────────────────────────────────────────
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
  return `\`${"█".repeat(filled)}${"░".repeat(length - filled)}\``;
}
function getRankColor(level) {
  if (level >= 50) return RANK_COLORS[4];
  if (level >= 35) return RANK_COLORS[3];
  if (level >= 20) return RANK_COLORS[2];
  if (level >= 10) return RANK_COLORS[1];
  return RANK_COLORS[0];
}
function getTierLabel(level) {
  for (const [t, label] of Object.entries(LEVEL_ROLES).reverse()) {
    if (level >= Number(t)) return label;
  }
  return "🌱 Newcomer";
}
function getNextMilestone(level) {
  return Object.keys(LEVEL_ROLES).map(Number).sort((a, b) => a - b).find((m) => m > level) ?? null;
}
function todayUTC() {
  return new Date().toISOString().slice(0, 10);
}
function avatarUrl(user) {
  return user.avatar
    ? `https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}.png?size=256`
    : `https://cdn.discordapp.com/embed/avatars/${Number(user.id) % 5}.png`;
}

// ─── KV Helpers ──────────────────────────────────────────────────────────────
async function getUserData(kv, userId) {
  const raw = await kv.get(`user:${userId}`);
  return raw ? JSON.parse(raw) : {
    xp: 0, level: 0, messages: 0, lastXpAt: 0,
    streak: 0, lastStreakDay: null,
    giveXpUsed: 0, giveXpDate: null,
  };
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
async function getWeeklyLeaderboard(kv) {
  const list = await kv.list({ prefix: "weekly:user:" });
  if (!list.keys.length) return [];
  const users = await Promise.all(
    list.keys.map(async ({ name }) => ({
      id: name.replace("weekly:user:", ""),
      weeklyXp: Number(await kv.get(name)),
    }))
  );
  return users.filter((u) => u.weeklyXp > 0).sort((a, b) => b.weeklyXp - a.weeklyXp).slice(0, 10);
}
async function addWeeklyXP(kv, userId, amount) {
  const current = Number((await kv.get(`weekly:user:${userId}`)) ?? "0");
  await kv.put(`weekly:user:${userId}`, String(current + amount));
}
async function getMultiplierEvent(kv) {
  const raw = await kv.get("event:multiplier");
  if (!raw) return null;
  const ev = JSON.parse(raw);
  if (Date.now() > ev.expiresAt) { await kv.delete("event:multiplier"); return null; }
  return ev;
}

// ─── Streak Logic ─────────────────────────────────────────────────────────────
function updateStreak(data) {
  const today = todayUTC();
  if (data.lastStreakDay === today) return { streakBonus: 0, newDay: false };

  const yesterday = new Date();
  yesterday.setUTCDate(yesterday.getUTCDate() - 1);
  const yesterdayStr = yesterday.toISOString().slice(0, 10);

  let streakBonus = 0;
  if (data.lastStreakDay === yesterdayStr) {
    data.streak = (data.streak || 0) + 1;
    streakBonus = STREAK_BONUS_XP + Math.floor(data.streak / 7) * 25;
  } else {
    data.streak = 1;
  }
  data.lastStreakDay = today;
  return { streakBonus, newDay: true };
}

// ─── Embed Builders ──────────────────────────────────────────────────────────
function buildRankEmbed(user, data, rank) {
  const level = getLevelFromXP(data.xp);
  const curLXP = xpForLevel(level);
  const nxtLXP = xpForLevel(level + 1);
  const prog = data.xp - curLXP;
  const need = nxtLXP - curLXP;
  const pct  = Math.floor((prog / need) * 100);

  return {
    embeds: [{
      color: getRankColor(level),
      author: { name: `${user.username}'s Rank Card`, icon_url: avatarUrl(user) },
      thumbnail: { url: avatarUrl(user) },
      fields: [
        { name: "🏅 Server Rank",  value: `**#${rank}**`,                                        inline: true },
        { name: "⚡ Level",         value: `**${level}**`,                                        inline: true },
        { name: "🎖️ Tier",         value: getTierLabel(level),                                    inline: true },
        { name: "✨ Total XP",      value: `**${data.xp.toLocaleString()}** XP`,                  inline: true },
        { name: "💬 Messages",      value: `**${data.messages.toLocaleString()}**`,                inline: true },
        { name: "🔥 Streak",        value: data.streak > 0 ? `**${data.streak}** days` : "None",  inline: true },
        { name: "📈 Next Level",    value: `**${(need - prog).toLocaleString()}** XP away`,        inline: true },
        {
          name: `Progress to Level ${level + 1} — ${pct}%`,
          value: `${getProgressBar(prog, need)}  **${prog.toLocaleString()} / ${need.toLocaleString()}**`,
          inline: false,
        },
      ],
      footer: { text: "WA99 Clan • Keep grinding 🔥" },
      timestamp: new Date().toISOString(),
    }],
  };
}

function buildLevelUpEmbed(user, newLevel, multiplier = 1, streak = 0) {
  const msg      = LEVELUP_MESSAGES[Math.floor(Math.random() * LEVELUP_MESSAGES.length)];
  const banner   = LEVELUP_BANNERS[Math.floor(Math.random() * LEVELUP_BANNERS.length)];
  const xpToNext = xpForLevel(newLevel + 1) - xpForLevel(newLevel);
  const milestone = LEVEL_ROLES[newLevel];
  const nextMlvl  = getNextMilestone(newLevel);
  const nextMlabel = nextMlvl ? LEVEL_ROLES[nextMlvl] : null;

  return {
    embeds: [{
      color: getRankColor(newLevel),
      title: banner,
      description: [
        `### <@${user.id}> just hit **Level ${newLevel}**!`,
        `> *${msg}*`,
        "",
        multiplier > 1 ? `⚡ **${multiplier}x XP Event** is active — keep grinding!` : "",
        milestone    ? `🏆 **Role unlocked:** ${milestone} — you earned it.`         : "",
      ].filter(Boolean).join("\n").trim(),
      thumbnail: { url: avatarUrl(user) },
      fields: [
        { name: "⚡ New Level",        value: `\`\`\`\n${newLevel}\n\`\`\``,         inline: true },
        { name: "🎖️ Current Tier",     value: getTierLabel(newLevel),                 inline: true },
        { name: "🎯 XP to Next Level", value: `**${xpToNext.toLocaleString()}** XP`,  inline: true },
        ...(streak > 1 ? [{ name: "🔥 Active Streak", value: `**${streak}** days`, inline: true }] : []),
        ...(nextMlabel && nextMlvl !== newLevel
          ? [{ name: "🔭 Next Milestone", value: `${nextMlabel} at **Level ${nextMlvl}** — ${nextMlvl - newLevel} level${nextMlvl - newLevel === 1 ? "" : "s"} away`, inline: false }]
          : []),
      ],
      footer: { text: "WA99 Clan • The grind never stops 🔥" },
      timestamp: new Date().toISOString(),
    }],
  };
}

function buildStreakEmbed(user, streak, bonus) {
  const isMilestone = [7, 14, 30, 60, 100].includes(streak);
  return {
    embeds: [{
      color: isMilestone ? 0xf7b731 : 0xff9500,
      title: isMilestone ? `🔥 ${streak}-DAY STREAK MILESTONE!` : `🔥 Daily Streak Bonus!`,
      description: `<@${user.id}> is on a **${streak}-day streak**!\n+**${bonus} bonus XP** awarded.${isMilestone ? "\n\n🏆 **Milestone reached!** Keep showing up!" : ""}`,
      footer: { text: "WA99 Clan • Show up every day" },
      timestamp: new Date().toISOString(),
    }],
  };
}

function buildLeaderboardEmbed(entries) {
  const medals = ["🥇", "🥈", "🥉"];
  const rows = entries.map((e, i) => {
    const level = getLevelFromXP(e.xp);
    return `${medals[i] ?? `**${i + 1}.**`} <@${e.id}> — **Lv ${level}** · ${e.xp.toLocaleString()} XP`;
  });
  return {
    embeds: [{
      color: 0xf7b731,
      title: "🏆  WA99 Clan Leaderboard",
      description: rows.join("\n") || "No members ranked yet. Start chatting!",
      footer: { text: `Top ${entries.length} members • WA99 Clan` },
      timestamp: new Date().toISOString(),
    }],
  };
}

function buildWeeklyLeaderboardEmbed(entries, weekStart) {
  const medals = ["🥇", "🥈", "🥉"];
  const rows = entries.map((e, i) =>
    `${medals[i] ?? `**${i + 1}.**`} <@${e.id}> — **${e.weeklyXp.toLocaleString()} XP** this week`
  );
  const weekLabel = weekStart
    ? new Date(weekStart).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
    : "Current week";

  return {
    embeds: [{
      color: 0xeb459e,
      title: "📅  WA99 Weekly Leaderboard",
      description: rows.join("\n") || "No activity yet this week. Start chatting!",
      fields: [
        { name: "📆 Week Starting", value: weekLabel,      inline: true },
        { name: "🔄 Resets",        value: "Every Monday", inline: true },
      ],
      footer: { text: "WA99 Clan • Compete every week 🏆" },
      timestamp: new Date().toISOString(),
    }],
  };
}

function buildWeeklyWinnerEmbed(entries) {
  const medals = ["🥇", "🥈", "🥉"];
  const rows = entries.slice(0, 3).map((e, i) =>
    `${medals[i]} <@${e.id}> — **${e.weeklyXp.toLocaleString()} XP**`
  );
  return {
    embeds: [{
      color: 0xf7b731,
      title: "🏆  WEEKLY WRAP-UP — WA99 Clan",
      description: `Another week done. Here are this week's top grinders:\n\n${rows.join("\n")}`,
      fields: [{
        name: "🎉 Big up to the top grinder",
        value: `<@${entries[0].id}> takes the W this week. 👑`,
        inline: false,
      }],
      footer: { text: "WA99 Clan • Weekly board resets every Monday" },
      timestamp: new Date().toISOString(),
    }],
  };
}

function buildXPEventEmbed(multiplier, durationHours, expiresAt) {
  return {
    embeds: [{
      color: 0xfee75c,
      title: "⚡  XP MULTIPLIER EVENT STARTED!",
      description: `Everyone earns **${multiplier}x XP** for the next **${durationHours} hour${durationHours === 1 ? "" : "s"}**!\n\nGet chatting and stack those levels. 🔥`,
      fields: [
        { name: "🔢 Multiplier", value: `**${multiplier}x**`,                          inline: true },
        { name: "⏱️ Duration",   value: `**${durationHours}h**`,                        inline: true },
        { name: "⏰ Expires",    value: `<t:${Math.floor(expiresAt / 1000)}:R>`,         inline: true },
      ],
      footer: { text: "WA99 Clan • XP Event Active 🔥" },
      timestamp: new Date().toISOString(),
    }],
  };
}

// ─── Shared Helpers ───────────────────────────────────────────────────────────
function json(body)    { return new Response(JSON.stringify(body), { headers: { "Content-Type": "application/json" } }); }
function ephemeral(msg){ return json({ type: 4, data: { content: msg, flags: 64 } }); }
function noPerms()     { return ephemeral("❌ You need **Manage Server** permissions to use this command."); }
function isAdmin(interaction) {
  const perms = BigInt(interaction.member?.permissions ?? "0");
  return (perms & BigInt(0x8)) !== BigInt(0) || (perms & BigInt(0x20)) !== BigInt(0);
}

// ─── Slash Command Handlers ───────────────────────────────────────────────────
async function handleRank(interaction, kv) {
  const targetUser =
    interaction.data.resolved?.users?.[interaction.data.options?.[0]?.value] ??
    interaction.member?.user ?? interaction.user;
  const data = await getUserData(kv, targetUser.id);
  const leaderboard = await getLeaderboard(kv);
  const rank = leaderboard.findIndex((e) => e.id === targetUser.id) + 1;
  return json({ type: 4, data: buildRankEmbed(targetUser, data, rank || "?") });
}

async function handleLeaderboard(interaction, kv) {
  return json({ type: 4, data: buildLeaderboardEmbed(await getLeaderboard(kv)) });
}

async function handleWeeklyLeaderboard(interaction, kv) {
  const entries   = await getWeeklyLeaderboard(kv);
  const weekStart = await kv.get("weekly:reset");
  return json({ type: 4, data: buildWeeklyLeaderboardEmbed(entries, weekStart) });
}

async function handleXPEvent(interaction, kv) {
  if (!isAdmin(interaction)) return noPerms();
  const multiplier    = Number(interaction.data.options.find((o) => o.name === "multiplier")?.value ?? 2);
  const durationHours = Number(interaction.data.options.find((o) => o.name === "duration")?.value   ?? 1);
  if (multiplier < 1.5 || multiplier > 10)       return ephemeral("❌ Multiplier must be between 1.5 and 10.");
  if (durationHours < 0.5 || durationHours > 48) return ephemeral("❌ Duration must be between 0.5 and 48 hours.");
  const expiresAt = Date.now() + durationHours * 3_600_000;
  await kv.put("event:multiplier", JSON.stringify({ multiplier, expiresAt }));
  return json({ type: 4, data: buildXPEventEmbed(multiplier, durationHours, expiresAt) });
}

async function handleGiveXP(interaction, kv) {
  const senderId = interaction.member?.user?.id ?? interaction.user?.id;
  const targetId = interaction.data.options.find((o) => o.name === "user")?.value;
  const amount   = Number(interaction.data.options.find((o) => o.name === "amount")?.value ?? 50);

  if (senderId === targetId)                     return ephemeral("❌ You can't give XP to yourself.");
  if (amount < 1 || amount > GIVE_XP_DAILY_CAP) return ephemeral(`❌ Amount must be 1–${GIVE_XP_DAILY_CAP}.`);

  const senderData = await getUserData(kv, senderId);
  const today      = todayUTC();
  if (senderData.giveXpDate !== today) { senderData.giveXpUsed = 0; senderData.giveXpDate = today; }

  const remaining = GIVE_XP_DAILY_CAP - (senderData.giveXpUsed || 0);
  if (amount > remaining) return ephemeral(`❌ You can only give **${remaining} more XP** today (daily cap: ${GIVE_XP_DAILY_CAP}).`);
  if (senderData.xp < amount) return ephemeral(`❌ Not enough XP. You have **${senderData.xp.toLocaleString()} XP**.`);

  senderData.xp         = Math.max(0, senderData.xp - amount);
  senderData.level      = getLevelFromXP(senderData.xp);
  senderData.giveXpUsed = (senderData.giveXpUsed || 0) + amount;
  await setUserData(kv, senderId, senderData);

  const recipientData  = await getUserData(kv, targetId);
  recipientData.xp    += amount;
  recipientData.level  = getLevelFromXP(recipientData.xp);
  await setUserData(kv, targetId, recipientData);

  return json({
    type: 4,
    data: {
      embeds: [{
        color: 0x57f287,
        description: `🎁 <@${senderId}> gifted **${amount} XP** to <@${targetId}>!\n<@${targetId}> now has **${recipientData.xp.toLocaleString()} XP** (Level **${recipientData.level}**).\n\n<@${senderId}> can give **${GIVE_XP_DAILY_CAP - senderData.giveXpUsed} more XP** today.`,
        footer: { text: "WA99 Clan • Spread the love 💚" },
      }],
    },
  });
}

async function handleStreak(interaction, kv) {
  const user  = interaction.member?.user ?? interaction.user;
  const data  = await getUserData(kv, user.id);
  const today = todayUTC();
  const streak      = data.streak || 0;
  const activeToday = data.lastStreakDay === today;
  const color = streak >= 30 ? 0xf7b731 : streak >= 7 ? 0xeb459e : streak >= 3 ? 0x57f287 : 0x5865f2;

  return json({
    type: 4,
    data: {
      embeds: [{
        color,
        title: "🔥 Daily Streak",
        description: streak === 0
          ? `<@${user.id}> hasn't started a streak yet. Chat today to begin!`
          : `<@${user.id}> has a **${streak}-day streak**! ${activeToday ? "✅ Active today." : "⚠️ Chat today to keep it going!"}`,
        fields: [
          { name: "🔥 Current Streak", value: `**${streak}** day${streak === 1 ? "" : "s"}`, inline: true },
          { name: "📅 Last Active",    value: data.lastStreakDay ?? "Never",                  inline: true },
          { name: "🎁 Daily Bonus",    value: `+${STREAK_BONUS_XP} XP base, +25 every 7 days`, inline: false },
        ],
        footer: { text: "WA99 Clan • Show up every day" },
        timestamp: new Date().toISOString(),
      }],
    },
  });
}

async function handleAddXP(interaction, kv) {
  if (!isAdmin(interaction)) return noPerms();
  const targetId = interaction.data.options.find((o) => o.name === "user")?.value;
  const amount   = Number(interaction.data.options.find((o) => o.name === "amount")?.value ?? 100);
  const data     = await getUserData(kv, targetId);
  data.xp        = Math.max(0, data.xp + amount);
  data.level     = getLevelFromXP(data.xp);
  await setUserData(kv, targetId, data);
  return json({
    type: 4,
    data: {
      embeds: [{
        color: amount > 0 ? 0x57f287 : 0xed4245,
        description: `${amount > 0 ? "✅ Added" : "✅ Removed"} **${Math.abs(amount)} XP** ${amount > 0 ? "to" : "from"} <@${targetId}>.\nThey now have **${data.xp.toLocaleString()} XP** (Level **${data.level}**).`,
        footer: { text: "WA99 Clan Admin" },
      }],
    },
  });
}

async function handleResetXP(interaction, kv) {
  if (!isAdmin(interaction)) return ephemeral("❌ Admin only.");
  const targetId = interaction.data.options.find((o) => o.name === "user")?.value;
  await setUserData(kv, targetId, { xp: 0, level: 0, messages: 0, lastXpAt: 0, streak: 0, lastStreakDay: null, giveXpUsed: 0, giveXpDate: null });
  return json({
    type: 4,
    data: {
      embeds: [{ color: 0xed4245, description: `🔄 Reset all XP for <@${targetId}>.`, footer: { text: "WA99 Clan Admin" } }],
    },
  });
}

// ─── Message XP Handler ───────────────────────────────────────────────────────
async function handleMessageXP(body, kv, secret) {
  if (body.secret !== secret) return new Response("Unauthorized", { status: 401 });

  const { userId, channelId, userData: discordUser, messageCount = 1 } = body;

  const data     = await getUserData(kv, userId);
  const oldLevel = getLevelFromXP(data.xp);

  const event      = await getMultiplierEvent(kv);
  const multiplier = event?.multiplier ?? 1;

  const { streakBonus, newDay } = updateStreak(data);

  const countCapped = Math.min(messageCount, 10);
  const earned      = Math.floor(XP_PER_MESSAGE * countCapped * multiplier) + streakBonus;

  data.xp       += earned;
  data.messages += messageCount;
  data.lastXpAt  = Date.now();
  data.level     = getLevelFromXP(data.xp);

  await setUserData(kv, userId, data);
  await addWeeklyXP(kv, userId, earned);

  const leveledUp = data.level > oldLevel;

  return new Response(JSON.stringify({
    levelUp:     leveledUp,
    newLevel:    data.level,
    channelId,
    multiplier,
    streak:      data.streak,
    streakBonus,
    newDay,
    embed:       leveledUp ? buildLevelUpEmbed(discordUser, data.level, multiplier, data.streak) : null,
    streakEmbed: (streakBonus > 0 && newDay) ? buildStreakEmbed(discordUser, data.streak, streakBonus) : null,
  }), { headers: { "Content-Type": "application/json" } });
}

// ─── Weekly Announcement Endpoint (polled by gateway) ────────────────────────
async function handleWeeklyAnnouncement(request, kv, secret) {
  if (request.headers.get("x-secret") !== secret) return new Response("Unauthorized", { status: 401 });
  const raw = await kv.get("weekly:pending_announcement");
  if (!raw) return json({ announcement: null });
  await kv.delete("weekly:pending_announcement");
  const { entries, weekStart } = JSON.parse(raw);
  return json({ announcement: { embed: buildWeeklyWinnerEmbed(entries), weekStart } });
}

// ─── Scheduled Handler (Cron) ─────────────────────────────────────────────────
async function handleScheduled(scheduledTime, kv) {
  const now       = new Date(scheduledTime);
  const dayOfWeek = now.getUTCDay(); // 0=Sun 1=Mon
  const nowMs     = now.getTime();

  // ── Monday: save weekly winner + reset weekly board ──
  if (dayOfWeek === 1) {
    const weeklyEntries = await getWeeklyLeaderboard(kv);
    if (weeklyEntries.length > 0) {
      await kv.put("weekly:pending_announcement", JSON.stringify({
        entries:   weeklyEntries.slice(0, 3),
        weekStart: now.toISOString(),
      }));
    }
    const list = await kv.list({ prefix: "weekly:user:" });
    await Promise.all(list.keys.map(({ name }) => kv.delete(name)));
    await kv.put("weekly:reset", now.toISOString());
    console.log(`Weekly reset done. ${weeklyEntries.length} entries cleared.`);
  }

  // ── Daily: XP decay for inactive users ──
  const thresholdMs = DECAY_AFTER_DAYS * 86_400_000;
  const userList    = await kv.list({ prefix: "user:" });

  for (const { name } of userList.keys) {
    const raw = await kv.get(name);
    if (!raw) continue;
    const data = JSON.parse(raw);
    if (!data.lastXpAt || data.xp === 0) continue;

    const inactiveMs = nowMs - data.lastXpAt;
    if (inactiveMs < thresholdMs) continue;

    const extraDays   = Math.floor((inactiveMs - thresholdMs) / 86_400_000);
    if (extraDays < 1) continue;

    const fraction    = Math.min(extraDays * DECAY_RATE, 0.5);
    const decayAmount = Math.floor(data.xp * fraction);
    if (decayAmount < 1) continue;

    data.xp    = Math.max(0, data.xp - decayAmount);
    data.level = getLevelFromXP(data.xp);
    await kv.put(name, JSON.stringify(data));
    console.log(`Decay: ${name.replace("user:", "")} lost ${decayAmount} XP`);
  }
}

// ─── Main Export ─────────────────────────────────────────────────────────────
export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (url.pathname === "/message-xp" && request.method === "POST") {
      return handleMessageXP(await request.json(), env.LEVELS_KV, env.GATEWAY_SECRET);
    }
    if (url.pathname === "/weekly-announcement" && request.method === "GET") {
      return handleWeeklyAnnouncement(request, env.LEVELS_KV, env.GATEWAY_SECRET);
    }
    if (url.pathname === "/interactions" && request.method === "POST") {
      const sig     = request.headers.get("x-signature-ed25519");
      const ts      = request.headers.get("x-signature-timestamp");
      const rawBody = await request.text();
      if (!await verifyKey(rawBody, sig, ts, env.DISCORD_PUBLIC_KEY)) {
        return new Response("Invalid signature", { status: 401 });
      }
      const interaction = JSON.parse(rawBody);
      if (interaction.type === 1) return json({ type: 1 });
      if (interaction.type === 2) {
        const cmd = interaction.data.name;
        if (cmd === "rank")              return handleRank(interaction, env.LEVELS_KV);
        if (cmd === "leaderboard")       return handleLeaderboard(interaction, env.LEVELS_KV);
        if (cmd === "weeklyleaderboard") return handleWeeklyLeaderboard(interaction, env.LEVELS_KV);
        if (cmd === "xpevent")           return handleXPEvent(interaction, env.LEVELS_KV);
        if (cmd === "givexp")            return handleGiveXP(interaction, env.LEVELS_KV);
        if (cmd === "streak")            return handleStreak(interaction, env.LEVELS_KV);
        if (cmd === "addxp")             return handleAddXP(interaction, env.LEVELS_KV);
        if (cmd === "resetxp")           return handleResetXP(interaction, env.LEVELS_KV);
      }
      return new Response("Unknown interaction", { status: 400 });
    }

    return new Response("WA99 Level Bot is online 🔥", { status: 200 });
  },

  async scheduled(event, env, ctx) {
    ctx.waitUntil(handleScheduled(event.scheduledTime, env.LEVELS_KV));
  },
};