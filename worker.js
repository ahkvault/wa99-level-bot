import { verifyKey } from "discord-interactions";

// ─── Constants ───────────────────────────────────────────────────────────────
const XP_PER_MESSAGE     = 15;
const COINS_PER_FLUSH    = 5;   // coins earned per flush batch
const LEVEL_BASE         = 100;
const LEVEL_SCALE        = 1.35;
const STREAK_BONUS_XP    = 50;
const GIVE_XP_DAILY_CAP  = 200;
const DECAY_AFTER_DAYS   = 30;
const DECAY_RATE         = 0.05;
const DAILY_COINS_MIN    = 100;
const DAILY_COINS_MAX    = 300;

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
  0x5865f2,
  0x57f287,
  0xfee75c,
  0xeb459e,
  0xf7b731,
];

// ─── Shop Items ──────────────────────────────────────────────────────────────
const SHOP_ITEMS = {
  xp_potion: {
    id: "xp_potion",
    name: "🧪 XP Potion",
    cost: 100,
    description: "Instantly gain **+500 XP**",
    emoji: "🧪",
  },
  xp_elixir: {
    id: "xp_elixir",
    name: "⚗️ XP Elixir",
    cost: 350,
    description: "Instantly gain **+2,500 XP**",
    emoji: "⚗️",
  },
  streak_shield: {
    id: "streak_shield",
    name: "🛡️ Streak Shield",
    cost: 200,
    description: "Survive **one missed day** without losing your streak",
    emoji: "🛡️",
  },
  personal_boost: {
    id: "personal_boost",
    name: "⚡ Personal 2x Boost",
    cost: 500,
    description: "**2x XP** from your own messages for **1 hour**",
    emoji: "⚡",
  },
  loot_box: {
    id: "loot_box",
    name: "🎁 Loot Box",
    cost: 150,
    description: "Random reward — coins, XP, or a boost. Could be huge!",
    emoji: "🎁",
  },
};

// ─── Slots Config ────────────────────────────────────────────────────────────
const SLOT_SYMBOLS = ["🍒", "🍋", "🍊", "🍇", "⭐", "💎", "7️⃣"];
const SLOT_WEIGHTS = [30, 25, 20, 15, 6, 3, 1]; // rarity weights

const SLOT_PAYOUTS = {
  "7️⃣": 10,
  "💎": 7,
  "⭐": 5,
  "🍇": 4,
  "🍊": 3,
  "🍋": 2.5,
  "🍒": 2,
};

// ─── XP / Level Math ─────────────────────────────────────────────────────────
function xpForLevel(l)  { return Math.floor(LEVEL_BASE * Math.pow(l, LEVEL_SCALE)); }
function getLevelFromXP(xp) {
  let l = 0;
  while (xp >= xpForLevel(l + 1)) l++;
  return l;
}
function getProgressBar(cur, tot, len = 16) {
  const f = Math.round((cur / tot) * len);
  return `\`${"█".repeat(f)}${"░".repeat(len - f)}\``;
}
function getRankColor(l) {
  if (l >= 50) return RANK_COLORS[4];
  if (l >= 35) return RANK_COLORS[3];
  if (l >= 20) return RANK_COLORS[2];
  if (l >= 10) return RANK_COLORS[1];
  return RANK_COLORS[0];
}
function getTierLabel(l) {
  for (const [t, label] of Object.entries(LEVEL_ROLES).reverse())
    if (l >= Number(t)) return label;
  return "🌱 Newcomer";
}
function getNextMilestone(l) {
  return Object.keys(LEVEL_ROLES).map(Number).sort((a,b)=>a-b).find(m=>m>l) ?? null;
}
function todayUTC() { return new Date().toISOString().slice(0, 10); }
function avatarUrl(u) {
  return u.avatar
    ? `https://cdn.discordapp.com/avatars/${u.id}/${u.avatar}.png?size=256`
    : `https://cdn.discordapp.com/embed/avatars/${Number(u.id) % 5}.png`;
}
function randInt(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min; }

