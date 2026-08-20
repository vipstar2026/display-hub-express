import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { useI18n } from "@/lib/i18n";
import { payResultMessage } from "@/lib/pay-messages";
import { confirmPaymentLinkPayment } from "@/lib/payment-links.functions";
import { Button } from "@/components/ui/button";
import { CheckCircle2, XCircle, Loader2 } from "lucide-react";

export const Route = createFileRoute("/pay-link/result")({
  ssr: false,
  validateSearch: z.object({
    token: z.string().optional(),
    id: z.string().optional(),
    resourcePath: z.string().optional(),
  }),
  head: () => ({
    meta: [
      { title: "Payment Result | VIPSTAR" },
      { name: "description", content: "Result of your VIPSTAR card payment processed through the AFS gateway." },
      { property: "og:title", content: "Payment Result | VIPSTAR" },
      { property: "og:description", content: "Result of your VIPSTAR card payment processed through the AFS gateway." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: PayLinkResult,
  errorComponent: () => null,
  notFoundComponent: () => null,
});

function PayLinkResult() {
  const search = Route.useSearch();
  const { lang } = useI18n();
  const nav = useNavigate();
  const confirm = useServerFn(confirmPaymentLinkPayment);

  const checkoutId = (search.resourcePath ? search.resourcePath.split("/")[3] : undefined) ?? search.id;

  const { data, isLoading } = useQuery({
    queryKey: ["pay-link-result", search.token, checkoutId],
    enabled: !!search.token && !!checkoutId,
    retry: false,
    queryFn: () => confirm({ data: { token: search.token!, checkout_id: checkoutId! } }),
  });

  const t = (ar: string, en: string, ur?: string, bn?: string) =>
    lang === "ar" ? ar : lang === "ur" ? (ur ?? en) : lang === "bn" ? (bn ?? en) : en;

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="container mx-auto max-w-xl px-4 py-20 text-center">
        {isLoading || !data ? (
          <div className="flex items-center justify-center gap-2 text-muted-foreground">
            <Loader2 className="h-5 w-5 animate-spin" /> {t("جارٍ التحقق من الدفع…", "Verifying payment…", "تصدیق ہو رہی ہے…", "যাচাই করা হচ্ছে…")}
          </div>
        ) : data.success ? (
          <>
            <CheckCircle2 className="mx-auto mb-4 h-14 w-14 text-primary" />
            <h1 className="font-display text-2xl font-bold">{t("تم الدفع بنجاح", "Payment successful", "ادائیگی کامیاب", "পেমেন্ট সফল")}</h1>
            <p className="mt-2 text-sm text-muted-foreground">{t("شكراً لك، تم استلام المبلغ.", "Thank you, your payment has been received.", "شکریہ، رقم موصول ہو گئی۔", "ধন্যবাদ, পেমেন্ট গৃহীত হয়েছে।")}</p>
            <Button className="mt-6" onClick={() => nav({ to: "/" })}>{t("الصفحة الرئيسية", "Home", "ہوم", "হোম")}</Button>
          </>
        ) : (
          <>
            <XCircle className="mx-auto mb-4 h-14 w-14 text-destructive" />
            <h1 className="font-display text-2xl font-bold">
              {data.pending ? t("الدفع قيد المعالجة", "Payment pending", "زیر عمل", "প্রক্রিয়াধীন") : t("فشل الدفع", "Payment failed", "ناکام", "ব্যর্থ")}
            </h1>
            <p className="mt-2 text-sm text-muted-foreground">{payResultMessage(lang, !!data.pending)}</p>
            {search.token && (
              <Button className="mt-6" onClick={() => nav({ to: "/pay-link/$token", params: { token: search.token! } })}>
                {t("إعادة المحاولة", "Try again", "دوبارہ کوشش", "আবার চেষ্টা করুন")}
              </Button>
            )}
          </>
        )}
      </div>
      <Footer />
    </div>
  );
}
