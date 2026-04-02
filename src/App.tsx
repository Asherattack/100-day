import { useEffect, useMemo, useState } from "react";
import { AuthPanel } from "./components/AuthPanel";
import { CategoryBlock } from "./components/CategoryBlock";
import { KpiCard } from "./components/KpiCard";
import { Leaderboard } from "./components/Leaderboard";
import { PerformanceCard } from "./components/PerformanceCard";
import { SectionHeader } from "./components/SectionHeader";
import { TopNav } from "./components/TopNav";
import { CATEGORIES } from "./lib/categories";
import type { MarketQuote } from "./types/market";
import { getChallengeMetrics } from "./lib/challenge";
import { useSupabaseSession } from "./lib/useSupabaseSession";
import { supabase } from "./lib/supabaseClient";

const REFRESH_MS = 45000;
const API_BASE = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:3001";

const parseChange = (change?: string) => {
  if (!change) return null;
  const cleaned = change.replace("%", "");
  const value = Number.parseFloat(cleaned);
  return Number.isFinite(value) ? value / 100 : null;
};

const parsePrice = (price?: string) => {
  if (!price) return null;
  const cleaned = price.replace(/[^0-9.]/g, "");
  const value = Number.parseFloat(cleaned);
  return Number.isFinite(value) ? value : null;
};

const buildSparkline = (symbol: string, price?: string) => {
  const base = parsePrice(price) ?? 100;
  const seed = symbol
    .split("")
    .reduce((sum, char) => sum + char.charCodeAt(0), 0);
  const values = Array.from({ length: 12 }).map((_, index) => {
    const wave = Math.sin((index + seed) / 2) * 2;
    const drift = (seed % 7) - 3;
    return base + wave + drift + index * 0.15;
  });
  return values;
};

const MOCK_LEADERBOARD = [
  { displayName: "Terminal Prime", returnPct: 18.2, picks: ["AAPL", "NVDA", "LLY"] },
  { displayName: "Quant Drifters", returnPct: 15.6, picks: ["MSFT", "TSLA", "JPM"] },
  { displayName: "Night Ops", returnPct: 12.9, picks: ["META", "AMZN", "NFLX"] },
  { displayName: "Signal Forge", returnPct: 11.4, picks: ["COST", "XOM", "CRM"] },
  { displayName: "Gamma Circuit", returnPct: 9.7, picks: ["ORCL", "UNH", "AMD"] },
];

