export interface StockSnapshot {
  symbol: string;
  companyName: string;
  price: number;
  peRatio: number | null;
  forwardPE: number | null;
  forwardEPS: number | null;
  peg: number | null;
  epsGrowth: number | null;
  fiveYearGrowth: number | null;
  roe: number | null;
  debtToEquity: number | null;
  profitMargin: number | null;
  industryPe: number | null;
  week52High: number | null;
  week52Low: number | null;
  prevClose: number | null;
  lastUpdated: number;
  history: number[];
}
