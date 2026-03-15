import "dotenv/config";

const DISCORD_TOKEN = process.env.DISCORD_TOKEN;
const APP_ID        = process.env.DISCORD_APP_ID;
const GUILD_ID      = process.env.DISCORD_GUILD_ID;

if (!DISCORD_TOKEN || !APP_ID) {
  console.error("❌ Set DISCORD_TOKEN and DISCORD_APP_ID environment variables.");
  process.exit(1);
}

const commands = [
  // ── XP & Levels ──────────────────────────────────────────────────────────
  {
    name: "rank",
    description: "Check your (or another member's) rank card 📊",
    options: [
      { name: "user", description: "Member to check (leave empty for yourself)", type: 6, required: false },
    ],
  },
  {
    name: "leaderboard",
    description: "View the all-time XP leaderboard 🏆",
  },
  {
    name: "weeklyleaderboard",
    description: "View this week's XP leaderboard — resets every Monday 📅",
  },
  {
    name: "streak",
    description: "Check your daily activity streak 🔥",
  },
  {
    name: "givexp",
    description: "Gift some of your XP to another member 🎁",
    options: [
      { name: "user",   description: "Member to gift XP to",                           type: 6,  required: true },
      { name: "amount", description: "XP to gift (max 200/day, deducted from yours)",  type: 4,  required: true },
    ],
  },

  // ── Economy ───────────────────────────────────────────────────────────────
  {
    name: "balance",
    description: "Check your coin balance and XP 💰",
  },
  {
    name: "daily",
    description: "Claim your daily coin reward 🎁",
  },
  {
    name: "shop",
    description: "Browse the WA99 shop — spend coins on XP, boosts & more 🏪",
  },
  {
    name: "buy",
    description: "Buy an item from the shop 🛒",
    options: [
      {
        name: "item",
        description: "Item to buy",
        type: 3, // STRING
        required: true,
        choices: [
          { name: "🧪 XP Potion (+500 XP) — 100 coins",            value: "xp_potion"     },
          { name: "⚗️ XP Elixir (+2,500 XP) — 350 coins",          value: "xp_elixir"     },
          { name: "🛡️ Streak Shield (miss a day safe) — 200 coins", value: "streak_shield" },
          { name: "⚡ Personal 2x Boost (1 hour) — 500 coins",     value: "personal_boost" },
          { name: "🎁 Loot Box (random reward) — 150 coins",        value: "loot_box"      },
        ],
      },
    ],
  },

  // ── Games ─────────────────────────────────────────────────────────────────
  {
    name: "coinflip",
    description: "Flip a coin and bet your coins 🪙",
    options: [
      {
        name: "side",
        description: "Pick a side",
        type: 3,
        required: true,
        choices: [
          { name: "🟡 Heads", value: "heads" },
          { name: "⚫ Tails", value: "tails" },
        ],
      },
      { name: "amount", description: "Coins to bet (min 10, max 5,000)", type: 4, required: true },
    ],
  },
  {
    name: "slots",
    description: "Spin the slot machine and bet your coins 🎰",
    options: [
      { name: "amount", description: "Coins to bet (min 10, max 5,000)", type: 4, required: true },
    ],
  },

  // ── Admin ─────────────────────────────────────────────────────────────────
  {
    name: "xpevent",
    description: "[Admin] Start an XP multiplier event for everyone ⚡",
    options: [
      { name: "multiplier", description: "XP multiplier (e.g. 2 for double, max 10)", type: 10, required: true },
      { name: "duration",   description: "Duration in hours (e.g. 1, 2, 24)",          type: 10, required: true },
    ],
  },
  {
    name: "addxp",
    description: "[Admin] Add or remove XP from a member ⚡",
    options: [
      { name: "user",   description: "Target member",                                  type: 6,  required: true },
      { name: "amount", description: "XP to add (negative to remove, e.g. -100)",      type: 4,  required: true },
    ],
  },
  {
    name: "resetxp",
    description: "[Admin] Reset a member's XP and coins to 0 🔄",
    options: [
      { name: "user", description: "Target member", type: 6, required: true },
    ],
  },
];

async function registerCommands() {
  const endpoint = GUILD_ID
    ? `https://discord.com/api/v10/applications/${APP_ID}/guilds/${GUILD_ID}/commands`
    : `https://discord.com/api/v10/applications/${APP_ID}/commands`;

  console.log(`🔧 Registering ${commands.length} commands...`);
  console.log(`   Mode: ${GUILD_ID ? `Guild (${GUILD_ID})` : "Global"}`);

  const res = await fetch(endpoint, {
    method:  "PUT",
    headers: { Authorization: `Bot ${DISCORD_TOKEN}`, "Content-Type": "application/json" },
    body:    JSON.stringify(commands),
  });

  if (!res.ok) { console.error("❌ Failed:", await res.text()); process.exit(1); }

  const data = await res.json();
  console.log(`\n✅ Registered ${data.length} commands:\n`);
  data.forEach(cmd => console.log(`   /${cmd.name} — ${cmd.description}`));
}

registerCommands();