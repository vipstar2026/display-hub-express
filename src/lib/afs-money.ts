/** Currency-precision helpers for AFS money comparisons.
 *  All monetary comparisons are done on integer minor units — never on
 *  JavaScript floating point values. BHD uses 3 decimals. */

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

export function currencyDecimals(currency?: string | null): number {
  const c = (currency ?? "").trim().toUpperCase();
  return DECIMALS[c] ?? 2;
}

/** Exact decimal -> minor units. Returns null when the value cannot be
 *  represented at the currency precision WITHOUT losing a non-zero remainder
 *  (i.e. we never silently round a mismatch into a match). */
export function toMinorUnits(value: string | number | null | undefined, currency: string): bigint | null {
  if (value === null || value === undefined) return null;
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

/** Numbers coming out of numeric(12,3) columns are safe up to 15 digits;
 *  fix at 6 decimals then trim so 110.0000009 style float noise is removed. */
function decimalFromNumber(n: number): string {
  if (!Number.isFinite(n)) return "NaN";
  return n.toFixed(6).replace(/0+$/, "").replace(/\.$/, "");
}

/** Formats an amount with the exact precision the currency requires. */
export function formatAmount(value: string | number, currency: string): string {
  const d = currencyDecimals(currency);
  const units = toMinorUnits(value, currency);
  if (units === null) return Number(value).toFixed(d);
  const neg = units < 0n;
  const s = (neg ? -units : units).toString().padStart(d + 1, "0");
  const body = d === 0 ? s : `${s.slice(0, s.length - d)}.${s.slice(s.length - d)}`;
  return neg ? `-${body}` : body;
}

export function amountsEqual(a: string | number, b: string | number, currency: string): boolean {
  const x = toMinorUnits(a, currency);
  const y = toMinorUnits(b, currency);
  return x !== null && y !== null && x === y;
}
