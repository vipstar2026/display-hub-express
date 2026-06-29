import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useCurrency } from "@/lib/currency";
import { useAdminI18n, statusLabel } from "@/lib/i18n-admin";
import {
  Store, Package, ShoppingBag, DollarSign, AlertCircle, Loader2,
  TrendingUp, TrendingDown, Activity, ArrowUpRight, Zap, Box,
  Clock, CheckCircle2, XCircle, BarChart3, Receipt, Sparkles,
} from "lucide-react";

export const Route = createFileRoute("/_authenticated/admin/")({
  component: AdminOverview,
});

type Stats = {
  vendors: number; vendorsPending: number;
  products: number; productsActive: number; productsLow: number;
  orders: number; ordersPending: number; ordersToday: number;
  users: number;
  revenue: number; revenue7: number; revenue30: number; revenuePrev30: number;
  aov: number; conversion: number;
  ticketsOpen: number;
};
type RecentOrder = { id: string; total: number; currency: string; status: string; ship_full_name: string; created_at: string };
type LowStock = { id: string; title: string; stock: number };

function Sparkline({ values, height = 36, accent = "var(--brand)" }: { values: number[]; height?: number; accent?: string }) {
  if (values.length < 2) return <div style={{ height }} />;
  const max = Math.max(1, ...values);
  const min = Math.min(...values);
  const range = max - min || 1;
  const step = 100 / (values.length - 1);
  const points = values.map((v, i) => `${i * step},${100 - ((v - min) / range) * 100}`).join(" ");
  const area = `0,100 ${points} 100,100`;
  return (
    <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="w-full" style={{ height }}>
      <defs>
        <linearGradient id="sparkfill" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor={accent} stopOpacity="0.35" />
          <stop offset="100%" stopColor={accent} stopOpacity="0" />
        </linearGradient>
      </defs>
      <polygon points={area} fill="url(#sparkfill)" />
      <polyline points={points} fill="none" stroke={accent} strokeWidth="1.6" vectorEffect="non-scaling-stroke" />
    </svg>
  );
}

