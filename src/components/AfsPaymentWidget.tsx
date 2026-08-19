import { useEffect, useRef, useState } from "react";
import { Lock, ShieldCheck, CreditCard, Loader2, RefreshCw } from "lucide-react";
import { useI18n } from "@/lib/i18n";
import { Button } from "@/components/ui/button";

declare global {
  interface Window {
    wpwlOptions?: Record<string, unknown>;
  }
}

type Props = {
  /** Payon widget script URL (includes checkoutId) */
  scriptUrl: string;
  /** Where the gateway posts the result */
  action: string;
  brands?: string | null;
  widgetLang?: string | null;
  amount?: string | number;
  currency?: string;
  onCancel?: () => void;
};

type Lang = "ar" | "en" | "ur" | "bn";

const STRINGS: Record<Lang, Record<string, string>> = {
  ar: {
    cardNumber: "رقم البطاقة",
    cardHolder: "اسم حامل البطاقة",
    expiry: "تاريخ الانتهاء",
    cvv: "رمز التحقق (CVV)",
    month: "الشهر",
    year: "السنة",
    pay: "ادفع الآن",
    detected: "تم التعرف على البطاقة",
  },
  en: {
    cardNumber: "Card number",
    cardHolder: "Cardholder name",
    expiry: "Expiry date",
    cvv: "Security code (CVV)",
    month: "Month",
    year: "Year",
    pay: "Pay now",
    detected: "Card detected",
  },
  ur: {
    cardNumber: "کارڈ نمبر",
    cardHolder: "کارڈ ہولڈر کا نام",
    expiry: "میعاد ختم",
    cvv: "سیکیورٹی کوڈ (CVV)",
    month: "مہینہ",
    year: "سال",
    pay: "ابھی ادائیگی کریں",
    detected: "کارڈ پہچان لیا گیا",
  },
  bn: {
    cardNumber: "কার্ড নম্বর",
    cardHolder: "কার্ডধারীর নাম",
    expiry: "মেয়াদ শেষ",
    cvv: "নিরাপত্তা কোড (CVV)",
    month: "মাস",
    year: "বছর",
    pay: "এখনই পরিশোধ করুন",
    detected: "কার্ড শনাক্ত হয়েছে",
  },
};

const BRAND_LABEL: Record<string, string> = { VISA: "Visa", MASTER: "Mastercard", AMEX: "Amex", MADA: "mada" };

