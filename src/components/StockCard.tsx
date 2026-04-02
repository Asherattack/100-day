type StockCardProps = {
  symbol: string;
  name: string;
  price?: string;
  change?: string;
  marketCap?: string;
  selected?: boolean;
  loading?: boolean;
  onClick?: () => void;
};

export function StockCard({
  symbol,
  name,
  price,
  change,
  marketCap,
  selected,
  loading,
  onClick,
}: StockCardProps) {
  const changeClass = change?.startsWith("-") ? "text-rose-400" : change ? "text-emerald-300" : "text-emerald-200/70";

  return (
    <button
      type="button"
      onClick={onClick}
      className={`group flex h-full flex-col gap-4 rounded-2xl border border-emerald-400/20 bg-black/60 p-4 text-left transition hover:-translate-y-1 hover:border-emerald-300 hover:shadow-[0_18px_40px_rgba(0,255,136,0.2)] ${
        selected ? "border-emerald-300 bg-emerald-400/10" : ""
      }`}
    >
      <div className="flex items-start justify-between">
        <div>
          <h4 className="font-display text-lg text-white">{symbol}</h4>
          <p className="text-sm text-emerald-200/70">{name}</p>
        </div>
        <span className={`text-xs font-semibold ${changeClass}`}>{loading ? "..." : change ?? "—"}</span>
      </div>
      <div className="grid gap-2 text-xs text-emerald-200/70">
        <div>
          <p className="uppercase tracking-[0.2em] text-emerald-200/50">Price</p>
          <p className="text-sm text-white">{loading ? "Loading" : price ?? "—"}</p>
        </div>
        <div>
          <p className="uppercase tracking-[0.2em] text-emerald-200/50">Market Cap</p>
          <p className="text-sm text-white">{loading ? "Loading" : marketCap ?? "—"}</p>
        </div>
      </div>
      <div className="mt-auto flex items-center justify-between text-[0.65rem] uppercase tracking-[0.2em] text-emerald-200/60">
        <span>{selected ? "Selected" : "Tap to select"}</span>
        <span className="badge">Live</span>
      </div>
    </button>
  );
}
