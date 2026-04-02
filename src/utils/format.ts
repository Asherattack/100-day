const placeholder = 'N/A';

export const formatCurrency = (value: number | null): string => {
  if (value == null || Number.isNaN(value)) {
    return placeholder;
  }
  return `$${value.toFixed(2)}`;
};

export const formatPercent = (
  value: number | null,
  { showSign = false }: { showSign?: boolean } = {},
): string => {
  if (value == null || Number.isNaN(value)) {
    return placeholder;
  }
  const sign = showSign ? (value > 0 ? '+' : value < 0 ? '-' : '') : '';
  return `${sign}${(Math.abs(value) * 100).toFixed(1)}%`;
};

export const formatDateTime = (timestamp: number | null): string => {
  if (!timestamp) {
    return placeholder;
  }
  return new Intl.DateTimeFormat('en-US', {
    hour: 'numeric',
    minute: 'numeric',
    hour12: true,
    month: 'short',
    day: 'numeric',
  }).format(new Date(timestamp));
};

export const formatRatio = (value: number | null, precision = 2): string => {
  if (value == null || Number.isNaN(value)) {
    return placeholder;
  }
  return value.toFixed(precision);
};
