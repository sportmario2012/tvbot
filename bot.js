// bot.js — Versione corretta per l'URL di Tundrak e ottimizzata per Railway
import { Bot, InlineKeyboard } from "grammy";
import "dotenv/config";
import fetch from "node-fetch";

const BOT_TOKEN = process.env.BOT_TOKEN;
const WEBAPP_URL = process.env.WEBAPP_URL || "https://tuo-dominio.example";
const ID_CANALE_PRIVATO = process.env.ID_CANALE_PRIVATO || "-100XXXXXXXXXX"; 
const ID_AMMINISTRATORE = parseInt(process.env.ID_AMMINISTRATORE) || 123456789;

if (!BOT_TOKEN) {
  console.error("❌ Manca BOT_TOKEN nelle variabili di Railway!");
  process.exit(1);
}

const bot = new Bot(BOT_TOKEN);

// CORRETTO: Aggiunto 'raw.' all'inizio dell'URL di GitHub
const m3uUrl = "https://githubusercontent.com";

let categories = {
  "📺 GENERALISTI": [],
  "⚽ SPORT": [],
  "🎬 INTRATTENIMENTO": [],
  "📰 NEWS": []
};
let globalChannelsMap = {};
let channelCounter = 0;
let isLoaded = false;

// Sostituisci solo questa funzione nel tuo bot.js per sbloccare i filtri di GitHub
async function fetchAllChannels() {
  try {
    console.log("⏳ Avvio scaricamento playlist da GitHub Tundrak...");
    
    // Configurazione Headers per simulare un browser reale ed evitare blocchi
    const response = await fetch(m3uUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/110.0.0.0 Safari/537.36'
      }
    });
    
    if (!response.ok) throw new Error(`Server di GitHub ha risposto con stato: ${response.status}`);
    
    const text = await response.text();
    const lines = text.split('\n');
    
    let currentName = "";
    let currentGroup = "";

    categories["📺 GENERALISTI"] = [];
    categories["⚽ SPORT"] = [];
    categories["🎬 INTRATTENIMENTO"] = [];
    categories["📰 NEWS"] = [];
    globalChannelsMap = {};
    channelCounter = 0;

    for (let line of lines) {
      line = line.trim();
      if (line.startsWith("#EXTINF:")) {
        const groupMatch = line.match(/group-title="([^"]+)"/);
        currentGroup = groupMatch ? groupMatch.toLowerCase() : "";
        const nameIndex = line.lastIndexOf(',');
        currentName = nameIndex !== -1 ? line.substring(nameIndex + 1).trim() : "";
      } else if (line.startsWith("http") && currentName) {
        channelCounter++;
        const shortId = `ch_${channelCounter}`;
        const channelData = { id: shortId, name: currentName, url: line };
        globalChannelsMap[shortId] = channelData;

        if (currentGroup.includes("sport") || currentName.toLowerCase().includes("sport") || currentName.toLowerCase().includes("calcio")) {
          categories["⚽ SPORT"].push(channelData);
        } else if (currentGroup.includes("news") || currentName.toLowerCase().includes("24") || currentName.toLowerCase().includes("tg")) {
          categories["📰 NEWS"].push(channelData);
        } else if (currentGroup.includes("cinema") || currentGroup.includes("film") || currentName.toLowerCase().includes("movie")) {
          categories["🎬 INTRATTENIMENTO"].push(channelData);
        } else {
          categories["📺 GENERALISTI"].push(channelData);
        }
        currentName = "";
      }
    }
    isLoaded = true;
    console.log(`✅ Playlist Tundrak scaricata! Canali totali: ${channelCounter}`);
  } catch (error) {
    console.error("❌ Errore download M3U, riprovo tra 15 secondi...", error.message);
    setTimeout(fetchAllChannels, 15000);
  }
}


function getMainMenu() {
  const keyboard = new InlineKeyboard();
  Object.keys(categories).forEach((cat, index) => {
    keyboard.text(cat, `cat_${index}`);
    if (index % 2 === 1) keyboard.row();
  });
  keyboard.row().webApp("📡 Apri Web App con Loghi", WEBAPP_URL);
  return keyboard;
}

function getChannelsMenu(categoryKey) {
  const keyboard = new InlineKeyboard();
  const channels = categories[categoryKey] || [];
  const limitedChannels = channels.slice(0, 20); 

  limitedChannels.forEach((ch) => {
    const viewers = (Math.random() * (6.2 - 0.5) + 0.5).toFixed(1);
    keyboard.text(`📺 ${ch.name.substring(0, 18)} [👥 ${viewers}K]`, ch.id);
    keyboard.row();
  });
  keyboard.text("⬅️ Torna alle Categorie", "back_main");
  return keyboard;
}

bot.command("start", async (ctx) => {
  if (!isLoaded) {
    return await ctx.reply("⏳ Il bot sta indicizzando i canali di Tundrak. Attendi 5 secondi e premi di nuovo /start!");
  }
  await ctx.reply(
    "✨ **Benvenuto su SEGNALE TV** ✨\n\n" +
    "Seleziona una categoria qui sotto per esplorare il palinsesto:",
    { parse_mode: "Markdown", reply_markup: getMainMenu() }
  );
});

bot.on("callback_query:data", async (ctx) => {
  const data = ctx.callbackQuery.data;
  if (data === "back_main") {
    return await ctx.editMessageText("Seleziona una categoria qui sotto per iniziare la visione:", { reply_markup: getMainMenu() });
  } 
  if (data.startsWith("cat_")) {
    const catIndex = parseInt(data.split("_")[1]);
    const catName = Object.keys(categories)[catIndex];
    if (catName) {
      return await ctx.editMessageText(`📂 Categoria: **${catName}**\nSeleziona un canale:`, {
        parse_mode: "Markdown",
        reply_markup: getChannelsMenu(catName)
      });
    }
  } 
  if (data.startsWith("ch_")) {
    const foundChannel = globalChannelsMap[data];
    if (foundChannel) {
      const liveViewers = Math.floor(Math.random() * 5200) + 210;
      const streamKeyboard = new InlineKeyboard()
        .url("🔒 AVVIA DIRETTA NEL CANALE PRIVATO", `https://t.me`)
        .row()
        .text("⬅️ Torna ai Canali", "back_main");

      return await ctx.editMessageText(
        `🟢 **FLUSSO STREAMING PRONTO** 🟢\n\n` +
        `📺 **Canale:** ${foundChannel.name}\n` +
        `👥 **Spettatori:** ${liveViewers.toLocaleString('it-IT')}\n\n` +
        `⚠️ Richiedi l'approvazione immediata nel nostro canale privato per guardare!`,
        { parse_mode: "Markdown", reply_markup: streamKeyboard }
      );
    }
  }
  try { await ctx.answerCallbackQuery(); } catch (e) {}
});

// Gestione dell'errore Conflict (Spegne il processo se un'altra istanza è attiva)
bot.catch((err) => {
  console.error("❌ Errore critico nel bot:", err.message);
  if (err.message.includes("Conflict")) {
    console.log("⚠️ Rilevato conflitto di istanze. Spengo questa istanza.");
    process.exit(1); 
  }
});

bot.start({
  onStart: () => {
    console.log("🚀 Bot Telegram online su Railway!");
    fetchAllChannels();
  }
});


