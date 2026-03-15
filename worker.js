import { verifyKey } from "discord-interactions";

// ╔══════════════════════════════════════════════════════════════════════════╗
// ║                        ⚙️  CONFIGURATION                                ║
// ║  Everything in this block is safe to change without touching any logic  ║
// ╚══════════════════════════════════════════════════════════════════════════╝

// ── Channels ─────────────────────────────────────────────────────────────────
const BOT_CHANNEL_ID      = "1482558356362362890"; // only channel where commands work
const LEVELUP_CHANNEL_ID  = "1482536684557045963"; // where level-up announcements post (used by gateway)

// ── XP ────────────────────────────────────────────────────────────────────────
const XP_PER_MESSAGE      = 15;    // base XP per message batch
const XP_COOLDOWN_MSGS    = 10;    // max messages per flush that count for XP (spam cap)
const LEVEL_BASE          = 100;   // XP needed for level 1 (scales up from here)
const LEVEL_SCALE         = 1.35;  // exponent — higher = steeper curve, lower = easier levelling

// ── Coins ─────────────────────────────────────────────────────────────────────
const COINS_PER_FLUSH     = 5;     // base coins earned per message batch from chatting
const DAILY_COINS_MIN     = 100;   // minimum /daily reward
const DAILY_COINS_MAX     = 300;   // maximum /daily reward
const DAILY_STREAK_BONUS_XP = 100; // bonus XP from /daily if streak >= 7 days

// ── Work ──────────────────────────────────────────────────────────────────────
const WORK_COOLDOWN_MS    = 3_600_000; // cooldown between /work uses       (default: 1 hour)
const WORK_COINS_MIN      = 40;        // minimum coins earned from /work
const WORK_COINS_MAX      = 120;       // maximum coins earned from /work

// ── Rob ───────────────────────────────────────────────────────────────────────
const ROB_COOLDOWN_MS     = 7_200_000; // cooldown between /rob attempts     (default: 2 hours)
const ROB_SUCCESS_CHANCE  = 0.30;      // probability of a successful rob     (0.0–1.0)
const ROB_MAX_STEAL_PCT   = 0.25;      // max fraction of target's coins that can be stolen (0.0–1.0)
const ROB_MIN_TARGET_COINS = 50;       // target must have at least this many coins to be robbed
const ROB_FINE_MIN        = 30;        // minimum fine if caught
const ROB_FINE_MAX        = 80;        // maximum fine if caught

// ── Streaks ───────────────────────────────────────────────────────────────────
const STREAK_BONUS_XP       = 50;   // base bonus XP for maintaining a daily streak
const STREAK_WEEKLY_BONUS   = 25;   // extra XP added per 7-day streak milestone on top of base
const STREAK_MILESTONE_DAYS = [7, 14, 30, 60, 100]; // days that get a special milestone embed

// ── Give XP ───────────────────────────────────────────────────────────────────
const GIVE_XP_DAILY_CAP   = 200;   // max XP a member can gift to others per day

// ── XP Decay (inactive users) ─────────────────────────────────────────────────
const DECAY_AFTER_DAYS    = 30;    // days of inactivity before decay starts
const DECAY_RATE          = 0.05;  // XP lost per day beyond threshold as a fraction (5% = 0.05)
const DECAY_MAX_FRACTION  = 0.50;  // maximum total XP loss from decay (50% = never lose more than half)

// ── XP Multiplier Events (admin /xpevent) ─────────────────────────────────────
const EVENT_MULT_MIN      = 1.5;   // minimum allowed multiplier
const EVENT_MULT_MAX      = 10;    // maximum allowed multiplier
const EVENT_DURATION_MIN  = 0.5;   // minimum duration in hours
const EVENT_DURATION_MAX  = 48;    // maximum duration in hours

// ── Personal Boost (shop item) ────────────────────────────────────────────────
const PERSONAL_BOOST_MULT      = 2;           // multiplier when personal boost is active
const PERSONAL_BOOST_DURATION  = 3_600_000;   // how long personal boost lasts  (default: 1 hour)

// ── Coin Doubler (shop item) ──────────────────────────────────────────────────
const COIN_DOUBLER_MULT        = 2;           // coin multiplier when doubler is active
const COIN_DOUBLER_DURATION    = 7_200_000;   // how long coin doubler lasts     (default: 2 hours)

// ── Trivia ────────────────────────────────────────────────────────────────────
const TRIVIA_REWARD_COINS   = 100;            // coins awarded for correct trivia answer
const TRIVIA_CYCLE_MS       = 3_600_000;      // how often the question rotates  (default: 1 hour)

// ── Transfer ──────────────────────────────────────────────────────────────────
const TRANSFER_MIN          = 1;              // minimum coins per transfer
const TRANSFER_MAX          = 10_000;         // maximum coins per transfer

// ── Gambling ──────────────────────────────────────────────────────────────────
const GAMBLE_BET_MIN        = 10;             // minimum bet for coinflip / slots
const GAMBLE_BET_MAX        = 5_000;          // maximum bet for coinflip / slots
const COINFLIP_WIN_CHANCE   = 0.50;           // probability of winning coinflip (0.5 = fair)

// ── Leaderboards ─────────────────────────────────────────────────────────────
const LEADERBOARD_SIZE      = 10;             // how many members show on /leaderboard / /richlist

// ── Weekly Reset ─────────────────────────────────────────────────────────────
const WEEKLY_RESET_DAY      = 1;              // 0=Sun 1=Mon 2=Tue … 6=Sat
const WEEKLY_RESET_HOUR_UTC = 3;              // UTC hour the cron runs (matches wrangler.toml)

// ── Shop — XP Item Grants ─────────────────────────────────────────────────────
const XP_POTION_GRANT       = 500;            // XP granted by XP Potion on success
const XP_ELIXIR_GRANT       = 2_500;          // XP granted by XP Elixir on success
const XP_BOMB_GRANT         = 10_000;         // XP granted by XP Bomb on success

// ── Shop — XP Item Downside Chances ──────────────────────────────────────────
const XP_POTION_FAIL_CHANCE      = 0.25;      // probability potion is a dud (0.0–1.0)
const XP_ELIXIR_FAIL_CHANCE      = 0.20;      // probability elixir backfires
const XP_ELIXIR_BACKFIRE_PENALTY = 500;       // XP lost on elixir backfire
const XP_BOMB_FAIL_CHANCE        = 0.15;      // probability bomb catastrophically fails
const XP_BOMB_CATASTROPHE_PCT    = 0.10;      // fraction of total XP lost on bomb failure (10% = 0.10)

// ── Shop — Base Costs & Level Scaling ────────────────────────────────────────
// Cost formula: baseCost + (playerLevel × levelMult)
const XP_POTION_BASE_COST    = 200;   const XP_POTION_LEVEL_MULT    = 40;
const XP_ELIXIR_BASE_COST    = 600;   const XP_ELIXIR_LEVEL_MULT    = 120;
const XP_BOMB_BASE_COST      = 1_500; const XP_BOMB_LEVEL_MULT      = 400;
const STREAK_SHIELD_COST     = 200;
const PERSONAL_BOOST_COST    = 500;
const COIN_DOUBLER_COST      = 400;
const LOOT_BOX_COST          = 150;
const MEGA_LOOT_BOX_COST     = 500;

// ── Loot Box — Reward Ranges ──────────────────────────────────────────────────
const LOOT_COINS_SMALL_MIN   = 50;    const LOOT_COINS_SMALL_MAX   = 200;
const LOOT_XP_SMALL_MIN      = 200;   const LOOT_XP_SMALL_MAX      = 800;
const LOOT_COINS_MED_MIN     = 300;   const LOOT_COINS_MED_MAX     = 600;
const LOOT_XP_BIG_MIN        = 1_000; const LOOT_XP_BIG_MAX        = 2_500;
const LOOT_JACKPOT_MIN       = 1_000; const LOOT_JACKPOT_MAX       = 2_000;   // normal box jackpot
const LOOT_MEGA_JACKPOT_MIN  = 2_000; const LOOT_MEGA_JACKPOT_MAX  = 5_000;   // mega box jackpot

// Loot box probability thresholds (cumulative, must end at 1.00)
// Tiers in order: small coins, small XP, med coins, big XP, streak shield, personal boost, jackpot
const LOOT_BOX_THRESHOLDS      = [0.40, 0.65, 0.80, 0.90, 0.96, 0.99, 1.00];
const LOOT_MEGA_BOX_THRESHOLDS = [0.20, 0.40, 0.55, 0.70, 0.82, 0.92, 1.00];

// ── Slots ─────────────────────────────────────────────────────────────────────
const SLOT_PAIR_MULT           = 1.5;         // payout multiplier for a pair
const SLOT_DEFAULT_JACKPOT_MULT = 2;          // fallback multiplier if symbol not in SLOT_PAYOUTS

// ── Progress Bar ──────────────────────────────────────────────────────────────
const PROGRESS_BAR_LENGTH      = 16;          // number of characters in the XP progress bar

// ── Streak Colour Thresholds ──────────────────────────────────────────────────
const STREAK_COLOR_GOLD_DAYS   = 30;          // streak >= this → gold  colour
const STREAK_COLOR_PINK_DAYS   = 7;           // streak >= this → pink  colour
const STREAK_COLOR_GREEN_DAYS  = 3;           // streak >= this → green colour

