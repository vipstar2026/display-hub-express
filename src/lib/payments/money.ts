/** VIPSTAR — single source of truth for money handling.
 *
 *  Rules enforced here:
 *   - every monetary comparison happens on integer minor units (never floats)
 *   - two amounts in different currencies are NEVER added before normalisation
 *   - every formatted amount always carries its real currency code
 */

export const BASE_CURRENCY = "BHD";

const DECIMALS: Record<string, number> = {
  BHD: 3,
  KWD: 3,
  OMR: 3,
  JOD: 3,
  TND: 3,
  LYD: 3,
  IQD: 3,
  JPY: 0,
  KRW: 0,
};

/** Static reference rates: 1 unit of <currency> expressed in BASE_CURRENCY.
 *  Used only for reporting roll-ups — never for charging a customer. */
const RATES_TO_BASE: Record<string, number> = {
  BHD: 1,
  USD: 0.376,
  EUR: 0.41,
  GBP: 0.48,
  SAR: 0.1,
  AED: 0.1024,
  KWD: 1.23,
  OMR: 0.978,
  QAR: 0.1033,
};

export function currencyDecimals(currency?: string | null): number {
  const c = (currency ?? "").trim().toUpperCase();
  return DECIMALS[c] ?? 2;
}

/** Exact decimal -> minor units. Returns null when the value cannot be
 *  represented at the currency precision WITHOUT losing a non-zero remainder
 *  (so we never silently round a mismatch into a match). */
export function toMinorUnits(value: string | number | null | undefined, currency: string): bigint | null {
  if (value === null || value === undefined || value === "") return null;
  const raw = typeof value === "number" ? decimalFromNumber(value) : String(value).trim();
  if (!/^-?\d+(\.\d+)?$/.test(raw)) return null;
  const neg = raw.startsWith("-");
  const [intPart, fracPart = ""] = raw.replace("-", "").split(".");
  const d = currencyDecimals(currency);
  const kept = fracPart.slice(0, d).padEnd(d, "0");
  const dropped = fracPart.slice(d);
  if (/[1-9]/.test(dropped)) return null; // precision loss => treat as mismatch
  const units = BigInt(`${intPart}${kept}` || "0");
  return neg ? -units : units;
}

function decimalFromNumber(n: number): string {
  if (!Number.isFinite(n)) return "NaN";
  return n.toFixed(6).replace(/0+$/, "").replace(/\.$/, "");
}

/** Formats a bare amount with the exact precision the currency requires. */
export function formatAmount(value: string | number, currency: string): string {
  const d = currencyDecimals(currency);
  const units = toMinorUnits(value, currency);
  if (units === null) return Number(value).toFixed(d);
  const neg = units < 0n;
  const s = (neg ? -units : units).toString().padStart(d + 1, "0");
  const body = d === 0 ? s : `${s.slice(0, s.length - d)}.${s.slice(s.length - d)}`;
  return neg ? `-${body}` : body;
}

/** The only display helper: always renders the REAL currency code. */
export function formatMoney(value: string | number, currency: string): string {
  const code = (currency || BASE_CURRENCY).toUpperCase();
  return `${formatAmount(value, code)} ${code}`;
}

/** Throwing variant used on internal write paths. */
export function formatInternalAmount(value: number | string, currency: string): string {
  const units = toMinorUnits(value, currency);
  if (units === null) throw new Error("invalid_amount");
  return formatAmount(value, currency);
}

/** AFS (COPYandPAY) requires the wire `amount` with exactly 2 decimals for
 *  every currency. Throws instead of rounding when a non-zero sub-fils
 *  remainder exists, so we can never charge a different amount. */
export function formatGatewayAmount(value: string | number, currency: string): string {
  const units = toMinorUnits(value, currency);
  if (units === null) throw new Error("Order amount has unsupported precision");
  const d = currencyDecimals(currency);
  let units2: bigint;
  if (d > 2) {
    const scale = BigInt(10) ** BigInt(d - 2);
    if (units % scale !== 0n) throw new Error("Order amount cannot be charged at gateway precision");
    units2 = units / scale;
  } else {
    units2 = units * BigInt(10) ** BigInt(2 - d);
  }
  const neg = units2 < 0n;
  const s = (neg ? -units2 : units2).toString().padStart(3, "0");
  return `${neg ? "-" : ""}${s.slice(0, -2)}.${s.slice(-2)}`;
}

/** Exact equality in the SAME currency. */
export function amountsMatch(left: number | string | null, right: number | string | null, currency: string): boolean {
  const a = toMinorUnits(left, currency);
  const b = toMinorUnits(right, currency);
  return a !== null && b !== null && a === b;
}

export const amountsEqual = amountsMatch;

export function isConvertible(currency?: string | null): boolean {
  return RATES_TO_BASE[(currency ?? "").trim().toUpperCase()] !== undefined;
}

/** Converts an amount into BASE_CURRENCY. Returns null for unknown currencies
 *  so callers can surface the gap instead of mixing currencies silently. */
export function convertToBase(value: number | string, currency: string): number | null {
  const rate = RATES_TO_BASE[(currency || "").trim().toUpperCase()];
  if (rate === undefined) return null;
  const n = Number(value);
  if (!Number.isFinite(n)) return null;
  return n * rate;
}

export type MixedAmount = { amount: number | string; currency: string };

/** Sums a mixed-currency list after normalising to BASE_CURRENCY.
 *  `skipped` lists currencies that had no rate and were excluded. */
export function sumInBase(rows: MixedAmount[]): { total: number; currency: string; skipped: string[] } {
  const skipped = new Set<string>();
  let total = 0;
  for (const r of rows) {
    const converted = convertToBase(r.amount, r.currency);
    if (converted === null) skipped.add((r.currency || "?").toUpperCase());
    else total += converted;
  }
  return { total, currency: BASE_CURRENCY, skipped: [...skipped] };
}
