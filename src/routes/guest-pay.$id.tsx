import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { useI18n } from "@/lib/i18n";
import { payInitMessage } from "@/lib/pay-messages";
import { formatAmount } from "@/lib/afs-money";
import { createGuestAfsCheckout, getGuestOrder } from "@/lib/guest-checkout.functions";
import { ShieldCheck, Loader2, Receipt, Truck, Store, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AfsTestCards } from "@/components/AfsTestCards";
import { AfsPaymentWidget } from "@/components/AfsPaymentWidget";

const searchSchema = z.object({ t: z.string().optional() });

export const Route = createFileRoute("/guest-pay/$id")({
  ssr: false,
  validateSearch: searchSchema,
  component: GuestPayPage,
  head: () => ({
    meta: [
      { title: "Complete payment — VIPSTAR" },
      { name: "description", content: "Securely complete your VIPSTAR order payment." },
      { name: "robots", content: "noindex" },
    ],
  }),
});

function GuestPayPage() {
  const { id } = Route.useParams();
  const { t: token } = Route.useSearch();
  const { lang } = useI18n();
  const nav = useNavigate();
  const start = useServerFn(createGuestAfsCheckout);
  const fetchOrder = useServerFn(getGuestOrder);

  const L = (ar: string, en: string, ur: string, bn: string) => (lang === "ar" ? ar : lang === "ur" ? ur : lang === "bn" ? bn : en);

  const { data: order } = useQuery({
    queryKey: ["guest-order", id, token],
    enabled: !!token,
    retry: false,
    queryFn: () => fetchOrder({ data: { order_id: id, token: token! } }),
  });

  const { data, isLoading, error } = useQuery({
    queryKey: ["guest-afs-checkout", id, token],
    enabled: !!token,
    staleTime: Infinity,
    retry: false,
    queryFn: () => start({ data: { order_id: id, token: token! } }),
  });

  const money = (n: number) => `${Number(n).toFixed(3)} ${order?.currency ?? "BHD"}`;

  if (!token) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto px-4 py-24 text-center">
          <p className="mb-4 text-muted-foreground">{L("رابط الدفع غير صالح.", "This payment link is invalid.", "ادائیگی لنک غلط ہے۔", "পেমেন্ট লিংকটি সঠিক নয়।")}</p>
          <Button onClick={() => nav({ to: "/cart" })}>{L("العودة للسلة", "Back to cart", "کارٹ", "কার্ট")}</Button>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="container mx-auto max-w-2xl px-4 py-10">
        <h1 className="mb-1 font-display text-2xl font-bold">{L("إتمام الدفع", "Complete payment", "ادائیگی مکمل کریں", "পেমেন্ট সম্পন্ন করুন")}</h1>
        <p className="mb-6 flex items-center gap-2 text-sm text-muted-foreground">
          <ShieldCheck className="h-4 w-4 text-primary" />
          {L("الدفع مؤمّن عبر بوابة AFS", "Secured by AFS payment gateway", "AFS گیٹ وے کے ذریعے محفوظ", "AFS গেটওয়ে দ্বারা সুরক্ষিত")}
        </p>

        {order && (
          <div className="mb-6 rounded-xl border border-primary/20 bg-card p-5">
            <div className="mb-3 flex items-center justify-between gap-2">
              <h2 className="flex items-center gap-2 font-display text-base font-bold">
                <Receipt className="h-4 w-4 text-primary" />
                {L("تفاصيل الطلب", "Order details", "آرڈر کی تفصیلات", "অর্ডারের বিবরণ")}
              </h2>
              <span className="font-mono text-xs text-muted-foreground">#{order.order_number}</span>
            </div>
            <div className="space-y-2 border-b border-primary/10 pb-3">
              {((order.order_items ?? []) as { product_name: string; quantity: number; unit_price: number; total: number; product_type: string }[]).map((it, idx) => (
                <div key={idx} className="flex items-start justify-between gap-3 text-sm">
                  <div className="min-w-0">
                    <div className="truncate">{it.product_name}</div>
                    <div className="text-[11px] text-muted-foreground">
                      {it.quantity} × {money(Number(it.unit_price))} ·{" "}
                      {it.product_type === "physical"
                        ? L("شحن/استلام", "Delivery", "ڈیلیوری", "ডেলিভারি")
                        : L("تسليم فوري", "Instant delivery", "فوری ترسیل", "তাৎক্ষণিক")}
                    </div>
                  </div>
                  <div className="shrink-0 font-mono">{money(Number(it.total))}</div>
                </div>
              ))}
            </div>
            <div className="mt-3 space-y-1.5 text-sm">
              <div className="flex justify-between text-muted-foreground">
                <span>{L("المجموع الفرعي", "Subtotal", "ذیلی کل", "সাবটোটাল")}</span>
                <span className="font-mono">{money(Number(order.subtotal))}</span>
              </div>
              {Number(order.discount) > 0 && (
                <div className="flex justify-between text-primary">
                  <span>{L("الخصم", "Discount", "رعایت", "ছাড়")}</span>
                  <span className="font-mono">−{money(Number(order.discount))}</span>
                </div>
              )}
              <div className="flex justify-between text-muted-foreground">
                <span className="flex items-center gap-1">
                  {order.shipping_method === "digital" ? <Zap className="h-3.5 w-3.5 text-primary" /> : order.shipping_method === "pickup" ? <Store className="h-3.5 w-3.5" /> : <Truck className="h-3.5 w-3.5" />}
                  {order.shipping_method === "digital"
                    ? L("منتجات رقمية — بدون شحن", "Digital — no shipping", "ڈیجیٹل — شپنگ نہیں", "ডিজিটাল — শিপিং নেই")
                    : order.shipping_method === "pickup"
                      ? L("استلام من المحل", "Pickup from store", "دکان سے وصولی", "দোকান থেকে সংগ্রহ")
                      : L("الشحن", "Shipping", "شپنگ", "শিপিং")}
                </span>
                <span className="font-mono">{Number(order.shipping_cost) > 0 ? money(Number(order.shipping_cost)) : L("مجاني", "Free", "مفت", "ফ্রি")}</span>
              </div>
              {Number(order.tax) > 0 && (
                <div className="flex justify-between text-muted-foreground">
                  <span>{L("الضريبة", "Tax", "ٹیکس", "কর")}</span>
                  <span className="font-mono">{money(Number(order.tax))}</span>
                </div>
              )}
              <div className="mt-2 flex justify-between border-t border-primary/20 pt-2 text-base font-bold">
                <span>{L("الإجمالي المستحق", "Total due", "کل واجب الادا", "মোট প্রদেয়")}</span>
                <span className="font-mono text-primary">{money(Number(order.total))}</span>
              </div>
            </div>
          </div>
        )}

        {data?.testMode && <AfsTestCards />}

        {isLoading && (
          <div className="flex items-center justify-center gap-2 rounded-xl border border-primary/10 bg-card py-10 text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" /> …
          </div>
        )}
        {error && (
          <div className="py-6 text-center">
            <p className="text-sm text-destructive">{payInitMessage(lang)}</p>
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="mt-3 rounded-lg border border-primary/30 px-4 py-2 text-sm text-foreground hover:bg-primary/10"
            >
              {lang === "ar" ? "إعادة المحاولة" : lang === "ur" ? "دوبارہ کوشش کریں" : lang === "bn" ? "আবার চেষ্টা করুন" : "Try again"}
            </button>
          </div>
        )}
        {data && (
          <AfsPaymentWidget
            scriptUrl={data.scriptUrl}
            action={`${BASE}/guest-pay/result?order=${id}&t=${encodeURIComponent(token)}`}
            brands={data.brands}
            widgetLang={data.widgetLang}
            amount={formatAmount(order?.total ?? data.amount, data.currency)}
            currency={data.currency}
            onCancel={() => nav({ to: "/cart" })}
          />
        )}
      </div>
      <Footer />
    </div>
  );
}