// ── Admin — Boost User Limits ─────────────────────────────────────────────────
const BOOST_USER_MIN_HOURS     = 0.5;         // minimum hours admin can boost a user
const BOOST_USER_MAX_HOURS     = 72;          // maximum hours admin can boost a user

// ── Admin — Set Level Limits ──────────────────────────────────────────────────
const SET_LEVEL_MAX            = 1_000;       // maximum level admin can set a user to

// ── Server Stats — Activity Window ───────────────────────────────────────────
const STATS_ACTIVE_DAYS        = 30;          // days used to define an "active" member

// ╔══════════════════════════════════════════════════════════════════════════╗
// ║                   ✋ STOP — don't edit below this line                   ║
// ║                   unless you know what you're doing                     ║
// ╚══════════════════════════════════════════════════════════════════════════╝

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

const RANK_COLORS = [0x5865f2, 0x57f287, 0xfee75c, 0xeb459e, 0xf7b731];

const WORK_RESPONSES = [
  "You ran drills and the clan paid you",
  "You guarded the base and got rewarded",
  "You scouted enemy territory and came back with the bag",
  "You carried the clan in ranked and got a bonus",
  "You coached a recruit and got paid for your time",
  "You ran the clan store and pocketed the profits",
  "You won a 1v1 bet and cashed out",
  "You repped WA99 in a tournament and got compensated",
];

const SHOP_ITEMS = {
  // XP items — cost scales with level, each has a downside chance
  xp_potion:     {
    id: "xp_potion",     name: "🧪 XP Potion",
    baseCost: XP_POTION_BASE_COST,   levelMult: XP_POTION_LEVEL_MULT,
    description: `Gain **+${XP_POTION_GRANT.toLocaleString()} XP** — but there's a ${Math.round(XP_POTION_FAIL_CHANCE*100)}% chance it's a dud and you lose the coins`,
    downside: { chance: XP_POTION_FAIL_CHANCE, type: "dud" },
  },
  xp_elixir:     {
    id: "xp_elixir",     name: "⚗️ XP Elixir",
    baseCost: XP_ELIXIR_BASE_COST,   levelMult: XP_ELIXIR_LEVEL_MULT,
    description: `Gain **+${XP_ELIXIR_GRANT.toLocaleString()} XP** — but ${Math.round(XP_ELIXIR_FAIL_CHANCE*100)}% chance it backfires and you lose ${XP_ELIXIR_BACKFIRE_PENALTY} XP instead`,
    downside: { chance: XP_ELIXIR_FAIL_CHANCE, type: "backfire", penalty: XP_ELIXIR_BACKFIRE_PENALTY },
  },
  xp_bomb:       {
    id: "xp_bomb",       name: "💣 XP Bomb",
    baseCost: XP_BOMB_BASE_COST,     levelMult: XP_BOMB_LEVEL_MULT,
    description: `Gain **+${XP_BOMB_GRANT.toLocaleString()} XP** — but ${Math.round(XP_BOMB_FAIL_CHANCE*100)}% chance of catastrophic failure: lose streak + ${Math.round(XP_BOMB_CATASTROPHE_PCT*100)}% of your XP`,
    downside: { chance: XP_BOMB_FAIL_CHANCE, type: "catastrophe" },
  },
  // Non-XP items — fixed cost, no downside
  streak_shield: { id: "streak_shield", name: "🛡️ Streak Shield",      baseCost: STREAK_SHIELD_COST,  levelMult: 0, description: "Survive **one missed day** without losing your streak"   },
  personal_boost:{ id: "personal_boost",name: "⚡ Personal 2x Boost",  baseCost: PERSONAL_BOOST_COST, levelMult: 0, description: "**2x XP** from your messages for **1 hour**"             },
  coin_doubler:  { id: "coin_doubler",  name: "💸 Coin Doubler",       baseCost: COIN_DOUBLER_COST,   levelMult: 0, description: "**2x coins** from chatting for **2 hours**"              },
  loot_box:      { id: "loot_box",      name: "🎁 Loot Box",           baseCost: LOOT_BOX_COST,       levelMult: 0, description: "Random reward — coins, XP, boosts. Could be huge!"       },
  mega_loot_box: { id: "mega_loot_box", name: "🎰 Mega Loot Box",      baseCost: MEGA_LOOT_BOX_COST,  levelMult: 0, description: "Guaranteed rare drop — higher chance at top rewards"     },
};

// Calculate dynamic cost for a shop item based on buyer's current level
function getItemCost(item, level) {
  return item.baseCost + Math.floor((item.levelMult ?? 0) * level);
}

const SLOT_SYMBOLS = ["🍒", "🍋", "🍊", "🍇", "⭐", "💎", "7️⃣"];
const SLOT_WEIGHTS = [30, 25, 20, 15, 6, 3, 1];
const SLOT_PAYOUTS = { "7️⃣": 10, "💎": 7, "⭐": 5, "🍇": 4, "🍊": 3, "🍋": 2.5, "🍒": 2 };

const TRIVIA_QUESTIONS = [
  { q: "What colour is the Discord logo?",                     a: "blurple",    choices: ["Blue", "Blurple", "Purple", "Indigo"] },
  { q: "How many sides does a hexagon have?",                  a: "6",          choices: ["5", "6", "7", "8"] },
  { q: "What does 'XP' stand for in gaming?",                  a: "experience", choices: ["Experience", "Extra Points", "Exchange", "Exploit"] },
  { q: "Which planet is closest to the Sun?",                  a: "mercury",    choices: ["Venus", "Earth", "Mars", "Mercury"] },
  { q: "What is 12 × 12?",                                     a: "144",        choices: ["122", "132", "144", "148"] },
  { q: "What language is Discord's backend written in?",       a: "elixir",     choices: ["Python", "Go", "Elixir", "Rust"] },
  { q: "How many players are on a football team on the field?",a: "11",         choices: ["10", "11", "12", "9"] },
  { q: "What is the capital of Japan?",                        a: "tokyo",      choices: ["Osaka", "Kyoto", "Tokyo", "Nagoya"] },
  { q: "What does CPU stand for?",                             a: "central processing unit", choices: ["Central Processing Unit", "Core Power Unit", "Computer Program Utility", "Central Program Upload"] },
  { q: "In what year did Fortnite Battle Royale release?",     a: "2017",       choices: ["2016", "2017", "2018", "2019"] },
];

