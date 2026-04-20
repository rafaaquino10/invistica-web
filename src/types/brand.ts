export type WordmarkSize = "sm" | "md" | "lg" | "xl";
export type WordmarkVariant = "light" | "dark";

export interface WordmarkProps {
  size?: WordmarkSize;
  variant?: WordmarkVariant;
  className?: string;
}
