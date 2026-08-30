const DECIMALS: Record<string, number> = { BHD: 3, KWD: 3, JOD: 3, OMR: 3 };

export function currencyDecimals(currency: string) {
  return DECIMALS[currency.toUpperCase()] ?? 2;
}

export function toMinorUnits(value: number | string | null | undefined, currency: string) {
  if (value === null || value === undefined || value === "") return null;
  const raw = String(value).trim();
  if (!/^\d+(\.\d+)?$/.test(raw)) return null;
  const decimals = currencyDecimals(currency);
  const [whole, fraction = ""] = raw.split(".");
  if (fraction.length > decimals) return null;
  return BigInt(whole) * 10n ** BigInt(decimals) + BigInt((fraction + "0".repeat(decimals)).slice(0, decimals));
}

export function formatInternalAmount(value: number | string, currency: string) {
  const units = toMinorUnits(value, currency);
  if (units === null) throw new Error("invalid_amount");
  const decimals = currencyDecimals(currency);
  const padded = units.toString().padStart(decimals + 1, "0");
  return decimals === 0 ? padded : `${padded.slice(0, -decimals)}.${padded.slice(-decimals)}`;
}

export function amountsMatch(left: number | string | null, right: number | string | null, currency: string) {
  const a = toMinorUnits(left, currency);
  const b = toMinorUnits(right, currency);
  return a !== null && b !== null && a === b;
}
