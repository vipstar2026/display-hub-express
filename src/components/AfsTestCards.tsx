import { useState } from "react";
import { Copy, FlaskConical, Check } from "lucide-react";
import { useI18n } from "@/lib/i18n";

type Card = { brand: string; number: string; threeds: "Y" | "N" | "C" };

const CARDS: Card[] = [
  { brand: "VISA", number: "4111111111111111", threeds: "N" },
  { brand: "VISA", number: "4200000000000000", threeds: "Y" },
  { brand: "MASTER", number: "5200000000000015", threeds: "C" },
  { brand: "MASTER", number: "5200000000000049", threeds: "C" },
  { brand: "MASTER", number: "5200000000000064", threeds: "C" },
  { brand: "MASTER", number: "5200000000000072", threeds: "C" },
];

export function AfsTestCards() {
  const { lang } = useI18n();
  const [copied, setCopied] = useState<string | null>(null);

  const t = {
    title: lang === "ar" ? "بطاقات الاختبار" : lang === "ur" ? "ٹیسٹ کارڈز" : lang === "bn" ? "টেস্ট কার্ড" : "Test cards",
    hint:
      lang === "ar"
        ? "تاريخ الانتهاء: أي تاريخ مستقبلي — CVV: أي ٣ أرقام. الوضع تجريبي، لا يتم خصم أي مبلغ."
        : lang === "ur"
          ? "میعاد: کوئی بھی مستقبل کی تاریخ — CVV: کوئی بھی 3 ہندسے۔ ٹیسٹ موڈ، رقم منہا نہیں ہوگی۔"
          : lang === "bn"
            ? "মেয়াদ: ভবিষ্যতের যেকোনো তারিখ — CVV: যেকোনো ৩ সংখ্যা। টেস্ট মোড, কোনো টাকা কাটা হবে না।"
            : "Expiry: any future date — CVV: any 3 digits. Test mode, no real charge.",
    threeds: lang === "ar" ? "تحقق 3D Secure" : lang === "bn" ? "3D Secure যাচাই" : "3D Secure",
    yes: lang === "ar" ? "نعم" : lang === "bn" ? "হ্যাঁ" : "Yes",
    no: lang === "ar" ? "لا" : lang === "bn" ? "না" : "No",
    challenge: lang === "ar" ? "تحدٍ (Challenge)" : lang === "bn" ? "চ্যালেঞ্জ" : "Challenge",
  };

  const label = (v: Card["threeds"]) => (v === "Y" ? t.yes : v === "N" ? t.no : t.challenge);

  const copy = (n: string) => {
    navigator.clipboard?.writeText(n);
    setCopied(n);
    setTimeout(() => setCopied((c) => (c === n ? null : c)), 1500);
  };

  return (
    <div className="mb-4 rounded-xl border border-amber-500/30 bg-amber-500/5 p-4">
      <div className="mb-1 flex items-center gap-2 text-sm font-semibold text-amber-500">
        <FlaskConical className="h-4 w-4" /> {t.title}
      </div>
      <p className="mb-3 text-xs text-muted-foreground">{t.hint}</p>
      <div className="grid gap-1.5">
        {CARDS.map((c) => (
          <button
            key={c.number}
            type="button"
            onClick={() => copy(c.number)}
            className="flex items-center justify-between gap-3 rounded-lg border border-border/60 bg-background/60 px-3 py-2 text-left transition-colors hover:border-amber-500/50"
          >
            <span className="flex items-center gap-3">
              <span className="w-16 shrink-0 text-[11px] font-semibold text-muted-foreground">{c.brand}</span>
              <span className="font-mono text-sm tracking-wider" dir="ltr">
                {c.number}
              </span>
            </span>
            <span className="flex items-center gap-2">
              <span className="text-[11px] text-muted-foreground">
                {t.threeds}: {label(c.threeds)}
              </span>
              {copied === c.number ? (
                <Check className="h-3.5 w-3.5 text-emerald-500" />
              ) : (
                <Copy className="h-3.5 w-3.5 text-muted-foreground" />
              )}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
