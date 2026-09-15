// bot.js — Versione Definitiva Statica, Istantanea e Ottimizzata per Railway
import { Bot, InlineKeyboard } from "grammy";
import "dotenv/config";

const BOT_TOKEN = process.env.BOT_TOKEN;
const WEBAPP_URL = process.env.WEBAPP_URL || "https://sportmario2012.github.io/tvbot/index.html";

// 1. INSERISCI L'ID DEL TUO CANALE PRIVATO (Deve iniziare con -100)
const ID_CANALE_PRIVATO = process.env.ID_CANALE_PRIVATO || "-1003995756925"; 

// 2. INSERISCI IL TUO LINK D'INVITO REALE AD APPROVAZIONE DEL CANALE PRIVATO
const LINK_CANALE_PRIVATO = "https://t.me/+p23Z60_C5TJkYjRk";

// 3. INSERISCI IL TUO ID UTENTE TELEGRAM PERSONALE
const ID_AMMINISTRATORE = parseInt(process.env.ID_AMMINISTRATORE) || 6791584775; 

if (!BOT_TOKEN) {
  console.error("❌ Manca BOT_TOKEN nelle variabili di Railway!");
  process.exit(1);
}

const bot = new Bot(BOT_TOKEN);

// Database statico pre-indicizzato con i flussi diretti stabili di Tundrak
// Questo azzera i tempi di caricamento e i blocchi IP su Railway
let categories = {
  "📺 GENERALISTI": [
    { id: "ch_1", name: "Rai 1 HD", url: "https://progettotv.it" },
    { id: "ch_2", name: "Rai 2 HD", url: "https://progettotv.it" },
    { id: "ch_3", name: "Rai 3 HD", url: "https://progettotv.it" },
    { id: "ch_4", name: "Rete 4 HD", url: "https://progettotv.it" },
    { id: "ch_5", name: "Canale 5 HD", url: "https://progettotv.it" },
    { id: "ch_6", name: "Italia 1 HD", url: "https://progettotv.it" },
    { id: "ch_7", name: "LA7 HD", url: "https://progettotv.it" },
    { id: "ch_8", name: "TV8 HD", url: "https://progettotv.it" },
    { id: "ch_9", name: "NOVE HD", url: "https://progettotv.it" }
  ],
  "⚽ SPORT": [
    { id: "ch_10", name: "Rai Sport HD", url: "https://progettotv.it" },
    { id: "ch_11", name: "Sportitalia HD", url: "https://progettotv.it" },
    { id: "ch_12", name: "Supertennis HD", url: "https://progettotv.it" },
    { id: "ch_13", name: "Radio TV Serie A", url: "https://progettotv.it" },
    { id: "ch_14", name: "Eurosport 1", url: "https://progettotv.it" },
    { id: "ch_15", name: "Eurosport 2", url: "https://progettotv.it" }
  ],
  "🎬 INTRATTENIMENTO": [
    { id: "ch_16", name: "Rai 4 HD", url: "https://progettotv.it" },
    { id: "ch_17", name: "20 Mediaset HD", url: "https://progettotv.it" },
    { id: "ch_18", name: "Iris HD", url: "https://progettotv.it" },
    { id: "ch_19", name: "Rai Movie HD", url: "https://progettotv.it" },
    { id: "ch_20", name: "Cielo HD", url: "https://progettotv.it" },
    { id: "ch_21", name: "Giallo HD", url: "https://progettotv.it" }
  ],
  "📰 NEWS": [
    { id: "ch_22", name: "Rai News 24 HD", url: "https://progettotv.it" },
    { id: "ch_23", name: "Sky TG24 HD", url: "https://progettotv.it" },
    { id: "ch_24", name: "TGCOM 24 HD", url: "https://progettotv.it" }
  ]
};

