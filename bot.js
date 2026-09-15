// bot.js — Versione con pubblicazione automatica post nel Canale (Stile Cherry Sport)
import { Bot, InlineKeyboard } from "grammy";
import "dotenv/config";
import fetch from "node-fetch";

const BOT_TOKEN = process.env.BOT_TOKEN;
const WEBAPP_URL = process.env.WEBAPP_URL;

// 1. INSERISCI L'ID DEL TUO CANALE PRIVATO (Deve iniziare con -100)
// Esempio: "-1001234567890" (Puoi recuperarlo inoltrando un post del canale a @userinfobot)
const ID_CANALE_PRIVATO = "-100XXXXXXXXXX"; 

// 2. INSERISCI IL TUO ID UTENTE TELEGRAM PERSONALE (Per evitare che altri usino il comando)
const ID_AMMINISTRATORE = 123456789; 

if (!BOT_TOKEN) {
  console.error("Manca BOT_TOKEN nel file .env");
  process.exit(1);
}

const bot = new Bot(BOT_TOKEN);
const m3uUrl = "https://githubusercontent.com";

let allChannelsList = []; // Lista piatta per la ricerca rapida dei post

async function fetchAllChannels() {
  try {
    const response = await fetch(m3uUrl);
    const text = await response.text();
    const lines = text.split('\n');
    let currentName = "";

    for (let line of lines) {
      line = line.trim();
      if (line.startsWith("#EXTINF:")) {
        const nameIndex = line.lastIndexOf(',');
        currentName = nameIndex !== -1 ? line.substring(nameIndex + 1).trim() : "";
      } else if (line.startsWith("http") && currentName) {
        allChannelsList.push({ name: currentName, url: line });
        currentName = "";
      }
    }
    console.log(`✅ Database pronto. ${allChannelsList.length} canali importati da Tundrak.`);
  } catch (error) {
    console.error("Errore sorgente GitHub:", error);
  }
}

// COMANDO PER L'AMMINISTRATORE: /pubblica [Nome Canale]
// Esempio in chat con il bot: /pubblica Sportitalia
bot.command("pubblica", async (ctx) => {
  // Controllo sicurezza: solo l'admin può pubblicare nel canale
  if (ctx.from.id !== ID_AMMINISTRATORE) {
    return ctx.reply("❌ Non hai i permessi per usare questo comando.");
  }

  // Estrae il nome del canale cercato dopo il comando /pubblica
  const query = ctx.match ? ctx.match.trim().toLowerCase() : "";
  if (!query) {
    return ctx.reply("💡 Uso corretto: `/pubblica NomeCanale`\nEsempio: `/pubblica Rai Sport` o `/pubblica Sportitalia` ", { parse_mode: "Markdown" });
  }

  // Cerca il canale più simile nella lista di Tundrak
  const found = allChannelsList.find(c => c.name.toLowerCase().includes(query));

  if (!found) {
    return ctx.reply("❌ Canale non trovato nella lista IPTV di Tundrak. Controlla il nome.");
  }

  // Genera dati casuali in stile palinsesto sportivo
  const spettatoriFinti = (Math.random() * (12.5 - 2.1) + 2.1).toFixed(1); // Es: 5.4
  const qualitàSegnale = "🟢 HD 1080p (Stabile)";

  // Creazione del layout del Post (Stile Cherry Sport)
  const testoPost = 
    `⚽ **DIRETTA STREAMING ATTIVA** ⚽\n\n` +
    `📺 **Canale:** ${found.name}\n` +
    `👥 **Spettatori live:** ${spettatoriFinti}K\n` +
    `⚡ **Segnale:** ${qualitàSegnale}\n\n` +
    `👉 Clicca sul pulsante in basso per aprire la diretta TV direttamente sul tuo dispositivo (VLC, Browser o Web App)!`;

  // Bottone in linea che punta direttamente alla sorgente video o alla tua Web App
  // Nota: Molti canali sportivi usano WEBAPP_URL per mostrare il player pulito senza blocchi del browser
  const tastieraPost = new InlineKeyboard()
    .url("🚀 GUARDA LA DIRETTA QUI", found.url) 
    .row()
    .url("📱 APRI NELLA WEB APP", WEBAPP_URL);

  try {
    // Invia il post direttamente nel canale privato
    await bot.api.sendMessage(ID_CANALE_PRIVATO, testoPost, {
      parse_mode: "Markdown",
      reply_markup: tastieraPost
    });
    
    await ctx.reply(`✅ Post per **${found.name}** pubblicato con successo nel tuo canale privato!`);
  } catch (error) {
    console.error("Errore durante l'invio nel canale:", error);
    await ctx.reply("❌ Errore. Assicurati che l'ID del canale sia corretto e che il bot sia amministratore inserito nel canale.");
  }
});

// Avvio applicazione
fetchAllChannels().then(() => {
  bot.start();
  console.log("Bot pronto per la pubblicazione automatica dei post.");
});


