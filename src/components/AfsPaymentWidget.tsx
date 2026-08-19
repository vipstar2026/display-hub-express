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

export function AfsPaymentWidget({ scriptUrl, action, brands, widgetLang, amount, currency, onCancel }: Props) {
  const { lang } = useI18n();
  const mounted = useRef(false);
  const [ready, setReady] = useState(false);
  const [failed, setFailed] = useState(false);

  const t = (ar: string, en: string, ur?: string, bn?: string) =>
    lang === "ar" ? ar : lang === "ur" ? (ur ?? en) : lang === "bn" ? (bn ?? en) : en;

  const locale = widgetLang || (lang === "ar" ? "ar" : "en");

  useEffect(() => {
    if (!scriptUrl || mounted.current) return;
    mounted.current = true;

    window.wpwlOptions = {
      style: "plain",
      locale,
      brandDetection: true,
      showCVVHint: true,
      showLabels: true,
      showPlaceholders: true,
      maskCvv: true,
      onReady: () => setReady(true),
      onError: () => setFailed(true),
    };

    const s = document.createElement("script");
    s.src = scriptUrl;
    s.async = true;
    s.onerror = () => setFailed(true);
    document.body.appendChild(s);

    const timer = setTimeout(() => setReady((r) => r || document.querySelector(".wpwl-form") !== null), 6000);
    return () => clearTimeout(timer);
  }, [scriptUrl, locale]);

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
          {brandList.map((b) => (
            <span
              key={b}
              className="rounded-md border border-border/70 bg-background/70 px-2 py-1 text-[10px] font-bold tracking-wider text-muted-foreground"
            >
              {b === "MASTER" ? "MASTERCARD" : b}
            </span>
          ))}
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
      <div className="afs-widget px-5 py-5">
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
        <form action={action} className="paymentWidgets" data-brands={brands || "VISA MASTER"} data-lang={locale} />
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