// ─── Math Helpers ────────────────────────────────────────────────────────────
function xpForLevel(l)      { return Math.floor(LEVEL_BASE * Math.pow(l, LEVEL_SCALE)); }
function getLevelFromXP(xp) { let l = 0; while (xp >= xpForLevel(l + 1)) l++; return l; }
function getProgressBar(cur, tot, len = PROGRESS_BAR_LENGTH) {
  const f = Math.round((cur / tot) * len);
  return `\`${"█".repeat(f)}${"░".repeat(len - f)}\``;
}
function getRankColor(l) {
  if (l >= 50) return RANK_COLORS[4]; if (l >= 35) return RANK_COLORS[3];
  if (l >= 20) return RANK_COLORS[2]; if (l >= 10) return RANK_COLORS[1];
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
function todayUTC()  { return new Date().toISOString().slice(0, 10); }
function randInt(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min; }
function avatarUrl(u) {
  return u.avatar
    ? `https://cdn.discordapp.com/avatars/${u.id}/${u.avatar}.png?size=256`
    : `https://cdn.discordapp.com/embed/avatars/${Number(u.id) % 5}.png`;
}
function weightedRandom(symbols, weights) {
  const total = weights.reduce((a, b) => a + b, 0);
  let r = Math.random() * total;
  for (let i = 0; i < symbols.length; i++) { r -= weights[i]; if (r <= 0) return symbols[i]; }
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
  if (a === b && b === c) return { multiplier: SLOT_PAYOUTS[a] ?? SLOT_DEFAULT_JACKPOT_MULT, coins: Math.floor(bet * (SLOT_PAYOUTS[a] ?? SLOT_DEFAULT_JACKPOT_MULT)), type: "jackpot" };
  if (a === b || b === c || a === c) return { multiplier: SLOT_PAIR_MULT, coins: Math.floor(bet * SLOT_PAIR_MULT), type: "pair" };
  return { multiplier: 0, coins: 0, type: "loss" };
}
function msToTime(ms) {
  const m = Math.floor(ms / 60000);
  const s = Math.floor((ms % 60000) / 1000);
  return m > 0 ? `${m}m ${s}s` : `${s}s`;
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
    coinDoublerExpiresAt: null,
    lastWorkAt: null,
    lastRobAt: null,
    totalCoinsEarned: 0,
    totalCoinsSpent: 0,
  };
}
async function setUserData(kv, userId, data) { await kv.put(`user:${userId}`, JSON.stringify(data)); }
async function getLeaderboard(kv) {
  const list = await kv.list({ prefix: "user:" });
  const users = await Promise.all(list.keys.map(async ({ name }) => {
    const d = JSON.parse(await kv.get(name));
    return { id: name.replace("user:", ""), ...d };
  }));
  return users.sort((a, b) => b.xp - a.xp).slice(0, LEADERBOARD_SIZE);
}
async function getRichlist(kv) {
  const list = await kv.list({ prefix: "user:" });
  const users = await Promise.all(list.keys.map(async ({ name }) => {
    const d = JSON.parse(await kv.get(name));
    return { id: name.replace("user:", ""), ...d };
  }));
  return users.sort((a, b) => (b.coins||0) - (a.coins||0)).slice(0, LEADERBOARD_SIZE);
}
async function getWeeklyLeaderboard(kv) {
  const list = await kv.list({ prefix: "weekly:user:" });
  if (!list.keys.length) return [];
  const users = await Promise.all(list.keys.map(async ({ name }) => ({
    id: name.replace("weekly:user:", ""),
    weeklyXp: Number(await kv.get(name)),
  })));
  return users.filter(u => u.weeklyXp > 0).sort((a, b) => b.weeklyXp - a.weeklyXp).slice(0, LEADERBOARD_SIZE);
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
    streakBonus = STREAK_BONUS_XP + Math.floor(data.streak / 7) * STREAK_WEEKLY_BONUS;
  } else if (data.streakShield) {
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
function openLootBox(data, mega = false) {
  const roll = Math.random();
  // mega box shifts odds toward better rewards
  const thresholds = mega ? LOOT_MEGA_BOX_THRESHOLDS : LOOT_BOX_THRESHOLDS;
  const rewards = [
    () => { const c = randInt(LOOT_COINS_SMALL_MIN, LOOT_COINS_SMALL_MAX); data.coins += c; data.totalCoinsEarned = (data.totalCoinsEarned||0)+c; return [`💰 **${c} Coins**`, "Some coins!"]; },
    () => { const x = randInt(LOOT_XP_SMALL_MIN, LOOT_XP_SMALL_MAX);  data.xp += x; data.level = getLevelFromXP(data.xp); return [`✨ **${x} XP**`, "A solid XP boost!"]; },
    () => { const c = randInt(LOOT_COINS_MED_MIN, LOOT_COINS_MED_MAX); data.coins += c; data.totalCoinsEarned = (data.totalCoinsEarned||0)+c; return [`💰 **${c} Coins**`, "Nice haul!"]; },
    () => { const x = randInt(LOOT_XP_BIG_MIN, LOOT_XP_BIG_MAX);      data.xp += x; data.level = getLevelFromXP(data.xp); return [`✨ **${x} XP**`, "Big XP drop! 🔥"]; },
    () => { data.streakShield = true;                                                  return ["🛡️ **Streak Shield**", "Streak protected!"]; },
    () => { data.personalBoostExpiresAt = Date.now()+PERSONAL_BOOST_DURATION;         return ["⚡ **Personal 2x Boost**", "2x XP for 1 hour!"]; },
    () => { const c = randInt(mega ? LOOT_MEGA_JACKPOT_MIN : LOOT_JACKPOT_MIN, mega ? LOOT_MEGA_JACKPOT_MAX : LOOT_JACKPOT_MAX); data.coins += c; data.totalCoinsEarned = (data.totalCoinsEarned||0)+c; return [`💰 **${c} Coins** — JACKPOT!`, "🎰 You hit the jackpot!!!"]; },
  ];
  let idx = 0;
  for (let i = 0; i < thresholds.length; i++) { if (roll < thresholds[i]) { idx = i; break; } }
  const [reward, description] = rewards[idx]();
  return { reward, description };
}

// ─── Shared Response Helpers ─────────────────────────────────────────────────
function json(body)     { return new Response(JSON.stringify(body), { headers: { "Content-Type": "application/json" } }); }
function ephemeral(msg) { return json({ type: 4, data: { content: msg, flags: 64 } }); }
function noPerms()      { return ephemeral("❌ You need **Manage Server** permissions to use this command."); }
function wrongChannel() {
  return json({
    type: 4,
    data: {
      content: `❌ Commands can only be used in <#${BOT_CHANNEL_ID}>.`,
      flags: 64, // ephemeral — only visible to the user who ran it
    },
  });
}
function isAdmin(i) {
  const p = BigInt(i.member?.permissions ?? "0");
  return (p & BigInt(0x8)) !== BigInt(0) || (p & BigInt(0x20)) !== BigInt(0);
}
function inBotChannel(interaction) {
  return interaction.channel_id === BOT_CHANNEL_ID;
}

// ─── Embed Builders ──────────────────────────────────────────────────────────
function buildRankEmbed(user, data, rank) {
  const level = getLevelFromXP(data.xp);
  const curLXP = xpForLevel(level), nxtLXP = xpForLevel(level + 1);
  const prog = data.xp - curLXP, need = nxtLXP - curLXP;
  const pct  = Math.floor((prog / need) * 100);
  const hasBoost = data.personalBoostExpiresAt && Date.now() < data.personalBoostExpiresAt;
  return {
    embeds: [{
      color: getRankColor(level),
      author: { name: `${user.username}'s Rank Card`, icon_url: avatarUrl(user) },
      thumbnail: { url: avatarUrl(user) },
      fields: [
        { name: "🏅 Rank",      value: `**#${rank}**`,                                                      inline: true },
        { name: "⚡ Level",     value: `**${level}**`,                                                       inline: true },
        { name: "🎖️ Tier",     value: getTierLabel(level),                                                   inline: true },
        { name: "✨ Total XP",  value: `**${data.xp.toLocaleString()}** XP`,                                 inline: true },
        { name: "💰 Coins",    value: `**${(data.coins||0).toLocaleString()}**`,                              inline: true },
        { name: "🔥 Streak",   value: data.streak > 0 ? `**${data.streak}** days${data.streakShield?" 🛡️":""}` : "None", inline: true },
        { name: "💬 Messages", value: `**${data.messages.toLocaleString()}**`,                                inline: true },
        { name: "📈 To Next",  value: `**${(need - prog).toLocaleString()}** XP away`,                       inline: true },
        ...(hasBoost ? [{ name: "⚡ Boost", value: `2x until <t:${Math.floor(data.personalBoostExpiresAt/1000)}:R>`, inline: true }] : []),
        { name: `Progress to Level ${level + 1} — ${pct}%`, value: `${getProgressBar(prog, need)}  **${prog.toLocaleString()} / ${need.toLocaleString()}**`, inline: false },
      ],
      footer: { text: "WA99 Clan • Keep grinding 🔥" },
      timestamp: new Date().toISOString(),
    }],
  };
}

function buildLevelUpEmbed(user, newLevel, multiplier = 1, streak = 0) {
  const msg       = LEVELUP_MESSAGES[Math.floor(Math.random() * LEVELUP_MESSAGES.length)];
  const banner    = LEVELUP_BANNERS[Math.floor(Math.random() * LEVELUP_BANNERS.length)];
  const xpToNext  = xpForLevel(newLevel + 1) - xpForLevel(newLevel);
  const milestone = LEVEL_ROLES[newLevel];
  const nextMlvl  = getNextMilestone(newLevel);
  const nextMlab  = nextMlvl ? LEVEL_ROLES[nextMlvl] : null;
  return {
    embeds: [{
      color: getRankColor(newLevel),
      title: banner,
      description: [
        `### <@${user.id}> just hit **Level ${newLevel}**!`,
        `> *${msg}*`,
        "",
        multiplier > 1 ? `⚡ **${multiplier}x XP Event** is active — keep grinding!` : "",
        milestone     ? `🏆 **Role unlocked:** ${milestone} — you earned it.`        : "",
      ].filter(Boolean).join("\n").trim(),
      thumbnail: { url: avatarUrl(user) },
      fields: [
        { name: "⚡ New Level",       value: `\`\`\`\n${newLevel}\n\`\`\``,         inline: true },
        { name: "🎖️ Tier",            value: getTierLabel(newLevel),                 inline: true },
        { name: "🎯 XP to Next",      value: `**${xpToNext.toLocaleString()}** XP`,  inline: true },
        ...(streak > 1 ? [{ name: "🔥 Streak", value: `**${streak}** days`, inline: true }] : []),
        ...(nextMlab && nextMlvl !== newLevel ? [{ name: "🔭 Next Milestone", value: `${nextMlab} at **Lv ${nextMlvl}** — ${nextMlvl - newLevel} level${nextMlvl - newLevel === 1 ? "" : "s"} away`, inline: false }] : []),
      ],
      footer: { text: "WA99 Clan • The grind never stops 🔥" },
      timestamp: new Date().toISOString(),
    }],
  };
}

function buildStreakEmbed(user, streak, bonus) {
  const isMilestone = STREAK_MILESTONE_DAYS.includes(streak);
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

function buildShopEmbed(userCoins) {
  const rows = Object.values(SHOP_ITEMS).map(item =>
    `${item.name} — \`${item.cost} coins\`\n┗ ${item.description}\n┗ \`/buy item:${item.id}\``
  );
  return {
    embeds: [{
      color: 0x57f287,
      title: "🏪  WA99 Clan Shop",
      description: rows.join("\n\n"),
      fields: [{ name: "💰 Your Balance", value: `**${userCoins.toLocaleString()} coins**`, inline: false }],
      footer: { text: "Earn coins by chatting & /work /daily • WA99 Clan" },
      timestamp: new Date().toISOString(),
    }],
  };
}

function buildLeaderboardEmbed(entries) {
  const medals = ["🥇", "🥈", "🥉"];
  const rows = entries.map((e, i) => {
    const level = getLevelFromXP(e.xp);
    return `${medals[i] ?? `**${i+1}.**`} <@${e.id}> — **Lv ${level}** · ${e.xp.toLocaleString()} XP`;
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
    `${medals[i] ?? `**${i+1}.**`} <@${e.id}> — **${e.weeklyXp.toLocaleString()} XP** this week`
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

function buildShopEmbed(userCoins, userLevel) {
  const xpItems = ["xp_potion", "xp_elixir", "xp_bomb"];
  const otherItems = ["streak_shield", "personal_boost", "coin_doubler", "loot_box", "mega_loot_box"];

  const xpRows = xpItems.map(id => {
    const item = SHOP_ITEMS[id];
    const cost = getItemCost(item, userLevel);
    const ds   = item.downside;
    const risk = ds ? `⚠️ ${Math.round(ds.chance * 100)}% downside risk` : "";
    return `${item.name} — \`${cost.toLocaleString()} coins\` *(scales with level)*\n┗ ${item.description}\n${risk ? `┗ ${risk}\n` : ""}┗ \`/buy item:${id}\``;
  });

  const otherRows = otherItems.map(id => {
    const item = SHOP_ITEMS[id];
    const cost = getItemCost(item, userLevel);
    return `${item.name} — \`${cost.toLocaleString()} coins\`\n┗ ${item.description}\n┗ \`/buy item:${id}\``;
  });

  return {
    embeds: [{
      color: 0x57f287,
      title: "🏪  WA99 Clan Shop",
      fields: [
        {
          name: "⚠️ XP Items — Cost scales with your level",
          value: xpRows.join("\n\n"),
          inline: false,
        },
        {
          name: "🛒 Other Items — Fixed price",
          value: otherRows.join("\n\n"),
          inline: false,
        },
        {
          name: "💰 Your Balance",
          value: `**${userCoins.toLocaleString()} coins** • Level **${userLevel}**`,
          inline: false,
        },
      ],
      footer: { text: "Higher level = XP items cost more • Earn coins by chatting, /work, /daily" },
      timestamp: new Date().toISOString(),
    }],
  };
}

// ─── Slash Command Handlers ───────────────────────────────────────────────────
async function handleRank(interaction, kv) {
  if (!inBotChannel(interaction)) return wrongChannel();
  const targetUser =
    interaction.data.resolved?.users?.[interaction.data.options?.[0]?.value] ??
    interaction.member?.user ?? interaction.user;
  const data = await getUserData(kv, targetUser.id);
  const lb   = await getLeaderboard(kv);
  const rank = lb.findIndex(e => e.id === targetUser.id) + 1;
  return json({ type: 4, data: buildRankEmbed(targetUser, data, rank || "?") });
}

async function handleLeaderboard(interaction, kv) {
  if (!inBotChannel(interaction)) return wrongChannel();
  return json({ type: 4, data: buildLeaderboardEmbed(await getLeaderboard(kv)) });
}

async function handleWeeklyLeaderboard(interaction, kv) {
  if (!inBotChannel(interaction)) return wrongChannel();
  const entries   = await getWeeklyLeaderboard(kv);
  const weekStart = await kv.get("weekly:reset");
  return json({ type: 4, data: buildWeeklyLeaderboardEmbed(entries, weekStart) });
}

async function handleRichlist(interaction, kv) {
  if (!inBotChannel(interaction)) return wrongChannel();
  const entries = await getRichlist(kv);
  const medals  = ["🥇", "🥈", "🥉"];
  const rows    = entries.map((e, i) =>
    `${medals[i] ?? `**${i+1}.**`} <@${e.id}> — **${(e.coins||0).toLocaleString()} coins**`
  );
  return json({
    type: 4,
    data: {
      embeds: [{
        color: 0xf7b731,
        title: "💰  WA99 Richest Members",
        description: rows.join("\n") || "Nobody has coins yet. Start chatting!",
        footer: { text: "WA99 Clan • Richlist" },
        timestamp: new Date().toISOString(),
      }],
    },
  });
}

async function handleStreak(interaction, kv) {
  if (!inBotChannel(interaction)) return wrongChannel();
  const user        = interaction.member?.user ?? interaction.user;
  const data        = await getUserData(kv, user.id);
  const today       = todayUTC();
  const streak      = data.streak || 0;
  const activeToday = data.lastStreakDay === today;
  const color = streak >= STREAK_COLOR_GOLD_DAYS ? 0xf7b731 : streak >= STREAK_COLOR_PINK_DAYS ? 0xeb459e : streak >= STREAK_COLOR_GREEN_DAYS ? 0x57f287 : 0x5865f2;
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
          { name: "🔥 Streak",      value: `**${streak}** day${streak===1?"":"s"}`,             inline: true },
          { name: "🛡️ Shield",      value: data.streakShield ? "Active ✅" : "None",             inline: true },
          { name: "📅 Last Active", value: data.lastStreakDay ?? "Never",                         inline: true },
          { name: "🎁 Daily Bonus", value: `+${STREAK_BONUS_XP} XP base, +25 every 7 days`,     inline: false },
        ],
        footer: { text: "WA99 Clan • Show up every day" },
        timestamp: new Date().toISOString(),
      }],
    },
  });
}