function AdminOverview() {
  const { format } = useCurrency();
  const { L } = useAdminI18n();
  const [stats, setStats] = useState<Stats | null>(null);
  const [recent, setRecent] = useState<RecentOrder[]>([]);
  const [topProducts, setTopProducts] = useState<{ id: string; title: string; sales_count: number; price: number; currency: string }[]>([]);
  const [lowStock, setLowStock] = useState<LowStock[]>([]);
  const [dailyRevenue, setDailyRevenue] = useState<number[]>([]);
  const [ordersDaily, setOrdersDaily] = useState<number[]>([]);
  const [statusBreakdown, setStatusBreakdown] = useState<Record<string, number>>({});

  useEffect(() => {
    (async () => {
      const now = Date.now();
      const day = 86400000;
      const since30 = new Date(now - 30 * day).toISOString();
      const sincePrev30 = new Date(now - 60 * day).toISOString();
      const since7 = new Date(now - 7 * day).toISOString();
      const todayStart = new Date(); todayStart.setHours(0, 0, 0, 0);

      const [v, vp, p, pa, pLow, o, op, oToday, ur, revAll, rev7, rev30, revPrev, ro, tp, low, allOrders, ticketsOpen] = await Promise.all([
        supabase.from("vendors").select("id", { count: "exact", head: true }),
        supabase.from("vendors").select("id", { count: "exact", head: true }).eq("status", "pending"),
        supabase.from("products").select("id", { count: "exact", head: true }),
        supabase.from("products").select("id", { count: "exact", head: true }).eq("status", "active"),
        supabase.from("products").select("id", { count: "exact", head: true }).lt("stock", 5).eq("status", "active"),
        supabase.from("orders").select("id", { count: "exact", head: true }),
        supabase.from("orders").select("id", { count: "exact", head: true }).eq("status", "pending"),
        supabase.from("orders").select("id", { count: "exact", head: true }).gte("created_at", todayStart.toISOString()),
        supabase.from("user_roles").select("user_id"),
        supabase.from("orders").select("total"),
        supabase.from("orders").select("total").gte("created_at", since7),
        supabase.from("orders").select("total, created_at, status").gte("created_at", since30),
        supabase.from("orders").select("total").gte("created_at", sincePrev30).lt("created_at", since30),
        supabase.from("orders").select("id, total, currency, status, ship_full_name, created_at").order("created_at", { ascending: false }).limit(7),
        supabase.from("products").select("id, title, sales_count, price, currency").order("sales_count", { ascending: false }).limit(5),
        supabase.from("products").select("id, title, stock").lt("stock", 5).eq("status", "active").order("stock").limit(5),
        supabase.from("orders").select("status"),
        supabase.from("support_tickets").select("id", { count: "exact", head: true }).in("status", ["open", "in_progress"]),
      ]);

      const uniqueUsers = new Set((ur.data || []).map((r) => r.user_id)).size;
      const sum = (rows: { total: number }[] | null) => (rows || []).reduce((s, r) => s + Number(r.total || 0), 0);

      const days = 30;
      const revBuckets = Array(days).fill(0) as number[];
      const ordBuckets = Array(days).fill(0) as number[];
      const today0 = new Date(); today0.setHours(0, 0, 0, 0);
      (rev30.data || []).forEach((r: { total: number; created_at: string }) => {
        const d = new Date(r.created_at); d.setHours(0, 0, 0, 0);
        const idx = days - 1 - Math.floor((today0.getTime() - d.getTime()) / day);
        if (idx >= 0 && idx < days) { revBuckets[idx] += Number(r.total || 0); ordBuckets[idx] += 1; }
      });

      const breakdown: Record<string, number> = {};
      (allOrders.data || []).forEach((r: { status: string }) => { breakdown[r.status] = (breakdown[r.status] || 0) + 1; });

      const r7 = sum(rev7.data);
      const r30 = sum(rev30.data);
      const rp30 = sum(revPrev.data);
      const aov = (o.count || 0) > 0 ? sum(revAll.data) / (o.count || 1) : 0;
      const conversion = uniqueUsers > 0 ? ((o.count || 0) / uniqueUsers) * 100 : 0;

      setStats({
        vendors: v.count || 0, vendorsPending: vp.count || 0,
        products: p.count || 0, productsActive: pa.count || 0, productsLow: pLow.count || 0,
        orders: o.count || 0, ordersPending: op.count || 0, ordersToday: oToday.count || 0,
        users: uniqueUsers,
        revenue: sum(revAll.data), revenue7: r7, revenue30: r30, revenuePrev30: rp30,
        aov, conversion,
        ticketsOpen: ticketsOpen.count || 0,
      });
      setDailyRevenue(revBuckets);
      setOrdersDaily(ordBuckets);
      setRecent((ro.data as RecentOrder[]) || []);
      setTopProducts((tp.data as typeof topProducts) || []);
      setLowStock((low.data as LowStock[]) || []);
      setStatusBreakdown(breakdown);
    })();
  }, []);

  if (!stats) {
    return <div className="grid place-items-center py-32"><Loader2 className="w-6 h-6 animate-spin text-brand" /></div>;
  }

  const growth = stats.revenuePrev30 > 0
    ? ((stats.revenue30 - stats.revenuePrev30) / stats.revenuePrev30) * 100
    : (stats.revenue30 > 0 ? 100 : 0);

  const kpis = [
    {
      label: "REVENUE · 30D", value: format(stats.revenue30),
      sub: `vs prev: ${format(stats.revenuePrev30)}`,
      icon: DollarSign, accent: "var(--brand)", trend: growth, spark: dailyRevenue,
    },
    {
      label: "ORDERS · TOTAL", value: stats.orders.toLocaleString(),
      sub: `${stats.ordersToday} today · ${stats.ordersPending} pending`,
      icon: ShoppingBag, accent: "var(--accent2)", trend: null, spark: ordersDaily,
    },
    {
      label: "AOV", value: format(stats.aov),
      sub: `${stats.conversion.toFixed(1)}% conversion`,
      icon: Receipt, accent: "var(--brand)", trend: null, spark: dailyRevenue.map((v, i) => v / Math.max(1, ordersDaily[i])),
    },
    {
      label: "CATALOG", value: stats.products.toLocaleString(),
      sub: `${stats.productsActive} active · ${stats.productsLow} low stock`,
      icon: Box, accent: "var(--accent2)", trend: null, spark: null as number[] | null,
    },
  ];

  const statusStyle: Record<string, string> = {
    pending: "bg-amber-500/15 text-amber-400 border-amber-500/30",
    processing: "bg-blue-500/15 text-blue-400 border-blue-500/30",
    paid: "bg-cyan-500/15 text-cyan-400 border-cyan-500/30",
    shipped: "bg-violet-500/15 text-violet-400 border-violet-500/30",
    completed: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
    cancelled: "bg-rose-500/15 text-rose-400 border-rose-500/30",
  };

  const totalStatus = Object.values(statusBreakdown).reduce((a, b) => a + b, 0) || 1;
  const statusOrder = ["pending", "processing", "paid", "shipped", "completed", "cancelled"];
  const maxRev = Math.max(1, ...dailyRevenue);

  return (
    <div className="space-y-5">
      {/* Hero strip */}
      <div className="relative overflow-hidden rounded-2xl border border-border bg-card/40 backdrop-blur p-5 md:p-7">
        <div className="absolute -top-24 -end-24 w-80 h-80 rounded-full bg-brand/15 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -start-24 w-80 h-80 rounded-full bg-accent2/10 blur-3xl pointer-events-none" />
        <div className="relative flex flex-wrap items-end justify-between gap-6">
          <div>
            <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-[10px] uppercase tracking-[0.25em] font-bold font-mono">
              <Sparkles className="w-3 h-3" /> System Online
            </div>
            <h1 className="mt-3 text-2xl md:text-4xl font-extrabold tracking-tight text-foreground">
              مرحباً، <span className="bg-gradient-brand bg-clip-text text-transparent">القائد</span>
            </h1>
            <p className="mt-1.5 text-sm text-muted-foreground max-w-xl">
              نظرة شاملة على متجرك خلال آخر 30 يوماً — اضغط <kbd className="px-1.5 py-0.5 bg-accent/40 border border-border rounded font-mono text-[10px]">⌘K</kbd> لأي إجراء فوري.
            </p>
          </div>
          <div className="flex items-center gap-6">
            <div>
              <div className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">7D REVENUE</div>
              <div className="text-2xl font-extrabold text-foreground font-mono">{format(stats.revenue7)}</div>
            </div>
            <div className="h-12 w-px bg-border" />
            <div>
              <div className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">GROWTH</div>
              <div className={`text-2xl font-extrabold font-mono inline-flex items-center gap-1 ${growth >= 0 ? "text-emerald-400" : "text-rose-400"}`}>
                {growth >= 0 ? <TrendingUp className="w-5 h-5" /> : <TrendingDown className="w-5 h-5" />}
                {growth >= 0 ? "+" : ""}{growth.toFixed(1)}%
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* KPI grid */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {kpis.map((k) => (
          <div key={k.label} className="group relative overflow-hidden rounded-xl bg-card/60 backdrop-blur border border-border p-4 hover:border-brand/40 transition-smooth">
            <div className="flex items-start justify-between">
              <div className="w-9 h-9 rounded-lg grid place-items-center border" style={{ background: `color-mix(in oklab, ${k.accent} 12%, transparent)`, borderColor: `color-mix(in oklab, ${k.accent} 30%, transparent)`, color: k.accent }}>
                <k.icon className="w-4 h-4" />
              </div>
              {k.trend !== null && (
                <span className={`inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded font-bold font-mono ${k.trend >= 0 ? "bg-emerald-500/10 text-emerald-400" : "bg-rose-500/10 text-rose-400"}`}>
                  {k.trend >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                  {k.trend >= 0 ? "+" : ""}{k.trend.toFixed(1)}%
                </span>
              )}
            </div>
            <div className="mt-3 text-[10px] text-muted-foreground font-bold uppercase tracking-[0.18em] font-mono">{k.label}</div>
            <div className="mt-0.5 text-2xl font-extrabold text-foreground tracking-tight font-mono">{k.value}</div>
            <div className="text-[11px] text-muted-foreground mt-0.5 truncate">{k.sub}</div>
            {k.spark && k.spark.length > 1 && (
              <div className="mt-2 -mx-1"><Sparkline values={k.spark} accent={k.accent} /></div>
            )}
          </div>
        ))}
      </div>

      {/* Revenue chart + Status breakdown */}
      <div className="grid lg:grid-cols-3 gap-3">
        <div className="lg:col-span-2 rounded-xl bg-card/60 backdrop-blur border border-border p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <div className="text-[10px] uppercase tracking-[0.22em] text-muted-foreground font-mono font-bold">REVENUE · LAST 30 DAYS</div>
              <h2 className="text-lg font-bold text-foreground mt-0.5 font-mono">{format(stats.revenue30)}</h2>
            </div>
            <div className="flex items-center gap-1 text-[10px] font-mono text-muted-foreground">
              <span className="w-2 h-2 rounded-full bg-brand" /> Daily
            </div>
          </div>
          <div className="flex items-end gap-1 h-40">
            {dailyRevenue.map((v, i) => (
              <div key={i} className="flex-1 group relative">
                <div
                  className="w-full rounded-t-sm bg-gradient-to-t from-brand/40 to-brand opacity-90 hover:opacity-100 transition-smooth"
                  style={{ height: `${(v / maxRev) * 100}%`, minHeight: v > 0 ? 3 : 1 }}
                />
                <div className="absolute -top-8 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 text-[10px] bg-foreground text-background px-1.5 py-0.5 rounded font-mono whitespace-nowrap pointer-events-none transition-smooth z-10">
                  {format(v)}
                </div>
              </div>
            ))}
          </div>
          <div className="mt-2 flex justify-between text-[9px] font-mono text-muted-foreground/60">
            <span>-30d</span><span>-15d</span><span>today</span>
          </div>
        </div>

        <div className="rounded-xl bg-card/60 backdrop-blur border border-border p-5">
          <div className="flex items-center gap-2 text-[10px] uppercase tracking-[0.22em] text-muted-foreground font-mono font-bold mb-4">
            <BarChart3 className="w-3 h-3 text-accent2" /> ORDER STATUS
          </div>
          <div className="space-y-2.5">
            {statusOrder.filter((s) => statusBreakdown[s]).map((s) => {
              const count = statusBreakdown[s] || 0;
              const pct = (count / totalStatus) * 100;
              return (
                <div key={s}>
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="text-foreground capitalize font-medium">{statusLabel(L, s)}</span>
                    <span className="text-muted-foreground font-mono">{count} · {pct.toFixed(0)}%</span>
                  </div>
                  <div className="h-1.5 bg-accent/30 rounded-full overflow-hidden">
                    <div className={`h-full rounded-full ${statusStyle[s]?.split(" ")[0] || "bg-brand"}`} style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })}
            {Object.keys(statusBreakdown).length === 0 && (
              <div className="text-xs text-muted-foreground py-4 text-center">لا توجد طلبات بعد</div>
            )}
          </div>
        </div>
      </div>

      {/* Alerts row */}
      {(stats.vendorsPending > 0 || stats.ordersPending > 0 || stats.productsLow > 0 || stats.ticketsOpen > 0) && (
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {stats.ordersPending > 0 && (
            <Link to="/admin/orders" className="flex items-center gap-3 p-3.5 rounded-xl bg-amber-500/5 border border-amber-500/20 hover:border-amber-500/50 hover:bg-amber-500/10 transition-smooth">
              <Clock className="w-5 h-5 text-amber-400 shrink-0" />
              <div className="min-w-0 flex-1">
                <div className="text-sm font-bold text-foreground">{stats.ordersPending} طلب معلّق</div>
                <div className="text-[11px] text-muted-foreground truncate">يحتاج معالجة</div>
              </div>
              <ArrowUpRight className="w-4 h-4 text-amber-400" />
            </Link>
          )}
          {stats.vendorsPending > 0 && (
            <Link to="/admin/vendors" className="flex items-center gap-3 p-3.5 rounded-xl bg-cyan-500/5 border border-cyan-500/20 hover:border-cyan-500/50 hover:bg-cyan-500/10 transition-smooth">
              <Store className="w-5 h-5 text-cyan-400 shrink-0" />
              <div className="min-w-0 flex-1">
                <div className="text-sm font-bold text-foreground">{stats.vendorsPending} بائع للمراجعة</div>
                <div className="text-[11px] text-muted-foreground truncate">في انتظار الموافقة</div>
              </div>
              <ArrowUpRight className="w-4 h-4 text-cyan-400" />
            </Link>
          )}
          {stats.productsLow > 0 && (
            <Link to="/admin/products" className="flex items-center gap-3 p-3.5 rounded-xl bg-rose-500/5 border border-rose-500/20 hover:border-rose-500/50 hover:bg-rose-500/10 transition-smooth">
              <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" />
              <div className="min-w-0 flex-1">
                <div className="text-sm font-bold text-foreground">{stats.productsLow} منتج بمخزون منخفض</div>
                <div className="text-[11px] text-muted-foreground truncate">أقل من 5 قطع</div>
              </div>
              <ArrowUpRight className="w-4 h-4 text-rose-400" />
            </Link>
          )}
          {stats.ticketsOpen > 0 && (
            <Link to="/admin/support" className="flex items-center gap-3 p-3.5 rounded-xl bg-violet-500/5 border border-violet-500/20 hover:border-violet-500/50 hover:bg-violet-500/10 transition-smooth">
              <Zap className="w-5 h-5 text-violet-400 shrink-0" />
              <div className="min-w-0 flex-1">
                <div className="text-sm font-bold text-foreground">{stats.ticketsOpen} تذكرة دعم مفتوحة</div>
                <div className="text-[11px] text-muted-foreground truncate">تحتاج رد</div>
              </div>
              <ArrowUpRight className="w-4 h-4 text-violet-400" />
            </Link>
          )}
        </div>
      )}

      {/* Recent orders + top products + low stock */}
      <div className="grid lg:grid-cols-3 gap-3">
        <div className="lg:col-span-2 bg-card/60 backdrop-blur border border-border rounded-xl overflow-hidden">
          <div className="px-5 py-3 border-b border-border flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Activity className="w-4 h-4 text-brand" />
              <h2 className="text-sm font-bold text-foreground">آخر الطلبات</h2>
            </div>
            <Link to="/admin/orders" className="text-xs text-brand hover:underline font-semibold inline-flex items-center gap-1">عرض الكل <ArrowUpRight className="w-3 h-3" /></Link>
          </div>
          {recent.length === 0 ? (
            <div className="p-12 text-center text-sm text-muted-foreground">لا توجد طلبات بعد</div>
          ) : (
            <div className="divide-y divide-border">
              {recent.map((o) => (
                <Link key={o.id} to="/orders/$id" params={{ id: o.id }} className="flex items-center justify-between gap-3 px-5 py-3 hover:bg-accent/30 transition-smooth">
                  <div className="min-w-0 flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-accent/40 border border-border grid place-items-center shrink-0">
                      <ShoppingBag className="w-3.5 h-3.5 text-muted-foreground" />
                    </div>
                    <div className="min-w-0">
                      <div className="text-sm font-semibold text-foreground truncate">{o.ship_full_name}</div>
                      <div className="text-[10px] text-muted-foreground font-mono">#{o.id.slice(0, 8)} · {new Date(o.created_at).toLocaleString()}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold border ${statusStyle[o.status] || "bg-accent text-foreground border-border"}`}>{statusLabel(L, o.status)}</span>
                    <div className="text-sm font-bold text-foreground font-mono">{format(Number(o.total))}</div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>

        <div className="space-y-3">
          <div className="bg-card/60 backdrop-blur border border-border rounded-xl overflow-hidden">
            <div className="px-5 py-3 border-b border-border flex items-center gap-2">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              <h2 className="text-sm font-bold text-foreground">الأكثر مبيعاً</h2>
            </div>
            {topProducts.length === 0 ? (
              <div className="p-8 text-center text-xs text-muted-foreground">لا توجد بيانات</div>
            ) : (
              <div className="divide-y divide-border">
                {topProducts.map((p, i) => (
                  <div key={p.id} className="flex items-center gap-3 px-4 py-2.5">
                    <div className="w-6 h-6 rounded-md bg-gradient-brand grid place-items-center text-[10px] font-bold text-brand-foreground font-mono shrink-0">{i + 1}</div>
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-medium text-foreground truncate">{p.title}</div>
                      <div className="text-[10px] text-muted-foreground font-mono">{p.sales_count} مبيعات</div>
                    </div>
                    <div className="text-[11px] font-bold text-brand font-mono">{format(Number(p.price))}</div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="bg-card/60 backdrop-blur border border-border rounded-xl overflow-hidden">
            <div className="px-5 py-3 border-b border-border flex items-center gap-2">
              <XCircle className="w-3.5 h-3.5 text-rose-400" />
              <h2 className="text-sm font-bold text-foreground">مخزون منخفض</h2>
            </div>
            {lowStock.length === 0 ? (
              <div className="p-8 text-center text-xs text-muted-foreground">المخزون بحالة جيدة ✓</div>
            ) : (
              <div className="divide-y divide-border">
                {lowStock.map((p) => (
                  <div key={p.id} className="flex items-center gap-3 px-4 py-2.5">
                    <Package className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                    <div className="flex-1 min-w-0 text-xs font-medium text-foreground truncate">{p.title}</div>
                    <span className={`text-[10px] px-1.5 py-0.5 rounded font-mono font-bold ${p.stock === 0 ? "bg-rose-500/15 text-rose-400" : "bg-amber-500/15 text-amber-400"}`}>
                      {p.stock} pcs
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
