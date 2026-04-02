type KpiCardProps = {
  label: string;
  value: string;
  meta?: string;
};

export function KpiCard({ label, value, meta }: KpiCardProps) {
  return (
    <div className="rounded-2xl border border-emerald-400/20 bg-black/40 p-4">
      <p className="text-xs uppercase tracking-[0.2em] text-emerald-200/60">{label}</p>
      <p className="mt-3 font-display text-2xl text-white">{value}</p>
      {meta && <p className="mt-2 text-xs text-emerald-200/60">{meta}</p>}
    </div>
  );
}
