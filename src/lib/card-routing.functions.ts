import { createServerFn } from "@tanstack/react-start";

export type CardRoute = {
  route: "benefit" | "afs";
  country: string | null;
  scheme: string | null;
  type: string | null;
  known: boolean;
};

/**
 * Routes a card by its first 6-8 digits (BIN) only.
 * Bahraini locally-issued debit cards must be processed by the BENEFIT
 * Payment Gateway; everything else goes to AFS.
 *
 * Only the BIN is ever sent, never the full card number, and nothing about
 * the card is stored.
 */
/**
 * Locally-issued BENEFIT (Bahrain domestic debit) BIN prefixes.
 * Source: the BENEFIT domestic scheme range 5888 45-49 (ISO issuer range
 * assigned to BENEFIT, Bahrain). Only prefixes we can attribute to the
 * domestic scheme are listed — no Visa/Mastercard co-badged guesses, so an
 * international Visa/Mastercard can never match this list.
 */
const BH_LOCAL_BIN_PREFIXES = [
  "588845", "588846", "588847", "588848", "588849",
];


export const lookupCardBin = createServerFn({ method: "POST" })
  .inputValidator((input: { bin: string }) => {
    const bin = String(input.bin ?? "").replace(/\D/g, "").slice(0, 8);
    if (bin.length < 6) throw new Error("bin_too_short");
    return { bin };
  })
  .handler(async ({ data }): Promise<CardRoute> => {
    if (BH_LOCAL_BIN_PREFIXES.some((p) => data.bin.startsWith(p))) {
      return { route: "benefit", country: "BH", scheme: "benefit", type: "debit", known: true };
    }
    try {
      const res = await fetch(`https://lookup.binlist.net/${data.bin}`, {
        headers: { "Accept-Version": "3" },
      });
      if (!res.ok) throw new Error(`bin_lookup_${res.status}`);
      const body = (await res.json()) as {
        scheme?: string;
        type?: string;
        country?: { alpha2?: string };
      };
      const country = body.country?.alpha2?.toUpperCase() ?? null;
      const scheme = body.scheme?.toLowerCase() ?? null;
      const type = body.type?.toLowerCase() ?? null;
      // Any card issued in Bahrain is treated as local (BENEFIT) unless it is
      // an international-only scheme that BENEFIT cannot process.
      const isLocalBahraini = country === "BH" && scheme !== "amex" && scheme !== "american express";
      return { route: isLocalBahraini ? "benefit" : "afs", country, scheme, type, known: true };
    } catch {
      // Unknown BIN: fall back to the international gateway; the shopper can
      // still pick another payment method manually.
      return { route: "afs", country: null, scheme: null, type: null, known: false };
    }
  });