// ─── Weighted Random for Slots ───────────────────────────────────────────────
function weightedRandom(symbols, weights) {
  const total = weights.reduce((a, b) => a + b, 0);
  let r = Math.random() * total;
  for (let i = 0; i < symbols.length; i++) {
    r -= weights[i];
    if (r <= 0) return symbols[i];
  }
  return symbols[symbols.length - 1];
}

function spinSlots() {
  return [
    weightedRandom(SLOT_SYMBOLS, SLOT_WEIGHTS),
    weightedRandom(SLOT_SYMBOLS, SLOT_WEIGHTS),
    weightedRandom(SLOT_SYMBOLS, SLOT_WEIGHTS),
  ];
}

function calcSlotPayout(reels, bet) {
  const [a, b, c] = reels;
  if (a === b && b === c) {
    const mult = SLOT_PAYOUTS[a] ?? 2;
    return { multiplier: mult, coins: Math.floor(bet * mult), type: "jackpot" };
  }
  if (a === b || b === c || a === c) {
    return { multiplier: 1.5, coins: Math.floor(bet * 1.5), type: "pair" };
  }
  return { multiplier: 0, coins: 0, type: "loss" };
}

// ─── KV Helpers ──────────────────────────────────────────────────────────────
async function getUserData(kv, userId) {
  const raw = await kv.get(`user:${userId}`);
  return raw ? JSON.parse(raw) : {
    xp: 0, level: 0, messages: 0, lastXpAt: 0,
    streak: 0, lastStreakDay: null,
    giveXpUsed: 0, giveXpDate: null,
    coins: 0, lastDailyAt: null,
    streakShield: false,
    personalBoostExpiresAt: null,
  };
}
async function setUserData(kv, userId, data) {
  await kv.put(`user:${userId}`, JSON.stringify(data));
}
async function getLeaderboard(kv) {
  const list = await kv.list({ prefix: "user:" });
  const users = await Promise.all(
    list.keys.map(async ({ name }) => {
      const d = JSON.parse(await kv.get(name));
      return { id: name.replace("user:", ""), ...d };
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
  return users.filter(u => u.weeklyXp > 0).sort((a, b) => b.weeklyXp - a.weeklyXp).slice(0, 10);
}
async function addWeeklyXP(kv, userId, amount) {
  const cur = Number((await kv.get(`weekly:user:${userId}`)) ?? "0");
  await kv.put(`weekly:user:${userId}`, String(cur + amount));
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
  const yStr = yesterday.toISOString().slice(0, 10);
  let streakBonus = 0;
  if (data.lastStreakDay === yStr) {
    data.streak = (data.streak || 0) + 1;
    streakBonus = STREAK_BONUS_XP + Math.floor(data.streak / 7) * 25;
  } else if (data.streakShield && data.lastStreakDay) {
    // shield consumed — preserve streak
    data.streak = (data.streak || 0) + 1;
    data.streakShield = false;
    streakBonus = STREAK_BONUS_XP;
  } else {
    data.streak = 1;
  }
  data.lastStreakDay = today;
  return { streakBonus, newDay: true };
}

// ─── Loot Box ────────────────────────────────────────────────────────────────
function openLootBox(data) {
  const roll = Math.random();
  let reward, description;

  if (roll < 0.40) {
    const coins = randInt(50, 200);
    data.coins += coins;
    reward = `💰 **${coins} Coins**`;
    description = "Some coins! Not bad.";
  } else if (roll < 0.65) {
    const xp = randInt(200, 800);
    data.xp += xp;
    data.level = getLevelFromXP(data.xp);
    reward = `✨ **${xp} XP**`;
    description = "A solid XP boost!";
  } else if (roll < 0.80) {
    const coins = randInt(300, 600);
    data.coins += coins;
    reward = `💰 **${coins} Coins**`;
    description = "Nice haul!";
  } else if (roll < 0.90) {
    const xp = randInt(1000, 2500);
    data.xp += xp;
    data.level = getLevelFromXP(data.xp);
    reward = `✨ **${xp} XP**`;
    description = "Big XP drop! 🔥";
  } else if (roll < 0.96) {
    data.streakShield = true;
    reward = "🛡️ **Streak Shield**";
    description = "Your streak is now protected for one missed day!";
  } else if (roll < 0.99) {
    data.personalBoostExpiresAt = Date.now() + 3_600_000;
    reward = "⚡ **Personal 2x Boost**";
    description = "2x XP from your messages for the next hour!";
  } else {
    const coins = randInt(1000, 2000);
    data.coins += coins;
    reward = `💰 **${coins} Coins** — JACKPOT!`;
    description = "🎰 You hit the jackpot!!! 👑";
  }

  return { reward, description };
}

// ─── Embed Builders ──────────────────────────────────────────────────────────
function buildRankEmbed(user, data, rank) {
  const level = getLevelFromXP(data.xp);
  const curLXP = xpForLevel(level);
  const nxtLXP = xpForLevel(level + 1);
  const prog = data.xp - curLXP;
  const need = nxtLXP - curLXP;
  const pct  = Math.floor((prog / need) * 100);
  const hasBoost = data.personalBoostExpiresAt && Date.now() < data.personalBoostExpiresAt;

  return {
    embeds: [{
      color: getRankColor(level),
      author: { name: `${user.username}'s Rank Card`, icon_url: avatarUrl(user) },
      thumbnail: { url: avatarUrl(user) },
      fields: [
        { name: "🏅 Rank",     value: `**#${rank}**`,                                         inline: true },
        { name: "⚡ Level",    value: `**${level}**`,                                          inline: true },
        { name: "🎖️ Tier",    value: getTierLabel(level),                                      inline: true },
        { name: "✨ Total XP", value: `**${data.xp.toLocaleString()}** XP`,                    inline: true },
        { name: "💰 Coins",   value: `**${(data.coins||0).toLocaleString()}**`,                inline: true },
        { name: "🔥 Streak",  value: data.streak > 0 ? `**${data.streak}** days${data.streakShield ? " 🛡️" : ""}` : "None", inline: true },
        { name: "💬 Messages",value: `**${data.messages.toLocaleString()}**`,                  inline: true },
        { name: "📈 To Next", value: `**${(need - prog).toLocaleString()}** XP away`,          inline: true },
        ...(hasBoost ? [{ name: "⚡ Active Boost", value: `2x until <t:${Math.floor(data.personalBoostExpiresAt/1000)}:R>`, inline: true }] : []),
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
        { name: "⚡ New Level",        value: `\`\`\`\n${newLevel}\n\`\`\``,          inline: true },
        { name: "🎖️ Current Tier",     value: getTierLabel(newLevel),                  inline: true },
        { name: "🎯 XP to Next",       value: `**${xpToNext.toLocaleString()}** XP`,   inline: true },
        ...(streak > 1 ? [{ name: "🔥 Streak", value: `**${streak}** days`, inline: true }] : []),
        ...(nextMlabel && nextMlvl !== newLevel
          ? [{ name: "🔭 Next Milestone", value: `${nextMlabel} at **Lv ${nextMlvl}** — ${nextMlvl - newLevel} level${nextMlvl - newLevel === 1 ? "" : "s"} away`, inline: false }]
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
      fields: [{ name: "🎉 Top grinder", value: `<@${entries[0].id}> takes the W this week. 👑`, inline: false }],
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
        { name: "🔢 Multiplier", value: `**${multiplier}x**`,                        inline: true },
        { name: "⏱️ Duration",   value: `**${durationHours}h**`,                      inline: true },
        { name: "⏰ Expires",    value: `<t:${Math.floor(expiresAt / 1000)}:R>`,       inline: true },
      ],
      footer: { text: "WA99 Clan • XP Event Active 🔥" },
      timestamp: new Date().toISOString(),
    }],
  };
}

function buildShopEmbed(userCoins) {
  const rows = Object.values(SHOP_ITEMS).map(item =>
    `${item.emoji} **${item.name}** — \`${item.cost} coins\`\n┗ ${item.description}\n┗ \`/buy item:${item.id}\``
  );
  return {
    embeds: [{
      color: 0x57f287,
      title: "🏪  WA99 Clan Shop",
      description: rows.join("\n\n"),
      fields: [{ name: "💰 Your Balance", value: `**${userCoins.toLocaleString()} coins**`, inline: false }],
      footer: { text: "Earn coins by chatting • WA99 Clan" },
      timestamp: new Date().toISOString(),
    }],
  };
}

// ─── Shared Helpers ───────────────────────────────────────────────────────────
function json(body)     { return new Response(JSON.stringify(body), { headers: { "Content-Type": "application/json" } }); }
function ephemeral(msg) { return json({ type: 4, data: { content: msg, flags: 64 } }); }
function noPerms()      { return ephemeral("❌ You need **Manage Server** permissions to use this command."); }
function isAdmin(i)     {
  const p = BigInt(i.member?.permissions ?? "0");
  return (p & BigInt(0x8)) !== BigInt(0) || (p & BigInt(0x20)) !== BigInt(0);
}

// ─── Slash Handlers ───────────────────────────────────────────────────────────
async function handleRank(interaction, kv) {
  const targetUser =
    interaction.data.resolved?.users?.[interaction.data.options?.[0]?.value] ??
    interaction.member?.user ?? interaction.user;
  const data = await getUserData(kv, targetUser.id);
  const lb   = await getLeaderboard(kv);
  const rank = lb.findIndex(e => e.id === targetUser.id) + 1;
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
          { name: "🔥 Streak",     value: `**${streak}** day${streak === 1 ? "" : "s"}`,      inline: true },
          { name: "🛡️ Shield",     value: data.streakShield ? "Active ✅" : "None",            inline: true },
          { name: "📅 Last Active",value: data.lastStreakDay ?? "Never",                        inline: true },
          { name: "🎁 Daily Bonus",value: `+${STREAK_BONUS_XP} XP base, +25 every 7 days`,    inline: false },
        ],
        footer: { text: "WA99 Clan • Show up every day" },
        timestamp: new Date().toISOString(),
      }],
    },
  });
}

