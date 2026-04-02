import { config } from '../config';
import type { StockSnapshot } from '../types';

const BASE_URL = 'https://finnhub.io/api/v1';

class RateLimiter {
  private windowStart: number;
  private count: number;
  private readonly maxPerSecond: number;

  constructor(maxPerSecond: number) {
    this.maxPerSecond = maxPerSecond;
    this.windowStart = Date.now();
    this.count = 0;
  }

  schedule<T>(task: () => Promise<T>): Promise<T> {
    return new Promise((resolve, reject) => {
      const attempt = () => {
        const now = Date.now();
        if (now - this.windowStart >= 1000) {
          this.windowStart = now;
          this.count = 0;
        }

        if (this.count < this.maxPerSecond) {
          this.count += 1;
          task().then(resolve).catch(reject);
        } else {
          setTimeout(attempt, 120);
        }
      };

      attempt();
    });
  }
}

const limiter = new RateLimiter(Math.max(1, config.rateLimitPerSecond));
const ensureKey = () => {
  if (!config.finnhubKey) {
    throw new Error('Missing VITE_FINNHUB_KEY, unable to query Finnhub.');
  }
  return config.finnhubKey;
};

const fetchWithRetry = async (url: string, retries = 2, delay = 400): Promise<any> => {
  try {
    const response = await fetch(url, { cache: 'no-store' });
    if (!response.ok) {
      throw new Error(`Request failed (${response.status})`);
    }
    return response.json();
  } catch (error) {
    if (retries <= 0) {
      throw error;
    }
    await new Promise((resolve) => setTimeout(resolve, delay));
    return fetchWithRetry(url, retries - 1, delay * 1.5);
  }
};

const buildUrl = (path: string, params: Record<string, string | number>) => {
  const key = ensureKey();
  const query = new URLSearchParams({ ...params, token: key }).toString();
  return `${BASE_URL}${path}?${query}`;
};

const fetchQuote = (symbol: string) => {
  const url = buildUrl('/quote', { symbol });
  return limiter.schedule(() => fetchWithRetry(url));
};

const fetchMetrics = (symbol: string) => {
  const url = buildUrl('/stock/metric', { symbol, metric: 'all' });
  return limiter.schedule(() => fetchWithRetry(url));
};

const fetchProfile = (symbol: string) => {
  const url = buildUrl('/stock/profile2', { symbol });
  return limiter.schedule(() => fetchWithRetry(url));
};

const fetchCandles = async (symbol: string): Promise<number[]> => {
  const to = Math.floor(Date.now() / 1000);
  const from = to - config.sparklineWindowDays * 24 * 60 * 60;
  const url = buildUrl('/stock/candle', {
    symbol,
    resolution: config.candleResolution,
    from,
    to,
  });

  const data = await limiter.schedule(() => fetchWithRetry(url));
  if (data?.c && Array.isArray(data.c)) {
    return data.c.filter((value: unknown) => typeof value === 'number' && Number.isFinite(value));
  }

  return [];
};

const toNumber = (value: unknown): number | null => {
  return typeof value === 'number' && Number.isFinite(value) ? value : null;
};

const preferredGrowthKeys = [
  'fiveYearGrowth',
  'fiveYearRevenueGrowth',
  'fiveYearEarningsGrowth',
  'fiveYearEpsGrowth',
  'fiveYearAnnualizedGrowth',
  'epsGrowth',
  'earningsGrowth',
  'revenueGrowth',
];

const extractValue = (metric: Record<string, unknown>, keys: string[]) => {
  for (const key of keys) {
    if (metric[key] != null) {
      const cast = toNumber(metric[key]);
      if (cast != null) {
        return cast;
      }
    }
  }
  return null;
};

const metricValue = (metric: Record<string, unknown>, key: string) => {
  return metric?.[key] != null ? toNumber(metric[key]) : null;
};

const buildSnapshot = (
  symbol: string,
  quote: Record<string, unknown>,
  metric: Record<string, unknown>,
  profile: Record<string, unknown>,
  history: number[],
): StockSnapshot => {
  const price = toNumber(quote['c']) ?? 0;
  const prevClose = toNumber(quote['pc']) ?? null;
  const lastUpdated = quote['t'] ? Number(quote['t']) * 1000 : Date.now();

  return {
    symbol,
    companyName: typeof profile?.name === 'string' ? profile.name : symbol,
    price,
    peRatio: metricValue(metric, 'trailingPE') ?? metricValue(metric, 'peNormalizedAnnual'),
    forwardPE: metricValue(metric, 'forwardPE'),
    forwardEPS: metricValue(metric, 'forwardEPS') ?? metricValue(metric, 'forwardEps'),
    peg: metricValue(metric, 'pegRatio') ?? metricValue(metric, 'peg'),
    epsGrowth: extractValue(metric, ['epsGrowth', 'earningsGrowth', 'revenueGrowth']),
    fiveYearGrowth: extractValue(metric, preferredGrowthKeys),
    roe: metricValue(metric, 'returnOnEquity'),
    debtToEquity: metricValue(metric, 'debtToEquity') ?? metricValue(metric, 'debtEquity'),
    profitMargin:
      metricValue(metric, 'profitMargin') ?? metricValue(metric, 'netProfitMargin') ?? metricValue(metric, 'netMargin'),
    industryPe: metricValue(metric, 'industryPe') ?? metricValue(metric, 'industryPE'),
    week52High: metricValue(metric, '52WeekHigh') ?? metricValue(metric, 'week52High'),
    week52Low: metricValue(metric, '52WeekLow') ?? metricValue(metric, 'week52Low'),
    lastUpdated,
    history,
    prevClose,
  };
};

export const fetchStockSnapshot = async (symbol: string): Promise<StockSnapshot> => {
  const normalized = symbol.toUpperCase();
  const [quote, metricsData, profile, candleHistory] = await Promise.all([
    fetchQuote(normalized),
    fetchMetrics(normalized),
    fetchProfile(normalized),
    fetchCandles(normalized),
  ]);

  const metric = metricsData?.metric ?? {};
  return buildSnapshot(normalized, quote ?? {}, metric, profile ?? {}, candleHistory);
};
