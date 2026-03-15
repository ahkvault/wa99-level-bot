import "dotenv/config";

const DISCORD_TOKEN = process.env.DISCORD_TOKEN;
const APP_ID        = process.env.DISCORD_APP_ID;
const GUILD_ID      = process.env.DISCORD_GUILD_ID;

if (!DISCORD_TOKEN || !APP_ID) {
  console.error("❌ Set DISCORD_TOKEN and DISCORD_APP_ID.");
  process.exit(1);
}

const commands = [
  // ── XP & Levels ──────────────────────────────────────────────────────────
  {
    name: "rank",
    description: "Check your (or another member's) rank card 📊",
    options: [{ name: "user", description: "Member to check (leave empty for yourself)", type: 6, required: false }],
  },
  { name: "leaderboard",       description: "View the all-time XP leaderboard 🏆" },
  { name: "weeklyleaderboard", description: "View this week's XP leaderboard — resets every Monday 📅" },
  { name: "streak",            description: "Check your daily activity streak 🔥" },
  {
    name: "givexp",
    description: "Gift some of your XP to another member 🎁",
    options: [
      { name: "user",   description: "Member to gift XP to",                          type: 6, required: true },
      { name: "amount", description: "XP to gift (max 200/day, deducted from yours)", type: 4, required: true },
    ],
  },

  // ── Economy ───────────────────────────────────────────────────────────────
  { name: "balance", description: "Check your coins, XP, active boosts, and cooldowns 💰" },
  { name: "daily",   description: "Claim your daily coin reward 🎁" },
  { name: "work",    description: "Work for coins — 1 hour cooldown 🔨" },
  { name: "richlist",description: "See who has the most coins 💰" },
  {
    name: "transfer",
    description: "Send coins to another member 💸",
    options: [
      { name: "user",   description: "Member to send coins to",  type: 6, required: true },
      { name: "amount", description: "Amount to send (max 10,000)", type: 4, required: true },
    ],
  },
  {
    name: "rob",
    description: "Try to steal coins from someone — 40% success, 2hr cooldown 🦹",
    options: [{ name: "user", description: "Member to rob", type: 6, required: true }],
  },

  // ── Shop ─────────────────────────────────────────────────────────────────
  { name: "shop", description: "Browse the WA99 shop 🏪" },
  {
    name: "buy",
    description: "Buy an item from the shop 🛒",
    options: [{
      name: "item", description: "Item to buy", type: 3, required: true,
      choices: [
        { name: "🧪 XP Potion (+500 XP) — 100 coins",               value: "xp_potion"      },
        { name: "⚗️ XP Elixir (+2,500 XP) — 350 coins",             value: "xp_elixir"      },
        { name: "💣 XP Bomb (+10,000 XP) — 900 coins",              value: "xp_bomb"        },
        { name: "🛡️ Streak Shield (miss a day safe) — 200 coins",   value: "streak_shield"  },
        { name: "⚡ Personal 2x Boost (1 hour) — 500 coins",        value: "personal_boost" },
        { name: "💸 Coin Doubler (2 hours) — 400 coins",            value: "coin_doubler"   },
        { name: "🎁 Loot Box (random reward) — 150 coins",          value: "loot_box"       },
        { name: "🎰 Mega Loot Box (rare drops) — 500 coins",        value: "mega_loot_box"  },
      ],
    }],
  },

  // ── Games ─────────────────────────────────────────────────────────────────
  {
    name: "coinflip",
    description: "Flip a coin and bet your coins 🪙",
    options: [
      { name: "side",   description: "Pick a side", type: 3, required: true,
        choices: [{ name: "🟡 Heads", value: "heads" }, { name: "⚫ Tails", value: "tails" }] },
      { name: "amount", description: "Coins to bet (min 10, max 5,000)", type: 4, required: true },
    ],
  },
  {
    name: "slots",
    description: "Spin the slot machine 🎰",
    options: [{ name: "amount", description: "Coins to bet (min 10, max 5,000)", type: 4, required: true }],
  },
  {
    name: "trivia",
    description: "Answer a trivia question for 100 coins 🧠 (changes every hour)",
    options: [{ name: "answer", description: "Your answer (leave blank to see the question)", type: 3, required: false }],
  },

  // ── Admin ─────────────────────────────────────────────────────────────────
  {
    name: "xpevent",
    description: "[Admin] Start a server-wide XP multiplier event ⚡",
    options: [
      { name: "multiplier", description: "XP multiplier (e.g. 2 for double, max 10)", type: 10, required: true },
      { name: "duration",   description: "Duration in hours (e.g. 1, 2, 24)",          type: 10, required: true },
    ],
  },
  {
    name: "eventend",
    description: "[Admin] Cancel the active XP event early 🛑",
  },
  {
    name: "addxp",
    description: "[Admin] Add or remove XP from a member ⚡",
    options: [
      { name: "user",   description: "Target member",                              type: 6, required: true },
      { name: "amount", description: "XP to add (negative to remove, e.g. -100)", type: 4, required: true },
    ],
  },
  {
    name: "addcoins",
    description: "[Admin] Add or remove coins from a member 💰",
    options: [
      { name: "user",   description: "Target member",                                  type: 6, required: true },
      { name: "amount", description: "Coins to add (negative to remove, e.g. -500)",   type: 4, required: true },
    ],
  },
  {
    name: "setlevel",
    description: "[Admin] Force-set a member's level directly 🎚️",
    options: [
      { name: "user",  description: "Target member",          type: 6, required: true },
      { name: "level", description: "Level to set (0–1000)",  type: 4, required: true },
    ],
  },
  {
    name: "boostuser",
    description: "[Admin] Give a member a personal 2x XP boost ⚡",
    options: [
      { name: "user",  description: "Target member",                         type: 6,  required: true },
      { name: "hours", description: "Duration in hours (0.5–72)",            type: 10, required: true },
    ],
  },
  {
    name: "blacklist",
    description: "[Admin] Block a member from earning XP or coins 🚫",
    options: [{ name: "user", description: "Target member", type: 6, required: true }],
  },
  {
    name: "unblacklist",
    description: "[Admin] Restore a member's ability to earn XP and coins ✅",
    options: [{ name: "user", description: "Target member", type: 6, required: true }],
  },
  {
    name: "serverstats",
    description: "[Admin] View server-wide XP, coins, and activity stats 📊",
  },
  {
    name: "viewuser",
    description: "[Admin] View full data for a member — all fields, cooldowns, boosts 🔍",
    options: [{ name: "user", description: "Target member", type: 6, required: true }],
  },
  {
    name: "announce",
    description: "[Admin] Post a formatted announcement embed in the announcements channel 📢",
    options: [
      { name: "message", description: "Announcement body text",            type: 3, required: true  },
      { name: "title",   description: "Embed title (optional)",            type: 3, required: false },
      {
        name: "color", description: "Embed colour (optional)", type: 3, required: false,
        choices: [
          { name: "🟡 Gold",   value: "gold"   },
          { name: "🟢 Green",  value: "green"  },
          { name: "🔵 Blue",   value: "blue"   },
          { name: "🔴 Red",    value: "red"    },
          { name: "🩷 Pink",   value: "pink"   },
          { name: "🟡 Yellow", value: "yellow" },
          { name: "⚪ White",  value: "white"  },
        ],
      },
    ],
  },
  {
    name: "resetxp",
    description: "[Admin] Reset all XP, coins, and data for a member 🔄",
    options: [{ name: "user", description: "Target member", type: 6, required: true }],
  },
];

async function registerCommands() {
  const endpoint = GUILD_ID
    ? `https://discord.com/api/v10/applications/${APP_ID}/guilds/${GUILD_ID}/commands`
    : `https://discord.com/api/v10/applications/${APP_ID}/commands`;

  console.log(`🔧 Registering ${commands.length} commands...`);
  console.log(`   Mode: ${GUILD_ID ? `Guild (${GUILD_ID})` : "Global"}`);

  const res = await fetch(endpoint, {
    method: "PUT",
    headers: { Authorization: `Bot ${DISCORD_TOKEN}`, "Content-Type": "application/json" },
    body: JSON.stringify(commands),
  });

  if (!res.ok) { console.error("❌ Failed:", await res.text()); process.exit(1); }

  const data = await res.json();
  console.log(`\n✅ Registered ${data.length} commands:\n`);
  data.forEach(cmd => console.log(`   /${cmd.name} — ${cmd.description}`));
}

registerCommands();