async function handleBalance(interaction, kv) {
  const user = interaction.member?.user ?? interaction.user;
  const data = await getUserData(kv, user.id);
  return json({
    type: 4,
    data: {
      embeds: [{
        color: 0x57f287,
        author: { name: `${user.username}'s Balance`, icon_url: avatarUrl(user) },
        fields: [
          { name: "💰 Coins",       value: `**${(data.coins||0).toLocaleString()}**`,           inline: true },
          { name: "✨ Total XP",    value: `**${data.xp.toLocaleString()}**`,                   inline: true },
          { name: "📅 Daily Claim", value: data.lastDailyAt === todayUTC() ? "Claimed ✅" : "Available 🎁", inline: true },
        ],
        footer: { text: "WA99 Clan Shop • /shop to browse" },
        timestamp: new Date().toISOString(),
      }],
    },
  });
}

async function handleShop(interaction, kv) {
  const user = interaction.member?.user ?? interaction.user;
  const data = await getUserData(kv, user.id);
  return json({ type: 4, data: buildShopEmbed(data.coins || 0) });
}

async function handleBuy(interaction, kv) {
  const user   = interaction.member?.user ?? interaction.user;
  const itemId = interaction.data.options.find(o => o.name === "item")?.value;
  const item   = SHOP_ITEMS[itemId];
  if (!item) return ephemeral("❌ Unknown item. Use `/shop` to see what's available.");

  const data = await getUserData(kv, user.id);
  if ((data.coins || 0) < item.cost) {
    return ephemeral(`❌ Not enough coins! You have **${(data.coins||0).toLocaleString()}** but need **${item.cost}**.`);
  }

  data.coins = (data.coins || 0) - item.cost;
  let resultDesc = "";

  switch (itemId) {
    case "xp_potion":
      data.xp   += 500;
      data.level = getLevelFromXP(data.xp);
      resultDesc = `+**500 XP** added! You now have **${data.xp.toLocaleString()} XP** (Level **${data.level}**).`;
      break;
    case "xp_elixir":
      data.xp   += 2500;
      data.level = getLevelFromXP(data.xp);
      resultDesc = `+**2,500 XP** added! You now have **${data.xp.toLocaleString()} XP** (Level **${data.level}**).`;
      break;
    case "streak_shield":
      if (data.streakShield) {
        data.coins += item.cost;
        return ephemeral("❌ You already have an active Streak Shield!");
      }
      data.streakShield = true;
      resultDesc = "🛡️ **Streak Shield activated!** You're protected for one missed day.";
      break;
    case "personal_boost":
      data.personalBoostExpiresAt = Date.now() + 3_600_000;
      resultDesc = `⚡ **2x Personal Boost activated!** Expires <t:${Math.floor(data.personalBoostExpiresAt/1000)}:R>.`;
      break;
    case "loot_box": {
      const { reward, description } = openLootBox(data);
      resultDesc = `🎁 You opened a Loot Box and got ${reward}!\n${description}`;
      break;
    }
  }

  await setUserData(kv, user.id, data);
  return json({
    type: 4,
    data: {
      embeds: [{
        color: 0x57f287,
        title: `${item.emoji} Purchased: ${item.name}`,
        description: resultDesc,
        fields: [{ name: "💰 Remaining Coins", value: `**${data.coins.toLocaleString()}**`, inline: true }],
        footer: { text: "WA99 Clan Shop" },
        timestamp: new Date().toISOString(),
      }],
    },
  });
}

