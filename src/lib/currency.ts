export type Currency = "RWF" | "USD" | "EUR" | "GBP";

export const CURRENCIES: Currency[] = ["RWF", "USD", "EUR", "GBP"];

// Display-only conversion rates (relative to USD). Payment is always charged in USD.
export const RATES: Record<Currency, number> = {
  USD: 1,
  RWF: 1300,
  EUR: 0.92,
  GBP: 0.79,
};

const SYMBOLS: Record<Currency, string> = {
  USD: "$",
  RWF: "FRW ",
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

/** Best-effort currency guess from browser locale. Defaults to RWF. */
export function detectCurrency(): Currency {
  if (typeof navigator === "undefined") return "RWF";
  const lang = (navigator.language || "en-RW").toLowerCase();
  const region = lang.split("-")[1];
  if (!region) return "RWF";
  if (["us", "ec", "sv", "pa"].includes(region)) return "USD";
  if (["gb", "uk"].includes(region)) return "GBP";
  if (
    ["fr", "de", "es", "it", "nl", "be", "at", "pt", "ie", "fi", "gr", "lu"].includes(region)
  )
    return "EUR";
  // Default for RW and anywhere else
  return "RWF";
}
