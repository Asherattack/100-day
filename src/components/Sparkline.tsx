interface SparklineProps {
  data: number[];
  color?: string;
}

export function Sparkline({ data, color = 'var(--color-accent)' }: SparklineProps) {
  const values = data.filter((value) => Number.isFinite(value));
  if (values.length < 2) {
    return <div className="sparkline__placeholder">Waiting for data</div>;
  }

  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;
  const points = values
    .map((value, index) => {
      const x = (index / (values.length - 1)) * 100;
      const y = 30 - ((value - min) / range) * 30;
      return `${x},${y}`;
    })
    .join(' ');

  return (
    <svg className="sparkline" viewBox="0 0 100 30" preserveAspectRatio="none">
      <polyline points={points} fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" />
    </svg>
  );
}

