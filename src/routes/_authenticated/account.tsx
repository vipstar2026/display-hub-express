import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { useI18n } from "@/lib/i18n";
import { supabase } from "@/integrations/supabase/client";
import { formatPrice } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { Copy, ShoppingBag, Heart, Package, Sparkles, MapPin } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/account")({
  component: AccountPage,
});

function AccountPage() {
  const { t } = useI18n();
  const { data: orders } = useQuery({
    queryKey: ["my-orders"],
    queryFn: async () => {
      const { data: u } = await supabase.auth.getUser();
      if (!u.user) return [];
      const { data } = await supabase.from("orders").select("*, order_items(*)").eq("buyer_id", u.user.id).order("created_at", { ascending: false });
      return data ?? [];
    },
  });

  const { data: loyalty } = useQuery({
    queryKey: ["my-loyalty"],
    queryFn: async () => {
      const { data: u } = await supabase.auth.getUser();
      if (!u.user) return { balance: 0 };
      const { data } = await supabase.from("loyalty_balance").select("balance").eq("buyer_id", u.user.id).maybeSingle();
      return { balance: data?.balance ?? 0 };
    },
  });

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="container mx-auto px-4 py-8">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <h1 className="font-display text-3xl font-bold">{t("nav.account")}</h1>
          <Link to="/wishlist"><Button variant="outline"><Heart className="me-2 h-4 w-4" />{t("wishlist.title")}</Button></Link>
        </div>

        <div className="mb-6 flex items-center gap-3 rounded-2xl border border-primary/30 bg-gradient-to-br from-primary/15 via-primary/5 to-transparent p-5">
          <div className="grid h-12 w-12 place-items-center rounded-xl bg-primary/20 text-primary">
            <Sparkles className="h-6 w-6" />
          </div>
          <div className="flex-1">
            <div className="text-xs uppercase tracking-wider text-muted-foreground">{t("loyalty.balance")}</div>
            <div className="font-mono text-2xl font-bold text-primary">{loyalty?.balance ?? 0} <span className="text-sm font-normal text-muted-foreground">{t("loyalty.points")}</span></div>
          </div>
          <div className="hidden text-end text-xs text-muted-foreground md:block">{t("loyalty.hint")}</div>
        </div>

        <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold"><ShoppingBag className="h-5 w-5 text-primary" />{t("admin.orders")}</h2>
        <div className="space-y-3">
          {(orders ?? []).length === 0 && (
            <div className="rounded-xl border border-primary/10 bg-card p-12 text-center">
              <Package className="mx-auto mb-3 h-12 w-12 text-primary/30" />
              <p className="text-muted-foreground">{t("account.no_orders")}</p>
              <Link to="/shop"><Button className="mt-4 bg-primary text-background hover:bg-primary">{t("shop.continueShopping")}</Button></Link>
            </div>
          )}
          {(orders ?? []).map((o) => {
            const items = (o.order_items ?? []) as { id: string; product_name: string; quantity: number; total: number; delivered_codes: unknown }[];
            const codes: { code: string; product_name: string }[] = [];
            items.forEach((it) => {
              const arr = Array.isArray(it.delivered_codes) ? (it.delivered_codes as { code: string }[]) : [];
              arr.forEach((c) => codes.push({ code: c.code, product_name: it.product_name }));
            });
            return (
              <div key={o.id} className="rounded-xl border border-primary/10 bg-card p-4">
                <div className="flex flex-wrap items-center gap-3">
                  <Link to="/order/success/$id" params={{ id: o.id }} className="font-mono text-sm text-primary hover:underline">{o.order_number}</Link>
                  <span className="rounded-full border border-primary/20 bg-primary/5 px-2 py-0.5 text-xs uppercase text-primary">{o.status}</span>
                  <span className="rounded-full border border-primary/10 px-2 py-0.5 text-xs text-muted-foreground">{o.payment_status}</span>
                  <span className="ms-auto font-mono font-bold">{formatPrice(Number(o.total), o.currency)}</span>
                </div>
                <div className="mt-1 text-xs text-muted-foreground">{new Date(o.created_at).toLocaleString()}</div>
                <div className="mt-3 space-y-1">
                  {items.map((it) => (
                    <div key={it.id} className="flex justify-between text-sm">
                      <span>{it.product_name} × {it.quantity}</span>
                      <span className="font-mono">{formatPrice(Number(it.total), o.currency)}</span>
                    </div>
                  ))}
                </div>
                {codes.length > 0 && (
                  <div className="mt-3 space-y-2 rounded-lg border border-primary/30 bg-background/60 p-3">
                    <div className="text-xs uppercase tracking-wider text-primary">{t("order.your_codes")}</div>
                    {codes.map((c, i) => (
                      <div key={i} className="flex items-center gap-2">
                        <div className="flex-1 font-mono text-sm text-primary">{c.code}</div>
                        <button onClick={() => { navigator.clipboard.writeText(c.code); toast.success(t("order.copied")); }} className="text-primary/70 hover:text-primary">
                          <Copy className="h-4 w-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
                <div className="mt-3 flex justify-end">
                  <Link to="/order/success/$id" params={{ id: o.id }} className="text-xs text-primary hover:underline">{t("account.view_order")} →</Link>
                </div>
              </div>
            );
          })}
        </div>
      </div>
      <Footer />
    </div>
  );
}
