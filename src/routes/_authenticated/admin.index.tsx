import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useCurrency } from "@/lib/currency";
import { useAdminI18n, statusLabel } from "@/lib/i18n-admin";
import {
  Store, Package, ShoppingBag, Users, DollarSign, AlertCircle, Loader2,
  TrendingUp, ArrowUpRight, Activity, Plus, ListTree, Settings as SettingsIcon,
  Sparkles, Zap, Eye, Layers,
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
  const { format } = useCurrency();
  const { L } = useAdminI18n();
  const [stats, setStats] = useState<Stats | null>(null);
  const [recent, setRecent] = useState<RecentOrder[]>([]);
  const [topProducts, setTopProducts] = useState<{ id: string; title: string; sales_count: number; price: number; currency: string }[]>([]);
  const [dailyRevenue, setDailyRevenue] = useState<number[]>([]);

  useEffect(() => {
    (async () => {
      const sinceISO = new Date(Date.now() - 30 * 86400000).toISOString();
      const [v, vp, p, pa, o, op, ur, rev, rev30, ro, tp, rd] = await Promise.all([
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
        supabase.from("orders").select("total, created_at").gte("created_at", sinceISO),
      ]);

      const uniqueUsers = new Set((ur.data || []).map((r) => r.user_id)).size;
      const sum = (rows: { total: number }[] | null) => (rows || []).reduce((s, r) => s + Number(r.total || 0), 0);

      const days = 14;
      const buckets = Array(days).fill(0) as number[];
      const today = new Date(); today.setHours(0, 0, 0, 0);
      (rd.data || []).forEach((r: { total: number; created_at: string }) => {
        const d = new Date(r.created_at); d.setHours(0, 0, 0, 0);
        const idx = days - 1 - Math.floor((today.getTime() - d.getTime()) / 86400000);
        if (idx >= 0 && idx < days) buckets[idx] += Number(r.total || 0);
      });
      setDailyRevenue(buckets);

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
    return <div className="grid place-items-center py-32"><Loader2 className="w-6 h-6 animate-spin text-brand" /></div>;
  }

  const kpis = [
    { label: L.ovRevenue30, value: format(stats.revenue30), sub: `${L.ovTotal}: ${format(stats.revenue)}`, icon: DollarSign, accent: "brand", trend: "+12%" },
    { label: L.ovOrders, value: String(stats.orders), sub: `${stats.ordersPending} ${L.ovOrdersProcessing}`, icon: ShoppingBag, accent: "accent2", trend: stats.ordersPending > 0 ? L.ovAlert : L.ovStable },
    { label: L.ovProducts, value: String(stats.products), sub: `${stats.productsActive} ${L.ovProductsActive}`, icon: Package, accent: "brand", trend: `${stats.productsActive}/${stats.products}` },
    { label: L.ovVendors, value: String(stats.vendors), sub: `${stats.vendorsPending} ${L.ovVendorsPending}`, icon: Store, accent: "accent2", trend: stats.vendorsPending > 0 ? L.ovReview : L.ovOk },
  ];

  const statusStyle: Record<string, string> = {
    pending: "bg-brand/15 text-brand border-brand/30",
    processing: "bg-accent2/15 text-accent2 border-accent2/30",
    paid: "bg-brand/20 text-brand border-brand/40",
    shipped: "bg-accent2/20 text-accent2 border-accent2/40",
    completed: "bg-brand/25 text-brand border-brand/40",
    cancelled: "bg-destructive/15 text-destructive border-destructive/30",
  };

  const maxRev = Math.max(1, ...dailyRevenue);

  return (
    <div className="space-y-6">
      <div className="relative overflow-hidden rounded-2xl bg-gradient-hero text-foreground p-6 md:p-10 border border-border shadow-card">
        <div className="absolute -top-32 -end-32 w-96 h-96 rounded-full bg-brand/20 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-32 -start-32 w-96 h-96 rounded-full bg-accent2/20 blur-3xl pointer-events-none" />
        <div className="relative flex flex-wrap items-end justify-between gap-6">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand/10 border border-brand/30 text-brand text-[11px] uppercase tracking-[0.25em] font-bold font-mono">
              <Sparkles className="w-3 h-3" /> {L.ovTagline}
            </div>
            <h1 className="mt-4 text-3xl md:text-5xl font-extrabold tracking-tight">
              {L.ovWelcome} <span className="bg-gradient-brand bg-clip-text text-transparent">VIP STAR</span>
            </h1>
            <p className="mt-3 text-sm md:text-base text-muted-foreground max-w-xl">{L.ovSub}</p>
          </div>
          <div className="flex gap-2 flex-wrap">
            <Link to="/admin/products" className="inline-flex items-center gap-1.5 h-11 px-5 rounded-xl bg-gradient-brand text-brand-foreground text-sm font-bold hover:opacity-90 shadow-glow transition-smooth">
              <Plus className="w-4 h-4" /> {L.ovNewProduct}
            </Link>
            <Link to="/admin/settings" className="inline-flex items-center gap-1.5 h-11 px-5 rounded-xl bg-card/60 backdrop-blur text-foreground text-sm font-semibold hover:bg-card border border-border transition-smooth">
              <SettingsIcon className="w-4 h-4" /> {L.ovSiteSettings}
            </Link>
            <Link to="/" className="inline-flex items-center gap-1.5 h-11 px-5 rounded-xl bg-card/40 text-foreground text-sm font-semibold hover:bg-card border border-border transition-smooth">
              <Eye className="w-4 h-4" /> {L.ovPreview}
            </Link>
          </div>
        </div>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map((k) => (
          <div key={k.label} className="group relative overflow-hidden rounded-2xl bg-card border border-border p-5 hover:border-brand/40 hover:shadow-hover transition-smooth">
            <div className={`absolute -end-10 -top-10 w-32 h-32 rounded-full ${k.accent === "brand" ? "bg-brand/15" : "bg-accent2/15"} blur-2xl group-hover:scale-125 transition-transform duration-500`} />
            <div className="flex items-start justify-between relative">
              <div className={`w-11 h-11 rounded-xl ${k.accent === "brand" ? "bg-brand/15 text-brand" : "bg-accent2/15 text-accent2"} grid place-items-center border ${k.accent === "brand" ? "border-brand/30" : "border-accent2/30"}`}>
                <k.icon className="w-5 h-5" />
              </div>
              <span className="inline-flex items-center gap-1 text-[10px] px-2 py-1 rounded-full bg-accent/60 text-foreground font-semibold font-mono">
                <TrendingUp className="w-3 h-3" /> {k.trend}
              </span>
            </div>
            <div className="mt-4 text-[11px] text-muted-foreground font-semibold uppercase tracking-wider font-mono">{k.label}</div>
            <div className="mt-1 text-3xl font-extrabold text-foreground tracking-tight">{k.value}</div>
            <div className="text-xs text-muted-foreground mt-1">{k.sub}</div>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 relative overflow-hidden rounded-2xl bg-card border border-border p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <div className="flex items-center gap-2 text-[11px] uppercase tracking-widest text-muted-foreground font-mono font-semibold">
                <Zap className="w-3 h-3 text-brand" /> {L.ovLast14}
              </div>
              <h2 className="text-lg font-bold text-foreground mt-1">{L.ovRevenueCurve}</h2>
            </div>
            <div className="text-end">
              <div className="text-2xl font-extrabold bg-gradient-brand bg-clip-text text-transparent">{format(dailyRevenue.reduce((a, b) => a + b, 0))}</div>
              <div className="text-[11px] text-muted-foreground">{L.ovPeriodTotal}</div>
            </div>
          </div>
          <div className="flex items-end gap-1.5 h-32">
            {dailyRevenue.map((v, i) => (
              <div key={i} className="flex-1 group relative">
                <div
                  className="w-full rounded-t-md bg-gradient-to-t from-brand to-accent2 opacity-80 hover:opacity-100 transition-smooth"
                  style={{ height: `${(v / maxRev) * 100}%`, minHeight: v > 0 ? 4 : 2 }}
                />
                <div className="absolute -top-7 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 text-[10px] bg-foreground text-background px-1.5 py-0.5 rounded font-mono whitespace-nowrap pointer-events-none transition-smooth">
                  {format(v)}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-2xl bg-card border border-border p-5">
          <div className="flex items-center gap-2 text-[11px] uppercase tracking-widest text-muted-foreground font-mono font-semibold mb-4">
            <Layers className="w-3 h-3 text-accent2" /> {L.ovShortcuts}
          </div>
          <div className="space-y-2">
            {[
              { to: "/admin/products" as const, label: L.ovManageProducts, icon: Package },
              { to: "/admin/orders" as const, label: L.ovProcessOrders, icon: ShoppingBag },
              { to: "/admin/vendors" as const, label: L.ovApproveVendors, icon: Store },
              { to: "/admin/categories" as const, label: L.ovEditCats, icon: ListTree },
            ].map((q) => (
              <Link key={q.to} to={q.to} className="flex items-center gap-3 p-3 rounded-xl bg-accent/40 hover:bg-accent border border-border hover:border-brand/40 transition-smooth group">
                <div className="w-9 h-9 rounded-lg bg-card border border-border grid place-items-center text-brand">
                  <q.icon className="w-4 h-4" />
                </div>
                <div className="flex-1 text-sm font-semibold text-foreground">{q.label}</div>
                <ArrowUpRight className="w-4 h-4 text-muted-foreground group-hover:text-brand transition-smooth" />
              </Link>
            ))}
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 bg-card border border-border rounded-2xl overflow-hidden">
          <div className="px-5 py-4 border-b border-border flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Activity className="w-4 h-4 text-brand" />
              <h2 className="text-sm font-bold text-foreground">{L.ovRecentOrders}</h2>
            </div>
            <Link to="/admin/orders" className="text-xs text-brand hover:underline font-semibold">{L.ovViewAll}</Link>
          </div>
          {recent.length === 0 ? (
            <div className="p-12 text-center text-sm text-muted-foreground">{L.ovNoOrders}</div>
          ) : (
            <div className="divide-y divide-border">
              {recent.map((o) => (
                <Link key={o.id} to="/orders/$id" params={{ id: o.id }} className="flex items-center justify-between gap-3 px-5 py-3 hover:bg-accent/40 transition-smooth">
                  <div className="min-w-0">
                    <div className="text-sm font-semibold text-foreground truncate">{o.ship_full_name}</div>
                    <div className="text-[11px] text-muted-foreground font-mono">#{o.id.slice(0, 8)} · {new Date(o.created_at).toLocaleString()}</div>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold border ${statusStyle[o.status] || "bg-accent/60 text-foreground border-border"}`}>{statusLabel(L, o.status)}</span>
                    <div className="text-sm font-bold text-foreground font-mono">{format(Number(o.total))}</div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>

        <div className="bg-card border border-border rounded-2xl overflow-hidden">
          <div className="px-5 py-4 border-b border-border">
            <h2 className="text-sm font-bold text-foreground">{L.ovTopSelling}</h2>
            <p className="text-[11px] text-muted-foreground mt-0.5">{L.ovBySales}</p>
          </div>
          {topProducts.length === 0 ? (
            <div className="p-12 text-center text-sm text-muted-foreground">{L.ovNoData}</div>
          ) : (
            <div className="divide-y divide-border">
              {topProducts.map((p, i) => (
                <div key={p.id} className="flex items-center gap-3 px-5 py-3">
                  <div className="w-7 h-7 rounded-lg bg-gradient-brand grid place-items-center text-xs font-bold text-brand-foreground">{i + 1}</div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-foreground truncate">{p.title}</div>
                    <div className="text-[11px] text-muted-foreground">{p.sales_count} {L.ovSold}</div>
                  </div>
                  <div className="text-xs font-bold text-brand font-mono">{format(Number(p.price))}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {(stats.vendorsPending > 0 || stats.ordersPending > 0) && (
        <div className="grid sm:grid-cols-2 gap-3">
          {stats.vendorsPending > 0 && (
            <Link to="/admin/vendors" className="flex items-start gap-3 p-4 rounded-2xl bg-brand/10 border border-brand/30 hover:bg-brand/15 transition-smooth">
              <AlertCircle className="w-5 h-5 text-brand mt-0.5 shrink-0" />
              <div>
                <div className="text-sm font-bold text-foreground">{stats.vendorsPending} {L.ovVendorsAlert}</div>
                <div className="text-xs text-muted-foreground mt-0.5">{L.ovVendorsAlertSub}</div>
              </div>
            </Link>
          )}
          {stats.ordersPending > 0 && (
            <Link to="/admin/orders" className="flex items-start gap-3 p-4 rounded-2xl bg-accent2/10 border border-accent2/30 hover:bg-accent2/15 transition-smooth">
              <AlertCircle className="w-5 h-5 text-accent2 mt-0.5 shrink-0" />
              <div>
                <div className="text-sm font-bold text-foreground">{stats.ordersPending} {L.ovOrdersAlert}</div>
                <div className="text-xs text-muted-foreground mt-0.5">{L.ovOrdersAlertSub}</div>
              </div>
            </Link>
          )}
        </div>
      )}

      <div className="flex items-center gap-2 text-[11px] text-muted-foreground justify-center pt-4 font-mono">
        <Users className="w-3 h-3" /> {stats.users} {L.ovUsersTotal}
      </div>
    </div>
  );
}