async function handleDaily(interaction, kv) {
  const user  = interaction.member?.user ?? interaction.user;
  const data  = await getUserData(kv, user.id);
  const today = todayUTC();
  if (data.lastDailyAt === today) {
    return ephemeral("❌ You've already claimed your daily reward today. Come back tomorrow!");
  }
  const coins = randInt(DAILY_COINS_MIN, DAILY_COINS_MAX);
  const bonusXP = data.streak >= 7 ? 100 : 0;
  data.coins = (data.coins || 0) + coins;
  data.xp   += bonusXP;
  data.level = getLevelFromXP(data.xp);
  data.lastDailyAt = today;
  await setUserData(kv, user.id, data);
  return json({
    type: 4,
    data: {
      embeds: [{
        color: 0xf7b731,
        title: "🎁 Daily Reward Claimed!",
        description: `<@${user.id}> claimed their daily reward!`,
        fields: [
          { name: "💰 Coins",          value: `+**${coins}**`,                                            inline: true },
          { name: "✨ Bonus XP",       value: bonusXP > 0 ? `+**${bonusXP}** (streak bonus!)` : "None",  inline: true },
          { name: "💰 New Balance",    value: `**${data.coins.toLocaleString()} coins**`,                 inline: true },
        ],
        footer: { text: "WA99 Clan • Come back tomorrow for more!" },
        timestamp: new Date().toISOString(),
      }],
    },
  });
}

