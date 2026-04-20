export type StockLogoVariant = "accent" | "dark" | "outline";

export interface StockSubScore {
  label: string;
  value: number;
  high?: boolean;
}

export interface StockCardData {
  ticker: string;
  price: string;
  logoLetter: string;
  logoVariant: StockLogoVariant;
  invscore: number;
  invscoreAccent?: boolean;
  tag?: string;
  subScores: StockSubScore[];
}
