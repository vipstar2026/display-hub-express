import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  Store, Package, ShoppingBag, Users, DollarSign, AlertCircle, Loader2,
  TrendingUp, ArrowUpRight, Activity, Plus, ListTree, Settings as SettingsIcon,
} from "lucide-react";

export const Route = createFileRoute("/_authenticated/admin/")({
  component: AdminOverview,
});

type Stats = {
  vendors: number; vendorsPending: number;
  products: number; productsActive: number;
  orders: number; ordersPending: number;
  users: number; revenue: number; revenue30: number;
};

type RecentOrder = {
  id: string; total: number; currency: string; status: string;
  ship_full_name: string; created_at: string;
};

function AdminOverview() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [recent, setRecent] = useState<RecentOrder[]>([]);
  const [topProducts, setTopProducts] = useState<{ id: string; title: string; sales_count: number; price: number; currency: string }[]>([]);

  useEffect(() => {
    (async () => {
      const sinceISO = new Date(Date.now() - 30 * 86400000).toISOString();
      const [v, vp, p, pa, o, op, ur, rev, rev30, ro, tp] = await Promise.all([
        supabase.from("vendors").select("id", { count: "exact", head: true }),
        supabase.from("vendors").select("id", { count: "exact", head: true }).eq("status", "pending"),
        supabase.from("products").select("id", { count: "exact", head: true }),
        supabase.from("products").select("id", { count: "exact", head: true }).eq("status", "active"),
        supabase.from("orders").select("id", { count: "exact", head: true }),
        supabase.from("orders").select("id", { count: "exact", head: true }).eq("status", "pending"),
        supabase.from("user_roles").select("user_id"),
        supabase.from("orders").select("total"),
        supabase.from("orders").select("total").gte("created_at", sinceISO),
        supabase.from("orders").select("id, total, currency, status, ship_full_name, created_at").order("created_at", { ascending: false }).limit(6),
        supabase.from("products").select("id, title, sales_count, price, currency").order("sales_count", { ascending: false }).limit(5),
      ]);

      const uniqueUsers = new Set((ur.data || []).map((r) => r.user_id)).size;
      const sum = (rows: { total: number }[] | null) => (rows || []).reduce((s, r) => s + Number(r.total || 0), 0);

      setStats({
        vendors: v.count || 0, vendorsPending: vp.count || 0,
        products: p.count || 0, productsActive: pa.count || 0,
        orders: o.count || 0, ordersPending: op.count || 0,
        users: uniqueUsers, revenue: sum(rev.data), revenue30: sum(rev30.data),
      });
      setRecent((ro.data as RecentOrder[]) || []);
      setTopProducts((tp.data as typeof topProducts) || []);
    })();
  }, []);

  if (!stats) {
    return <div className="grid place-items-center py-32"><Loader2 className="w-6 h-6 animate-spin text-amber-500" /></div>;
  }

  const kpis = [
    { label: "Revenue (30d)", value: `QAR ${stats.revenue30.toFixed(0)}`, sub: `All-time: QAR ${stats.revenue.toFixed(0)}`, icon: DollarSign, gradient: "from-emerald-500 to-teal-600", trend: "+12%" },
    { label: "Orders", value: stats.orders, sub: `${stats.ordersPending} pending`, icon: ShoppingBag, gradient: "from-amber-500 to-orange-600", trend: stats.ordersPending > 0 ? "Action" : "Stable" },
    { label: "Products", value: stats.products, sub: `${stats.productsActive} active`, icon: Package, gradient: "from-indigo-500 to-purple-600", trend: `${stats.productsActive}/${stats.products}` },
    { label: "Vendors", value: stats.vendors, sub: `${stats.vendorsPending} pending review`, icon: Store, gradient: "from-rose-500 to-pink-600", trend: stats.vendorsPending > 0 ? "Review" : "OK" },
  ];

  const statusColor: Record<string, string> = {
    pending: "bg-amber-100 text-amber-700",
    processing: "bg-blue-100 text-blue-700",
    paid: "bg-emerald-100 text-emerald-700",
    shipped: "bg-indigo-100 text-indigo-700",
    completed: "bg-green-100 text-green-700",
    cancelled: "bg-rose-100 text-rose-700",
  };

  return (
    <div className="space-y-6">
      {/* Hero */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white p-6 md:p-8 border border-slate-800">
        <div className="absolute -top-20 -right-20 w-72 h-72 rounded-full bg-amber-500/20 blur-3xl" />
        <div className="absolute -bottom-20 -left-20 w-72 h-72 rounded-full bg-indigo-500/10 blur-3xl" />
        <div className="relative flex flex-wrap items-end justify-between gap-4">
          <div>
            <div className="text-[11px] uppercase tracking-[0.25em] text-amber-400 font-bold">Dashboard</div>
            <h1 className="mt-2 text-3xl md:text-4xl font-extrabold tracking-tight">Welcome back, Admin</h1>
            <p className="mt-2 text-sm text-slate-300 max-w-xl">Manage your entire marketplace — vendors, products, orders, users, and site content — from one professional console.</p>
          </div>
          <div className="flex gap-2">
            <Link to="/admin/products" className="inline-flex items-center gap-1.5 h-10 px-4 rounded-lg bg-amber-400 text-slate-900 text-sm font-bold hover:bg-amber-300 transition">
              <Plus className="w-4 h-4" /> New product
            </Link>
            <Link to="/admin/settings" className="inline-flex items-center gap-1.5 h-10 px-4 rounded-lg bg-white/10 text-white text-sm font-semibold hover:bg-white/20 border border-white/10 transition">
              <SettingsIcon className="w-4 h-4" /> Site settings
            </Link>
          </div>
        </div>
      </div>

      {/* KPI cards */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map((k) => (
          <div key={k.label} className="group relative overflow-hidden rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 hover:shadow-lg transition">
            <div className={`absolute -right-8 -top-8 w-28 h-28 rounded-full bg-gradient-to-br ${k.gradient} opacity-10 group-hover:opacity-20 transition`} />
            <div className="flex items-start justify-between relative">
              <div className={`w-11 h-11 rounded-lg bg-gradient-to-br ${k.gradient} text-white grid place-items-center shadow-md`}>
                <k.icon className="w-5 h-5" />
              </div>
              <span className="inline-flex items-center gap-1 text-[10px] px-2 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-semibold">
                <TrendingUp className="w-3 h-3" /> {k.trend}
              </span>
            </div>
            <div className="mt-4 text-xs text-slate-500 dark:text-slate-400 font-medium uppercase tracking-wide">{k.label}</div>
            <div className="mt-1 text-2xl font-extrabold text-slate-900 dark:text-white">{k.value}</div>
            <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">{k.sub}</div>
          </div>
        ))}
      </div>

      {/* Quick actions */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { to: "/admin/products" as const, label: "Manage Products", icon: Package, color: "text-indigo-600 bg-indigo-50" },
          { to: "/admin/orders" as const, label: "Process Orders", icon: ShoppingBag, color: "text-amber-600 bg-amber-50" },
          { to: "/admin/vendors" as const, label: "Approve Vendors", icon: Store, color: "text-rose-600 bg-rose-50" },
          { to: "/admin/categories" as const, label: "Edit Categories", icon: ListTree, color: "text-emerald-600 bg-emerald-50" },
        ].map((q) => (
          <Link key={q.to} to={q.to} className="flex items-center gap-3 p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-amber-400 hover:shadow-md transition group">
            <div className={`w-10 h-10 rounded-lg grid place-items-center ${q.color}`}><q.icon className="w-5 h-5" /></div>
            <div className="flex-1 text-sm font-semibold text-slate-800 dark:text-slate-100">{q.label}</div>
            <ArrowUpRight className="w-4 h-4 text-slate-400 group-hover:text-amber-500 transition" />
          </Link>
        ))}
      </div>

      {/* Recent activity + top products */}
      <div className="grid lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Activity className="w-4 h-4 text-amber-500" />
              <h2 className="text-sm font-bold text-slate-900 dark:text-white">Recent orders</h2>
            </div>
            <Link to="/admin/orders" className="text-xs text-amber-600 hover:underline font-semibold">View all →</Link>
          </div>
          {recent.length === 0 ? (
            <div className="p-10 text-center text-sm text-slate-500">No orders yet.</div>
          ) : (
            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              {recent.map((o) => (
                <Link key={o.id} to="/orders/$id" params={{ id: o.id }} className="flex items-center justify-between gap-3 px-5 py-3 hover:bg-slate-50 dark:hover:bg-slate-800/50">
                  <div className="min-w-0">
                    <div className="text-sm font-semibold text-slate-900 dark:text-white truncate">{o.ship_full_name}</div>
                    <div className="text-[11px] text-slate-500 font-mono">#{o.id.slice(0, 8)} · {new Date(o.created_at).toLocaleString()}</div>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold capitalize ${statusColor[o.status] || "bg-slate-100 text-slate-700"}`}>{o.status}</span>
                    <div className="text-sm font-bold text-slate-900 dark:text-white">{o.currency} {Number(o.total).toFixed(2)}</div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-200 dark:border-slate-800">
            <h2 className="text-sm font-bold text-slate-900 dark:text-white">Top products</h2>
            <p className="text-[11px] text-slate-500 mt-0.5">By total sales</p>
          </div>
          {topProducts.length === 0 ? (
            <div className="p-10 text-center text-sm text-slate-500">No data.</div>
          ) : (
            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              {topProducts.map((p, i) => (
                <div key={p.id} className="flex items-center gap-3 px-5 py-3">
                  <div className="w-7 h-7 rounded-md bg-gradient-to-br from-amber-400 to-amber-600 grid place-items-center text-xs font-bold text-slate-900">{i + 1}</div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-slate-900 dark:text-white truncate">{p.title}</div>
                    <div className="text-[11px] text-slate-500">{p.sales_count} sold</div>
                  </div>
                  <div className="text-xs font-bold text-emerald-600">{p.currency} {Number(p.price).toFixed(0)}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Alerts */}
      {(stats.vendorsPending > 0 || stats.ordersPending > 0) && (
        <div className="grid sm:grid-cols-2 gap-3">
          {stats.vendorsPending > 0 && (
            <Link to="/admin/vendors" className="flex items-start gap-3 p-4 rounded-xl bg-amber-50 border border-amber-200 hover:bg-amber-100 transition">
              <AlertCircle className="w-5 h-5 text-amber-600 mt-0.5 shrink-0" />
              <div>
                <div className="text-sm font-bold text-amber-900">{stats.vendorsPending} vendor(s) awaiting approval</div>
                <div className="text-xs text-amber-700 mt-0.5">Review and approve new sellers →</div>
              </div>
            </Link>
          )}
          {stats.ordersPending > 0 && (
            <Link to="/admin/orders" className="flex items-start gap-3 p-4 rounded-xl bg-blue-50 border border-blue-200 hover:bg-blue-100 transition">
              <AlertCircle className="w-5 h-5 text-blue-600 mt-0.5 shrink-0" />
              <div>
                <div className="text-sm font-bold text-blue-900">{stats.ordersPending} order(s) pending</div>
                <div className="text-xs text-blue-700 mt-0.5">Process and update fulfillment →</div>
              </div>
            </Link>
          )}
        </div>
      )}

      <div className="flex items-center gap-2 text-[11px] text-slate-400 justify-center pt-4">
        <Users className="w-3 h-3" /> {stats.users} registered users across the platform
      </div>
    </div>
  );
}