async function handleBalance(interaction, kv) {
  if (!inBotChannel(interaction)) return wrongChannel();
  const user = interaction.member?.user ?? interaction.user;
  const data = await getUserData(kv, user.id);
  const hasBoost      = data.personalBoostExpiresAt  && Date.now() < data.personalBoostExpiresAt;
  const hasDoubler    = data.coinDoublerExpiresAt     && Date.now() < data.coinDoublerExpiresAt;
  return json({
    type: 4,
    data: {
      embeds: [{
        color: 0x57f287,
        author: { name: `${user.username}'s Wallet`, icon_url: avatarUrl(user) },
        thumbnail: { url: avatarUrl(user) },
        fields: [
          { name: "💰 Coins",          value: `**${(data.coins||0).toLocaleString()}**`,                             inline: true },
          { name: "✨ Total XP",        value: `**${data.xp.toLocaleString()}**`,                                    inline: true },
          { name: "📅 Daily Claim",    value: data.lastDailyAt === todayUTC() ? "Claimed ✅" : "Available 🎁",      inline: true },
          { name: "🔨 Work Cooldown",  value: data.lastWorkAt && Date.now() - data.lastWorkAt < WORK_COOLDOWN_MS ? `<t:${Math.floor((data.lastWorkAt + WORK_COOLDOWN_MS)/1000)}:R>` : "Ready ✅", inline: true },
          { name: "💸 Total Earned",   value: `${(data.totalCoinsEarned||0).toLocaleString()} coins`,                inline: true },
          { name: "🛍️ Total Spent",    value: `${(data.totalCoinsSpent||0).toLocaleString()} coins`,                 inline: true },
          ...(hasBoost   ? [{ name: "⚡ XP Boost",    value: `Active until <t:${Math.floor(data.personalBoostExpiresAt/1000)}:R>`,  inline: true }] : []),
          ...(hasDoubler ? [{ name: "💸 Coin Doubler",value: `Active until <t:${Math.floor(data.coinDoublerExpiresAt/1000)}:R>`,    inline: true }] : []),
        ],
        footer: { text: "WA99 Clan Shop • /shop to browse" },
        timestamp: new Date().toISOString(),
      }],
    },
  });
}

async function handleShop(interaction, kv) {
  if (!inBotChannel(interaction)) return wrongChannel();
  const user = interaction.member?.user ?? interaction.user;
  const data = await getUserData(kv, user.id);
  const level = getLevelFromXP(data.xp);
  return json({ type: 4, data: buildShopEmbed(data.coins || 0, level) });
}

