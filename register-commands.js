// register-commands.js
// Run once: node register-commands.js
// Needs: DISCORD_TOKEN and DISCORD_APP_ID env vars
import "dotenv/config";
const DISCORD_TOKEN = process.env.DISCORD_TOKEN;
const APP_ID        = process.env.DISCORD_APP_ID;
const GUILD_ID      = process.env.DISCORD_GUILD_ID; // guild = instant, global = 1hr

if (!DISCORD_TOKEN || !APP_ID) {
  console.error("❌ Set DISCORD_TOKEN and DISCORD_APP_ID environment variables.");
  process.exit(1);
}

const commands = [
  // ── Public ──────────────────────────────────────────────────────────────
  {
    name: "rank",
    description: "Check your (or another member's) level and XP rank card 📊",
    options: [
      { name: "user", description: "Member to check (leave empty for yourself)", type: 6, required: false },
    ],
  },
  {
    name: "leaderboard",
    description: "View the all-time WA99 Clan XP leaderboard 🏆",
  },
  {
    name: "weeklyleaderboard",
    description: "View this week's XP leaderboard — resets every Monday 📅",
  },
  {
    name: "streak",
    description: "Check your current daily activity streak 🔥",
  },
  {
    name: "givexp",
    description: "Gift some of your XP to another member 🎁",
    options: [
      { name: "user",   description: "Member to gift XP to",                          type: 6, required: true  },
      { name: "amount", description: "XP to gift (max 200 per day, taken from yours)", type: 4, required: true  },
    ],
  },

  // ── Admin ────────────────────────────────────────────────────────────────
  {
    name: "xpevent",
    description: "[Admin] Start an XP multiplier event for the whole server ⚡",
    options: [
      { name: "multiplier", description: "XP multiplier (e.g. 2 for double XP, max 10)", type: 10, required: true },
      { name: "duration",   description: "Duration in hours (e.g. 1, 2, 24 — max 48)",  type: 10, required: true },
    ],
  },
  {
    name: "addxp",
    description: "[Admin] Add or remove XP from a member ⚡",
    options: [
      { name: "user",   description: "Target member",                              type: 6, required: true },
      { name: "amount", description: "XP to add (use negative to remove, e.g. -100)", type: 4, required: true },
    ],
  },
  {
    name: "resetxp",
    description: "[Admin] Reset a member's XP to 0 🔄",
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

  if (!res.ok) {
    console.error("❌ Failed:", await res.text());
    process.exit(1);
  }

  const data = await res.json();
  console.log(`\n✅ Registered ${data.length} commands:\n`);
  data.forEach((cmd) => console.log(`   /${cmd.name} — ${cmd.description}`));
}

registerCommands();