async function handleCoinflip(interaction, kv) {
  const user   = interaction.member?.user ?? interaction.user;
  const choice = interaction.data.options.find(o => o.name === "side")?.value; // heads or tails
  const bet    = Number(interaction.data.options.find(o => o.name === "amount")?.value ?? 50);

  if (bet < 10)    return ephemeral("❌ Minimum bet is **10 coins**.");
  if (bet > 5000)  return ephemeral("❌ Maximum bet is **5,000 coins**.");

  const data = await getUserData(kv, user.id);
  if ((data.coins || 0) < bet) return ephemeral(`❌ Not enough coins! You have **${(data.coins||0).toLocaleString()}**.`);

  const result = Math.random() < 0.5 ? "heads" : "tails";
  const won    = result === choice;

  data.coins = (data.coins || 0) + (won ? bet : -bet);
  if (data.coins < 0) data.coins = 0;
  await setUserData(kv, user.id, data);

  return json({
    type: 4,
    data: {
      embeds: [{
        color: won ? 0x57f287 : 0xed4245,
        title: won ? "🪙 You Won!" : "🪙 You Lost!",
        description: [
          `The coin landed on **${result === "heads" ? "🟡 Heads" : "⚫ Tails"}**.`,
          `<@${user.id}> picked **${choice === "heads" ? "🟡 Heads" : "⚫ Tails"}**.`,
          "",
          won ? `✅ You won **${bet.toLocaleString()} coins**!` : `❌ You lost **${bet.toLocaleString()} coins**.`,
        ].join("\n"),
        fields: [{ name: "💰 New Balance", value: `**${data.coins.toLocaleString()} coins**`, inline: true }],
        footer: { text: "WA99 Clan Casino 🎰" },
        timestamp: new Date().toISOString(),
      }],
    },
  });
}

