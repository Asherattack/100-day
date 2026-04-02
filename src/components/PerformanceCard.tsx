import { LineChart } from "./LineChart";

export type PerformanceCardProps = {
  symbol: string;
  name: string;
  price?: string;
  change?: string;
  chart?: number[];
};

export function PerformanceCard({ symbol, name, price, change, chart }: PerformanceCardProps) {
  const changeClass = change?.startsWith("-") ? "text-rose-400" : "text-emerald-300";

  return (
    <div className="rounded-2xl border border-emerald-400/20 bg-black/40 p-4">
      <div className="flex items-start justify-between">
        <div>
          <p className="font-display text-lg text-white">{symbol}</p>
          <p className="text-sm text-emerald-200/70">{name}</p>
        </div>
        <div className="text-right">
          <p className="text-sm text-white">{price ?? "—"}</p>
          <p className={`text-xs ${changeClass}`}>{change ?? "—"}</p>
        </div>
      </div>
      <div className="mt-4">
        <LineChart values={chart ?? []} />
      </div>
    </div>
  );
}
