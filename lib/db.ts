import { createClient } from "@libsql/client";

const db = createClient({
  url: process.env.DATABASE_URL || "file:dev.db",
  authToken: process.env.TURSO_AUTH_TOKEN,
});

export async function initDb() {
  await db.execute(`
    CREATE TABLE IF NOT EXISTS articles (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      description TEXT NOT NULL,
      imageUrl TEXT,
      articleUrl TEXT UNIQUE NOT NULL,
      youtubeId TEXT,
      category TEXT NOT NULL,
      source TEXT NOT NULL,
      publishedAt TEXT NOT NULL,
      createdAt TEXT NOT NULL DEFAULT (datetime('now')),
      clicks INTEGER NOT NULL DEFAULT 0,
      likes INTEGER NOT NULL DEFAULT 0,
      shares INTEGER NOT NULL DEFAULT 0
    )
  `);
  await db.execute(`
    CREATE TABLE IF NOT EXISTS comments (
      id TEXT PRIMARY KEY,
      articleId TEXT NOT NULL,
      author TEXT NOT NULL DEFAULT 'Anônimo',
      content TEXT NOT NULL,
      createdAt TEXT NOT NULL DEFAULT (datetime('now')),
      approved INTEGER NOT NULL DEFAULT 1,
      FOREIGN KEY (articleId) REFERENCES articles(id)
    )
  `);
  await db.execute(`
    CREATE TABLE IF NOT EXISTS rss_feeds (
      id TEXT PRIMARY KEY,
      url TEXT UNIQUE NOT NULL,
      category TEXT NOT NULL,
      name TEXT NOT NULL,
      active INTEGER NOT NULL DEFAULT 1
    )
  `);
  await db.execute(`
    CREATE TABLE IF NOT EXISTS admin_settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL
    )
  `);

  // default admin password
  await db.execute(`
    INSERT OR IGNORE INTO admin_settings (key, value) VALUES ('admin_password', '${process.env.SECRET_KEY}')
  `);

  const feeds = [
    // ===== Geral =====
    { id: "f28", url: "https://agenciabrasil.ebc.com.br/rss/ultimasnoticias/feed.xml", category: "Geral", name: "Agência Brasil" },
    { id: "f29", url: "https://feeds.folha.uol.com.br/emcimadahora/rss091.xml", category: "Geral", name: "Folha de S.Paulo" },
    { id: "f30", url: "https://g1.globo.com/rss/g1/", category: "Geral", name: "G1 Globo" },
    { id: "f31", url: "https://www.uol.com.br/rss.xml", category: "Geral", name: "UOL" },
    { id: "f52", url: "https://rss.cnn.com/rss/edition.rss", category: "Geral", name: "CNN" },
    { id: "f53", url: "https://feeds.skynews.com/feeds/rss/home.xml", category: "Geral", name: "Sky News" },
    { id: "f54", url: "https://www.aljazeera.com/xml/rss/all.xml", category: "Geral", name: "Al Jazeera" },
    { id: "f55", url: "https://feeds.nbcnews.com/nbcnews/public/news", category: "Geral", name: "NBC News" },
    { id: "f56", url: "https://rss.nytimes.com/services/xml/rss/nyt/HomePage.xml", category: "Geral", name: "New York Times" },
    { id: "f57", url: "https://feeds.washingtonpost.com/rss/world", category: "Geral", name: "Washington Post" },

    // ===== Ciência =====
    { id: "f32", url: "https://phys.org/rss-feed/", category: "Ciência", name: "Phys.org" },
    { id: "f33", url: "https://www.livescience.com/feeds/all", category: "Ciência", name: "Live Science" },
    { id: "f34", url: "https://www.sciencedaily.com/rss/all.xml", category: "Ciência", name: "Science Daily" },
    { id: "f35", url: "https://www.nature.com/nature.rss", category: "Ciência", name: "Nature" },
    { id: "f58", url: "https://www.newscientist.com/feed/home/", category: "Ciência", name: "New Scientist" },
    { id: "f59", url: "https://www.quantamagazine.org/feed/", category: "Ciência", name: "Quanta Magazine" },
    { id: "f60", url: "https://spectrum.ieee.org/rss/fulltext", category: "Ciência", name: "IEEE Spectrum" },

    // ===== Astronomia =====
    { id: "f36", url: "https://spacenews.com/feed/", category: "Astronomia", name: "SpaceNews" },
    { id: "f37", url: "https://www.space.com/feeds/all", category: "Astronomia", name: "Space.com" },
    { id: "f38", url: "https://skyandtelescope.org/feed/", category: "Astronomia", name: "Sky & Telescope" },
    { id: "f72", url: "https://www.esa.int/rssfeed/Our_Activities/Space_Science", category: "Astronomia", name: "ESA" },

    // ===== Economia =====
    { id: "f39", url: "https://www.infomoney.com.br/feed/", category: "Economia", name: "InfoMoney" },
    { id: "f40", url: "https://feeds.reuters.com/reuters/businessNews", category: "Economia", name: "Reuters Business" },
    { id: "f41", url: "https://www.moneytimes.com.br/feed/", category: "Economia", name: "Money Times" },
    { id: "f42", url: "https://valoreconomico.globo.com/rss/", category: "Economia", name: "Valor Econômico" },
    { id: "f66", url: "https://rss.nytimes.com/services/xml/rss/nyt/Business.xml", category: "Economia", name: "NYT Business" },
    { id: "f67", url: "https://feeds.marketwatch.com/marketwatch/topstories/", category: "Economia", name: "MarketWatch" },

    // ===== Tecnologia =====
    { id: "f43", url: "https://www.theverge.com/rss/index.xml", category: "Tecnologia", name: "The Verge" },
    { id: "f44", url: "https://arstechnica.com/feed/", category: "Tecnologia", name: "Ars Technica" },
    { id: "f45", url: "https://olhardigital.com.br/feed/", category: "Tecnologia", name: "Olhar Digital" },
    { id: "f46", url: "https://canaltech.com.br/rss/", category: "Tecnologia", name: "Canaltech" },
    { id: "f61", url: "https://www.engadget.com/rss.xml", category: "Tecnologia", name: "Engadget" },
    { id: "f62", url: "https://www.cnet.com/rss/news/", category: "Tecnologia", name: "CNET" },
    { id: "f63", url: "https://www.digitaltrends.com/feed/", category: "Tecnologia", name: "Digital Trends" },
    { id: "f64", url: "https://feeds.arstechnica.com/arstechnica/index", category: "Tecnologia", name: "Ars Technica (Completo)" },
    { id: "f65", url: "https://www.bleepingcomputer.com/feed/", category: "Tecnologia", name: "BleepingComputer" },

    // ===== Música =====
    { id: "f47", url: "https://consequenceofsound.net/feed/", category: "Música", name: "Consequence of Sound" },
    { id: "f48", url: "https://www.nme.com/news/music/feed", category: "Música", name: "NME" },
    { id: "f49", url: "https://www.musicbusinessworldwide.com/feed/", category: "Música", name: "Music Business Worldwide" },

    // ===== Saúde =====
    { id: "f50", url: "https://feeds.bbci.co.uk/news/health/rss.xml", category: "Saúde", name: "BBC Health" },
    { id: "f51", url: "https://saude.abril.com.br/feed/", category: "Saúde", name: "Saúde Abril" },
    { id: "f70", url: "https://www.medicalnewstoday.com/rss", category: "Saúde", name: "Medical News Today" },
    { id: "f71", url: "https://www.webmd.com/rss/news_breaking.xml", category: "Saúde", name: "WebMD" },

    // ===== Política =====
    { id: "f68", url: "https://rss.nytimes.com/services/xml/rss/nyt/Politics.xml", category: "Política", name: "NYT Politics" },
    { id: "f69", url: "https://www.politico.com/rss/politics08.xml", category: "Política", name: "POLITICO" },

    // ===== Games =====
    { id: "f73", url: "https://www.ign.com/rss", category: "Games", name: "IGN" },
    { id: "f74", url: "https://kotaku.com/rss", category: "Games", name: "Kotaku" },
];

  for (const f of feeds) {
    await db.execute({
      sql: "INSERT OR IGNORE INTO rss_feeds (id, url, category, name) VALUES (?, ?, ?, ?)",
      args: [f.id, f.url, f.category, f.name],
    });
  }
}

export default db;