async function handleSlots(interaction, kv) {
  const user = interaction.member?.user ?? interaction.user;
  const bet  = Number(interaction.data.options.find(o => o.name === "amount")?.value ?? 50);

  if (bet < 10)    return ephemeral("❌ Minimum bet is **10 coins**.");
  if (bet > 5000)  return ephemeral("❌ Maximum bet is **5,000 coins**.");

  const data = await getUserData(kv, user.id);
  if ((data.coins || 0) < bet) return ephemeral(`❌ Not enough coins! You have **${(data.coins||0).toLocaleString()}**.`);

  const reels   = spinSlots();
  const payout  = calcSlotPayout(reels, bet);

  data.coins = (data.coins || 0) - bet + payout.coins;
  if (data.coins < 0) data.coins = 0;
  await setUserData(kv, user.id, data);

  const slotDisplay = `╔══════════════╗\n║  ${reels.join("  ")}  ║\n╚══════════════╝`;

  let resultText, color;
  if (payout.type === "jackpot") {
    color      = 0xf7b731;
    resultText = `🎰 **JACKPOT!** ${payout.multiplier}x — You won **${payout.coins.toLocaleString()} coins**!`;
  } else if (payout.type === "pair") {
    color      = 0x57f287;
    resultText = `✅ **Two of a kind!** — You won **${payout.coins.toLocaleString()} coins**!`;
  } else {
    color      = 0xed4245;
    resultText = `❌ **No match.** — You lost **${bet.toLocaleString()} coins**.`;
  }

  return json({
    type: 4,
    data: {
      embeds: [{
        color,
        title: "🎰 WA99 Slot Machine",
        description: `\`\`\`\n${slotDisplay}\n\`\`\`\n${resultText}`,
        fields: [{ name: "💰 New Balance", value: `**${data.coins.toLocaleString()} coins**`, inline: true }],
        footer: { text: "WA99 Clan Casino 🎰 • Bet responsibly lol" },
        timestamp: new Date().toISOString(),
      }],
    },
  });
}