async function handleBuy(interaction, kv) {
  if (!inBotChannel(interaction)) return wrongChannel();
  const user   = interaction.member?.user ?? interaction.user;
  const itemId = interaction.data.options.find(o => o.name === "item")?.value;
  const item   = SHOP_ITEMS[itemId];
  if (!item) return ephemeral("❌ Unknown item. Use `/shop` to see what's available.");

  const data  = await getUserData(kv, user.id);
  const level = getLevelFromXP(data.xp);
  const cost  = getItemCost(item, level);

  if ((data.coins || 0) < cost)
    return ephemeral(`❌ Not enough coins! You have **${(data.coins||0).toLocaleString()}** but need **${cost.toLocaleString()}** (cost scales with your level ${level}).`);

  data.coins = (data.coins || 0) - cost;
  data.totalCoinsSpent = (data.totalCoinsSpent || 0) + cost;

  let resultDesc = "";
  let embedColor = 0x57f287;
  let triggered  = false; // downside triggered?

  switch (itemId) {
    case "xp_potion": {
      const ds = item.downside;
      if (Math.random() < ds.chance) {
        // Dud — coins already spent, no XP
        triggered  = true;
        embedColor = 0xed4245;
        resultDesc = `💥 **Dud!** The potion fizzled out. You lost **${cost.toLocaleString()} coins** and got nothing.\n*(${Math.round(ds.chance * 100)}% chance — you got unlucky)*`;
      } else {
        data.xp += XP_POTION_GRANT; data.level = getLevelFromXP(data.xp);
        resultDesc = `✅ +**${XP_POTION_GRANT.toLocaleString()} XP** added! You now have **${data.xp.toLocaleString()} XP** (Level **${data.level}**).`;
      }
      break;
    }
    case "xp_elixir": {
      const ds = item.downside;
      if (Math.random() < ds.chance) {
        // Backfire — lose XP
        triggered  = true;
        embedColor = 0xed4245;
        const lost = Math.min(ds.penalty, data.xp);
        data.xp    = Math.max(0, data.xp - ds.penalty);
        data.level = getLevelFromXP(data.xp);
        resultDesc = `💥 **Backfire!** The elixir reacted badly. You lost **${lost.toLocaleString()} XP** instead of gaining!\nNow at **${data.xp.toLocaleString()} XP** (Level **${data.level}**).\n*(${Math.round(ds.chance * 100)}% chance — you got unlucky)*`;
      } else {
        data.xp += XP_ELIXIR_GRANT; data.level = getLevelFromXP(data.xp);
        resultDesc = `✅ +**${XP_ELIXIR_GRANT.toLocaleString()} XP** added! You now have **${data.xp.toLocaleString()} XP** (Level **${data.level}**).**`;
      }
      break;
    }
    case "xp_bomb": {
      const ds = item.downside;
      if (Math.random() < ds.chance) {
        // Catastrophe — lose streak AND 10% XP
        triggered  = true;
        embedColor = 0xed4245;
        const xpLost   = Math.floor(data.xp * XP_BOMB_CATASTROPHE_PCT);
        const oldStreak = data.streak || 0;
        data.xp     = Math.max(0, data.xp - xpLost);
        data.level  = getLevelFromXP(data.xp);
        data.streak = 0;
        data.lastStreakDay = null;
        resultDesc = [
          `💥 **CATASTROPHIC FAILURE!** The bomb detonated prematurely!`,
          ``,
          `❌ Lost **${xpLost.toLocaleString()} XP** (${Math.round(XP_BOMB_CATASTROPHE_PCT*100)}% of your total)`,
          `❌ Lost your **${oldStreak}-day streak**`,
          ``,
          `Now at **${data.xp.toLocaleString()} XP** (Level **${data.level}**).`,
          `*(${Math.round(ds.chance * 100)}% chance — you got unlucky)*`,
        ].join("\n");
      } else {
        data.xp += XP_BOMB_GRANT; data.level = getLevelFromXP(data.xp);
        resultDesc = `💣 **+${XP_BOMB_GRANT.toLocaleString()} XP** BOOM! You now have **${data.xp.toLocaleString()} XP** (Level **${data.level}**).**`;
      }
      break;
    }
    case "streak_shield":
      if (data.streakShield) { data.coins += cost; data.totalCoinsSpent -= cost; return ephemeral("❌ You already have a Streak Shield active!"); }
      data.streakShield = true;
      resultDesc = "🛡️ **Streak Shield activated!** You're protected for one missed day.";
      break;
    case "personal_boost":
      data.personalBoostExpiresAt = Date.now() + PERSONAL_BOOST_DURATION;
      resultDesc = `⚡ **${PERSONAL_BOOST_MULT}x Personal Boost activated!** Expires <t:${Math.floor(data.personalBoostExpiresAt/1000)}:R>.`;
      break;
    case "coin_doubler":
      data.coinDoublerExpiresAt = Date.now() + COIN_DOUBLER_DURATION;
      resultDesc = `💸 **Coin Doubler activated!** ${COIN_DOUBLER_MULT}x coins from chatting expires <t:${Math.floor(data.coinDoublerExpiresAt/1000)}:R>.`;
      break;
    case "loot_box": {
      const { reward, description } = openLootBox(data, false);
      resultDesc = `🎁 You opened a Loot Box and got ${reward}!\n${description}`;
      break;
    }
    case "mega_loot_box": {
      const { reward, description } = openLootBox(data, true);
      resultDesc = `🎰 You opened a **Mega Loot Box** and got ${reward}!\n${description}`;
      break;
    }
  }

  await setUserData(kv, user.id, data);
  return json({
    type: 4,
    data: {
      embeds: [{
        color: embedColor,
        title: triggered
          ? `💥 ${item.name} — Downside Triggered!`
          : `${item.name} — Purchased`,
        description: resultDesc,
        fields: [{ name: "💰 Remaining Coins", value: `**${data.coins.toLocaleString()}**`, inline: true }],
        footer: { text: "WA99 Clan Shop • Risk and reward 🎲" },
        timestamp: new Date().toISOString(),
      }],
    },
  });
}

async function handleDaily(interaction, kv) {
  if (!inBotChannel(interaction)) return wrongChannel();
  const user  = interaction.member?.user ?? interaction.user;
  const data  = await getUserData(kv, user.id);
  const today = todayUTC();
  if (data.lastDailyAt === today) return ephemeral("❌ Already claimed today. Come back tomorrow!");
  const coins   = randInt(DAILY_COINS_MIN, DAILY_COINS_MAX);
  const bonusXP = data.streak >= 7 ? DAILY_STREAK_BONUS_XP : 0;
  data.coins = (data.coins || 0) + coins;
  data.totalCoinsEarned = (data.totalCoinsEarned || 0) + coins;
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
          { name: "💰 Coins",       value: `+**${coins}**`,                                             inline: true },
          { name: "✨ Bonus XP",    value: bonusXP > 0 ? `+**${bonusXP}** (streak bonus!)` : "None",   inline: true },
          { name: "💰 Balance",     value: `**${data.coins.toLocaleString()} coins**`,                  inline: true },
        ],
        footer: { text: "WA99 Clan • Come back tomorrow!" },
        timestamp: new Date().toISOString(),
      }],
    },
  });
}

async function handleWork(interaction, kv) {
  if (!inBotChannel(interaction)) return wrongChannel();
  const user = interaction.member?.user ?? interaction.user;
  const data = await getUserData(kv, user.id);
  const now  = Date.now();

  if (data.lastWorkAt && now - data.lastWorkAt < WORK_COOLDOWN_MS) {
    const remaining = WORK_COOLDOWN_MS - (now - data.lastWorkAt);
    return ephemeral(`⏳ You're on cooldown! Work again <t:${Math.floor((data.lastWorkAt + WORK_COOLDOWN_MS)/1000)}:R> (${msToTime(remaining)}).`);
  }

  const coins      = randInt(WORK_COINS_MIN, WORK_COINS_MAX);
  const hasDoubler = data.coinDoublerExpiresAt && now < data.coinDoublerExpiresAt;
  const earned     = hasDoubler ? coins * COIN_DOUBLER_MULT : coins;
  const response   = WORK_RESPONSES[Math.floor(Math.random() * WORK_RESPONSES.length)];

  data.coins = (data.coins || 0) + earned;
  data.totalCoinsEarned = (data.totalCoinsEarned || 0) + earned;
  data.lastWorkAt = now;
  await setUserData(kv, user.id, data);

  return json({
    type: 4,
    data: {
      embeds: [{
        color: 0x57f287,
        title: "🔨 Work Complete!",
        description: `${response}.\n\n💰 Earned **${earned} coins**${hasDoubler ? " (2x doubler active!)" : ""}!`,
        fields: [
          { name: "💰 New Balance", value: `**${data.coins.toLocaleString()} coins**`, inline: true },
          { name: "⏰ Next Work",   value: `<t:${Math.floor((now + WORK_COOLDOWN_MS)/1000)}:R>`,     inline: true },
        ],
        footer: { text: "WA99 Clan • Work cooldown: 1 hour" },
        timestamp: new Date().toISOString(),
      }],
    },
  });
}

async function handleRob(interaction, kv) {
  if (!inBotChannel(interaction)) return wrongChannel();
  const robber   = interaction.member?.user ?? interaction.user;
  const targetId = interaction.data.options.find(o => o.name === "user")?.value;
  const targetUser = interaction.data.resolved?.users?.[targetId];

  if (robber.id === targetId) return ephemeral("❌ You can't rob yourself lmao.");

  const robberData = await getUserData(kv, robber.id);
  const now        = Date.now();

  if (robberData.lastRobAt && now - robberData.lastRobAt < ROB_COOLDOWN_MS) {
    return ephemeral(`⏳ Rob cooldown active. Try again <t:${Math.floor((robberData.lastRobAt + ROB_COOLDOWN_MS)/1000)}:R>.`);
  }

  const targetData = await getUserData(kv, targetId);
  if ((targetData.coins || 0) < ROB_MIN_TARGET_COINS) return ephemeral(`❌ That person doesn't have enough coins to rob (minimum ${ROB_MIN_TARGET_COINS}).`);

  robberData.lastRobAt = now;
  const success = Math.random() < ROB_SUCCESS_CHANCE;

  if (success) {
    const maxRob  = Math.floor(targetData.coins * ROB_MAX_STEAL_PCT);
    const stolen  = randInt(Math.floor(maxRob * 0.5), maxRob);
    targetData.coins  = Math.max(0, (targetData.coins || 0) - stolen);
    robberData.coins  = (robberData.coins || 0) + stolen;
    robberData.totalCoinsEarned = (robberData.totalCoinsEarned || 0) + stolen;
    await setUserData(kv, robber.id, robberData);
    await setUserData(kv, targetId, targetData);
    return json({
      type: 4,
      data: {
        embeds: [{
          color: 0xf7b731,
          title: "🦹 Robbery Successful!",
          description: `<@${robber.id}> crept up on <@${targetId}> and got away with **${stolen.toLocaleString()} coins**! 😂`,
          fields: [
            { name: "💰 Your Balance",   value: `**${robberData.coins.toLocaleString()} coins**`,  inline: true },
            { name: "💸 Victim Balance", value: `**${targetData.coins.toLocaleString()} coins**`,  inline: true },
          ],
          footer: { text: "WA99 Clan Casino 🎰 • Rob cooldown: 2 hours" },
          timestamp: new Date().toISOString(),
        }],
      },
    });
  } else {
    // Failed — pay a fine
    const fine = randInt(ROB_FINE_MIN, ROB_FINE_MAX);
    robberData.coins = Math.max(0, (robberData.coins || 0) - fine);
    await setUserData(kv, robber.id, robberData);
    return json({
      type: 4,
      data: {
        embeds: [{
          color: 0xed4245,
          title: "🚨 Caught Red-Handed!",
          description: `<@${robber.id}> tried to rob <@${targetId}> but got caught!\nPaid a fine of **${fine} coins**. 💸`,
          fields: [{ name: "💰 Your Balance", value: `**${robberData.coins.toLocaleString()} coins**`, inline: true }],
          footer: { text: "WA99 Clan Casino 🎰 • Rob cooldown: 2 hours" },
          timestamp: new Date().toISOString(),
        }],
      },
    });
  }
}

