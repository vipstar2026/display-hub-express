import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { Package, Loader2 } from "lucide-react";

export const Route = createFileRoute("/_authenticated/orders")({
  component: OrdersPage,
  head: () => ({ meta: [{ title: "My Orders | VIP STAR" }] }),
});

type OrderRow = {
  id: string;
  status: string;
  total: number;
  currency: string;
  created_at: string;
  order_items: { id: string; title: string; qty: number; image_url: string | null }[];
};

const STATUS_COLOR: Record<string, string> = {
  pending: "bg-amber-100 text-amber-800",
  processing: "bg-blue-100 text-blue-800",
  paid: "bg-emerald-100 text-emerald-800",
  shipped: "bg-indigo-100 text-indigo-800",
  completed: "bg-green-100 text-green-800",
  cancelled: "bg-rose-100 text-rose-800",
};

function OrdersPage() {
  const { user } = useAuth();
  const [orders, setOrders] = useState<OrderRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data } = await supabase
        .from("orders")
        .select("id, status, total, currency, created_at, order_items(id, title, qty, image_url)")
        .eq("buyer_id", user.id)
        .order("created_at", { ascending: false });
      setOrders((data as OrderRow[]) || []);
      setLoading(false);
    })();
  }, [user]);

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <SiteHeader />
      <main className="flex-1 mx-auto max-w-5xl w-full px-4 py-8">
        <h1 className="text-2xl font-bold text-foreground mb-6">My Orders</h1>

        {loading ? (
          <div className="grid place-items-center py-16"><Loader2 className="w-6 h-6 animate-spin text-brand" /></div>
        ) : orders.length === 0 ? (
          <div className="bg-card border border-border rounded-xl p-10 text-center">
            <Package className="w-10 h-10 text-muted-foreground mx-auto" />
            <p className="mt-3 text-foreground font-medium">No orders yet.</p>
            <Link to="/" className="mt-4 inline-block text-brand hover:underline">Start shopping</Link>
          </div>
        ) : (
          <div className="space-y-3">
            {orders.map((o) => (
              <Link
                key={o.id}
                to="/orders/$id"
                params={{ id: o.id }}
                className="block bg-card border border-border rounded-xl p-4 hover:border-brand transition-smooth"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="text-xs text-muted-foreground">Order #{o.id.slice(0, 8)}</div>
                    <div className="text-sm font-medium text-foreground mt-1">
                      {o.order_items.length} item(s) · {new Date(o.created_at).toLocaleDateString()}
                    </div>
                  </div>
                  <span className={`text-xs px-2 py-1 rounded-full font-semibold capitalize ${STATUS_COLOR[o.status] || "bg-muted text-foreground"}`}>{o.status}</span>
                </div>
                <div className="mt-3 flex items-center justify-between">
                  <div className="flex -space-x-2">
                    {o.order_items.slice(0, 4).map((it) => (
                      <div key={it.id} className="w-10 h-10 rounded border-2 border-card bg-secondary overflow-hidden">
                        {it.image_url && <img src={it.image_url} alt="" className="w-full h-full object-cover" />}
                      </div>
                    ))}
                  </div>
                  <div className="text-base font-extrabold text-sale">{o.currency} {Number(o.total).toFixed(2)}</div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </main>
      <SiteFooter />
    </div>
  );
}
