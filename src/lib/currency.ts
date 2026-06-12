export type Currency = "USD" | "RWF" | "EUR" | "GBP";

export const CURRENCIES: Currency[] = ["USD", "RWF", "EUR", "GBP"];

// Display-only conversion rates (relative to USD). Payment is always charged in USD.
export const RATES: Record<Currency, number> = {
  USD: 1,
  RWF: 1300,
  EUR: 0.92,
  GBP: 0.79,
};

const SYMBOLS: Record<Currency, string> = {
  USD: "$",
  RWF: "RWF ",
  EUR: "€",
  GBP: "£",
};

export function convertFromUsd(usd: number, currency: Currency): number {
  return usd * RATES[currency];
}

export function formatPrice(usd: number, currency: Currency): string {
  const converted = convertFromUsd(usd, currency);
  if (currency === "RWF") {
    return `${SYMBOLS.RWF}${Math.round(converted).toLocaleString()}`;
  }
  return `${SYMBOLS[currency]}${converted.toFixed(2)}`;
}
