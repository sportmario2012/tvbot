// bot.js — Versione Indipendente ad Avvio Istantaneo (Senza bisogno di Web App esterna)
import { Bot, InlineKeyboard } from "grammy";
import "dotenv/config";

const BOT_TOKEN = process.env.BOT_TOKEN;

// 1. INSERISCI IL TUO LINK REALE DEL CANALE PRIVATO CON RICHIESTA DI ACCESSO
const LINK_CANALE_PRIVATO = "https://t.me/+p23Z60_C5TJkYjRk";

// 2. INSERISCI IL TUO ID UTENTE TELEGRAM PERSONALE (Esempio: 123456789)
const ID_AMMINISTRATORE = parseInt(process.env.ID_AMMINISTRATORE) || 6791584775; 

if (!BOT_TOKEN) {
  console.error("❌ Errore fatale: Manca BOT_TOKEN nelle variabili d'ambiente di Railway!");
  process.exit(1);
}

const bot = new Bot(BOT_TOKEN);

// Database completo integrato direttamente nel Bot per evitare blocchi e attese
let categories = {
  "📺 GENERALISTI": [
    { name: "Rai 1 HD", url: "https://progettotv.it" },
    { name: "Rai 2 HD", url: "https://progettotv.it" },
    { name: "Rai 3 HD", url: "https://progettotv.it" },
    { name: "Rete 4 HD", url: "https://progettotv.it" },
    { name: "Canale 5 HD", url: "https://progettotv.it" },
    { name: "Italia 1 HD", url: "https://progettotv.it" },
    { name: "LA7 HD", url: "https://progettotv.it" },
    { name: "TV8 HD", url: "https://progettotv.it" },
    { name: "NOVE HD", url: "https://progettotv.it" }
  ],
  "⚽ SPORT": [
    { name: "Rai Sport HD", url: "https://progettotv.it" },
    { name: "Sportitalia HD", url: "https://progettotv.it" },
    { name: "Supertennis HD", url: "https://progettotv.it" },
    { name: "Radio TV Serie A", url: "https://progettotv.it" }
  ]
};

// Generazione menu principale
function getMainMenu() {
  const keyboard = new InlineKeyboard();
  const keys = Object.keys(categories);
  keys.forEach((cat, index) => {
    keyboard.text(cat, `cat_${index}`);
    if (index % 2 === 1) keyboard.row();
  });
  return keyboard;
}

// Sotto-menu dei canali (Reindirizza al canale privato)
function getChannelsMenu(categoryKey) {
  const keyboard = new InlineKeyboard();
  const channels = categories[categoryKey] || [];
  
  channels.forEach((ch) => {
    const viewers = (Math.random() * (7.4 - 1.1) + 1.1).toFixed(1);
    // Cliccando sul canale, l'utente viene indirizzato al canale privato ad approvazione
    keyboard.url(`📺 ${ch.name} [👥 ${viewers}K]`, LINK_CANALE_PRIVATO);
    keyboard.row();
  });
  
  keyboard.text("⬅️ Torna alle Categorie", "back_main");
  return keyboard;
}

// Comando /start
bot.command("start", async (ctx) => {
  await ctx.reply(
    "✨ **Benvenuto su SEGNALE TV** ✨\n\n" +
    "Il tuo hub multimediale per i canali televisivi in diretta.\n" +
    "Seleziona una categoria qui sotto per esplorare il palinsesto:",
    { parse_mode: "Markdown", reply_markup: getMainMenu() }
  );
});

// Gestore dei click sulle Categorie
bot.on("callback_query:data", async (ctx) => {
  const data = ctx.callbackQuery.data;

  if (data === "back_main") {
    return await ctx.editMessageText("Seleziona una categoria qui sotto per iniziare la visione:", { reply_markup: getMainMenu() });
  } 

  if (data.startsWith("cat_")) {
    const catIndex = parseInt(data.split("_")[1]);
    const catName = Object.keys(categories)[catIndex];
    if (catName) {
      return await ctx.editMessageText(`📂 Categoria: **${catName}**\nClicca su un canale per richiedere l'accesso alla diretta nel canale privato:`, {
        parse_mode: "Markdown",
        reply_markup: getChannelsMenu(catName)
      });
    }
  }
  try { await ctx.answerCallbackQuery(); } catch (e) {}
});

bot.start({
  onStart: () => {
    console.log("🚀 Bot avviato in modalità nativa al 100%!");
  }
});