async function handleTransfer(interaction, kv) {
  if (!inBotChannel(interaction)) return wrongChannel();
  const sender   = interaction.member?.user ?? interaction.user;
  const targetId = interaction.data.options.find(o => o.name === "user")?.value;
  const amount   = Number(interaction.data.options.find(o => o.name === "amount")?.value);

  if (sender.id === targetId) return ephemeral("❌ Can't send coins to yourself.");
  if (amount < TRANSFER_MIN || amount > TRANSFER_MAX) return ephemeral(`❌ Amount must be between ${TRANSFER_MIN} and ${TRANSFER_MAX.toLocaleString()}.`);

  const senderData = await getUserData(kv, sender.id);
  if ((senderData.coins || 0) < amount) return ephemeral(`❌ Not enough coins! You have **${(senderData.coins||0).toLocaleString()}**.`);

  senderData.coins = (senderData.coins || 0) - amount;
  const recipientData  = await getUserData(kv, targetId);
  recipientData.coins  = (recipientData.coins || 0) + amount;
  recipientData.totalCoinsEarned = (recipientData.totalCoinsEarned || 0) + amount;

  await setUserData(kv, sender.id, senderData);
  await setUserData(kv, targetId, recipientData);

  return json({
    type: 4,
    data: {
      embeds: [{
        color: 0x57f287,
        title: "💸 Coins Sent!",
        description: `<@${sender.id}> sent **${amount.toLocaleString()} coins** to <@${targetId}>!`,
        fields: [
          { name: "💰 Your Balance",       value: `**${senderData.coins.toLocaleString()} coins**`,    inline: true },
          { name: "💰 Recipient Balance",  value: `**${recipientData.coins.toLocaleString()} coins**`, inline: true },
        ],
        footer: { text: "WA99 Clan Economy 💰" },
        timestamp: new Date().toISOString(),
      }],
    },
  });
}

async function handleTrivia(interaction, kv) {
  if (!inBotChannel(interaction)) return wrongChannel();
  const user   = interaction.member?.user ?? interaction.user;
  const answer = interaction.data.options.find(o => o.name === "answer")?.value?.toLowerCase().trim();

  // Pick a pseudo-random question based on hour so everyone gets the same question
  const qIndex   = Math.floor(Date.now() / TRIVIA_CYCLE_MS) % TRIVIA_QUESTIONS.length;
  const question = TRIVIA_QUESTIONS[qIndex];

  if (!answer) {
    // Show the question
    return json({
      type: 4,
      data: {
        embeds: [{
          color: 0x5865f2,
          title: "🧠 Trivia Question",
          description: `**${question.q}**\n\nChoices: ${question.choices.map(c => `\`${c}\``).join(", ")}\n\nUse \`/trivia answer:your_answer\` to answer! (Changes every ${TRIVIA_CYCLE_MS / 60000} minutes)`,
          footer: { text: `WA99 Clan Trivia • Reward: ${TRIVIA_REWARD_COINS} coins` },
          timestamp: new Date().toISOString(),
        }],
      },
    });
  }

  // Check if already answered this hour
  const hourKey   = `trivia:${user.id}:${Math.floor(Date.now() / TRIVIA_CYCLE_MS)}`;
  const answered  = await kv.get(hourKey);
  if (answered) return ephemeral(`❌ You've already answered this trivia! Come back in ${TRIVIA_CYCLE_MS / 60000} minutes.`);

  const correct = answer === question.a.toLowerCase();
  await kv.put(hourKey, "1", { expirationTtl: Math.floor(TRIVIA_CYCLE_MS / 1000) });

  if (correct) {
    const data = await getUserData(kv, user.id);
    data.coins = (data.coins || 0) + TRIVIA_REWARD_COINS;
    data.totalCoinsEarned = (data.totalCoinsEarned || 0) + TRIVIA_REWARD_COINS;
    await setUserData(kv, user.id, data);
    return json({
      type: 4,
      data: {
        embeds: [{
          color: 0x57f287,
          title: "🧠 Correct!",
          description: `✅ <@${user.id}> got it right!\nThe answer was **${question.a}**.\n\n+**${TRIVIA_REWARD_COINS} coins** added to your balance!`,
          fields: [{ name: "💰 New Balance", value: `**${data.coins.toLocaleString()} coins**`, inline: true }],
          footer: { text: `WA99 Clan Trivia • New question every ${TRIVIA_CYCLE_MS / 60000} minutes` },
          timestamp: new Date().toISOString(),
        }],
      },
    });
  } else {
    return json({
      type: 4,
      data: {
        embeds: [{
          color: 0xed4245,
          title: "🧠 Wrong!",
          description: `❌ <@${user.id}> got it wrong.\nThe correct answer was **${question.a}**. Better luck next time!`,
          footer: { text: `WA99 Clan Trivia • New question every ${TRIVIA_CYCLE_MS / 60000} minutes` },
          timestamp: new Date().toISOString(),
        }],
      },
    });
  }
}

async function handleCoinflip(interaction, kv) {
  if (!inBotChannel(interaction)) return wrongChannel();
  const user   = interaction.member?.user ?? interaction.user;
  const choice = interaction.data.options.find(o => o.name === "side")?.value;
  const bet    = Number(interaction.data.options.find(o => o.name === "amount")?.value ?? 50);
  if (bet < GAMBLE_BET_MIN) return ephemeral(`❌ Minimum bet is **${GAMBLE_BET_MIN} coins**.`);
  if (bet > GAMBLE_BET_MAX) return ephemeral(`❌ Maximum bet is **${GAMBLE_BET_MAX.toLocaleString()} coins**.`);
  const data = await getUserData(kv, user.id);
  if ((data.coins || 0) < bet) return ephemeral(`❌ Not enough coins! You have **${(data.coins||0).toLocaleString()}**.`);
  const result = Math.random() < COINFLIP_WIN_CHANCE ? "heads" : "tails";
  const won    = result === choice;
  data.coins   = (data.coins || 0) + (won ? bet : -bet);
  if (data.coins < 0) data.coins = 0;
  if (won) data.totalCoinsEarned = (data.totalCoinsEarned || 0) + bet;
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
  if (!inBotChannel(interaction)) return wrongChannel();
  const user = interaction.member?.user ?? interaction.user;
  const bet  = Number(interaction.data.options.find(o => o.name === "amount")?.value ?? 50);
  if (bet < GAMBLE_BET_MIN) return ephemeral(`❌ Minimum bet is **${GAMBLE_BET_MIN} coins**.`);
  if (bet > GAMBLE_BET_MAX) return ephemeral(`❌ Maximum bet is **${GAMBLE_BET_MAX.toLocaleString()} coins**.`);
  const data = await getUserData(kv, user.id);
  if ((data.coins || 0) < bet) return ephemeral(`❌ Not enough coins! You have **${(data.coins||0).toLocaleString()}**.`);
  const reels  = spinSlots();
  const payout = calcSlotPayout(reels, bet);
  data.coins   = (data.coins || 0) - bet + payout.coins;
  if (data.coins < 0) data.coins = 0;
  if (payout.coins > 0) data.totalCoinsEarned = (data.totalCoinsEarned || 0) + payout.coins;
  await setUserData(kv, user.id, data);
  const slotDisplay = `╔══════════════╗\n║  ${reels.join("  ")}  ║\n╚══════════════╝`;
  let resultText, color;
  if (payout.type === "jackpot") {
    color = 0xf7b731;
    resultText = `🎰 **JACKPOT!** ${payout.multiplier}x — You won **${payout.coins.toLocaleString()} coins**!`;
  } else if (payout.type === "pair") {
    color = 0x57f287;
    resultText = `✅ **Two of a kind!** — You won **${payout.coins.toLocaleString()} coins**!`;
  } else {
    color = 0xed4245;
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
  if (!inBotChannel(interaction)) return wrongChannel();
  const senderId = interaction.member?.user?.id ?? interaction.user?.id;
  const targetId = interaction.data.options.find(o => o.name === "user")?.value;
  const amount   = Number(interaction.data.options.find(o => o.name === "amount")?.value ?? 50);
  if (senderId === targetId) return ephemeral("❌ You can't give XP to yourself.");
  if (amount < 1 || amount > GIVE_XP_DAILY_CAP) return ephemeral(`❌ Amount must be 1–${GIVE_XP_DAILY_CAP}.`);
  const senderData = await getUserData(kv, senderId);
  const today = todayUTC();
  if (senderData.giveXpDate !== today) { senderData.giveXpUsed = 0; senderData.giveXpDate = today; }
  const remaining = GIVE_XP_DAILY_CAP - (senderData.giveXpUsed || 0);
  if (amount > remaining) return ephemeral(`❌ You can only give **${remaining} more XP** today (cap: ${GIVE_XP_DAILY_CAP}).`);
  if (senderData.xp < amount) return ephemeral(`❌ Not enough XP. You have **${senderData.xp.toLocaleString()} XP**.`);
  senderData.xp = Math.max(0, senderData.xp - amount);
  senderData.level = getLevelFromXP(senderData.xp);
  senderData.giveXpUsed = (senderData.giveXpUsed || 0) + amount;
  await setUserData(kv, senderId, senderData);
  const recipientData = await getUserData(kv, targetId);
  recipientData.xp   += amount;
  recipientData.level = getLevelFromXP(recipientData.xp);
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
  if (multiplier < EVENT_MULT_MIN || multiplier > EVENT_MULT_MAX)           return ephemeral(`❌ Multiplier must be ${EVENT_MULT_MIN}–${EVENT_MULT_MAX}.`);
  if (durationHours < EVENT_DURATION_MIN || durationHours > EVENT_DURATION_MAX) return ephemeral(`❌ Duration must be ${EVENT_DURATION_MIN}–${EVENT_DURATION_MAX} hours.`);
  const expiresAt = Date.now() + durationHours * 3_600_000; // hours → ms
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
        description: `${amount > 0 ? "✅ Added" : "✅ Removed"} **${Math.abs(amount)} XP** ${amount > 0 ? "to" : "from"} <@${targetId}>.\nNow: **${data.xp.toLocaleString()} XP** (Level **${data.level}**).`,
        footer: { text: "WA99 Clan Admin" },
      }],
    },
  });
}

