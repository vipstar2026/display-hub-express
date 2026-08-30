import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { useI18n } from "@/lib/i18n";
import { payResultMessage, payFailureReason } from "@/lib/pay-messages";
import { confirmUserAfsPayment, getOrderPaymentState } from "@/lib/payment-core.functions";
import { Button } from "@/components/ui/button";
import { CheckCircle2, XCircle, Clock, Loader2, Ban } from "lucide-react";

const searchSchema = z.object({
  order: z.string().optional(),
  id: z.string().optional(),
  resourcePath: z.string().optional(),
  provider: z.string().optional(),
  cancel: z.string().optional(),
});

export const Route = createFileRoute("/pay/result")({
  ssr: false,
  validateSearch: searchSchema,
  component: PayResult,
  errorComponent: () => null,
  notFoundComponent: () => null,
});

/** Confirmation window: poll every 6s, give up after 15 minutes. */
const POLL_MS = 6_000;
const MAX_WAIT_MS = 15 * 60 * 1000;

function PayResult() {
  const search = Route.useSearch();
  const { lang } = useI18n();
  const nav = useNavigate();
  const confirm = useServerFn(confirmUserAfsPayment);
  const readState = useServerFn(getOrderPaymentState);

  const checkoutId =
    (search.resourcePath ? search.resourcePath.split("/")[3] : undefined) ?? search.id;

  const startedAt = useRef(Date.now());
  const [expired, setExpired] = useState(false);

  const { data, isLoading, isFetching, refetch } = useQuery({
    queryKey: ["pay-result", search.order, checkoutId],
    enabled: !!search.order,
    retry: false,
    refetchOnWindowFocus: true,
    refetchInterval: (query) => {
      const result = query.state.data;
      if (!result?.pending) return false;
      if (Date.now() - startedAt.current > MAX_WAIT_MS) return false;
      return result.rateLimited ? 15_000 : POLL_MS;
    },
    refetchIntervalInBackground: true,
    queryFn: async () => {
      // Database first — a webhook may already have settled this order.
      const dbState = await readState({ data: { order_id: search.order! } });
      if (dbState.success || dbState.cancelled || !checkoutId) return dbState;
      return confirm({ data: { order_id: search.order!, checkout_id: checkoutId, resource_path: search.resourcePath } });
    },
  });

  useEffect(() => {
    if (!data?.pending) return;
    const timer = setInterval(() => {
      if (Date.now() - startedAt.current > MAX_WAIT_MS) setExpired(true);
    }, 5_000);
    return () => clearInterval(timer);
  }, [data?.pending]);

  useEffect(() => {
    if (data?.success && search.order) {
      const timer = setTimeout(() => nav({ to: "/order/success/$id", params: { id: search.order! } }), 1200);
      return () => clearTimeout(timer);
    }
  }, [data?.success, search.order, nav]);

  const txt = (ar: string, en: string, ur: string, bn?: string) => (lang === "ar" ? ar : lang === "ur" ? ur : lang === "bn" ? (bn ?? en) : en);

  const cancelled = !!data?.cancelled || search.cancel === "1";
  const pending = !!data?.pending && !cancelled;

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="container mx-auto max-w-xl px-4 py-20 text-center">
        {isLoading || !data ? (
          <div className="flex items-center justify-center gap-2 text-muted-foreground">
            <Loader2 className="h-5 w-5 animate-spin" /> {txt("جارٍ التحقق من الدفع…", "Verifying payment…", "ادائیگی کی تصدیق…", "পেমেন্ট যাচাই হচ্ছে…")}
          </div>
        ) : data.success ? (
          <>
            <CheckCircle2 className="mx-auto mb-4 h-14 w-14 text-primary" />
            <h1 className="font-display text-2xl font-bold">{txt("تم الدفع بنجاح", "Payment successful", "ادائیگی کامیاب", "পেমেন্ট সফল")}</h1>
            <p className="mt-2 text-sm text-muted-foreground">{txt("يتم تحويلك إلى تفاصيل الطلب…", "Redirecting to your order…", "آرڈر کی تفصیل…", "অর্ডারে নিয়ে যাওয়া হচ্ছে…")}</p>
          </>
        ) : cancelled ? (
          <>
            <Ban className="mx-auto mb-4 h-14 w-14 text-muted-foreground" />
            <h1 className="font-display text-2xl font-bold">{txt("تم إلغاء الدفع", "Payment cancelled", "ادائیگی منسوخ", "পেমেন্ট বাতিল")}</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              {txt(
                "لم يتم خصم أي مبلغ. يمكنك إكمال الدفع لنفس الطلب في أي وقت.",
                "You were not charged. You can complete payment for the same order at any time.",
                "کوئی رقم منہا نہیں ہوئی۔",
                "কোনো টাকা কাটা হয়নি।",
              )}
            </p>
          </>
        ) : pending ? (
          <>
            <Clock className="mx-auto mb-4 h-14 w-14 text-orange-500" />
            <h1 className="font-display text-2xl font-bold">{txt("قيد التأكيد", "Awaiting confirmation", "تصدیق زیر التوا", "নিশ্চিতকরণের অপেক্ষায়")}</h1>
            <p className="mt-2 text-sm text-muted-foreground">{payResultMessage(lang, true)}</p>
            <p className="mx-auto mt-3 max-w-md rounded-lg border border-orange-500/30 bg-orange-500/10 px-4 py-3 text-sm font-medium text-orange-600 dark:text-orange-400">
              {txt(
                "لم يُرفض طلبك — لا تدفع مرة أخرى. نتحقق تلقائياً كل بضع ثوانٍ.",
                "Your order was not declined — do not pay again. We re-check automatically every few seconds.",
                "آپ کا آرڈر مسترد نہیں ہوا — دوبارہ ادائیگی نہ کریں۔",
                "আপনার অর্ডার বাতিল হয়নি — আবার পেমেন্ট করবেন না।",
              )}
            </p>
            {expired && (
              <p className="mt-3 text-xs text-muted-foreground">
                {txt("انتهت مهلة الانتظار التلقائي — استخدم زر التحقق الآن.", "Automatic checking stopped — use “Check now”.", "خودکار جانچ رک گئی۔", "স্বয়ংক্রিয় যাচাই বন্ধ হয়েছে।")}
              </p>
            )}
          </>
        ) : (
          <>
            <XCircle className="mx-auto mb-4 h-14 w-14 text-destructive" />
            <h1 className="font-display text-2xl font-bold">{txt("فشل الدفع", "Payment failed", "ادائیگی ناکام", "পেমেন্ট ব্যর্থ")}</h1>
            <p className="mt-2 text-sm text-muted-foreground">{payResultMessage(lang, false)}</p>
            {payFailureReason(lang, data.code) && (
              <p className="mx-auto mt-3 max-w-md rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm font-medium text-destructive">
                {payFailureReason(lang, data.code)}
              </p>
            )}
          </>
        )}

        {data && !data.success && (
          <div className="mt-6 flex flex-wrap justify-center gap-2">
            {pending && (
              <Button onClick={() => refetch()} disabled={isFetching}>
                {isFetching && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {txt("تحقق الآن", "Check now", "ابھی چیک کریں", "এখনই যাচাই করুন")}
              </Button>
            )}
            {!pending && search.order && (
              <Button onClick={() => window.location.assign(`/pay/${encodeURIComponent(search.order!)}`)}>
                {txt("إكمال الدفع الآن", "Complete payment now", "ابھی ادائیگی مکمل کریں", "এখনই পেমেন্ট সম্পন্ন করুন")}
              </Button>
            )}
            <Button variant="outline" onClick={() => nav({ to: "/account" })}>
              {txt("العودة إلى طلباتي", "Back to my orders", "میرے آرڈرز", "আমার অর্ডারে ফিরুন")}
            </Button>
          </div>
        )}
      </div>
      <Footer />
    </div>
  );
}
