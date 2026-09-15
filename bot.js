// bot.js — Versione Definitiva Completa con Auto-Configurazione del Menu Button
import { Bot, InlineKeyboard } from "grammy";
import "dotenv/config";

// Lettura delle variabili d'ambiente fornite da Railway
const BOT_TOKEN = process.env.BOT_TOKEN;
const WEBAPP_URL = process.env.WEBAPP_URL || "https://tuo-dominio.example";

// 1. INSERISCI L'ID DEL TUO CANALE PRIVATO (Deve iniziare con -100)
const ID_CANALE_PRIVATO = process.env.ID_CANALE_PRIVATO || "-100XXXXXXXXXX"; 

// 2. INSERISCI IL TUO LINK D'INVITO REALE AD APPROVAZIONE DEL CANALE PRIVATO
const LINK_CANALE_PRIVATO = "https://t.me";

// 3. INSERISCI IL TUO ID UTENTE TELEGRAM PERSONALE (Esempio: 123456789)
const ID_AMMINISTRATORE = parseInt(process.env.ID_AMMINISTRATORE) || 123456789; 

if (!BOT_TOKEN) {
  console.error("❌ Errore fatale: Manca BOT_TOKEN nelle variabili d'ambiente di Railway!");
  process.exit(1);
}

const bot = new Bot(BOT_TOKEN);

// Database canali statico integrato (Previene i blocchi IP di GitHub e i timeout su Railway)
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
    { id: "ch_13", name: "Radio TV Serie A", url: "https://progettotv.it" }
  ]
};

// Generazione mappa piatta per l'intercettazione rapida tramite ID
let globalChannelsMap = {};
Object.values(categories).forEach(cat => {
  cat.forEach(ch => { globalChannelsMap[ch.id] = ch; });
});

// Tastiera principale
function getMainMenu() {
  const keyboard = new InlineKeyboard();
  const keys = Object.keys(categories);
  keys.forEach((cat, index) => {
    keyboard.text(cat, `cat_${index}`);
    if (index % 2 === 1) keyboard.row();
  });
  keyboard.row().webApp("📡 Apri Web App Completa", WEBAPP_URL);
  return keyboard;
}

// Sotto-menu dei canali
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

// Comando /start
bot.command("start", async (ctx) => {
  await ctx.reply(
    "✨ **Benvenuto su SEGNALE TV** ✨\n\n" +
    "Il tuo hub multimediale per i canali televisivi in diretta.\n" +
    "Seleziona una categoria qui sotto per esplorare il palinsesto:",
    { parse_mode: "Markdown", reply_markup: getMainMenu() }
  );
});

// Gestore delle Callback delle tastiere in linea (Senza blocchi di byte)
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
      
      // Quando cliccano, li indirizza alla richiesta d'accesso nel canale privato
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

// Comando rapido amministratore per pubblicare post in stile Cherry Sport nel canale privato
bot.command("pubblica", async (ctx) => {
  if (ctx.from.id !== ID_AMMINISTRATORE) return;
  const query = ctx.match ? ctx.match.trim().toLowerCase() : "";
  if (!query) return ctx.reply("Uso: `/pubblica NomeCanale`", { parse_mode: "Markdown" });

  const found = Object.values(globalChannelsMap).find(c => c.name.toLowerCase().includes(query));
  if (!found) return ctx.reply("❌ Canale non trovato nell'elenco pre-caricato.");

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

// Gestione preventiva degli errori di conflitto (Doppia istanza attiva)
bot.catch((err) => {
  console.error("❌ Errore intercettato nel runtime:", err.message);
  if (err.message.includes("Conflict")) {
    console.log("⚠️ Conflitto rilevato. Chiusura preventiva dell'istanza duplicata.");
    process.exit(1);
  }
});

// Avvio sequenziale del server
bot.start({
  onStart: async () => {
    console.log("🚀 Bot Telegram online su Railway!");
    try {
      // Forza l'iniezione automatica del Menu Button via API di Telegram
      await bot.api.setChatMenuButton({
        menu_button: {
          type: "web_app",
          text: "📡 Apri Segnale",
          web_app: { url: WEBAPP_URL }
        }
      });
      console.log("✅ Menu Button configurato automaticamente con successo!");
    } catch (error) {
      console.error("❌ Impossibile iniettare il Menu Button automaticamente:", error.message);
    }
  }
});


