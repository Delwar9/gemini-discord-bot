require("dotenv").config();
const express = require("express");
const { Client, GatewayIntentBits } = require("discord.js");
const axios = require("axios");

const app = express();
const PORT = process.env.PORT || 3000;
const GENERAL_CHANNEL_ID = "1391652922835861558"; // Your #general channel ID

app.use(express.json());
app.disable("x-powered-by");

// ========== Discord Bot ==========
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
  try {
    if (message.author.bot) return;

    const isMentioned = message.mentions.has(client.user);
    if (!isMentioned) return;

    // Only handle messages directly in #general (not in threads)
    if (message.channel.id !== GENERAL_CHANNEL_ID) return;

    // Extract prompt without mention
    const prompt = message.content.replace(/<@!?(\d+)>/, "").trim();
    if (!prompt) {
      return message.reply("❗ Please ask a question after mentioning me.");
    }

    await message.channel.sendTyping();

    // Call Gemini AI via your n8n webhook
    const response = await axios.post(process.env.WEBHOOK_URL, { text: prompt });
    const aiReply = response.data?.reply || "❗ Gemini AI didn't return a valid response.";

    // Create a thread with first 50 chars of prompt as name
    const threadName = prompt.length > 50 ? prompt.slice(0, 47) + "..." : prompt;

    const thread = await message.channel.threads.create({
      name: threadName,
      autoArchiveDuration: 60, // archive after 1 hour of inactivity
      reason: `Thread created for question by ${message.author.tag}`,
    });

    // Send AI reply inside the thread
    await thread.send({
      content: aiReply,
    });

    // Optionally reply in main channel with thread link
    await message.reply(`💬 I've created a thread for this discussion: ${thread}`);

  } catch (error) {
    console.error("❌ Error handling message:", error.response?.data || error.message);
    try {
      await message.reply("⚠️ Sorry, I couldn't get a reply from Gemini.");
    } catch {}
  }
});

client.login(process.env.DISCORD_TOKEN);

// ========== Public Health Check ==========
app.get("/health", (req, res) => {
  res.json({ status: "ok", botUser: client.user?.tag || "not_connected" });
});

app.listen(PORT, () => {
  console.log(`🌐 Server running at http://localhost:${PORT}`);
});
