import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { useI18n } from "@/lib/i18n";
import { payResultMessage, payFailureReason } from "@/lib/pay-messages";
import { confirmUserAfsPayment } from "@/lib/payment-core.functions";
import { Button } from "@/components/ui/button";
import { CheckCircle2, XCircle, Clock, Loader2 } from "lucide-react";

const searchSchema = z.object({
  order: z.string().optional(),
  id: z.string().optional(),
  resourcePath: z.string().optional(),
});

export const Route = createFileRoute("/pay/result")({
  ssr: false,
  validateSearch: searchSchema,
  component: PayResult,
  errorComponent: () => null,
  notFoundComponent: () => null,
});

function PayResult() {
  const search = Route.useSearch();
  const { lang } = useI18n();
  const nav = useNavigate();
  const confirm = useServerFn(confirmUserAfsPayment);

  const checkoutId =
    (search.resourcePath ? search.resourcePath.split("/")[3] : undefined) ?? search.id;

  const attemptsKey = `afs-recheck:${search.order ?? ""}:${checkoutId ?? ""}`;
  const triesRef = useRef(typeof window === "undefined" ? 0 : Number(window.sessionStorage.getItem(attemptsKey) ?? "0"));
  const MAX_AUTO_TRIES = 5;

  const { data, isLoading, isFetching, refetch } = useQuery({
    queryKey: ["afs-result", search.order, checkoutId],
    enabled: !!search.order && !!checkoutId,
    retry: false,
    refetchInterval: (query) => {
      const result = query.state.data;
      if (!result?.pending || triesRef.current >= MAX_AUTO_TRIES) return false;
      // Back off hard while the gateway is rate limiting us.
      return result.rateLimited ? Math.min(30 + triesRef.current * 20, 90) * 1_000 : 8_000;
    },
    refetchIntervalInBackground: true,
    queryFn: () => confirm({ data: { order_id: search.order!, checkout_id: checkoutId!, resource_path: search.resourcePath } }),
  });

  useEffect(() => {
    if (!data?.pending) return;
    const next = triesRef.current + 1;
    triesRef.current = next;
    if (typeof window !== "undefined") window.sessionStorage.setItem(attemptsKey, String(next));
  }, [data, attemptsKey]);

  useEffect(() => {
    if (data?.success && search.order) {
      const timer = setTimeout(() => nav({ to: "/order/success/$id", params: { id: search.order! } }), 1200);
      return () => clearTimeout(timer);
    }
  }, [data?.success, search.order, nav]);

  const txt = (ar: string, en: string, ur: string, bn?: string) => (lang === "ar" ? ar : lang === "ur" ? ur : lang === "bn" ? (bn ?? en) : en);

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="container mx-auto max-w-xl px-4 py-20 text-center">
        {isLoading || !data ? (
          <div className="flex items-center justify-center gap-2 text-muted-foreground">
            <Loader2 className="h-5 w-5 animate-spin" /> {txt("جارٍ التحقق من الدفع…", "Verifying payment…", "ادائیگی کی تصدیق…")}
          </div>
        ) : data.success ? (
          <>
            <CheckCircle2 className="mx-auto mb-4 h-14 w-14 text-primary" />
            <h1 className="font-display text-2xl font-bold">{txt("تم الدفع بنجاح", "Payment successful", "ادائیگی کامیاب")}</h1>
            <p className="mt-2 text-sm text-muted-foreground">{txt("يتم تحويلك إلى تفاصيل الطلب…", "Redirecting to your order…", "آرڈر کی تفصیل…")}</p>
          </>
        ) : (
          <>
            {data.pending ? (
              <Clock className="mx-auto mb-4 h-14 w-14 text-orange-500" />
            ) : (
              <XCircle className="mx-auto mb-4 h-14 w-14 text-destructive" />
            )}
            <h1 className="font-display text-2xl font-bold">
              {data.pending ? txt("الدفع قيد المعالجة", "Payment pending", "ادائیگی زیر عمل") : txt("فشل الدفع", "Payment failed", "ادائیگی ناکام")}
            </h1>
            <p className="mt-2 text-sm text-muted-foreground">{payResultMessage(lang, !!data.pending)}</p>
            {!data.pending && payFailureReason(lang, data.code) && (
              <p className="mx-auto mt-3 max-w-md rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm font-medium text-destructive">
                {payFailureReason(lang, data.code)}
              </p>
            )}
            {data.pending && (
              <p className="mx-auto mt-3 max-w-md rounded-lg border border-orange-500/30 bg-orange-500/10 px-4 py-3 text-sm font-medium text-orange-600 dark:text-orange-400">
                {txt(
                  "لم يُرفض طلبك — لا تُعد عملية الدفع ولا تدفع مرة أخرى.",
                  "Your order was not declined — do not pay again.",
                  "آپ کا آرڈر مسترد نہیں ہوا — دوبارہ ادائیگی نہ کریں۔",
                  "আপনার অর্ডার বাতিল হয়নি — আবার পেমেন্ট করবেন না।",
                )}
              </p>
            )}
            <div className="mt-6 flex flex-wrap justify-center gap-2">
              {data.pending && (
                <Button onClick={() => refetch()} disabled={isFetching}>
                  {isFetching && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {txt("التحقق الآن", "Check now", "ابھی چیک کریں", "এখনই যাচাই করুন")}
                </Button>
              )}
              {!data.pending && search.order && (
                <Button onClick={() => window.location.assign(`/pay/${encodeURIComponent(search.order!)}`)}>
                  {txt("إعادة المحاولة", "Try again", "دوبارہ کوشش")}
                </Button>
              )}
              <Button
                variant="outline"
                onClick={() => {
                  // Send the shopper back to the payment-method step, not a new order.
                  window.sessionStorage.setItem("checkout:step", "payment");
                  window.sessionStorage.removeItem(attemptsKey);
                  nav({ to: "/cart" });
                }}
              >{txt("السلة", "Cart", "کارٹ")}</Button>
            </div>
          </>
        )}
      </div>
      <Footer />
    </div>
  );
}
