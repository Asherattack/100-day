type LineChartProps = {
  values: number[];
};

export function LineChart({ values }: LineChartProps) {
  if (values.length < 2) {
    return <div className="text-xs text-emerald-200/60">Chart data unavailable.</div>;
  }

  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;
  const points = values
    .map((value, index) => {
      const x = (index / (values.length - 1)) * 100;
      const y = 100 - ((value - min) / range) * 100;
      return `${x},${y}`;
    })
    .join(" ");

  return (
    <svg viewBox="0 0 100 100" className="h-20 w-full" preserveAspectRatio="none">
      <polyline
        fill="none"
        stroke="rgba(0, 255, 136, 0.8)"
        strokeWidth="2"
        points={points}
      />
    </svg>
  );
}