async function handleGiveXP(interaction, kv) {
  const senderId = interaction.member?.user?.id ?? interaction.user?.id;
  const targetId = interaction.data.options.find(o => o.name === "user")?.value;
  const amount   = Number(interaction.data.options.find(o => o.name === "amount")?.value ?? 50);
  if (senderId === targetId)                     return ephemeral("❌ You can't give XP to yourself.");
  if (amount < 1 || amount > GIVE_XP_DAILY_CAP) return ephemeral(`❌ Amount must be 1–${GIVE_XP_DAILY_CAP}.`);
  const senderData = await getUserData(kv, senderId);
  const today      = todayUTC();
  if (senderData.giveXpDate !== today) { senderData.giveXpUsed = 0; senderData.giveXpDate = today; }
  const remaining = GIVE_XP_DAILY_CAP - (senderData.giveXpUsed || 0);
  if (amount > remaining) return ephemeral(`❌ You can only give **${remaining} more XP** today (cap: ${GIVE_XP_DAILY_CAP}).`);
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

async function handleXPEvent(interaction, kv) {
  if (!isAdmin(interaction)) return noPerms();
  const multiplier    = Number(interaction.data.options.find(o => o.name === "multiplier")?.value ?? 2);
  const durationHours = Number(interaction.data.options.find(o => o.name === "duration")?.value   ?? 1);
  if (multiplier < 1.5 || multiplier > 10)       return ephemeral("❌ Multiplier must be 1.5–10.");
  if (durationHours < 0.5 || durationHours > 48) return ephemeral("❌ Duration must be 0.5–48 hours.");
  const expiresAt = Date.now() + durationHours * 3_600_000;
  await kv.put("event:multiplier", JSON.stringify({ multiplier, expiresAt }));
  return json({ type: 4, data: buildXPEventEmbed(multiplier, durationHours, expiresAt) });
}

async function handleAddXP(interaction, kv) {
  if (!isAdmin(interaction)) return noPerms();
  const targetId = interaction.data.options.find(o => o.name === "user")?.value;
  const amount   = Number(interaction.data.options.find(o => o.name === "amount")?.value ?? 100);
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
  const targetId = interaction.data.options.find(o => o.name === "user")?.value;
  await setUserData(kv, targetId, { xp: 0, level: 0, messages: 0, lastXpAt: 0, streak: 0, lastStreakDay: null, giveXpUsed: 0, giveXpDate: null, coins: 0, lastDailyAt: null, streakShield: false, personalBoostExpiresAt: null });
  return json({
    type: 4,
    data: { embeds: [{ color: 0xed4245, description: `🔄 Reset all data for <@${targetId}>.`, footer: { text: "WA99 Clan Admin" } }] },
  });
}

// ─── Message XP Handler ───────────────────────────────────────────────────────
async function handleMessageXP(body, kv, secret) {
  if (body.secret !== secret) return new Response("Unauthorized", { status: 401 });
  const { userId, channelId, userData: discordUser, messageCount = 1 } = body;
  const data     = await getUserData(kv, userId);
  const oldLevel = getLevelFromXP(data.xp);
  const event      = await getMultiplierEvent(kv);
  const serverMult = event?.multiplier ?? 1;
  const hasPersonalBoost = data.personalBoostExpiresAt && Date.now() < data.personalBoostExpiresAt;
  const effectiveMult = hasPersonalBoost ? Math.max(serverMult, 2) : serverMult;
  const { streakBonus, newDay } = updateStreak(data);
  const countCapped = Math.min(messageCount, 10);
  const earned      = Math.floor(XP_PER_MESSAGE * countCapped * effectiveMult) + streakBonus;
  const coinsEarned = COINS_PER_FLUSH * countCapped;
  data.xp       += earned;
  data.messages += messageCount;
  data.lastXpAt  = Date.now();
  data.level     = getLevelFromXP(data.xp);
  data.coins     = (data.coins || 0) + coinsEarned;
  await setUserData(kv, userId, data);
  await addWeeklyXP(kv, userId, earned);
  const leveledUp = data.level > oldLevel;
  return new Response(JSON.stringify({
    levelUp:     leveledUp,
    newLevel:    data.level,
    channelId,
    multiplier:  effectiveMult,
    streak:      data.streak,
    streakBonus,
    newDay,
    embed:       leveledUp ? buildLevelUpEmbed(discordUser, data.level, effectiveMult, data.streak) : null,
    streakEmbed: (streakBonus > 0 && newDay) ? buildStreakEmbed(discordUser, data.streak, streakBonus) : null,
  }), { headers: { "Content-Type": "application/json" } });
}

// ─── Weekly Announcement ──────────────────────────────────────────────────────
async function handleWeeklyAnnouncement(request, kv, secret) {
  if (request.headers.get("x-secret") !== secret) return new Response("Unauthorized", { status: 401 });
  const raw = await kv.get("weekly:pending_announcement");
  if (!raw) return json({ announcement: null });
  await kv.delete("weekly:pending_announcement");
  const { entries } = JSON.parse(raw);
  return json({ announcement: { embed: buildWeeklyWinnerEmbed(entries) } });
}

// ─── Scheduled ───────────────────────────────────────────────────────────────
async function handleScheduled(scheduledTime, kv) {
  const now       = new Date(scheduledTime);
  const dayOfWeek = now.getUTCDay();
  const nowMs     = now.getTime();

  if (dayOfWeek === 1) {
    const weeklyEntries = await getWeeklyLeaderboard(kv);
    if (weeklyEntries.length > 0) {
      await kv.put("weekly:pending_announcement", JSON.stringify({ entries: weeklyEntries.slice(0, 3), weekStart: now.toISOString() }));
    }
    const list = await kv.list({ prefix: "weekly:user:" });
    await Promise.all(list.keys.map(({ name }) => kv.delete(name)));
    await kv.put("weekly:reset", now.toISOString());
  }

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
  }
}