export function AfsPaymentWidget({ scriptUrl, action, brands, widgetLang, amount, currency, onCancel }: Props) {
  const { lang } = useI18n();
  const uiLang: Lang = (["ar", "en", "ur", "bn"].includes(lang) ? lang : "en") as Lang;
  const s = STRINGS[uiLang];
  const mounted = useRef(false);
  const [ready, setReady] = useState(false);
  const [failed, setFailed] = useState(false);
  const [brand, setBrand] = useState<string | null>(null);

  const t = (ar: string, en: string, ur?: string, bn?: string) =>
    uiLang === "ar" ? ar : uiLang === "ur" ? (ur ?? en) : uiLang === "bn" ? (bn ?? en) : en;

  // The hosted widget only ships ar/en resources — everything else falls back to
  // English inside the iframe, while our own labels stay in the chosen language.
  const locale = widgetLang || (uiLang === "ar" ? "ar" : "en");

  useEffect(() => {
    if (!scriptUrl || mounted.current) return;
    mounted.current = true;

    /** Swap the free-text expiry field for month/year dropdowns. */
    const buildExpirySelects = () => {
      const input = document.querySelector<HTMLInputElement>(".afs-widget .wpwl-control-expiry");
      if (!input || input.dataset.afsEnhanced === "1") return;
      input.dataset.afsEnhanced = "1";
      input.classList.add("afs-expiry-hidden");

      const wrap = document.createElement("div");
      wrap.className = "afs-expiry-grid";

      const mm = document.createElement("select");
      mm.className = "afs-expiry-select";
      mm.setAttribute("aria-label", s.month);
      mm.innerHTML =
        `<option value="">${s.month}</option>` +
        Array.from({ length: 12 }, (_, i) => String(i + 1).padStart(2, "0"))
          .map((m) => `<option value="${m}">${m}</option>`)
          .join("");

      const yy = document.createElement("select");
      yy.className = "afs-expiry-select";
      yy.setAttribute("aria-label", s.year);
      const start = new Date().getFullYear();
      yy.innerHTML =
        `<option value="">${s.year}</option>` +
        Array.from({ length: 15 }, (_, i) => start + i)
          .map((y) => `<option value="${String(y).slice(2)}">${y}</option>`)
          .join("");

      const sync = () => {
        input.value = mm.value && yy.value ? `${mm.value} / ${yy.value}` : "";
        input.dispatchEvent(new Event("input", { bubbles: true }));
        input.dispatchEvent(new Event("change", { bubbles: true }));
        input.dispatchEvent(new Event("blur", { bubbles: true }));
      };
      mm.addEventListener("change", sync);
      yy.addEventListener("change", sync);

      wrap.appendChild(mm);
      wrap.appendChild(yy);
      input.parentNode?.insertBefore(wrap, input.nextSibling);
    };

    const applyLabels = () => {
      const map: Record<string, string> = {
        ".wpwl-label-cardNumber": s.cardNumber,
        ".wpwl-label-cardHolder": s.cardHolder,
        ".wpwl-label-expiry": s.expiry,
        ".wpwl-label-cvv": s.cvv,
      };
      Object.entries(map).forEach(([sel, text]) => {
        const el = document.querySelector<HTMLElement>(`.afs-widget ${sel}`);
        if (el) el.textContent = text;
      });
      const btn = document.querySelector<HTMLButtonElement>(".afs-widget .wpwl-button-pay");
      if (btn) btn.textContent = s.pay;
    };

    window.wpwlOptions = {
      style: "plain",
      locale,
      // Detect the card scheme from the entered number instead of asking the user.
      brandDetection: true,
      brandDetectionType: "binlist",
      brandDetectionPriority: (brands || "VISA MASTER").split(/\s+/).filter(Boolean),
      showCVVHint: true,
      showLabels: true,
      showPlaceholders: true,
      maskCvv: true,
      onReady: () => {
        setReady(true);
        buildExpirySelects();
        applyLabels();
      },
      onChangeBrand: (b: string) => setBrand(b || null),
      onDetectBrand: (b: string) => setBrand(b || null),
      onError: () => setFailed(true),
    };

    const script = document.createElement("script");
    script.src = scriptUrl;
    script.async = true;
    script.onerror = () => setFailed(true);
    document.body.appendChild(script);

    const timer = setTimeout(() => {
      if (document.querySelector(".wpwl-form")) {
        setReady(true);
        buildExpirySelects();
        applyLabels();
      }
    }, 6000);
    return () => clearTimeout(timer);
  }, [scriptUrl, locale, brands, s]);

  const brandList = (brands || "VISA MASTER").split(/\s+/).filter(Boolean);

  return (
    <div className="overflow-hidden rounded-2xl border border-primary/15 bg-card shadow-lg">
      {/* header */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border/60 bg-secondary/40 px-5 py-3">
        <div className="flex items-center gap-2 text-sm font-semibold">
          <CreditCard className="h-4 w-4 text-primary" />
          {t("الدفع بالبطاقة", "Card payment", "کارڈ سے ادائیگی", "কার্ড পেমেন্ট")}
        </div>
        <div className="flex items-center gap-1.5">
          {brandList.map((b) => {
            const active = brand?.toUpperCase() === b;
            return (
              <span
                key={b}
                className={`rounded-md border px-2 py-1 text-[10px] font-bold tracking-wider transition-colors ${
                  active
                    ? "border-primary/60 bg-primary/15 text-primary"
                    : "border-border/70 bg-background/70 text-muted-foreground"
                }`}
              >
                {BRAND_LABEL[b] ?? b}
              </span>
            );
          })}
        </div>
      </div>

      {/* amount strip */}
      {amount !== undefined && (
        <div className="flex items-center justify-between border-b border-border/60 px-5 py-3 text-sm">
          <span className="text-muted-foreground">{t("الإجمالي المستحق", "Total due", "کل رقم", "মোট")}</span>
          <span className="font-display text-lg font-bold text-primary" dir="ltr">
            {amount} {currency}
          </span>
        </div>
      )}

      {/* widget */}
      <div className="afs-widget px-5 py-5" dir="ltr">
        <div>
          {!ready && !failed && (
            <div className="flex items-center justify-center gap-2 py-10 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              {t("جارٍ تحميل نموذج الدفع الآمن…", "Loading the secure payment form…", "محفوظ فارم لوڈ ہو رہا ہے…", "সুরক্ষিত ফর্ম লোড হচ্ছে…")}
            </div>
          )}
          {failed && (
            <div className="py-8 text-center">
              <p className="mb-3 text-sm text-destructive">
                {t("تعذر تحميل نموذج الدفع.", "The payment form could not be loaded.", "فارم لوڈ نہیں ہو سکا۔", "ফর্ম লোড করা যায়নি।")}
              </p>
              <Button variant="outline" size="sm" onClick={() => window.location.reload()}>
                <RefreshCw className="me-2 h-4 w-4" />
                {t("إعادة المحاولة", "Try again", "دوبارہ کوشش", "আবার চেষ্টা")}
              </Button>
            </div>
          )}
          {ready && brand && (
            <div className="mb-3 inline-flex items-center gap-2 rounded-md bg-primary/10 px-2.5 py-1 text-[11px] font-semibold text-primary">
              <CreditCard className="h-3.5 w-3.5" />
              {s.detected}: {BRAND_LABEL[brand.toUpperCase()] ?? brand}
            </div>
          )}
        </div>
        {/* Host node owned by the gateway script — React must never render children here. */}
        <div ref={hostRef} suppressHydrationWarning />
      </div>


      {/* trust footer */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border/60 bg-secondary/30 px-5 py-3 text-[11px] text-muted-foreground">
        <span className="flex items-center gap-1.5">
          <Lock className="h-3.5 w-3.5 text-primary" />
          {t("اتصال مشفّر SSL 256-bit", "256-bit SSL encrypted", "256-bit SSL خفیہ کاری", "256-bit SSL এনক্রিপ্টেড")}
        </span>
        <span className="flex items-center gap-1.5">
          <ShieldCheck className="h-3.5 w-3.5 text-primary" />
          {t("متوافق مع PCI DSS و 3D Secure", "PCI DSS & 3D Secure compliant", "PCI DSS اور 3D Secure", "PCI DSS ও 3D Secure")}
        </span>
        <span>{t("لا نقوم بتخزين بيانات بطاقتك", "We never store your card details", "کارڈ کی تفصیلات محفوظ نہیں ہوتیں", "আমরা কার্ডের তথ্য সংরক্ষণ করি না")}</span>
      </div>

      {onCancel && (
        <div className="border-t border-border/60 px-5 py-3 text-center">
          <button type="button" onClick={onCancel} className="text-xs text-muted-foreground underline-offset-4 hover:text-foreground hover:underline">
            {t("إلغاء والعودة", "Cancel and go back", "منسوخ کریں", "বাতিল করুন")}
          </button>
        </div>
      )}
    </div>
  );
}
