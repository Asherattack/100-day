type LeaderboardEntry = {
  _id?: string;
  displayName: string;
  returnPct: number;
  picks: string[];
};

type LeaderboardProps = {
  entries: LeaderboardEntry[];
};

export function Leaderboard({ entries }: LeaderboardProps) {
  return (
    <div className="glass-panel flex h-full flex-col gap-4 p-5">
      <div>
        <p className="badge">Leaderboard</p>
        <h3 className="mt-3 font-display text-xl">Top 10 performance</h3>
      </div>
      <div className="grid gap-2 text-sm text-emerald-200/70">
        {entries.length ? (
          entries.map((entry, index) => (
            <div
              key={entry._id ?? entry.displayName}
              className="flex items-center justify-between rounded-xl border border-emerald-400/10 bg-black/40 px-4 py-2"
            >
              <div className="flex items-center gap-3">
                <span className="text-xs text-emerald-200/50">#{index + 1}</span>
                <span className="text-white">{entry.displayName}</span>
              </div>
              <div className="text-right">
                <p className="text-emerald-300">+{entry.returnPct.toFixed(2)}%</p>
                <p className="text-xs text-emerald-200/50">{entry.picks.length} picks</p>
              </div>
            </div>
          ))
        ) : (
          <p className="text-sm text-emerald-200/50">Leaderboard is warming up.</p>
        )}
      </div>
    </div>
  );
}
