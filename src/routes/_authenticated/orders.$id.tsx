import { createFileRoute, Link, useParams } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, MapPin, CreditCard, Package } from "lucide-react";

export const Route = createFileRoute("/_authenticated/orders/$id")({
  component: OrderDetailPage,
  head: () => ({ meta: [{ title: "Order details | VIP STAR" }] }),
});

type Order = {
  id: string;
  status: string;
  subtotal: number;
  shipping: number;
  total: number;
  currency: string;
  payment_method: string;
  ship_full_name: string;
  ship_phone: string;
  ship_line1: string;
  ship_line2: string | null;
  ship_city: string;
  ship_country: string;
  notes: string | null;
  created_at: string;
  order_items: {
    id: string;
    title: string;
    image_url: string | null;
    price: number;
    qty: number;
    status: string;
    vendor_id: string;
    product_id: string;
  }[];
};

function OrderDetailPage() {
  const { id } = useParams({ from: "/_authenticated/orders/$id" });
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from("orders")
        .select("*, order_items(*)")
        .eq("id", id)
        .maybeSingle();
      setOrder(data as Order | null);
      setLoading(false);
    })();
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <SiteHeader />
        <main className="flex-1 grid place-items-center"><Loader2 className="w-6 h-6 animate-spin text-brand" /></main>
        <SiteFooter />
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <SiteHeader />
        <main className="flex-1 mx-auto max-w-3xl w-full px-4 py-16 text-center">
          <h1 className="text-xl font-bold">Order not found</h1>
          <Link to="/orders" className="mt-4 inline-block text-brand hover:underline">Back to orders</Link>
        </main>
        <SiteFooter />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <SiteHeader />
      <main className="flex-1 mx-auto max-w-5xl w-full px-4 py-8">
        <Link to="/orders" className="text-sm text-brand hover:underline">← All orders</Link>
        <div className="mt-3 flex items-center justify-between flex-wrap gap-2">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Order #{order.id.slice(0, 8)}</h1>
            <div className="text-sm text-muted-foreground">{new Date(order.created_at).toLocaleString()}</div>
          </div>
          <span className="text-xs px-3 py-1 rounded-full bg-accent text-brand font-semibold capitalize">{order.status}</span>
        </div>

        <div className="mt-6 grid gap-4 lg:grid-cols-[1fr_320px]">
          <section className="bg-card border border-border rounded-xl p-5">
            <h2 className="flex items-center gap-2 font-semibold text-foreground"><Package className="w-4 h-4 text-brand" /> Items</h2>
            <div className="mt-3 divide-y divide-border">
              {order.order_items.map((it) => (
                <div key={it.id} className="py-3 flex gap-3 items-center">
                  <div className="w-16 h-16 rounded bg-secondary overflow-hidden shrink-0">
                    {it.image_url && <img src={it.image_url} alt="" className="w-full h-full object-cover" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-foreground line-clamp-2">{it.title}</div>
                    <div className="text-xs text-muted-foreground mt-1">{order.currency} {Number(it.price).toFixed(2)} × {it.qty}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-bold text-sale">{order.currency} {(it.price * it.qty).toFixed(2)}</div>
                    <span className="mt-1 inline-block text-[10px] px-2 py-0.5 rounded-full bg-accent text-brand capitalize">{it.status}</span>
                  </div>
                </div>
              ))}
            </div>
          </section>

          <aside className="space-y-4">
            <div className="bg-card border border-border rounded-xl p-5">
              <h2 className="flex items-center gap-2 font-semibold text-foreground"><MapPin className="w-4 h-4 text-brand" /> Shipping</h2>
              <div className="mt-2 text-sm text-foreground">
                <div className="font-medium">{order.ship_full_name}</div>
                <div className="text-muted-foreground">{order.ship_phone}</div>
                <div className="text-muted-foreground mt-1">{order.ship_line1}{order.ship_line2 ? `, ${order.ship_line2}` : ""}</div>
                <div className="text-muted-foreground">{order.ship_city}, {order.ship_country}</div>
              </div>
            </div>

            <div className="bg-card border border-border rounded-xl p-5">
              <h2 className="flex items-center gap-2 font-semibold text-foreground"><CreditCard className="w-4 h-4 text-brand" /> Payment</h2>
              <div className="mt-2 text-sm capitalize text-foreground">{order.payment_method === "cod" ? "Cash on Delivery" : order.payment_method}</div>
              <div className="mt-4 space-y-1 text-sm">
                <div className="flex justify-between"><span className="text-muted-foreground">Subtotal</span><span>{order.currency} {Number(order.subtotal).toFixed(2)}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Shipping</span><span>{order.shipping === 0 ? "Free" : `${order.currency} ${order.shipping}`}</span></div>
                <div className="border-t border-border pt-2 mt-1 flex justify-between text-base">
                  <span className="font-bold">Total</span><span className="font-extrabold text-sale">{order.currency} {Number(order.total).toFixed(2)}</span>
                </div>
              </div>
            </div>

            {order.notes && (
              <div className="bg-card border border-border rounded-xl p-5">
                <h2 className="font-semibold text-foreground">Notes</h2>
                <p className="mt-2 text-sm text-muted-foreground whitespace-pre-wrap">{order.notes}</p>
              </div>
            )}
          </aside>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
