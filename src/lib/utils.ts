import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Format number as Japanese Yen (no decimals, with comma separators).
 * Negative values get a minus sign prefix.
 */
export function formatYen(amount: number): string {
  return amount.toLocaleString("ja-JP");
}

/**
 * Format number as 万円 for large values (e.g. 1,500万円).
 */
export function formatMan(amount: number): string {
  const man = amount / 10_000;
  if (Number.isInteger(man)) return `${man.toLocaleString("ja-JP")}万`;
  return `${man.toLocaleString("ja-JP", { maximumFractionDigits: 1 })}万`;
}

/** Generate a short random ID. */
export function nanoid(): string {
  return crypto.randomUUID().slice(0, 8);
}
