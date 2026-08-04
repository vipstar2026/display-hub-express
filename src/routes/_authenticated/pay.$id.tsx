import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { useI18n } from "@/lib/i18n";
import { createAfsCheckout } from "@/lib/afs.functions";
import { ShieldCheck, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AfsTestCards } from "@/components/AfsTestCards";

export const Route = createFileRoute("/_authenticated/pay/$id")({
  ssr: false,
  component: PayPage,
  errorComponent: () => <PayError />,
  notFoundComponent: () => <PayError />,
});

function PayError() {
  const { lang } = useI18n();
  const nav = useNavigate();
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="container mx-auto px-4 py-24 text-center">
        <p className="mb-4 text-muted-foreground">
          {lang === "ar" ? "تعذر بدء عملية الدفع." : lang === "ur" ? "ادائیگی شروع نہیں ہو سکی۔" : lang === "bn" ? "পেমেন্ট শুরু করা যায়নি।" : "Could not start the payment."}
        </p>
        <Button onClick={() => nav({ to: "/cart" })}>{lang === "ar" ? "العودة للسلة" : lang === "bn" ? "কার্টে ফিরে যান" : "Back to cart"}</Button>
      </div>
      <Footer />
    </div>
  );
}

function PayPage() {
  const { id } = Route.useParams();
  const { lang } = useI18n();
  const start = useServerFn(createAfsCheckout);
  const mounted = useRef(false);

  const { data, isLoading, error } = useQuery({
    queryKey: ["afs-checkout", id],
    queryFn: () => start({ data: { order_id: id } }),
    staleTime: Infinity,
    retry: false,
  });

  useEffect(() => {
    if (!data?.scriptUrl || mounted.current) return;
    mounted.current = true;
    const s = document.createElement("script");
    s.src = data.scriptUrl;
    s.async = true;
    document.body.appendChild(s);
  }, [data?.scriptUrl]);

  const heading = lang === "ar" ? "إتمام الدفع" : lang === "ur" ? "ادائیگی مکمل کریں" : "Complete payment";
  const secure =
    lang === "ar"
      ? "الدفع مؤمّن عبر بوابة AFS للخدمات المالية العربية"
      : lang === "ur"
        ? "ادائیگی AFS گیٹ وے کے ذریعے محفوظ ہے"
        : "Secured by AFS payment gateway";

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="container mx-auto max-w-2xl px-4 py-10">
        <h1 className="mb-1 font-display text-2xl font-bold">{heading}</h1>
        <p className="mb-6 flex items-center gap-2 text-sm text-muted-foreground">
          <ShieldCheck className="h-4 w-4 text-primary" /> {secure}
        </p>

        {data && (
          <div className="mb-4 rounded-xl border border-primary/10 bg-card p-4 text-sm">
            <span className="text-muted-foreground">{lang === "ar" ? "المبلغ" : "Amount"}: </span>
            <span className="font-bold text-primary">{data.amount} {data.currency}</span>
          </div>
        )}

        {data?.testMode && <AfsTestCards />}


        <div className="rounded-xl border border-primary/10 bg-card p-4">
          {isLoading && (
            <div className="flex items-center justify-center gap-2 py-10 text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" /> …
            </div>
          )}
          {error && <PayErrorInline message={(error as Error).message} />}
          {data && (
            <form
              action={`${data.resultUrl || `${window.location.origin}/pay/result`}?order=${id}`}
              className="paymentWidgets"
              data-brands={data.brands || "VISA MASTER"}
              data-lang={data.widgetLang || (lang === "ar" ? "ar" : "en")}
            />
          )}
        </div>
      </div>
      <Footer />
    </div>
  );
}

function PayErrorInline({ message }: { message: string }) {
  return <p className="py-6 text-center text-sm text-destructive">{message}</p>;
}
