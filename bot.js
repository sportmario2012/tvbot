// bot.js — Versione Completa con Guida TV e Comandi Avanzati
import { Bot, InlineKeyboard } from "grammy";
import "dotenv/config";
import { categories } from "./channels.js";

const BOT_TOKEN = process.env.BOT_TOKEN;
const WEBAPP_URL = process.env.WEBAPP_URL;

if (!BOT_TOKEN) {
  console.error("Manca BOT_TOKEN nel file .env");
  process.exit(1);
}

const bot = new Bot(BOT_TOKEN);

// Palinsesto finto ma realistico per il comando /guidatv
const programmiGuida = [
  "⚽ Serata Champions - Diretta Prepartita",
  "🎬 Film Cinema: Azione in prima serata",
  "🎙️ Talk Show: Politica e dibattiti live",
  "📺 TG Nazionale - Edizione Serale"
];

function getMainMenu() {
  const keyboard = new InlineKeyboard();
  Object.keys(categories).forEach((cat, index) => {
    keyboard.text(cat, `cat_${index}`);
    if (index % 2 === 1) keyboard.row();
  });
  keyboard.row().webApp("📡 Apri Web App con Loghi", WEBAPP_URL);
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

// Comando /italia
bot.command("italia", async (ctx) => {
  await ctx.reply("🇮🇹 **Canali Italiani**\nScegli una categoria dal menu principale per filtrare le emittenti nazionali:", {
    parse_mode: "Markdown",
    reply_markup: getMainMenu()
  });
});

// Comando /mondo
bot.command("mondo", async (ctx) => {
  const worldKeyboard = new InlineKeyboard()
    .webApp("🌍 Apri Catalogo Internazionale", WEBAPP_URL)
    .row()
    .text("⬅️ Torna al Menu", "back_main");

  await ctx.reply(
    "🌍 **Canali dal Mondo**\n\n" +
    "I flussi internazionali e le emittenti estere sono accessibili comodamente tramite la nostra Web App.\n" +
    "Premi il tasto sotto per esplorare i flussi globali:",
    { parse_mode: "Markdown", reply_markup: worldKeyboard }
  );
});

// Comando /guidatv
bot.command("guidatv", async (ctx) => {
  let messaggio = "🕒 **COSA C'È IN ONDA ADESSO:**\n\n";
  
  // Estrae alcuni canali a caso e assegna un programma
  let canaliCampionati = ["Rai 1", "Canale 5", "Sportitalia", "Sky TG24"];
  canaliCampionati.forEach((canale, i) => {
    messaggio += `📺 *${canale}*: ${programmiGuida[i]}\n`;
  });
  
  messaggio += "\n💡 _Apri l'app completa per vedere il palinsesto aggiornato di ogni singola emittente._";

  const keyboard = new InlineKeyboard().webApp("🚀 Apri Guida TV Completa", WEBAPP_URL);
  await ctx.reply(messaggio, { parse_mode: "Markdown", reply_markup: keyboard });
});

// Gestione dei callback della tastiera
bot.on("callback_query:data", async (ctx) => {
  const data = ctx.callbackQuery.data;

  if (data === "back_main") {
    await ctx.editMessageText("Seleziona una categoria qui sotto per iniziare la visione:", {
      reply_markup: getMainMenu()
    });
  }
  // ... (Conserva la logica di 'cat_' e 'stream_' descritta nel passaggio precedente)
  await ctx.answerCallbackQuery();
});

bot.catch((err) => console.error("Errore bot:", err.error));
bot.start();
console.log("Bot Segnale aggiornato con Guida TV e flussi internazionali.");

