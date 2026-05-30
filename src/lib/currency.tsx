import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

export type CurrencyCode = "BHD" | "QAR" | "SAR" | "AED" | "KWD" | "OMR" | "USD" | "EUR";

export type CurrencyMeta = {
  code: CurrencyCode;
  label: string;
  symbol: string;
  /** Value of 1 unit in USD (approximate, fixed pegs where applicable). */
  usd: number;
  decimals: number;
};

export const CURRENCIES: CurrencyMeta[] = [
  { code: "BHD", label: "Bahraini Dinar", symbol: "BD", usd: 2.659, decimals: 3 },
  { code: "QAR", label: "Qatari Riyal", symbol: "QAR", usd: 0.2747, decimals: 2 },
  { code: "SAR", label: "Saudi Riyal", symbol: "SAR", usd: 0.2667, decimals: 2 },
  { code: "AED", label: "UAE Dirham", symbol: "AED", usd: 0.2723, decimals: 2 },
  { code: "KWD", label: "Kuwaiti Dinar", symbol: "KD", usd: 3.26, decimals: 3 },
  { code: "OMR", label: "Omani Rial", symbol: "OMR", usd: 2.60, decimals: 3 },
  { code: "USD", label: "US Dollar", symbol: "$", usd: 1, decimals: 2 },
  { code: "EUR", label: "Euro", symbol: "€", usd: 1.08, decimals: 2 },
];

const META: Record<CurrencyCode, CurrencyMeta> = Object.fromEntries(
  CURRENCIES.map((c) => [c.code, c]),
) as Record<CurrencyCode, CurrencyMeta>;

/** All numeric prices stored in the app are expressed in this base currency. */
export const BASE_CURRENCY: CurrencyCode = "BHD";

type Ctx = {
  currency: CurrencyCode;
  setCurrency: (c: CurrencyCode) => void;
  convert: (amount: number, from?: CurrencyCode) => number;
  toBase: (amount: number, from?: CurrencyCode) => number;
  format: (amount: number, from?: CurrencyCode) => string;
};

const CurrencyContext = createContext<Ctx | null>(null);

const STORAGE_KEY = "currency";

/** Map of country code (ISO-3166 alpha-2) -> default currency for the region. */
const COUNTRY_TO_CURRENCY: Record<string, CurrencyCode> = {
  BH: "BHD", QA: "QAR", SA: "SAR", AE: "AED", KW: "KWD", OM: "OMR",
  US: "USD", GB: "USD", CA: "USD", AU: "USD",
  DE: "EUR", FR: "EUR", IT: "EUR", ES: "EUR", NL: "EUR", BE: "EUR",
  PT: "EUR", IE: "EUR", AT: "EUR", FI: "EUR", GR: "EUR",
};

/** Map of IANA timezone -> country code (fallback when locale lacks region). */
const TZ_TO_COUNTRY: Record<string, string> = {
  "Asia/Bahrain": "BH",
  "Asia/Qatar": "QA",
  "Asia/Riyadh": "SA",
  "Asia/Dubai": "AE",
  "Asia/Kuwait": "KW",
  "Asia/Muscat": "OM",
};

function detectRegionCurrency(): CurrencyCode | null {
  if (typeof window === "undefined") return null;
  try {
    // 1) Try browser locale region (e.g. "ar-BH", "en-US")
    const langs: string[] = [
      ...(navigator.languages ?? []),
      navigator.language,
    ].filter(Boolean) as string[];
    for (const l of langs) {
      const region = l.split("-")[1]?.toUpperCase();
      if (region && COUNTRY_TO_CURRENCY[region]) return COUNTRY_TO_CURRENCY[region];
    }
    // 2) Fallback to timezone
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
    const country = TZ_TO_COUNTRY[tz];
    if (country && COUNTRY_TO_CURRENCY[country]) return COUNTRY_TO_CURRENCY[country];
  } catch {}
  return null;
}

export function CurrencyProvider({ children }: { children: ReactNode }) {
  const [currency, setCurrencyState] = useState<CurrencyCode>("BHD");

  useEffect(() => {
    const saved = typeof window !== "undefined" ? localStorage.getItem(STORAGE_KEY) : null;
    if (saved && META[saved as CurrencyCode]) {
      setCurrencyState(saved as CurrencyCode);
      return;
    }
    const auto = detectRegionCurrency();
    if (auto) setCurrencyState(auto);
  }, []);

  function setCurrency(c: CurrencyCode) {
    setCurrencyState(c);
    try { localStorage.setItem(STORAGE_KEY, c); } catch {}
  }

  function convert(amount: number, from: CurrencyCode = BASE_CURRENCY) {
    if (!Number.isFinite(amount)) return 0;
    if (from === currency) return amount;
    const inUsd = amount * META[from].usd;
    return inUsd / META[currency].usd;
  }

  function toBase(amount: number, from: CurrencyCode = BASE_CURRENCY) {
    if (!Number.isFinite(amount)) return 0;
    if (from === BASE_CURRENCY) return amount;
    const inUsd = amount * META[from].usd;
    return inUsd / META[BASE_CURRENCY].usd;
  }

  function format(amount: number, from: CurrencyCode = BASE_CURRENCY) {
    const meta = META[currency];
    const value = convert(amount, from);
    const formatted = value.toLocaleString(undefined, {
      minimumFractionDigits: meta.decimals,
      maximumFractionDigits: meta.decimals,
    });
    return `${meta.symbol} ${formatted}`;
  }

  return (
    <CurrencyContext.Provider value={{ currency, setCurrency, convert, toBase, format }}>
      {children}
    </CurrencyContext.Provider>
  );
}

export function useCurrency() {
  const ctx = useContext(CurrencyContext);
  if (!ctx) throw new Error("useCurrency must be used within CurrencyProvider");
  return ctx;
}
