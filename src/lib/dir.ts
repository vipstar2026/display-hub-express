/**
 * Direction helpers.
 *
 * Bengali (bn) and English (en) are LTR scripts; Arabic (ar) and Urdu (ur) are RTL.
 * The admin dashboard renders in whichever UI language is selected, but individual
 * fields hold content in a *specific* language — a Bengali name typed inside an
 * RTL page is mangled unless the input itself is forced to LTR (and vice-versa).
 */

export type LangCode = "ar" | "en" | "ur" | "bn" | string;
export type Dir = "ltr" | "rtl";

const RTL_LANGS = new Set(["ar", "ur", "fa", "he"]);

/** Direction for a UI/content language code. */
export function dirForLang(lang: LangCode): Dir {
  return RTL_LANGS.has(lang) ? "rtl" : "ltr";
}

/** Direction for a field suffix, e.g. field("name_bn") -> "ltr". */
export function dirForField(field: string): Dir {
  const suffix = field.split("_").pop() ?? "";
  return dirForLang(suffix);
}

/** Props to spread on an input/textarea bound to a language-specific column. */
export function fieldDirProps(field: string) {
  const dir = dirForField(field);
  return { dir, className: dir === "rtl" ? "text-right" : "text-left" } as const;
}

/** Charts (recharts) must always lay out LTR; numbers/axes flip otherwise. */
export const CHART_DIR = "ltr" as const;
