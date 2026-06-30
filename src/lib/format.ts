export function formatPrice(amount: number, currency = "BHD"): string {
  const digits = currency === "BHD" ? 3 : 2;
  try {
    return new Intl.NumberFormat("en-BH", { style: "currency", currency, minimumFractionDigits: digits, maximumFractionDigits: digits }).format(amount);
  } catch {
    return `${amount.toFixed(digits)} ${currency}`;
  }
}
