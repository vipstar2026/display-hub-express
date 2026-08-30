import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, CreditCard, ShieldCheck } from "lucide-react";
import { useI18n } from "@/lib/i18n";
import { lookupCardBin } from "@/lib/card-routing.functions";

/**
 * Asks only for the first 6-8 digits of the card so the payment can be routed
 * to the right gateway (local Bahraini cards → BENEFIT, everything else → AFS).
 * The full card number is never requested, sent or stored here.
 */
export function CardRouteGate({
  onRoute,
  showBenefitOption,
  onPickOther,
}: {
  onRoute: (route: "benefit" | "afs") => void;
  showBenefitOption?: boolean;
  onPickOther?: () => void;
}) {
  const { lang } = useI18n();
  const lookup = useServerFn(lookupCardBin);
  const [bin, setBin] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const L = (ar: string, en: string, ur: string, bn: string) => (lang === "ar" ? ar : lang === "ur" ? ur : lang === "bn" ? bn : en);

  const submit = async () => {
    const digits = bin.replace(/\D/g, "");
    if (digits.length < 6) {
      setError(L("أدخل أول 6 أرقام من البطاقة.", "Enter the first 6 digits of your card.", "کارڈ کے پہلے 6 ہندسے درج کریں۔", "কার্ডের প্রথম ৬ সংখ্যা দিন।"));
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const res = await lookup({ data: { bin: digits } });
      onRoute(res.route);
    } catch {
      onRoute("afs");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="rounded-xl border border-primary/10 bg-card p-5">
      <div className="mb-3 flex items-center gap-2 font-display text-base font-bold">
        <CreditCard className="h-4 w-4 text-primary" />
        {L("نوع البطاقة", "Your card", "آپ کا کارڈ", "আপনার কার্ড")}
      </div>
      <p className="mb-3 text-sm text-muted-foreground">
        {L(
          "أدخل أول 6 إلى 8 أرقام من بطاقتك فقط لتوجيهك إلى البوابة الصحيحة.",
          "Enter only the first 6-8 digits of your card so we can route you to the right gateway.",
          "صرف پہلے 6-8 ہندسے درج کریں۔",
          "শুধু প্রথম ৬-৮ সংখ্যা লিখুন।",
        )}
      </p>
      <div className="flex gap-2">
        <Input
          inputMode="numeric"
          maxLength={8}
          value={bin}
          onChange={(e) => setBin(e.target.value.replace(/\D/g, "").slice(0, 8))}
          placeholder="123456"
          className="font-mono"
        />
        <Button onClick={submit} disabled={busy}>
          {busy && <Loader2 className="me-2 h-4 w-4 animate-spin" />}
          {L("متابعة", "Continue", "جاری رکھیں", "চালিয়ে যান")}
        </Button>
      </div>
      {error && <p className="mt-2 text-sm text-destructive">{error}</p>}
      <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
        <span className="inline-flex items-center gap-1"><ShieldCheck className="h-3.5 w-3.5 text-primary" />
          {L("لا نحفظ رقم بطاقتك", "We never store your card number", "ہم کارڈ نمبر محفوظ نہیں کرتے", "আমরা কার্ড নম্বর সংরক্ষণ করি না")}
        </span>
        {showBenefitOption && (
          <button type="button" onClick={() => onRoute("benefit")} className="text-primary hover:underline">
            {L("الدفع عبر بنفت", "Pay with BENEFIT", "BENEFIT سے ادائیگی", "BENEFIT দিয়ে পেমেন্ট")}
          </button>
        )}
        {onPickOther && (
          <button type="button" onClick={onPickOther} className="text-primary hover:underline">
            {L("اختر طريقة دفع أخرى", "Choose another payment method", "دوسرا طریقہ منتخب کریں", "অন্য পেমেন্ট পদ্ধতি")}
          </button>
        )}
      </div>
    </div>
  );
}
