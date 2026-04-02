const parseMs = (value: string | undefined, fallback: number) => {
  if (!value) {
    return fallback;
  }
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
};

export const config = {
  pollingInterval: parseMs(import.meta.env.VITE_POLLING_INTERVAL_MS, 12_000),
  rateLimitPerSecond: parseMs(import.meta.env.VITE_RATE_LIMIT_PER_SEC, 6),
  maxHistoryPoints: 60,
  sparklineWindowDays: 7,
  candleResolution: '60',
  finnhubKey: import.meta.env.VITE_FINNHUB_KEY ?? '',
};
