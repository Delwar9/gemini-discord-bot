require("dotenv").config();
const { Client, GatewayIntentBits } = require("discord.js");
const axios = require("axios");

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
});

client.once("ready", () => {
  console.log(`🤖 Logged in as ${client.user.tag}`);
});

client.on("messageCreate", async (message) => {
  if (message.author.bot) return;

  const prompt = message.content;

  try {
    const response = await axios.post(process.env.WEBHOOK_URL, { text: prompt });
    await message.reply(response.data.reply);
  } catch (error) {
    console.error("❌ Error:", error.response?.data || error.message);
    await message.reply("Sorry, the AI agent is currently unavailable.");
  }
});

client.login(process.env.DISCORD_TOKEN);