export default function App() {
  const { session, loading: authLoading } = useSupabaseSession();
  const [quotes, setQuotes] = useState<Record<string, MarketQuote>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [picks, setPicks] = useState<Record<string, string>>({});
  const [leaderboard, setLeaderboard] = useState(
    [] as Array<{ displayName: string; returnPct: number; picks: string[] }>
  );
  const [confirmOpen, setConfirmOpen] = useState(false);

  const allSymbols = useMemo(() => {
    const symbols = new Set<string>();
    CATEGORIES.forEach((category) => {
      category.stocks.forEach((stock) => symbols.add(stock.symbol));
    });
    return Array.from(symbols);
  }, []);

  const fetchQuotes = async () => {
    try {
      setLoading(true);
      setError(null);
      const params = new URLSearchParams({ tickers: allSymbols.join(",") });
      const res = await fetch(`${API_BASE}/api/stocks?${params.toString()}`);
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data?.error ?? "Failed to fetch quotes");
      }
      const nextQuotes: Record<string, MarketQuote> = {};
      (data.data as MarketQuote[]).forEach((quote) => {
        nextQuotes[quote.ticker] = quote;
      });
      setQuotes(nextQuotes);
    } catch (fetchError) {
      setError(fetchError instanceof Error ? fetchError.message : "Failed to fetch quotes");
    } finally {
      setLoading(false);
    }
  };

  const fetchLeaderboard = async () => {
    const res = await fetch(`${API_BASE}/api/leaderboard`);
    const data = await res.json();
    setLeaderboard(data.data ?? []);
  };

  useEffect(() => {
    fetchQuotes();
    fetchLeaderboard();
    const timer = setInterval(fetchQuotes, REFRESH_MS);
    return () => clearInterval(timer);
  }, []);

  const picksList = Object.entries(picks).map(([category, symbol]) => ({ category, symbol }));
  const progress = Math.min(100, Math.round((picksList.length / 10) * 100));

  const { day, daysLeft } = getChallengeMetrics();

  const avgChange = useMemo(() => {
    const changes = Object.values(quotes)
      .map((quote) => parseChange(quote.change))
      .filter((value): value is number => value != null);
    if (!changes.length) {
      return 0;
    }
    return changes.reduce((sum, value) => sum + value, 0) / changes.length;
  }, [quotes]);

  const portfolioValue = 100000 * (1 + avgChange);
  const dailyMove = avgChange * 100;

  const dashboardSymbols = CATEGORIES.map((category) => {
    const selected = picks[category.label];
    const fallback = category.stocks[0];
    const stock = category.stocks.find((entry) => entry.symbol === selected) ?? fallback;
    return stock;
  });

  const movers = useMemo(() => {
    const entries = Object.values(quotes)
      .map((quote) => ({
        quote,
        change: parseChange(quote.change),
      }))
      .filter((entry) => entry.change != null);
    const sorted = [...entries].sort((a, b) => (b.change ?? 0) - (a.change ?? 0));
    return {
      gainers: sorted.slice(0, 3),
      losers: sorted.slice(-3).reverse(),
    };
  }, [quotes]);

  const handleLockPortfolio = async () => {
    if (!session) {
      setError("Sign in to lock your portfolio.");
      return;
    }
    if (picksList.length < 10) {
      setError("You must pick 1 stock in each category before locking.");
      return;
    }
    setConfirmOpen(true);
  };

  const confirmLock = async () => {
    if (!session) {
      return;
    }
    try {
      const response = await fetch(`${API_BASE}/api/portfolio`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: session.user.id, picks: picksList.map((pick) => pick.symbol) }),
      });
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data?.error ?? "Failed to lock portfolio");
      }
      setConfirmOpen(false);
    } catch (lockError) {
      setError(lockError instanceof Error ? lockError.message : "Failed to lock portfolio");
    }
  };

  const handleGoogleSignIn = async () => {
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: window.location.origin },
    });
  };

  const leaderboardData = leaderboard.length ? leaderboard : MOCK_LEADERBOARD;

  return (
    <div className="app-shell min-h-screen">
      <TopNav />
      <main className="relative z-10 mx-auto grid max-w-7xl gap-12 px-6 pb-20 pt-10">
        <section id="landing" className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="glass-panel flex flex-col gap-6 p-8">
            <SectionHeader
              kicker="Landing"
              title="100-Day Stock Fantasy Challenge"
              subtitle="A trading-grade fantasy league where your picks live or die by real market performance."
            />
            <div className="grid gap-4 text-sm text-emerald-200/70">
              <p>Pick 1 stock per category and lock it in for 100 days.</p>
              <p>Live quotes refresh every 45 seconds with caching to stay fast.</p>
              <p>Leaderboard ranks every portfolio by total gain/loss.</p>
            </div>
            <div className="flex flex-wrap gap-4">
              <a href="#entry" className="neon-button">
                Start Challenge
              </a>
              <a href="#dashboard" className="ghost-button">
                View Dashboard
              </a>
            </div>
          </div>
          <AuthPanel />
        </section>

        <section id="entry" className="glass-panel relative grid gap-6 p-8">
          <SectionHeader
            kicker="Entry"
            title="Pick 1 stock per category"
            subtitle="10 categories, 10 stocks each. Choose one champion from every sector."
            right={<span className="badge">Live quotes</span>}
          />
          {error && <p className="text-sm text-rose-400">{error}</p>}
          <div className="rounded-2xl border border-emerald-400/20 bg-black/40 p-4">
            <div className="flex items-center justify-between text-xs uppercase tracking-[0.2em] text-emerald-200/60">
              <span>Progress</span>
              <span>{picksList.length}/10 locked</span>
            </div>
            <div className="mt-3 h-2 w-full rounded-full bg-emerald-400/10">
              <div className="h-2 rounded-full bg-emerald-400" style={{ width: `${progress}%` }} />
            </div>
          </div>
          <div className="grid gap-6">
            {CATEGORIES.map((category) => (
              <CategoryBlock
                key={category.label}
                label={category.label}
                icon={category.icon}
                stocks={category.stocks}
                quotes={quotes}
                selected={picks[category.label]}
                loading={loading}
                onSelect={(symbol) => {
                  if (!session) {
                    setError("Sign in to make picks.");
                    return;
                  }
                  setPicks((prev) => ({ ...prev, [category.label]: symbol }));
                }}
              />
            ))}
          </div>
          <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-emerald-400/20 bg-black/40 p-5">
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-emerald-200/60">Your picks</p>
              <p className="mt-2 font-display text-2xl text-white">{picksList.length} / 10 locked</p>
            </div>
            <div className="flex flex-wrap gap-2">
              {picksList.map((pick) => (
                <span key={pick.category} className="badge">
                  {pick.symbol}
                </span>
              ))}
            </div>
            <button className="neon-button" onClick={handleLockPortfolio}>
              Lock In Portfolio
            </button>
          </div>
          {!session && !authLoading && (
            <div className="absolute inset-0 grid place-items-center rounded-2xl border border-emerald-400/20 bg-black/85 text-center">
              <div className="max-w-sm space-y-4">
                <p className="text-sm uppercase tracking-[0.2em] text-emerald-200">
                  Sign in to unlock the draft board.
                </p>
                <button className="neon-button w-full" onClick={handleGoogleSignIn}>
                  Continue with Google
                </button>
              </div>
            </div>
          )}
        </section>

        <section id="dashboard" className="glass-panel grid gap-6 p-8">
          <SectionHeader
            kicker="Dashboard"
            title="Market Intel Headquarters"
            subtitle="Live price feeds, portfolio performance, and leaderboard standings."
          />
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <KpiCard
              label="Portfolio value"
              value={`$${portfolioValue.toLocaleString(undefined, { maximumFractionDigits: 0 })}`}
              meta="Weighted across 10 picks"
            />
            <KpiCard
              label="Daily move"
              value={`${dailyMove >= 0 ? "+" : ""}${dailyMove.toFixed(2)}%`}
              meta="Average change today"
            />
            <KpiCard label="Challenge day" value={`Day ${day}`} meta={`${daysLeft} days left`} />
            <KpiCard label="Status" value={session ? "Verified" : "Guest"} meta="Auth required to submit picks" />
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="rounded-2xl border border-emerald-400/20 bg-black/40 p-5">
              <p className="badge">Top movers</p>
              <div className="mt-4 grid gap-3">
                {movers.gainers.map(({ quote }) => (
                  <div key={`gain-${quote.ticker}`} className="flex items-center justify-between text-sm text-emerald-200/70">
                    <span className="text-white">{quote.ticker}</span>
                    <span className="text-emerald-300">{quote.change ?? "—"}</span>
                  </div>
                ))}
                {movers.losers.map(({ quote }) => (
                  <div key={`loss-${quote.ticker}`} className="flex items-center justify-between text-sm text-emerald-200/70">
                    <span className="text-white">{quote.ticker}</span>
                    <span className="text-rose-400">{quote.change ?? "—"}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="rounded-2xl border border-emerald-400/20 bg-black/40 p-5">
              <p className="badge">Portfolio pulse</p>
              <div className="mt-4 grid grid-cols-3 gap-3">
                {dashboardSymbols.slice(0, 3).map((stock) => (
                  <div key={`pulse-${stock.symbol}`} className="rounded-xl border border-emerald-400/10 bg-black/60 p-3">
                    <p className="text-xs uppercase tracking-[0.2em] text-emerald-200/60">{stock.symbol}</p>
                    <svg viewBox="0 0 100 40" className="mt-2 h-8 w-full">
                      <polyline
                        fill="none"
                        stroke="rgba(0,255,136,0.8)"
                        strokeWidth="2"
                        points={buildSparkline(stock.symbol, quotes[stock.symbol]?.price)
                          .map((value, index, arr) => {
                            const min = Math.min(...arr);
                            const max = Math.max(...arr);
                            const range = max - min || 1;
                            const x = (index / (arr.length - 1)) * 100;
                            const y = 40 - ((value - min) / range) * 40;
                            return `${x},${y}`;
                          })
                          .join(" ")}
                      />
                    </svg>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {dashboardSymbols.map((stock) => {
              const quote = quotes[stock.symbol];
              return (
                <PerformanceCard
                  key={stock.symbol}
                  symbol={stock.symbol}
                  name={stock.name}
                  price={quote?.price}
                  change={quote?.change}
                  chart={buildSparkline(stock.symbol, quote?.price)}
                />
              );
            })}
            {loading &&
              Array.from({ length: 3 }).map((_, index) => (
                <div key={`skeleton-${index}`} className="skeleton h-40" />
              ))}
          </div>
          <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
            <Leaderboard entries={leaderboardData} />
            <div className="glass-panel flex flex-col gap-5 p-6">
              <p className="badge">Countdown</p>
              <h3 className="font-display text-2xl">{daysLeft} days left</h3>
              <p className="text-sm text-emerald-200/70">
                The 100-day competition ends when the timer hits zero. Lock in picks before day 1 closes.
              </p>
              <div className="rounded-2xl border border-emerald-400/20 bg-black/40 p-4 text-sm text-emerald-200/70">
                Daily refresh every 45 seconds. Cached on the server to protect quote limits.
              </div>
            </div>
          </div>
        </section>

        <section id="admin" className="glass-panel grid gap-6 p-8">
          <SectionHeader
            kicker="Admin"
            title="System Control"
            subtitle="Manage the challenge lifecycle and keep the competition calibrated."
          />
          <div className="grid gap-4 md:grid-cols-2">
            {[
              {
                title: "Reset challenge",
                description: "Wipe leaderboard, picks, and day counter to open a new season.",
                action: "Initiate reset",
              },
              {
                title: "Manage users",
                description: "Invite new challengers, suspend accounts, or export the roster.",
                action: "Open roster",
              },
              {
                title: "Update categories",
                description: "Add or remove stocks in a category. Changes take effect next season.",
                action: "Edit categories",
              },
            ].map((action) => (
              <div key={action.title} className="rounded-2xl border border-emerald-400/20 bg-black/40 p-5">
                <h3 className="font-display text-lg text-white">{action.title}</h3>
                <p className="mt-2 text-sm text-emerald-200/70">{action.description}</p>
                <button className="ghost-button mt-4">{action.action}</button>
              </div>
            ))}
          </div>
        </section>
      </main>

      {confirmOpen && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/80 px-4">
          <div className="glass-panel w-full max-w-md p-6">
            <h3 className="font-display text-xl text-white">Confirm portfolio lock</h3>
            <p className="mt-2 text-sm text-emerald-200/70">
              You are about to lock 10 picks for the 100-day challenge. This cannot be changed once submitted.
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              {picksList.map((pick) => (
                <span key={`confirm-${pick.category}`} className="badge">
                  {pick.symbol}
                </span>
              ))}
            </div>
            <div className="mt-6 flex justify-end gap-3">
              <button className="ghost-button" onClick={() => setConfirmOpen(false)}>
                Cancel
              </button>
              <button className="neon-button" onClick={confirmLock}>
                Lock portfolio
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
