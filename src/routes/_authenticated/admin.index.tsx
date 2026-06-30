import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { formatPrice } from "@/lib/format";
import { Package, ShoppingBag, Users, DollarSign } from "lucide-react";

export const Route = createFileRoute("/_authenticated/admin/")({
  component: AdminDashboard,
});

function AdminDashboard() {
  const { data: stats } = useQuery({
    queryKey: ["admin-stats"],
    queryFn: async () => {
      const [products, orders, paidOrders, profiles] = await Promise.all([
        supabase.from("products").select("id", { count: "exact", head: true }),
        supabase.from("orders").select("id", { count: "exact", head: true }),
        supabase.from("orders").select("total").eq("payment_status", "succeeded"),
        supabase.from("profiles").select("id", { count: "exact", head: true }),
      ]);
      return {
        products: products.count ?? 0,
        orders: orders.count ?? 0,
        revenue: (paidOrders.data ?? []).reduce((s, o) => s + Number(o.total), 0),
        users: profiles.count ?? 0,
      };
    },
  });

  const { data: recent } = useQuery({
    queryKey: ["admin-recent-orders"],
    queryFn: async () => (await supabase.from("orders").select("*").order("created_at", { ascending: false }).limit(8)).data ?? [],
  });

  const cards = [
    { icon: DollarSign, label: "Revenue", value: formatPrice(stats?.revenue ?? 0) },
    { icon: ShoppingBag, label: "Orders", value: stats?.orders ?? 0 },
    { icon: Package, label: "Products", value: stats?.products ?? 0 },
    { icon: Users, label: "Users", value: stats?.users ?? 0 },
  ];

  return (
    <div className="space-y-6">
      <h1 className="font-display text-2xl font-bold">Dashboard</h1>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {cards.map((c) => (
          <div key={c.label} className="rounded-xl border border-cyan-500/10 bg-card p-4">
            <div className="flex items-center justify-between">
              <span className="text-xs uppercase text-muted-foreground">{c.label}</span>
              <c.icon className="h-4 w-4 text-cyan-400" />
            </div>
            <div className="mt-2 font-mono text-2xl font-bold text-cyan-400">{c.value}</div>
          </div>
        ))}
      </div>

      <div className="rounded-xl border border-cyan-500/10 bg-card">
        <div className="border-b border-cyan-500/10 p-4 font-semibold">Recent Orders</div>
        <div className="divide-y divide-cyan-500/10">
          {(recent ?? []).length === 0 && <div className="p-6 text-center text-muted-foreground">No orders yet</div>}
          {(recent ?? []).map((o) => (
            <div key={o.id} className="flex flex-wrap items-center gap-3 p-3 text-sm">
              <span className="font-mono text-cyan-400">{o.order_number}</span>
              <span className="text-muted-foreground">{o.buyer_email}</span>
              <span className="ms-auto rounded-full border border-cyan-500/20 px-2 py-0.5 text-xs">{o.status}</span>
              <span className="font-mono font-bold">{formatPrice(Number(o.total), o.currency)}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
