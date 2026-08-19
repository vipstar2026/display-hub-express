import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { useI18n } from "@/lib/i18n";
import { getGuestOrder } from "@/lib/guest-checkout.functions";
import { CheckCircle2, Loader2, KeyRound, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { analytics } from "@/lib/analytics";

const searchSchema = z.object({ t: z.string().optional() });

export const Route = createFileRoute("/guest-order/$id")({
  ssr: false,
  validateSearch: searchSchema,
  component: GuestOrderPage,
  head: () => ({
    meta: [
      { title: "Your order — VIPSTAR" },
      { name: "description", content: "Your VIPSTAR order details, delivery status and digital codes." },
      { name: "robots", content: "noindex" },
    ],
  }),
});

function GuestOrderPage() {
  const { id } = Route.useParams();
  const { t: token } = Route.useSearch();
  const { lang } = useI18n();
  const fetchOrder = useServerFn(getGuestOrder);
  const L = (ar: string, en: string, ur: string, bn: string) => (lang === "ar" ? ar : lang === "ur" ? ur : lang === "bn" ? bn : en);

  const { data: order, isLoading } = useQuery({
    queryKey: ["guest-order-view", id, token],
    enabled: !!token,
    retry: false,
    refetchInterval: (q) => ((q.state.data as any)?.payment_status === "succeeded" ? false : 5000),
    queryFn: () => fetchOrder({ data: { order_id: id, token: token! } }),
  });

  const paid = order?.payment_status === "succeeded";
  useEffect(() => {
    if (paid && order) {
      analytics.purchase(
        id,
        ((order.order_items ?? []) as any[]).map((i) => ({ id: i.product_name, name: i.product_name, price: Number(i.unit_price), quantity: i.quantity })),
        Number(order.total),
        order.currency ?? "BHD"
      );
    }
  }, [paid, order, id]);

  const money = (n: number) => `${Number(n).toFixed(3)} ${order?.currency ?? "BHD"}`;

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="container mx-auto max-w-2xl px-4 py-12">
        {isLoading && (
          <div className="flex items-center justify-center gap-2 py-16 text-muted-foreground">
            <Loader2 className="h-5 w-5 animate-spin" /> …
          </div>
        )}
        {!token && <p className="py-16 text-center text-muted-foreground">{L("رابط غير صالح.", "Invalid link.", "غلط لنک۔", "অবৈধ লিংক।")}</p>}
        {order && (
          <>
            <div className="mb-6 text-center">
              {paid ? <CheckCircle2 className="mx-auto mb-3 h-14 w-14 text-primary" /> : <Clock className="mx-auto mb-3 h-14 w-14 text-muted-foreground" />}
              <h1 className="font-display text-2xl font-bold">
                {paid ? L("تم استلام طلبك", "Your order is confirmed", "آرڈر کی تصدیق", "আপনার অর্ডার নিশ্চিত") : L("طلبك قيد الانتظار", "Your order is pending", "آرڈر زیر التوا", "অর্ডার অপেক্ষমাণ")}
              </h1>
              <p className="mt-1 font-mono text-sm text-muted-foreground">#{order.order_number}</p>
            </div>

            <div className="rounded-xl border border-primary/20 bg-card p-5">
              <div className="space-y-2">
                {((order.order_items ?? []) as any[]).map((it, idx) => (
                  <div key={idx}>
                    <div className="flex items-start justify-between gap-3 text-sm">
                      <span className="min-w-0 truncate">{it.product_name} × {it.quantity}</span>
                      <span className="shrink-0 font-mono">{money(Number(it.total))}</span>
                    </div>
                    {Array.isArray(it.delivered_codes) && it.delivered_codes.length > 0 && (
                      <div className="mt-2 space-y-1 rounded-lg border border-primary/30 bg-primary/5 p-3">
                        <div className="flex items-center gap-1.5 text-xs font-semibold text-primary">
                          <KeyRound className="h-3.5 w-3.5" /> {L("أكواد التفعيل", "Activation codes", "ایکٹیویشن کوڈز", "অ্যাক্টিভেশন কোড")}
                        </div>
                        {it.delivered_codes.map((c: any, i: number) => (
                          <div key={i} className="select-all font-mono text-sm">{c.code}</div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
              <div className="mt-3 flex justify-between border-t border-primary/20 pt-3 font-bold">
                <span>{L("الإجمالي", "Total", "کل", "মোট")}</span>
                <span className="font-mono text-primary">{money(Number(order.total))}</span>
              </div>
            </div>

            <p className="mt-4 text-center text-xs text-muted-foreground">
              {L("احتفظ بهذا الرابط لمتابعة طلبك، وأُرسلت نسخة إلى بريدك الإلكتروني.",
                 "Keep this link to follow your order — a copy was emailed to you.",
                 "اس لنک کو محفوظ رکھیں؛ ای میل بھی بھیجی گئی ہے۔",
                 "এই লিংকটি সংরক্ষণ করুন; একটি কপি ইমেইলে পাঠানো হয়েছে।")}
            </p>
            <div className="mt-6 flex justify-center gap-2">
              <Link to="/shop"><Button variant="outline">{L("متابعة التسوق", "Continue shopping", "خریداری جاری رکھیں", "কেনাকাটা চালিয়ে যান")}</Button></Link>
              <Link to="/track"><Button>{L("تتبع الطلب", "Track order", "آرڈر ٹریک", "অর্ডার ট্র্যাক")}</Button></Link>
            </div>
          </>
        )}
      </div>
      <Footer />
    </div>
  );
}
