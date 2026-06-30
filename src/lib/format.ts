export function formatPrice(amount: number, currency = "USD"): string {
  try {
    return new Intl.NumberFormat("en-US", { style: "currency", currency, maximumFractionDigits: 2 }).format(amount);
  } catch {
    return `${amount.toFixed(2)} ${currency}`;
  }
}

export function firstImage(images: unknown): string | null {
  if (Array.isArray(images) && images.length > 0 && typeof images[0] === "string") return images[0];
  return null;
}
