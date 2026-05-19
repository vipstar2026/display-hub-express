import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { toast } from "sonner";
import { Loader2, Package } from "lucide-react";

export const Route = createFileRoute("/_authenticated/sell/orders")({
  component: VendorOrdersPage,
  head: () => ({ meta: [{ title: "Vendor Orders | VIP STAR" }] }),
});

type Item = {
  id: string;
  title: string;
  image_url: string | null;
  price: number;
  qty: number;
  status: string;
  vendor_id: string;
  order_id: string;
  created_at: string;
  orders: {
    id: string;
    ship_full_name: string;
    ship_phone: string;
    ship_city: string;
    ship_country: string;
    payment_method: string;
    currency: string;
  };
};

const STATUSES = ["pending", "processing", "shipped", "delivered", "cancelled"] as const;

function VendorOrdersPage() {
  const { user } = useAuth();
  const [vendorId, setVendorId] = useState<string | null>(null);
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data: v } = await supabase.from("vendors").select("id").eq("owner_id", user.id).maybeSingle();
      if (!v) { setLoading(false); return; }
      setVendorId(v.id);
      const { data } = await supabase
        .from("order_items")
        .select("*, orders(id, ship_full_name, ship_phone, ship_city, ship_country, payment_method, currency)")
        .eq("vendor_id", v.id)
        .order("created_at", { ascending: false });
      setItems((data as Item[]) || []);
      setLoading(false);
    })();
  }, [user]);

  async function updateStatus(id: string, status: string) {
    const { error } = await supabase.from("order_items").update({ status }).eq("id", id);
    if (error) return toast.error(error.message);
    setItems((prev) => prev.map((it) => (it.id === id ? { ...it, status } : it)));
    toast.success("Status updated");
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <SiteHeader />
      <main className="flex-1 mx-auto max-w-6xl w-full px-4 py-8">
        <div className="flex items-center justify-between flex-wrap gap-3 mb-6">
          <h1 className="text-2xl font-bold text-foreground">Incoming Orders</h1>
          <Link to="/sell/dashboard" className="text-sm text-brand hover:underline">← Dashboard</Link>
        </div>

        {loading ? (
          <div className="grid place-items-center py-16"><Loader2 className="w-6 h-6 animate-spin text-brand" /></div>
        ) : !vendorId ? (
          <div className="bg-card border border-border rounded-xl p-10 text-center">
            <p className="text-foreground">You don't have a store yet.</p>
            <Link to="/sell/register" className="mt-4 inline-block text-brand hover:underline">Register your store</Link>
          </div>
        ) : items.length === 0 ? (
          <div className="bg-card border border-border rounded-xl p-10 text-center">
            <Package className="w-10 h-10 text-muted-foreground mx-auto" />
            <p className="mt-3 text-foreground">No orders for your products yet.</p>
          </div>
        ) : (
          <div className="bg-card border border-border rounded-xl overflow-hidden divide-y divide-border">
            {items.map((it) => (
              <div key={it.id} className="p-4 grid gap-3 sm:grid-cols-[64px_1fr_auto] items-center">
                <div className="w-16 h-16 rounded bg-secondary overflow-hidden">
                  {it.image_url && <img src={it.image_url} alt="" className="w-full h-full object-cover" />}
                </div>
                <div className="min-w-0">
                  <div className="text-sm font-medium text-foreground line-clamp-1">{it.title}</div>
                  <div className="text-xs text-muted-foreground mt-1">
                    {it.orders.ship_full_name} · {it.orders.ship_phone} · {it.orders.ship_city}, {it.orders.ship_country}
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">
                    {it.orders.currency} {Number(it.price).toFixed(2)} × {it.qty} · {it.orders.payment_method.toUpperCase()} · {new Date(it.created_at).toLocaleDateString()}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <select
                    value={it.status}
                    onChange={(e) => updateStatus(it.id, e.target.value)}
                    className="h-9 rounded-md border border-border bg-background px-2 text-sm capitalize focus:border-brand outline-none"
                  >
                    {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
                  </select>
                  <Link to="/orders/$id" params={{ id: it.order_id }} className="text-xs text-brand hover:underline">View</Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
      <SiteFooter />
    </div>
  );
}
