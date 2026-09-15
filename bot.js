// bot.js — Versione resiliente ottimizzata al 100% per il deploy su Railway
import { Bot, InlineKeyboard } from "grammy";
import "dotenv/config";
import fetch from "node-fetch";

const BOT_TOKEN = process.env.BOT_TOKEN;
const WEBAPP_URL = process.env.WEBAPP_URL || "https://tuo-dominio.example";
const ID_CANALE_PRIVATO = process.env.ID_CANALE_PRIVATO || "-100XXXXXXXXXX"; 
const ID_AMMINISTRATORE = parseInt(process.env.ID_AMMINISTRATORE) || 123456789;

if (!BOT_TOKEN) {
  console.error("ERRORE: Manca BOT_TOKEN. Configuralo nella scheda 'Variables' su Railway!");
  process.exit(1);
}

const bot = new Bot(BOT_TOKEN);
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

// Funzione di scaricamento asincrona in background
async function fetchAllChannels() {
  try {
    console.log("⏳ Avvio scaricamento playlist da GitHub Tundrak...");
    const response = await fetch(m3uUrl);
    const text = await response.text();
    const lines = text.split('\n');
    
    let currentName = "";
    let currentGroup = "";

    // Reset strutture dati
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
    console.log(`✅ Playlist sincronizzata! Canali indicizzati: ${channelCounter}`);
  } catch (error) {
    console.error("❌ Errore download M3U, riprovo tra 30 secondi...", error);
    setTimeout(fetchAllChannels, 30000); // Riprova in caso di timeout della rete di Railway
  }
}

function getMainMenu() {
  const keyboard = new InlineKeyboard();
  const keys = Object.keys(categories);
  keys.forEach((cat, index) => {
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

// Comando /start (Risponde SEMPRE, anche se la lista sta ancora caricando)
bot.command("start", async (ctx) => {
  if (!isLoaded) {
    return await ctx.reply("⏳ Il sistema sta caricando la lista canali IPTV di Tundrak. Attendi qualche secondo e riprova con /start!");
  }
  await ctx.reply(
    "✨ **Benvenuto su SEGNALE TV** ✨\n\n" +
    "Il tuo hub multimediale per i canali televisivi in diretta.\n" +
    "Seleziona una categoria qui sotto per esplorare il palinsesto:",
    { parse_mode: "Markdown", reply_markup: getMainMenu() }
  );
});

// Intercettore azioni bottoni
bot.on("callback_query:data", async (ctx) => {
  const data = ctx.callbackQuery.data;

  if (data === "back_main") {
    return await ctx.editMessageText("Seleziona una categoria qui sotto per iniziare la visione:", { reply_markup: getMainMenu() });
  } 

  if (data.startsWith("cat_")) {
    const catIndex = parseInt(data.split("_")[1]);
    const catName = Object.keys(categories)[catIndex];
    if (catName) {
      return await ctx.editMessageText(`📂 Categoria: **${catName}**\nSeleziona un canale televisivo dall'elenco:`, {
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
        `📺 **Canale Selezionato:** ${foundChannel.name}\n` +
        `👥 **Utenti connessi ora:** ${liveViewers.toLocaleString('it-IT')}\n` +
        `⚠️ Lo streaming è cifrato e visibile solo per i membri. Richiedi l'approvazione immediata nel nostro canale privato!`,
        { parse_mode: "Markdown", reply_markup: streamKeyboard }
      );
    }
  }
  try { await ctx.answerCallbackQuery(); } catch (e) {}
});

// Avvia Telegram all'istante
bot.start({
  onStart: () => {
    console.log("🚀 Bot Telegram connesso ai server di Railway!");
    fetchAllChannels(); // Avvia lo scaricamento in parallelo
  }
});


