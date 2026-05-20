import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Store, Package, ShoppingBag, Users, DollarSign, AlertCircle, Loader2 } from "lucide-react";

export const Route = createFileRoute("/_authenticated/admin/")({
  component: AdminOverview,
});

type Stats = {
  vendors: number;
  vendorsPending: number;
  products: number;
  productsActive: number;
  orders: number;
  ordersPending: number;
  users: number;
  revenue: number;
};

function AdminOverview() {
  const [stats, setStats] = useState<Stats | null>(null);

  useEffect(() => {
    (async () => {
      const [v, vp, p, pa, o, op, ur, rev] = await Promise.all([
        supabase.from("vendors").select("id", { count: "exact", head: true }),
        supabase.from("vendors").select("id", { count: "exact", head: true }).eq("status", "pending"),
        supabase.from("products").select("id", { count: "exact", head: true }),
        supabase.from("products").select("id", { count: "exact", head: true }).eq("status", "active"),
        supabase.from("orders").select("id", { count: "exact", head: true }),
        supabase.from("orders").select("id", { count: "exact", head: true }).eq("status", "pending"),
        supabase.from("user_roles").select("user_id"),
        supabase.from("orders").select("total"),
      ]);

      const uniqueUsers = new Set((ur.data || []).map((r) => r.user_id)).size;
      const revenue = (rev.data || []).reduce((s, r: { total: number }) => s + Number(r.total || 0), 0);

      setStats({
        vendors: v.count || 0,
        vendorsPending: vp.count || 0,
        products: p.count || 0,
        productsActive: pa.count || 0,
        orders: o.count || 0,
        ordersPending: op.count || 0,
        users: uniqueUsers,
        revenue,
      });
    })();
  }, []);

  if (!stats) {
    return <div className="grid place-items-center py-16"><Loader2 className="w-6 h-6 animate-spin text-brand" /></div>;
  }

  const cards = [
    { label: "Vendors", value: stats.vendors, sub: `${stats.vendorsPending} pending`, icon: Store, to: "/admin/vendors", accent: "text-brand" },
    { label: "Products", value: stats.products, sub: `${stats.productsActive} active`, icon: Package, to: "/admin/products", accent: "text-emerald-600" },
    { label: "Orders", value: stats.orders, sub: `${stats.ordersPending} pending`, icon: ShoppingBag, to: "/admin/orders", accent: "text-amber-600" },
    { label: "Users", value: stats.users, sub: "with roles", icon: Users, to: "/admin/users", accent: "text-indigo-600" },
    { label: "GMV", value: `QAR ${stats.revenue.toFixed(0)}`, sub: "all-time", icon: DollarSign, to: "/admin/orders", accent: "text-sale" },
  ];

  return (
    <div>
      <h1 className="text-2xl font-bold text-foreground">Overview</h1>
      <p className="text-sm text-muted-foreground mt-1">Manage the entire marketplace from one place.</p>

      <div className="mt-6 grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {cards.map((c) => (
          <Link key={c.label} to={c.to} className="bg-card border border-border rounded-xl p-5 hover:border-brand transition-smooth">
            <div className="flex items-center justify-between">
              <div className="text-sm text-muted-foreground">{c.label}</div>
              <c.icon className={`w-4 h-4 ${c.accent}`} />
            </div>
            <div className="mt-2 text-2xl font-extrabold text-foreground">{c.value}</div>
            <div className="text-xs text-muted-foreground mt-1">{c.sub}</div>
          </Link>
        ))}
      </div>

      {stats.vendorsPending > 0 && (
        <div className="mt-6 bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-amber-600 mt-0.5" />
          <div className="flex-1">
            <div className="text-sm font-semibold text-amber-900">{stats.vendorsPending} vendor(s) awaiting approval</div>
            <Link to="/admin/vendors" className="text-xs text-amber-700 hover:underline">Review now →</Link>
          </div>
        </div>
      )}
    </div>
  );
}
