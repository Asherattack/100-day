import "dotenv/config";
import express from "express";
import axios from "axios";
import cors from "cors";
import mongoose from "mongoose";
import * as cheerio from "cheerio";

const app = express();
app.use(cors());
app.use(express.json());

const PORT = 3001;
const SERPAPI_KEY = process.env.SERPAPI_KEY;
const CACHE_TTL = Number(process.env.PRICE_CACHE_TTL_MS ?? 60000);
const RATE_LIMIT_WINDOW = Number(process.env.RATE_LIMIT_WINDOW_MS ?? 60000);
const RATE_LIMIT_MAX = Number(process.env.RATE_LIMIT_MAX ?? 120);

const cache = new Map();
const rateLimits = new Map();

const rateLimitMiddleware = (req, res, next) => {
  const key = req.ip;
  const now = Date.now();
  const entry = rateLimits.get(key) ?? { count: 0, resetAt: now + RATE_LIMIT_WINDOW };
  if (now > entry.resetAt) {
    entry.count = 0;
    entry.resetAt = now + RATE_LIMIT_WINDOW;
  }
  entry.count += 1;
  rateLimits.set(key, entry);
  res.setHeader("X-RateLimit-Limit", RATE_LIMIT_MAX);
  res.setHeader("X-RateLimit-Remaining", Math.max(0, RATE_LIMIT_MAX - entry.count));
  res.setHeader("X-RateLimit-Reset", entry.resetAt);
  if (entry.count > RATE_LIMIT_MAX) {
    return res.status(429).json({ error: "Rate limit exceeded" });
  }
  return next();
};

app.use(rateLimitMiddleware);

const connectMongo = async () => {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    return null;
  }
  if (mongoose.connection.readyState === 1) {
    return mongoose.connection;
  }
  await mongoose.connect(uri, { bufferCommands: false });
  return mongoose.connection;
};

const LeaderboardSchema = new mongoose.Schema(
  {
    userId: { type: String, required: true },
    displayName: { type: String, required: true },
    returnPct: { type: Number, required: true },
    picks: { type: [String], default: [] },
  },
  { timestamps: true }
);

const PortfolioSchema = new mongoose.Schema(
  {
    userId: { type: String, required: true },
    picks: { type: [String], default: [] },
    lockedAt: { type: Date },
  },
  { timestamps: true }
);

const Leaderboard = mongoose.models.Leaderboard || mongoose.model("Leaderboard", LeaderboardSchema);
const Portfolio = mongoose.models.Portfolio || mongoose.model("Portfolio", PortfolioSchema);

const fetchGoogleFinance = async (ticker) => {
  if (!SERPAPI_KEY) {
    throw new Error("Missing SERPAPI_KEY");
  }

  const { data } = await axios.get("https://serpapi.com/search.json", {
    params: {
      engine: "google_finance",
      hl: "en",
      q: ticker,
      api_key: SERPAPI_KEY,
    },
  });

  const summary = data?.summary;
  if (!summary) {
    throw new Error("Missing summary");
  }

  const movement = summary.price_movement;
  const changePct =
    movement && typeof movement.percentage === "number"
      ? `${movement.percentage >= 0 ? "+" : ""}${(movement.percentage * 100).toFixed(2)}%`
      : undefined;

  return {
    ticker: summary.stock || ticker,
    name: summary.title,
    price: summary.price,
    extractedPrice: summary.extracted_price,
    currency: summary.currency,
    exchange: summary.exchange,
    change: changePct,
  };
};

const fetchFinviz = async (ticker) => {
  const url = `https://finviz.com/quote.ashx?t=${ticker}`;
  const response = await axios.get(url, {
    headers: { "User-Agent": "Mozilla/5.0" },
  });

  const $ = cheerio.load(response.data);
  const snapshot = {};
  $(".snapshot-table2 td").each((index, element) => {
    const text = $(element).text().trim();
    if (index % 2 === 0) {
      snapshot[text] = $(element).next().text().trim();
    }
  });

  return {
    price: snapshot["Price"],
    change: snapshot["Change"],
    marketCap: snapshot["Market Cap"],
    volume: snapshot["Volume"],
    pe: snapshot["P/E"],
  };
};

const fetchCombinedQuote = async (ticker) => {
  const cached = cache.get(ticker);
  if (cached && Date.now() < cached.expiresAt) {
    return cached.data;
  }

  const [google, finviz] = await Promise.allSettled([
    fetchGoogleFinance(ticker),
    fetchFinviz(ticker),
  ]);

  if (google.status === "rejected" && finviz.status === "rejected") {
    throw new Error("Quote sources unavailable");
  }

  const googleValue = google.status === "fulfilled" ? google.value : {};
  const finvizValue = finviz.status === "fulfilled" ? finviz.value : {};

  const merged = {
    ticker,
    name: googleValue.name,
    price: googleValue.price || finvizValue.price,
    extractedPrice: googleValue.extractedPrice,
    currency: googleValue.currency,
    exchange: googleValue.exchange,
    change: googleValue.change || finvizValue.change,
    marketCap: finvizValue.marketCap,
    volume: finvizValue.volume,
    pe: finvizValue.pe,
    updatedAt: Date.now(),
  };

  cache.set(ticker, { data: merged, expiresAt: Date.now() + CACHE_TTL });
  return merged;
};

app.get("/api/stock/:ticker", async (req, res) => {
  try {
    const ticker = req.params.ticker.toUpperCase();
    const payload = await fetchCombinedQuote(ticker);
    res.json(payload);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch stock data" });
  }
});

app.get("/api/stocks", async (req, res) => {
  try {
    const tickersRaw = String(req.query.tickers || "")
      .split(",")
      .map((value) => value.trim().toUpperCase())
      .filter(Boolean);

    if (!tickersRaw.length) {
      return res.status(400).json({ error: "No tickers provided" });
    }

    const results = [];
    const concurrency = Number(process.env.QUOTE_CONCURRENCY ?? 4);
    let index = 0;

    const worker = async () => {
      while (index < tickersRaw.length) {
        const current = tickersRaw[index];
        index += 1;
        try {
          const snapshot = await fetchCombinedQuote(current);
          results.push(snapshot);
        } catch (error) {
          results.push({ ticker: current, error: "Failed to fetch" });
        }
      }
    };

    const workers = Array.from({ length: Math.min(concurrency, tickersRaw.length) }, worker);
    await Promise.all(workers);

    res.json({
      count: results.length,
      updatedAt: Date.now(),
      data: results,
    });
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch stock data" });
  }
});

app.get("/api/leaderboard", async (_req, res) => {
  const conn = await connectMongo();
  if (!conn) {
    return res.json({ data: [] });
  }
  const rows = await Leaderboard.find({}).sort({ returnPct: -1 }).limit(10).lean();
  return res.json({ data: rows });
});

app.post("/api/portfolio", async (req, res) => {
  const { userId, picks } = req.body ?? {};
  if (!userId || !Array.isArray(picks)) {
    return res.status(400).json({ error: "Missing userId or picks" });
  }
  const conn = await connectMongo();
  if (!conn) {
    return res.status(500).json({ error: "Database not configured" });
  }
  const portfolio = await Portfolio.findOneAndUpdate(
    { userId },
    { userId, picks, lockedAt: new Date() },
    { upsert: true, new: true }
  );
  return res.json({ data: portfolio });
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