async function handleResetXP(interaction, kv) {
  if (!isAdmin(interaction)) return ephemeral("❌ Admin only.");
  const targetId = interaction.data.options.find(o => o.name === "user")?.value;
  await setUserData(kv, targetId, { xp: 0, level: 0, messages: 0, lastXpAt: 0, streak: 0, lastStreakDay: null, giveXpUsed: 0, giveXpDate: null, coins: 0, lastDailyAt: null, streakShield: false, personalBoostExpiresAt: null, coinDoublerExpiresAt: null, lastWorkAt: null, lastRobAt: null, totalCoinsEarned: 0, totalCoinsSpent: 0 });
  return json({
    type: 4,
    data: { embeds: [{ color: 0xed4245, description: `🔄 Reset all data for <@${targetId}>.`, footer: { text: "WA99 Clan Admin" } }] },
  });
}

// ─── Admin Command Handlers ───────────────────────────────────────────────────

async function handleAddCoins(interaction, kv) {
  if (!isAdmin(interaction)) return noPerms();
  const targetId = interaction.data.options.find(o => o.name === "user")?.value;
  const amount   = Number(interaction.data.options.find(o => o.name === "amount")?.value ?? 100);
  const data     = await getUserData(kv, targetId);
  data.coins     = Math.max(0, (data.coins || 0) + amount);
  if (amount > 0) data.totalCoinsEarned = (data.totalCoinsEarned || 0) + amount;
  await setUserData(kv, targetId, data);
  return json({
    type: 4,
    data: {
      embeds: [{
        color: amount > 0 ? 0x57f287 : 0xed4245,
        description: `${amount > 0 ? "✅ Added" : "✅ Removed"} **${Math.abs(amount).toLocaleString()} coins** ${amount > 0 ? "to" : "from"} <@${targetId}>.\nThey now have **${data.coins.toLocaleString()} coins**.`,
        footer: { text: "WA99 Clan Admin" },
      }],
    },
  });
}

async function handleSetLevel(interaction, kv) {
  if (!isAdmin(interaction)) return noPerms();
  const targetId = interaction.data.options.find(o => o.name === "user")?.value;
  const level    = Number(interaction.data.options.find(o => o.name === "level")?.value);
  if (level < 0 || level > SET_LEVEL_MAX) return ephemeral(`❌ Level must be between 0 and ${SET_LEVEL_MAX}.`);
  const data     = await getUserData(kv, targetId);
  const oldLevel = data.level;
  data.xp        = xpForLevel(level);
  data.level     = level;
  await setUserData(kv, targetId, data);
  return json({
    type: 4,
    data: {
      embeds: [{
        color: 0x5865f2,
        description: `🎚️ Set <@${targetId}>'s level from **${oldLevel}** → **${level}**.\nXP set to **${data.xp.toLocaleString()}**.`,
        footer: { text: "WA99 Clan Admin" },
      }],
    },
  });
}

async function handleEventEnd(interaction, kv) {
  if (!isAdmin(interaction)) return noPerms();
  const existing = await kv.get("event:multiplier");
  if (!existing) return ephemeral("❌ There is no active XP event to end.");
  const ev = JSON.parse(existing);
  await kv.delete("event:multiplier");
  return json({
    type: 4,
    data: {
      embeds: [{
        color: 0xed4245,
        title: "⚡ XP Event Ended",
        description: `The **${ev.multiplier}x XP event** has been manually ended by an admin.\nXP rates are back to normal.`,
        footer: { text: "WA99 Clan Admin" },
        timestamp: new Date().toISOString(),
      }],
    },
  });
}

async function handleBoostUser(interaction, kv) {
  if (!isAdmin(interaction)) return noPerms();
  const targetId = interaction.data.options.find(o => o.name === "user")?.value;
  const hours    = Number(interaction.data.options.find(o => o.name === "hours")?.value ?? 1);
  if (hours < BOOST_USER_MIN_HOURS || hours > BOOST_USER_MAX_HOURS) return ephemeral(`❌ Duration must be between ${BOOST_USER_MIN_HOURS} and ${BOOST_USER_MAX_HOURS} hours.`);
  const data     = await getUserData(kv, targetId);
  data.personalBoostExpiresAt = Date.now() + hours * 3_600_000;
  await setUserData(kv, targetId, data);
  return json({
    type: 4,
    data: {
      embeds: [{
        color: 0xfee75c,
        title: "⚡ Personal Boost Granted!",
        description: `<@${targetId}> has been given a **${PERSONAL_BOOST_MULT}x XP boost** for **${hours} hour${hours === 1 ? "" : "s"}**!\nExpires <t:${Math.floor(data.personalBoostExpiresAt / 1000)}:R>.`,
        footer: { text: "WA99 Clan Admin" },
        timestamp: new Date().toISOString(),
      }],
    },
  });
}

async function handleBlacklist(interaction, kv) {
  if (!isAdmin(interaction)) return noPerms();
  const targetId = interaction.data.options.find(o => o.name === "user")?.value;
  const data     = await getUserData(kv, targetId);
  data.blacklisted = true;
  await setUserData(kv, targetId, data);
  return json({
    type: 4,
    data: {
      embeds: [{
        color: 0xed4245,
        description: `🚫 <@${targetId}> has been **blacklisted** and will no longer earn XP or coins.`,
        footer: { text: "WA99 Clan Admin" },
      }],
    },
  });
}

async function handleUnblacklist(interaction, kv) {
  if (!isAdmin(interaction)) return noPerms();
  const targetId = interaction.data.options.find(o => o.name === "user")?.value;
  const data     = await getUserData(kv, targetId);
  data.blacklisted = false;
  await setUserData(kv, targetId, data);
  return json({
    type: 4,
    data: {
      embeds: [{
        color: 0x57f287,
        description: `✅ <@${targetId}> has been **unblacklisted** and can earn XP and coins again.`,
        footer: { text: "WA99 Clan Admin" },
      }],
    },
  });
}

async function handleServerStats(interaction, kv) {
  if (!isAdmin(interaction)) return noPerms();
  const list  = await kv.list({ prefix: "user:" });
  let totalXP = 0, totalCoins = 0, totalMessages = 0, activeCount = 0;
  const thirtyDaysAgo = Date.now() - STATS_ACTIVE_DAYS * 86_400_000;

  for (const { name } of list.keys) {
    const raw = await kv.get(name);
    if (!raw) continue;
    const d = JSON.parse(raw);
    totalXP       += d.xp       || 0;
    totalCoins    += d.coins    || 0;
    totalMessages += d.messages || 0;
    if (d.lastXpAt && d.lastXpAt > thirtyDaysAgo) activeCount++;
  }

  const event = await getMultiplierEvent(kv);
  const weeklyEntries = await getWeeklyLeaderboard(kv);

  return json({
    type: 4,
    data: {
      embeds: [{
        color: 0x5865f2,
        title: "📊  WA99 Server Stats",
        fields: [
          { name: "👥 Total Members Tracked", value: `**${list.keys.length.toLocaleString()}**`,  inline: true },
          { name: `🟢 Active (${STATS_ACTIVE_DAYS} days)`,      value: `**${activeCount.toLocaleString()}**`,       inline: true },
          { name: "✨ Total XP Earned",         value: `**${totalXP.toLocaleString()}**`,           inline: true },
          { name: "💰 Total Coins in Circulation", value: `**${totalCoins.toLocaleString()}**`,    inline: true },
          { name: "💬 Total Messages",          value: `**${totalMessages.toLocaleString()}**`,     inline: true },
          { name: "📅 Weekly Active",           value: `**${weeklyEntries.length}** members`,       inline: true },
          {
            name: "⚡ Active XP Event",
            value: event
              ? `**${event.multiplier}x** — expires <t:${Math.floor(event.expiresAt / 1000)}:R>`
              : "None",
            inline: false,
          },
        ],
        footer: { text: "WA99 Clan Admin • Server Overview" },
        timestamp: new Date().toISOString(),
      }],
    },
  });
}

