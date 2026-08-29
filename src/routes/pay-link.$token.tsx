import { BASE } from "@/lib/site-url";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { useI18n } from "@/lib/i18n";
import { getPaymentLinkPublic, startPaymentLinkCheckout } from "@/lib/payment-links.functions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ShieldCheck, Loader2, CheckCircle2 } from "lucide-react";

import { AfsPaymentWidget } from "@/components/AfsPaymentWidget";

export const Route = createFileRoute("/pay-link/$token")({
  ssr: false,
  component: PayLinkPage,
  head: () => ({
    meta: [
      { title: "Secure Payment | VIPSTAR" },
      { name: "description", content: "Pay your VIPSTAR invoice securely by card through the AFS payment gateway." },
      { property: "og:title", content: "Secure Payment | VIPSTAR" },
      { property: "og:description", content: "Pay your VIPSTAR invoice securely by card through the AFS payment gateway." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  errorComponent: () => <LinkError />,
  notFoundComponent: () => <LinkError />,
});

function LinkError() {
  const { lang } = useI18n();
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="container mx-auto px-4 py-24 text-center text-muted-foreground">
        {lang === "ar" ? "رابط الدفع غير صالح أو منتهي." : lang === "bn" ? "পেমেন্ট লিংকটি অবৈধ বা মেয়াদোত্তীর্ণ।" : lang === "ur" ? "ادائیگی لنک غلط یا ختم شدہ ہے۔" : "This payment link is invalid or expired."}
      </div>
      <Footer />
    </div>
  );
}

function PayLinkPage() {
  const { token } = Route.useParams();
  const { lang } = useI18n();
  const nav = useNavigate();
  const fetchLink = useServerFn(getPaymentLinkPublic);
  const start = useServerFn(startPaymentLinkCheckout);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");

  const t = (ar: string, en: string, ur?: string, bn?: string) =>
    lang === "ar" ? ar : lang === "ur" ? (ur ?? en) : lang === "bn" ? (bn ?? en) : en;

  const { data: link, isLoading, error } = useQuery({
    queryKey: ["pay-link", token],
    queryFn: () => fetchLink({ data: { token } }),
    retry: false,
    staleTime: 60_000,
  });

  useEffect(() => {
    if (!link) return;
    setName((v) => v || link.customer_name || "");
    setEmail((v) => v || link.customer_email || "");
  }, [link]);

  const checkout = useMutation({
    mutationFn: () => start({ data: { token, name, email, phone } }),
  });


  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="flex items-center justify-center gap-2 py-32 text-muted-foreground">
          <Loader2 className="h-5 w-5 animate-spin" />
        </div>
        <Footer />
      </div>
    );
  }
  if (error || !link) return <LinkError />;

  const paid = link.status === "paid";

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="container mx-auto max-w-2xl px-4 py-10">
        <h1 className="mb-1 font-display text-2xl font-bold">{t("رابط دفع", "Payment link", "ادائیگی لنک", "পেমেন্ট লিংক")}</h1>
        <p className="mb-6 flex items-center gap-2 text-sm text-muted-foreground">
          <ShieldCheck className="h-4 w-4 text-primary" />
          {t("الدفع مؤمّن عبر بوابة AFS", "Secured by the AFS payment gateway", "AFS گیٹ وے کے ذریعے محفوظ", "AFS গেটওয়ে দ্বারা সুরক্ষিত")}
        </p>

        <div className="mb-4 rounded-xl border border-primary/10 bg-card p-5">
          <div className="text-sm text-muted-foreground">{t("المبلغ المطلوب", "Amount due", "قابل ادائیگی رقم", "প্রদেয় পরিমাণ")}</div>
          <div className="font-display text-3xl font-bold text-primary">
            {Number(link.amount).toFixed(3)} {link.currency}
          </div>
          {link.description && <p className="mt-2 text-sm text-muted-foreground">{link.description}</p>}
        </div>

        {paid ? (
          <div className="rounded-xl border border-primary/20 bg-card p-8 text-center">
            <CheckCircle2 className="mx-auto mb-3 h-12 w-12 text-primary" />
            <p className="font-semibold">{t("تم سداد هذا الرابط بنجاح", "This payment link has already been paid", "یہ ادائیگی مکمل ہو چکی ہے", "এই পেমেন্টটি সম্পন্ন হয়েছে")}</p>
            <Button className="mt-4" variant="outline" onClick={() => nav({ to: "/" })}>
              {t("الصفحة الرئيسية", "Home", "ہوم", "হোম")}
            </Button>
          </div>
        ) : !checkout.data ? (
          <div className="space-y-3 rounded-xl border border-primary/10 bg-card p-5">
            <Input placeholder={t("الاسم", "Full name", "نام", "নাম")} value={name} onChange={(e) => setName(e.target.value)} />
            <Input type="email" placeholder={t("البريد الإلكتروني", "Email", "ای میل", "ইমেইল")} value={email} onChange={(e) => setEmail(e.target.value)} />
            <Input placeholder={t("رقم الهاتف (اختياري)", "Phone (optional)", "فون (اختیاری)", "ফোন (ঐচ্ছিক)")} value={phone} onChange={(e) => setPhone(e.target.value)} />
            {checkout.error && <p className="text-sm text-destructive">{(checkout.error as Error).message}</p>}
            <Button className="w-full" disabled={!email || checkout.isPending} onClick={() => checkout.mutate()}>
              {checkout.isPending && <Loader2 className="me-2 h-4 w-4 animate-spin" />}
              {t("متابعة الدفع بالبطاقة", "Continue to card payment", "کارڈ سے ادائیگی", "কার্ডে পেমেন্ট করুন")}
            </Button>
          </div>
        ) : (
          <>
            <AfsPaymentWidget
              scriptUrl={checkout.data.scriptUrl}
              scriptIntegrity={checkout.data.scriptIntegrity}
              action={`${BASE}/pay-link/result?token=${token}`}
              brands={checkout.data.brands}
              widgetLang={checkout.data.widgetLang}
              amount={Number(link.amount).toFixed(3)}
              currency={link.currency}
              onCancel={() => nav({ to: "/" })}
            />
          </>
        )}
      </div>
      <Footer />
    </div>
  );
}
