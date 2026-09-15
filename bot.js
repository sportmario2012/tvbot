// bot.js — Versione corretta con caricamento automatico di TUTTI i canali Tundrak
import { Bot, InlineKeyboard } from "grammy";
import "dotenv/config";
import fetch from "node-fetch"; // Assicurati di avere node-fetch installato (npm install node-fetch)

const BOT_TOKEN = process.env.BOT_TOKEN;
const WEBAPP_URL = process.env.WEBAPP_URL;

// INSERISCI QUI IL LINK D'INVITO DEL TUO CANALE PRIVATO (Con richiesta di accesso / Admin Approval)
const LINK_CANALE_PRIVATO = "https://t.me"; 

if (!BOT_TOKEN) {
  console.error("Manca BOT_TOKEN nel file .env");
  process.exit(1);
}

const bot = new Bot(BOT_TOKEN);
const m3uUrl = "https://githubusercontent.com";

// Database globale dei canali caricati dinamicamente
let categories = {
  "📺 GENERALISTI": [],
  "⚽ SPORT": [],
  "🎬 INTRATTENIMENTO": [],
  "📰 NEWS": []
};

// Funzione per mappare automaticamente tutti i canali di Tundrak nelle categorie corrette
async function fetchAllChannels() {
  try {
    const response = await fetch(m3uUrl);
    const text = await response.text();
    const lines = text.split('\n');
    
    let currentName = "";
    let currentGroup = "";

    for (let line of lines) {
      line = line.trim();
      if (line.startsWith("#EXTINF:")) {
        // Cerca il gruppo nel file M3U (es. group-title="DTT Sport")
        const groupMatch = line.match(/group-title="([^"]+)"/);
        currentGroup = groupMatch ? groupMatch[1].toLowerCase() : "";

        const nameIndex = line.lastIndexOf(',');
        currentName = nameIndex !== -1 ? line.substring(nameIndex + 1).trim() : "";
      } else if (line.startsWith("http") && currentName) {
        const channelData = { name: currentName, url: line };

        // Smistamento automatico basato sulle parole chiave di Tundrak
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
    console.log(`✅ Playlist Tundrak caricata! Sport: ${categories["⚽ SPORT"].length}, Generalisti: ${categories["📺 GENERALISTI"].length}`);
  } catch (error) {
    console.error("Errore nel caricamento dei canali da GitHub:", error);
  }
}

// Menu Principale: Categorie
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

// Sotto-menu: Mostra TUTTI i canali estratti per quella categoria
function getChannelsMenu(categoryKey) {
  const keyboard = new InlineKeyboard();
  const channels = categories[categoryKey];

  // Mostra i primi 25 canali per non superare i limiti di Telegram nei pulsanti
  const maxChannels = channels.slice(0, 25); 

  maxChannels.forEach((ch) => {
    const viewers = (Math.random() * (5.5 - 0.4) + 0.4).toFixed(1);
    // Cambiato l'ID in 'str_' per accorciare i byte del bottone ed evitare errori di Telegram
    keyboard.text(`📺 ${ch.name.substring(0, 18)} [👥 ${viewers}K]`, `str_${ch.name.substring(0, 20)}`);
    keyboard.row();
  });

  keyboard.text("⬅️ Torna alle Categorie", "back_main");
  return keyboard;
}

// Comando /start
bot.command("start", async (ctx) => {
  await ctx.reply(
    "✨ **Benvenuto su SEGNALE TV** ✨\n\n" +
    "Il tuo hub per i canali televisivi in diretta.\n" +
    "Seleziona una categoria o usa i comandi rapidi per esplorare:",
    { parse_mode: "Markdown", reply_markup: getMainMenu() }
  );
});

// Gestione dei click sui pulsanti (Risolto il bug del click vuoto)
bot.on("callback_query:data", async (ctx) => {
  const data = ctx.callbackQuery.data;

  // CORREZIONE: Gestisce il click sulle categorie prendendo l'indice corretto
  if (data.startsWith("cat_")) {
    const catIndex = parseInt(data.split("_")[1]); // Estratto l'indice numerico correttamente
    const catName = Object.keys(categories)[catIndex];
    
    if (catName) {
      await ctx.editMessageText(`📂 Categoria: **${catName}**\nSeleziona un canale per richiedere l'accesso alla diretta streaming:`, {
        parse_mode: "Markdown",
        reply_markup: getChannelsMenu(catName)
      });
    }
  } 
  
  else if (data === "back_main") {
    await ctx.editMessageText("Seleziona una categoria qui sotto per iniziare la visione:", {
      reply_markup: getMainMenu()
    });
  } 
  
  // Quando l'utente clicca su un canale specifico
  else if (data.startsWith("str_")) {
    const partialName = data.replace("str_", "");
    
    // Trova il canale corrispondente nel database dinamico
    let foundChannel = null;
    for (const cat of Object.values(categories)) {
      foundChannel = cat.find(c => c.name.substring(0, 20) === partialName);
      if (foundChannel) break;
    }

    if (foundChannel) {
      const viewersCount = Math.floor(Math.random() * 4800) + 320;
      
      // Tasto stile Cherry Sport: Rimanda al canale privato con richiesta d'accesso
      const streamKeyboard = new InlineKeyboard()
        .url("🔒 UNISCITI AL CANALE PER VEDERE LA DIRETTA", LINK_CANALE_PRIVATO)
        .row()
        .text("⬅️ Cambia Canale", "back_main");

      await ctx.editMessageText(
        `🟢 **DIRETTA DISPONIBILE** 🟢\n\n` +
        `📺 **Canale:** ${foundChannel.name}\n` +
        `👥 **Spettatori all'ascolto:** ${viewersCount.toLocaleString('it-IT')}\n` +
        `⚡ **Qualità:** HD / Auto\n\n` +
        `⚠️ Questo streaming è riservato ai membri. Clicca sul pulsante sotto e premi **"Invia richiesta di accesso"** per sbloccare la visione istantaneamente nel nostro canale privato.`,
        { parse_mode: "Markdown", reply_markup: streamKeyboard }
      );
    }
  }
  
  try {
    await ctx.answerCallbackQuery();
  } catch (e) {
    // Evita crash se la callback scade
  }
});

// Avvia prima il caricamento dei canali da GitHub, poi il bot
fetchAllChannels().then(() => {
  bot.start();
  console.log("Bot Segnale sincronizzato con IPTV Tundrak e avviato.");
});

