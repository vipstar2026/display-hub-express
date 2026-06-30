import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { useI18n } from "@/lib/i18n";
import { supabase } from "@/integrations/supabase/client";
import { formatPrice } from "@/lib/format";

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

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="container mx-auto px-4 py-8">
        <h1 className="mb-6 font-display text-3xl font-bold">{t("nav.account")}</h1>
        <h2 className="mb-4 text-lg font-semibold">{t("admin.orders")}</h2>
        <div className="space-y-3">
          {(orders ?? []).length === 0 && <div className="rounded-xl border border-cyan-500/10 bg-card p-8 text-center text-muted-foreground">—</div>}
          {(orders ?? []).map((o) => (
            <div key={o.id} className="rounded-xl border border-cyan-500/10 bg-card p-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="font-mono text-sm text-cyan-400">{o.order_number}</span>
                <span className="rounded-full border border-cyan-500/20 px-2 py-0.5 text-xs">{o.status}</span>
                <span className="font-mono font-bold">{formatPrice(Number(o.total), o.currency)}</span>
              </div>
              <div className="mt-2 text-xs text-muted-foreground">{new Date(o.created_at).toLocaleString()}</div>
              <div className="mt-3 space-y-1">
                {o.order_items?.map((it: { id: string; product_name: string; quantity: number; total: number }) => (
                  <div key={it.id} className="flex justify-between text-sm">
                    <span>{it.product_name} × {it.quantity}</span>
                    <span className="font-mono">{formatPrice(Number(it.total), o.currency)}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
      <Footer />
    </div>
  );
}