async function handleAnnounce(interaction, kv, env) {
  if (!isAdmin(interaction)) return noPerms();
  const message = interaction.data.options.find(o => o.name === "message")?.value;
  const title   = interaction.data.options.find(o => o.name === "title")?.value ?? "📢  WA99 Clan Announcement";
  const color   = interaction.data.options.find(o => o.name === "color")?.value ?? "gold";

  const colorMap = {
    gold:    0xf7b731,
    green:   0x57f287,
    blue:    0x5865f2,
    red:     0xed4245,
    pink:    0xeb459e,
    yellow:  0xfee75c,
    white:   0xffffff,
  };

  const embedColor = colorMap[color] ?? 0xf7b731;

  // Queue the announcement for the gateway to post in LEVELUP_CHANNEL_ID
  await kv.put("admin:pending_announcement", JSON.stringify({
    embeds: [{
      color: embedColor,
      title,
      description: message,
      footer: { text: "WA99 Clan" },
      timestamp: new Date().toISOString(),
    }],
  }), { expirationTtl: 300 }); // expires in 5 min if gateway doesn't pick it up

  return json({
    type: 4,
    data: {
      embeds: [{
        color: 0x57f287,
        description: `✅ Announcement queued! It will post in <#${LEVELUP_CHANNEL_ID}> within 60 seconds.`,
        footer: { text: "WA99 Clan Admin" },
      }],
      flags: 64, // ephemeral — only visible to the admin
    },
  });
}

async function handleViewUser(interaction, kv) {
  if (!isAdmin(interaction)) return noPerms();
  const targetId   = interaction.data.options.find(o => o.name === "user")?.value;
  const targetUser = interaction.data.resolved?.users?.[targetId];
  const data       = await getUserData(kv, targetId);
  const level      = getLevelFromXP(data.xp);
  const hasBoost   = data.personalBoostExpiresAt && Date.now() < data.personalBoostExpiresAt;
  const hasDoubler = data.coinDoublerExpiresAt   && Date.now() < data.coinDoublerExpiresAt;
  const robCd  = data.lastRobAt  && Date.now() - data.lastRobAt  < ROB_COOLDOWN_MS;
  const workCd = data.lastWorkAt && Date.now() - data.lastWorkAt < WORK_COOLDOWN_MS;

  return json({
    type: 4,
    data: {
      embeds: [{
        color: 0x5865f2,
        title: `🔍 Admin View — ${targetUser?.username ?? targetId}`,
        fields: [
          { name: "⚡ Level",          value: `**${level}**`,                                                              inline: true },
          { name: "✨ XP",             value: `**${data.xp.toLocaleString()}**`,                                           inline: true },
          { name: "💰 Coins",          value: `**${(data.coins||0).toLocaleString()}**`,                                   inline: true },
          { name: "🔥 Streak",         value: `**${data.streak||0}** days${data.streakShield?" 🛡️":""}`,                   inline: true },
          { name: "💬 Messages",       value: `**${(data.messages||0).toLocaleString()}**`,                                inline: true },
          { name: "🚫 Blacklisted",    value: data.blacklisted ? "**Yes**" : "No",                                         inline: true },
          { name: "💸 Total Earned",   value: `**${(data.totalCoinsEarned||0).toLocaleString()}** coins`,                  inline: true },
          { name: "🛍️ Total Spent",   value: `**${(data.totalCoinsSpent||0).toLocaleString()}** coins`,                   inline: true },
          { name: "📅 Last Active",    value: data.lastXpAt ? `<t:${Math.floor(data.lastXpAt/1000)}:R>` : "Never",        inline: true },
          { name: "⚡ XP Boost",       value: hasBoost   ? `Active until <t:${Math.floor(data.personalBoostExpiresAt/1000)}:R>` : "None", inline: true },
          { name: "💸 Coin Doubler",   value: hasDoubler ? `Active until <t:${Math.floor(data.coinDoublerExpiresAt/1000)}:R>`   : "None", inline: true },
          { name: "🔨 Work CD",        value: workCd ? `<t:${Math.floor((data.lastWorkAt+WORK_COOLDOWN_MS)/1000)}:R>` : "Ready", inline: true },
          { name: "🦹 Rob CD",         value: robCd  ? `<t:${Math.floor((data.lastRobAt+ROB_COOLDOWN_MS)/1000)}:R>`   : "Ready", inline: true },
        ],
        footer: { text: "WA99 Clan Admin • Full User View" },
        timestamp: new Date().toISOString(),
      }],
      flags: 64,
    },
  });
}

// ─── Message XP Handler ───────────────────────────────────────────────────────
async function handleMessageXP(body, kv, secret) {
  if (body.secret !== secret) return new Response("Unauthorized", { status: 401 });
  const { userId, channelId, userData: discordUser, messageCount = 1 } = body;
  const data     = await getUserData(kv, userId);
  if (data.blacklisted) return new Response(JSON.stringify({ levelUp: false }), { headers: { "Content-Type": "application/json" } });
  const oldLevel = getLevelFromXP(data.xp);
  const event    = await getMultiplierEvent(kv);
  const serverMult    = event?.multiplier ?? 1;
  const hasPersonalBoost = data.personalBoostExpiresAt && Date.now() < data.personalBoostExpiresAt;
  const effectiveMult = hasPersonalBoost ? Math.max(serverMult, PERSONAL_BOOST_MULT) : serverMult;
  const hasDoubler    = data.coinDoublerExpiresAt && Date.now() < data.coinDoublerExpiresAt;
  const { streakBonus, newDay } = updateStreak(data);
  const countCapped = Math.min(messageCount, XP_COOLDOWN_MSGS);
  const earned      = Math.floor(XP_PER_MESSAGE * countCapped * effectiveMult) + streakBonus;
  const coinsEarned = COINS_PER_FLUSH * countCapped * (hasDoubler ? COIN_DOUBLER_MULT : 1);
  data.xp       += earned;
  data.messages += messageCount;
  data.lastXpAt  = Date.now();
  data.level     = getLevelFromXP(data.xp);
  data.coins     = (data.coins || 0) + coinsEarned;
  data.totalCoinsEarned = (data.totalCoinsEarned || 0) + coinsEarned;
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
  if (dayOfWeek === WEEKLY_RESET_DAY) {
    const weeklyEntries = await getWeeklyLeaderboard(kv);
    if (weeklyEntries.length > 0)
      await kv.put("weekly:pending_announcement", JSON.stringify({ entries: weeklyEntries.slice(0, 3), weekStart: now.toISOString() }));
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
    const decayAmount = Math.floor(data.xp * Math.min(extraDays * DECAY_RATE, DECAY_MAX_FRACTION));
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
    if (url.pathname === "/admin-announcement" && request.method === "GET") {
      if (request.headers.get("x-secret") !== env.GATEWAY_SECRET) return new Response("Unauthorized", { status: 401 });
      const raw = await env.LEVELS_KV.get("admin:pending_announcement");
      if (!raw) return json({ announcement: null });
      await env.LEVELS_KV.delete("admin:pending_announcement");
      return json({ announcement: JSON.parse(raw) });
    }
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
        if (cmd === "richlist")          return handleRichlist(interaction, env.LEVELS_KV);
        if (cmd === "streak")            return handleStreak(interaction, env.LEVELS_KV);
        if (cmd === "balance")           return handleBalance(interaction, env.LEVELS_KV);
        if (cmd === "daily")             return handleDaily(interaction, env.LEVELS_KV);
        if (cmd === "work")              return handleWork(interaction, env.LEVELS_KV);
        if (cmd === "rob")               return handleRob(interaction, env.LEVELS_KV);
        if (cmd === "transfer")          return handleTransfer(interaction, env.LEVELS_KV);
        if (cmd === "trivia")            return handleTrivia(interaction, env.LEVELS_KV);
        if (cmd === "shop")              return handleShop(interaction, env.LEVELS_KV);
        if (cmd === "buy")               return handleBuy(interaction, env.LEVELS_KV);
        if (cmd === "coinflip")          return handleCoinflip(interaction, env.LEVELS_KV);
        if (cmd === "slots")             return handleSlots(interaction, env.LEVELS_KV);
        if (cmd === "givexp")            return handleGiveXP(interaction, env.LEVELS_KV);
        if (cmd === "xpevent")           return handleXPEvent(interaction, env.LEVELS_KV);
        if (cmd === "addxp")             return handleAddXP(interaction, env.LEVELS_KV);
        if (cmd === "addcoins")          return handleAddCoins(interaction, env.LEVELS_KV);
        if (cmd === "setlevel")          return handleSetLevel(interaction, env.LEVELS_KV);
        if (cmd === "eventend")          return handleEventEnd(interaction, env.LEVELS_KV);
        if (cmd === "boostuser")         return handleBoostUser(interaction, env.LEVELS_KV);
        if (cmd === "blacklist")         return handleBlacklist(interaction, env.LEVELS_KV);
        if (cmd === "unblacklist")       return handleUnblacklist(interaction, env.LEVELS_KV);
        if (cmd === "serverstats")       return handleServerStats(interaction, env.LEVELS_KV);
        if (cmd === "announce")          return handleAnnounce(interaction, env.LEVELS_KV, env);
        if (cmd === "viewuser")          return handleViewUser(interaction, env.LEVELS_KV);
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