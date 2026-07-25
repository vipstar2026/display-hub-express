import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { useI18n } from "@/lib/i18n";
import { supabase } from "@/integrations/supabase/client";
import { formatPrice } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { CheckCircle2, Copy, Package, ShieldCheck, Download } from "lucide-react";
import { generateInvoicePDF } from "@/lib/invoice-pdf";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/order/success/$id")({
  component: OrderSuccess,
});

function OrderSuccess() {
  const { id } = Route.useParams();
  const { t } = useI18n();

  const { data: order, isLoading } = useQuery({
    queryKey: ["order", id],
    queryFn: async () => (await supabase.from("orders").select("*, order_items(*)").eq("id", id).maybeSingle()).data,
    refetchInterval: (q) => (q.state.data?.payment_status === "succeeded" ? false : 5000),
  });

  if (isLoading) {
    return <div className="min-h-screen bg-background"><Header /><div className="container mx-auto py-24 text-center text-muted-foreground">...</div></div>;
  }
  if (!order) {
    return <div className="min-h-screen bg-background"><Header /><div className="container mx-auto py-24 text-center text-muted-foreground">—</div></div>;
  }

  const allCodes: { code: string; product_name: string }[] = [];
  (order.order_items as { product_name: string; delivered_codes: unknown }[] | null)?.forEach((it) => {
    const arr = Array.isArray(it.delivered_codes) ? (it.delivered_codes as { code: string }[]) : [];
    arr.forEach((c) => allCodes.push({ code: c.code, product_name: it.product_name }));
  });

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="container mx-auto max-w-3xl px-4 py-12">
        <div className="rounded-2xl border border-primary/30 bg-gradient-to-b from-primary/10 to-transparent p-8 text-center shadow-lg shadow-primary/10">
          <div className="mx-auto mb-4 grid h-16 w-16 place-items-center rounded-full bg-primary/20">
            <CheckCircle2 className="h-10 w-10 text-primary" />
          </div>
          <h1 className="font-display text-3xl font-bold text-primary">{t("order.success")}</h1>
          <p className="mt-2 text-muted-foreground">{t("order.thank_you")}</p>
          <div className="mx-auto mt-6 grid max-w-md gap-3 text-start">
            <div className="flex justify-between rounded-lg border border-primary/20 bg-card px-4 py-3">
              <span className="text-sm text-muted-foreground">{t("order.order_number")}</span>
              <span className="font-mono font-bold text-primary">{order.order_number}</span>
            </div>
            <div className="flex justify-between rounded-lg border border-primary/20 bg-card px-4 py-3">
              <span className="text-sm text-muted-foreground">{t("order.status")}</span>
              <span className="rounded-full border border-primary/30 bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary uppercase">{order.status}</span>
            </div>
            <div className="flex justify-between rounded-lg border border-primary/20 bg-card px-4 py-3">
              <span className="text-sm text-muted-foreground">{t("order.total")}</span>
              <span className="font-mono font-bold">{formatPrice(Number(order.total), order.currency)}</span>
            </div>
          </div>
        </div>

        <div className="mt-6 rounded-xl border border-primary/10 bg-card p-6">
          <h2 className="mb-3 flex items-center gap-2 font-display text-lg font-bold"><ShieldCheck className="h-5 w-5 text-primary" />{t("order.next_steps")}</h2>
          <p className="text-sm leading-relaxed text-muted-foreground">{t("order.pending_note")}</p>
        </div>

        {allCodes.length > 0 && (
          <div className="mt-6 rounded-xl border border-primary/30 bg-card p-6">
            <h2 className="mb-4 font-display text-lg font-bold text-primary">{t("order.your_codes")}</h2>
            <div className="space-y-3">
              {allCodes.map((c, i) => (
                <div key={i} className="flex items-center gap-3 rounded-lg border border-primary/20 bg-background/60 p-3">
                  <div className="flex-1">
                    <div className="text-xs text-muted-foreground">{c.product_name}</div>
                    <div className="font-mono text-lg font-bold tracking-wider text-primary">{c.code}</div>
                  </div>
                  <Button size="sm" variant="ghost" onClick={() => { navigator.clipboard.writeText(c.code); toast.success(t("order.copied")); }}>
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="mt-6 rounded-xl border border-primary/10 bg-card p-6">
          <h2 className="mb-3 flex items-center gap-2 font-display text-lg font-bold"><Package className="h-5 w-5 text-primary" />Items</h2>
          <div className="space-y-2">
            {(order.order_items as { id: string; product_name: string; quantity: number; total: number }[] | null)?.map((it) => (
              <div key={it.id} className="flex justify-between text-sm">
                <span>{it.product_name} × {it.quantity}</span>
                <span className="font-mono">{formatPrice(Number(it.total), order.currency)}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <Button onClick={() => generateInvoicePDF(order as unknown as Parameters<typeof generateInvoicePDF>[0])} variant="outline" className="gap-2">
            <Download className="h-4 w-4" />{t("orders.downloadInvoice")}
          </Button>
          <Link to="/account"><Button className="bg-primary text-background hover:bg-primary">{t("order.view_orders")}</Button></Link>
          <Link to="/shop"><Button variant="outline">{t("shop.continueShopping")}</Button></Link>
        </div>
      </div>
      <Footer />
    </div>
  );
}
