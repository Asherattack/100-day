import { StockCard } from "./StockCard";
import type { MarketQuote } from "../types/market";

type CategoryBlockProps = {
  label: string;
  icon: string;
  stocks: { symbol: string; name: string }[];
  quotes: Record<string, MarketQuote | undefined>;
  selected?: string;
  loading?: boolean;
  onSelect: (symbol: string) => void;
};

export function CategoryBlock({
  label,
  icon,
  stocks,
  quotes,
  selected,
  loading,
  onSelect,
}: CategoryBlockProps) {
  return (
    <div className="glass-panel flex flex-col gap-6 p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-emerald-300">
            {icon} {label}
          </p>
          <p className="mt-2 text-sm text-emerald-200/70">Select one pick</p>
        </div>
        <span className="text-xs uppercase tracking-[0.2em] text-emerald-200/70">
          {selected ? `Chosen: ${selected}` : "No pick"}
        </span>
      </div>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {stocks.map((stock) => {
          const quote = quotes[stock.symbol];
          return (
            <StockCard
              key={`${label}-${stock.symbol}`}
              symbol={stock.symbol}
              name={stock.name}
              price={quote?.price}
              change={quote?.change}
              marketCap={quote?.marketCap}
              selected={selected === stock.symbol}
              loading={loading && !quote}
              onClick={() => onSelect(stock.symbol)}
            />
          );
        })}
      </div>
    </div>
  );
}