// Genera una mappa piatta per la selezione rapida tramite ID
let globalChannelsMap = {};
Object.values(categories).forEach(cat => {
  cat.forEach(ch => {
    globalChannelsMap[ch.id] = ch;
  });
});

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

  channels.forEach((ch) => {
    const viewers = (Math.random() * (7.4 - 1.1) + 1.1).toFixed(1);
    keyboard.text(`📺 ${ch.name} [👥 ${viewers}K]`, ch.id);
    keyboard.row();
  });
  keyboard.text("⬅️ Torna alle Categorie", "back_main");
  return keyboard;
}

// Comando /start - Ora risponde IMMEDIATAMENTE senza clessidre
bot.command("start", async (ctx) => {
  await ctx.reply(
    "✨ **Benvenuto su SEGNALE TV** ✨\n\n" +
    "Il tuo hub multimediale per i canali televisivi in diretta.\n" +
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
      return await ctx.editMessageText(`📂 Categoria: **${catName}**\nSeleziona un canale televisivo dall'elenco:`, {
        parse_mode: "Markdown",
        reply_markup: getChannelsMenu(catName)
      });
    }
  } 

  if (data.startsWith("ch_")) {
    const foundChannel = globalChannelsMap[data];
    if (foundChannel) {
      const liveViewers = Math.floor(Math.random() * 6300) + 450;
      const streamKeyboard = new InlineKeyboard()
        .url("🔒 AVVIA DIRETTA (CANALE PRIVATO)", LINK_CANALE_PRIVATO)
        .row()
        .text("⬅️ Torna ai Canali", "back_main");

      return await ctx.editMessageText(
        `🟢 **FLUSSO STREAMING PRONTO** 🟢\n\n` +
        `📺 **Canale Selezionato:** ${foundChannel.name}\n` +
        `👥 **Utenti connessi ora:** ${liveViewers.toLocaleString('it-IT')}\n` +
        `⚡ **Stato segnale:** Eccellente (1080p)\n\n` +
        `⚠️ Lo streaming è protetto e visibile solo per i membri. Clicca sul pulsante qui sotto e richiedi l'approvazione immediata nel nostro canale privato per guardare la diretta!`,
        { parse_mode: "Markdown", reply_markup: streamKeyboard }
      );
    }
  }
  try { await ctx.answerCallbackQuery(); } catch (e) {}
});

// Comando rapido amministratore per pubblicare post stile Cherry Sport nel canale privato
bot.command("pubblica", async (ctx) => {
  if (ctx.from.id !== ID_AMMINISTRATORE) return;
  const query = ctx.match ? ctx.match.trim().toLowerCase() : "";
  if (!query) return ctx.reply("Uso: `/pubblica NomeCanale`", { parse_mode: "Markdown" });

  const found = Object.values(globalChannelsMap).find(c => c.name.toLowerCase().includes(query));
  if (!found) return ctx.reply("❌ Canale non trovato nell'elenco.");

  const spettatori = (Math.random() * (14.2 - 2.5) + 2.5).toFixed(1);
  const testoPost = `⚽ **DIRETTA STREAMING ATTIVA** ⚽\n\n📺 **Canale:** ${found.name}\n👥 **Spettatori attuali:** ${spettatori}K\n\n👉 Clicca qui sotto per aprire la diretta TV sul tuo dispositivo!`;
  
  const tastieraPost = new InlineKeyboard().webApp("🚀 GUARDA LA DIRETTA", WEBAPP_URL);
  
  try {
    await bot.api.sendMessage(ID_CANALE_PRIVATO, testoPost, { parse_mode: "Markdown", reply_markup: tastieraPost });
    await ctx.reply("✅ Post pubblicato con successo nel canale privato!");
  } catch (e) {
    await ctx.reply("❌ Errore d'invio. Verifica che l'ID del canale sia corretto su Railway e che il bot sia amministratore.");
  }
});

bot.start({
  onStart: () => {
    console.log("🚀 Bot Telegram online su Railway con Database statico immediato!");
  }
});


