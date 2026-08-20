import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { useI18n } from "@/lib/i18n";
import { payResultMessage } from "@/lib/pay-messages";
import { confirmGuestAfsPayment } from "@/lib/guest-checkout.functions";
import { Button } from "@/components/ui/button";
import { CheckCircle2, XCircle, Loader2 } from "lucide-react";

const searchSchema = z.object({
  order: z.string().optional(),
  t: z.string().optional(),
  id: z.string().optional(),
  resourcePath: z.string().optional(),
});

export const Route = createFileRoute("/guest-pay/result")({
  ssr: false,
  validateSearch: searchSchema,
  component: GuestPayResult,
  head: () => ({
    meta: [
      { title: "Payment result — VIPSTAR" },
      { name: "description", content: "Result of your VIPSTAR order payment." },
      { name: "robots", content: "noindex" },
    ],
  }),
});

function GuestPayResult() {
  const search = Route.useSearch();
  const { lang } = useI18n();
  const nav = useNavigate();
  const confirm = useServerFn(confirmGuestAfsPayment);

  const checkoutId = (search.resourcePath ? search.resourcePath.split("/")[3] : undefined) ?? search.id;
  const txt = (ar: string, en: string, ur: string, bn: string) => (lang === "ar" ? ar : lang === "ur" ? ur : lang === "bn" ? bn : en);

  const { data, isLoading } = useQuery({
    queryKey: ["guest-afs-result", search.order, checkoutId],
    enabled: !!search.order && !!search.t && !!checkoutId,
    retry: false,
    queryFn: () => confirm({ data: { order_id: search.order!, token: search.t!, checkout_id: checkoutId! } }),
  });

  useEffect(() => {
    if (data?.success && search.order && search.t) {
      const timer = setTimeout(() => nav({ to: "/guest-order/$id", params: { id: search.order! }, search: { t: search.t! } }), 1200);
      return () => clearTimeout(timer);
    }
  }, [data?.success, search.order, search.t, nav]);

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
        ) : (
          <>
            <XCircle className="mx-auto mb-4 h-14 w-14 text-destructive" />
            <h1 className="font-display text-2xl font-bold">
              {data.pending ? txt("الدفع قيد المعالجة", "Payment pending", "ادائیگی زیر عمل", "পেমেন্ট প্রক্রিয়াধীন") : txt("فشل الدفع", "Payment failed", "ادائیگی ناکام", "পেমেন্ট ব্যর্থ")}
            </h1>
            <p className="mt-2 text-sm text-muted-foreground">{payResultMessage(lang, !!data.pending)}</p>
            <div className="mt-6 flex justify-center gap-2">
              {search.order && search.t && (
                <Button onClick={() => nav({ to: "/guest-pay/$id", params: { id: search.order! }, search: { t: search.t! } })}>
                  {txt("إعادة المحاولة", "Try again", "دوبارہ کوشش", "আবার চেষ্টা")}
                </Button>
              )}
              <Button variant="outline" onClick={() => nav({ to: "/cart" })}>{txt("السلة", "Cart", "کارٹ", "কার্ট")}</Button>
            </div>
          </>
        )}
      </div>
      <Footer />
    </div>
  );
}
