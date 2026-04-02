type SectionHeaderProps = {
  kicker: string;
  title: string;
  subtitle?: string;
  right?: React.ReactNode;
};

export function SectionHeader({ kicker, title, subtitle, right }: SectionHeaderProps) {
  return (
    <div className="flex flex-wrap items-start justify-between gap-4">
      <div>
        <p className="badge">{kicker}</p>
        <h2 className="mt-3 font-display text-2xl text-white md:text-3xl">{title}</h2>
        {subtitle && <p className="mt-2 max-w-xl text-sm text-emerald-200/70">{subtitle}</p>}
      </div>
      {right}
    </div>
  );
}
