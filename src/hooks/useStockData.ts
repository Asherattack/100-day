import { useEffect, useMemo, useRef, useState } from 'react';
import { config } from '../config';
import { fetchStockSnapshot } from '../services/finnhubService';
import type { StockSnapshot } from '../types';

interface UseStockDataOptions {
  pollingInterval?: number;
}

export const useStockData = (symbols: string[], options?: UseStockDataOptions) => {
  const interval = options?.pollingInterval ?? config.pollingInterval;
  const [snapshots, setSnapshots] = useState<Record<string, StockSnapshot>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const historyRef = useRef<Record<string, number[]>>({});
  const symbolsKey = useMemo(
    () => symbols.map((symbol) => symbol.toUpperCase()).join(','),
    [symbols],
  );

  useEffect(() => {
    const staleKeys = Object.keys(historyRef.current).filter((symbol) => !symbols.includes(symbol));
    if (staleKeys.length) {
      staleKeys.forEach((symbol) => {
        delete historyRef.current[symbol];
      });
    }
  }, [symbols]);

  useEffect(() => {
    let active = true;
    let timer: ReturnType<typeof setInterval> | undefined;

    const refresh = async () => {
      if (!symbols.length) {
        setSnapshots({});
        setError(null);
        setLoading(false);
        return;
      }

      setLoading(true);
      const fetched: Record<string, StockSnapshot> = {};
      const errors: string[] = [];

      await Promise.all(
        symbols.map(async (symbol) => {
          try {
            const snapshot = await fetchStockSnapshot(symbol);
            const baseHistory = historyRef.current[symbol] ?? snapshot.history ?? [];
            const nextHistory = [...baseHistory, snapshot.price].slice(-config.maxHistoryPoints);
            historyRef.current[symbol] = nextHistory;
            fetched[symbol] = { ...snapshot, history: nextHistory };
          } catch (err) {
            errors.push(err instanceof Error ? err.message : String(err));
          }
        }),
      );

      if (!active) {
        return;
      }

      setSnapshots((prev) => {
        const next: Record<string, StockSnapshot> = {};
        symbols.forEach((symbol) => {
          if (fetched[symbol]) {
            next[symbol] = fetched[symbol];
          } else if (prev[symbol]) {
            next[symbol] = prev[symbol];
          }
        });
        return next;
      });

      setError(errors.length ? Array.from(new Set(errors)).join('; ') : null);
      setLoading(false);
    };

    void refresh();

    if (interval > 0) {
      timer = setInterval(() => {
        void refresh();
      }, interval);
    }

    return () => {
      active = false;
      if (timer) {
        clearInterval(timer);
      }
    };
  }, [symbolsKey, interval, symbols]);

  return { snapshots, loading, error };
};
