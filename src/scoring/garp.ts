import type { StockSnapshot } from '../types';

export interface GarpWeights {
  peg: number;
  pe: number;
  epsGrowth: number;
  roe: number;
}

export interface GarpRuleResult {
  id: keyof GarpWeights;
  label: string;
  passed: boolean;
  actual: number | null;
  detail: string;
}

export interface GarpScore {
  rules: GarpRuleResult[];
  percentage: number;
  weightedScore: number;
  maxScore: number;
  heat: 'cold' | 'warm' | 'hot';
  strongBuy: boolean;
}

export const defaultWeights: GarpWeights = {
  peg: 0.35,
  pe: 0.25,
  epsGrowth: 0.2,
  roe: 0.2,
};

const thresholds = {
  peg: 1.2,
  strongPeg: 1.0,
  pe: 20,
  epsGrowthMin: 0.1,
  epsGrowthMax: 0.25,
  roe: 0.15,
};

const formatPercent = (value: number | null) => {
  if (value == null || Number.isNaN(value)) {
    return 'N/A';
  }
  return `${(value * 100).toFixed(1)}%`;
};

const determineHeat = (percentage: number): GarpScore['heat'] => {
  if (percentage >= 85) {
    return 'hot';
  }
  if (percentage >= 60) {
    return 'warm';
  }
  return 'cold';
};

export const calculateGarpScore = (snapshot: StockSnapshot, weights: GarpWeights): GarpScore => {
  const pegValue = snapshot.peg;
  const peValue = snapshot.peRatio;
  const industryPe = snapshot.industryPe;
  const epsGrowth = snapshot.fiveYearGrowth ?? snapshot.epsGrowth ?? null;
  const roe = snapshot.roe;

  const pegPassed = pegValue != null && pegValue > 0 && pegValue < thresholds.peg;
  const pePassed =
    peValue != null &&
    peValue > 0 &&
    ((industryPe != null && peValue <= industryPe) || peValue < thresholds.pe);
  const epsPassed =
    epsGrowth != null &&
    epsGrowth >= thresholds.epsGrowthMin &&
    epsGrowth <= thresholds.epsGrowthMax;
  const roePassed = roe != null && roe >= thresholds.roe;

  const rules: GarpRuleResult[] = [
    {
      id: 'peg',
      label: `PEG < ${thresholds.peg}`,
      actual: pegValue,
      passed: pegPassed,
      detail: pegValue != null ? pegValue.toFixed(2) : 'N/A',
    },
    {
      id: 'pe',
      label: 'P/E v industry / < 20',
      actual: peValue,
      passed: pePassed,
      detail: peValue != null ? peValue.toFixed(2) : 'N/A',
    },
    {
      id: 'epsGrowth',
      label: 'EPS growth 10–25%',
      actual: epsGrowth,
      passed: epsPassed,
      detail: formatPercent(epsGrowth),
    },
    {
      id: 'roe',
      label: 'ROE > 15%',
      actual: roe,
      passed: roePassed,
      detail: formatPercent(roe),
    },
  ];

  const weightedScore = rules.reduce((score, rule) => (rule.passed ? score + weights[rule.id] : score), 0);
  const maxScore = Object.values(weights).reduce((sum, value) => sum + value, 0);
  const percentage = maxScore > 0 ? Math.round((weightedScore / maxScore) * 100) : 0;
  const heat = determineHeat(percentage);
  const strongBuy = pegValue != null && pegValue < thresholds.strongPeg && pePassed && epsPassed;

  return { rules, weightedScore, maxScore, percentage, heat, strongBuy };
};
