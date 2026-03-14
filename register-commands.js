// register-commands.js
// Run once: node register-commands.js
// Needs: DISCORD_TOKEN and DISCORD_APP_ID env vars set

const DISCORD_TOKEN = process.env.DISCORD_TOKEN;
const APP_ID = process.env.DISCORD_APP_ID;
const GUILD_ID = process.env.DISCORD_GUILD_ID; // Set for guild-specific (instant), remove for global (1hr propagation)

if (!DISCORD_TOKEN || !APP_ID) {
  console.error("❌ Set DISCORD_TOKEN and DISCORD_APP_ID environment variables.");
  process.exit(1);
}

const commands = [
  {
    name: "rank",
    description: "Check your (or another member's) level and XP rank card 📊",
    options: [
      {
        name: "user",
        description: "Member to check (leave empty for yourself)",
        type: 6, // USER
        required: false,
      },
    ],
  },
  {
    name: "leaderboard",
    description: "View the WA99 Clan XP leaderboard 🏆",
  },
  {
    name: "addxp",
    description: "[Admin] Add or remove XP from a member ⚡",
    options: [
      {
        name: "user",
        description: "Target member",
        type: 6, // USER
        required: true,
      },
      {
        name: "amount",
        description: "XP to add (use negative to remove, e.g. -100)",
        type: 4, // INTEGER
        required: true,
      },
    ],
  },
  {
    name: "resetxp",
    description: "[Admin] Reset a member's XP to 0 🔄",
    options: [
      {
        name: "user",
        description: "Target member",
        type: 6, // USER
        required: true,
      },
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
    method: "PUT",
    headers: {
      Authorization: `Bot ${DISCORD_TOKEN}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(commands),
  });

  if (!res.ok) {
    const err = await res.text();
    console.error("❌ Failed to register commands:", err);
    process.exit(1);
  }

  const data = await res.json();
  console.log(`\n✅ Registered ${data.length} commands successfully!\n`);
  data.forEach((cmd) => console.log(`   /${cmd.name} — ${cmd.description}`));
}

registerCommands();
