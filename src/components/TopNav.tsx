const NAV_ITEMS = [
  { label: "Landing / Auth", href: "#landing" },
  { label: "Entry", href: "#entry" },
  { label: "Dashboard", href: "#dashboard" },
  { label: "Admin", href: "#admin" },
];

export function TopNav() {
  return (
    <header className="sticky top-0 z-20 border-b border-emerald-400/30 bg-black/70 backdrop-blur-xl">
      <div className="mx-auto flex max-w-7xl items-center gap-6 px-6 py-4">
        <div className="flex items-center gap-3">
          <span className="neon-ring" />
          <div>
            <p className="font-display text-sm font-semibold uppercase tracking-[0.2em] text-emerald-200">
              Terminal Prime
            </p>
            <p className="text-xs uppercase tracking-[0.3em] text-emerald-200/60">
              100-Day Stock Fantasy Challenge
            </p>
          </div>
        </div>
        <nav className="hidden flex-1 items-center justify-center gap-6 text-xs uppercase tracking-[0.2em] text-emerald-200/70 md:flex">
          {NAV_ITEMS.map((item) => (
            <a key={item.href} href={item.href} className="transition hover:text-emerald-200">
              {item.label}
            </a>
          ))}
        </nav>
        <div className="ml-auto hidden rounded-full border border-emerald-400/60 bg-emerald-400/10 px-4 py-2 text-xs uppercase tracking-[0.2em] text-emerald-200 md:block">
          Live Session
        </div>
      </div>
    </header>
  );
}