// ─── Main Export ─────────────────────────────────────────────────────────────
export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (url.pathname === "/message-xp" && request.method === "POST")
      return handleMessageXP(await request.json(), env.LEVELS_KV, env.GATEWAY_SECRET);

    if (url.pathname === "/weekly-announcement" && request.method === "GET")
      return handleWeeklyAnnouncement(request, env.LEVELS_KV, env.GATEWAY_SECRET);

    if (url.pathname === "/interactions" && request.method === "POST") {
      const sig     = request.headers.get("x-signature-ed25519");
      const ts      = request.headers.get("x-signature-timestamp");
      const rawBody = await request.text();
      if (!await verifyKey(rawBody, sig, ts, env.DISCORD_PUBLIC_KEY))
        return new Response("Invalid signature", { status: 401 });

      const interaction = JSON.parse(rawBody);
      if (interaction.type === 1) return json({ type: 1 });
      if (interaction.type === 2) {
        const cmd = interaction.data.name;
        if (cmd === "rank")              return handleRank(interaction, env.LEVELS_KV);
        if (cmd === "leaderboard")       return handleLeaderboard(interaction, env.LEVELS_KV);
        if (cmd === "weeklyleaderboard") return handleWeeklyLeaderboard(interaction, env.LEVELS_KV);
        if (cmd === "streak")            return handleStreak(interaction, env.LEVELS_KV);
        if (cmd === "balance")           return handleBalance(interaction, env.LEVELS_KV);
        if (cmd === "daily")             return handleDaily(interaction, env.LEVELS_KV);
        if (cmd === "shop")              return handleShop(interaction, env.LEVELS_KV);
        if (cmd === "buy")               return handleBuy(interaction, env.LEVELS_KV);
        if (cmd === "coinflip")          return handleCoinflip(interaction, env.LEVELS_KV);
        if (cmd === "slots")             return handleSlots(interaction, env.LEVELS_KV);
        if (cmd === "givexp")            return handleGiveXP(interaction, env.LEVELS_KV);
        if (cmd === "xpevent")           return handleXPEvent(interaction, env.LEVELS_KV);
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