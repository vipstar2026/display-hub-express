import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { formatPrice } from "@/lib/format";
import { useI18n, localizedName } from "@/lib/i18n";
import {
  Package, ShoppingBag, Users, DollarSign, TrendingUp, TrendingDown,
  AlertTriangle, Plus, FolderTree, Eye, ArrowRight, Clock,
} from "lucide-react";
import {
  ResponsiveContainer, AreaChart, Area, XAxis, Tooltip, CartesianGrid,
  PieChart, Pie, Cell,
} from "recharts";
import { format, subDays, startOfDay } from "date-fns";

export const Route = createFileRoute("/_authenticated/admin/")({
  component: AdminDashboard,
});

const STATUS_COLORS: Record<string, string> = {
  pending: "#f59e0b",
  paid: "#10b981",
  processing: "#06b6d4",
  shipped: "#3b82f6",
  delivered: "#22c55e",
  cancelled: "#ef4444",
  refunded: "#a855f7",
};

function AdminDashboard() {
  const { t, lang } = useI18n();

  const { data: stats } = useQuery({
    queryKey: ["admin-stats-v2"],
    queryFn: async () => {
      const since14 = subDays(startOfDay(new Date()), 13).toISOString();
      const since28 = subDays(startOfDay(new Date()), 27).toISOString();
      const todayStart = startOfDay(new Date()).toISOString();

      const [products, ordersAll, paid, profiles, ordersWindow, todayOrders, pending] = await Promise.all([
        supabase.from("products").select("id", { count: "exact", head: true }),
        supabase.from("orders").select("id", { count: "exact", head: true }),
        supabase.from("orders").select("total, created_at").eq("payment_status", "succeeded"),
        supabase.from("profiles").select("id", { count: "exact", head: true }),
        supabase.from("orders").select("total, status, created_at, payment_status").gte("created_at", since28),
        supabase.from("orders").select("id", { count: "exact", head: true }).gte("created_at", todayStart),
        supabase.from("orders").select("id", { count: "exact", head: true }).in("status", ["pending", "processing"]),
      ]);

      const paidRows = paid.data ?? [];
      const totalRevenue = paidRows.reduce((s, o) => s + Number(o.total), 0);

      // 14-day series
      const days: { day: string; label: string; revenue: number; orders: number }[] = [];
      for (let i = 13; i >= 0; i--) {
        const d = subDays(startOfDay(new Date()), i);
        days.push({ day: d.toISOString().slice(0, 10), label: format(d, "MMM d"), revenue: 0, orders: 0 });
      }
      const byDay = new Map(days.map((d) => [d.day, d]));
      (ordersWindow.data ?? []).forEach((o: { total: string | number; created_at: string; payment_status: string }) => {
        const k = o.created_at.slice(0, 10);
        const bucket = byDay.get(k);
        if (!bucket) return;
        bucket.orders += 1;
        if (o.payment_status === "succeeded") bucket.revenue += Number(o.total);
      });

      // Status breakdown (last 28d)
      const statusMap: Record<string, number> = {};
      (ordersWindow.data ?? []).forEach((o: { status: string }) => {
        statusMap[o.status] = (statusMap[o.status] ?? 0) + 1;
      });
      const statusData = Object.entries(statusMap).map(([name, value]) => ({ name, value }));

      // Trend: revenue last 14d vs prior 14d
      const last14 = days.reduce((s, d) => s + d.revenue, 0);
      const prior14 = (ordersWindow.data ?? [])
        .filter((o: { created_at: string; payment_status: string }) => o.payment_status === "succeeded" && o.created_at < since14)
        .reduce((s: number, o: { total: string | number }) => s + Number(o.total), 0);
      const revenueTrend = prior14 > 0 ? ((last14 - prior14) / prior14) * 100 : last14 > 0 ? 100 : 0;

      return {
        products: products.count ?? 0,
        orders: ordersAll.count ?? 0,
        revenue: totalRevenue,
        users: profiles.count ?? 0,
        days,
        statusData,
        todayOrders: todayOrders.count ?? 0,
        pending: pending.count ?? 0,
        revenueTrend,
      };
    },
  });

  const { data: recent } = useQuery({
    queryKey: ["admin-recent-orders-v2"],
    queryFn: async () => (await supabase.from("orders").select("*").order("created_at", { ascending: false }).limit(6)).data ?? [],
  });

  const { data: topProducts } = useQuery({
    queryKey: ["admin-top-products"],
    queryFn: async () => {
      const { data } = await supabase
        .from("order_items")
        .select("product_id, quantity, unit_price, products(id, name_ar, name_en, name_ur, images)")
        .limit(200);
      const agg = new Map<string, { product: Record<string, unknown>; qty: number; revenue: number }>();
      (data ?? []).forEach((row) => {
        if (!row.products || !row.product_id) return;
        const key = row.product_id;
        const cur = agg.get(key) ?? { product: row.products as unknown as Record<string, unknown>, qty: 0, revenue: 0 };
        cur.qty += row.quantity;
        cur.revenue += Number(row.unit_price) * row.quantity;
        agg.set(key, cur);
      });
      return Array.from(agg.values()).sort((a, b) => b.qty - a.qty).slice(0, 5);
    },
  });

  const { data: lowStock } = useQuery({
    queryKey: ["admin-low-stock"],
    queryFn: async () =>
      (await supabase
        .from("products")
        .select("id, name_ar, name_en, name_ur, stock, status")
        .eq("status", "active")
        .lte("stock", 5)
        .order("stock", { ascending: true })
        .limit(5)).data ?? [],
  });

  const cards = [
    {
      icon: DollarSign,
      label: t("admin.totalRevenue"),
      value: formatPrice(stats?.revenue ?? 0),
      trend: stats?.revenueTrend ?? 0,
      gradient: "from-emerald-500/20 to-emerald-500/0",
      iconBg: "bg-emerald-500/15 text-emerald-400",
    },
    {
      icon: ShoppingBag,
      label: t("admin.todayOrders"),
      value: stats?.todayOrders ?? 0,
      sub: `${stats?.orders ?? 0} ${t("admin.orders").toLowerCase()}`,
      gradient: "from-cyan-500/20 to-cyan-500/0",
      iconBg: "bg-cyan-500/15 text-cyan-400",
    },
    {
      icon: Clock,
      label: t("admin.pendingOrders"),
      value: stats?.pending ?? 0,
      gradient: "from-amber-500/20 to-amber-500/0",
      iconBg: "bg-amber-500/15 text-amber-400",
    },
    {
      icon: Users,
      label: t("admin.customersCount"),
      value: stats?.users ?? 0,
      sub: `${stats?.products ?? 0} ${t("admin.products").toLowerCase()}`,
      gradient: "from-violet-500/20 to-violet-500/0",
      iconBg: "bg-violet-500/15 text-violet-400",
    },
  ];

  return (
    <div className="space-y-6">
      {/* Welcome bar */}
      <div className="flex flex-col gap-4 rounded-2xl border border-cyan-500/20 bg-gradient-to-br from-cyan-500/10 via-card to-card p-6 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold md:text-3xl">{t("admin.welcome")}</h1>
          <p className="mt-1 text-sm text-muted-foreground">{t("admin.welcomeSub")}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link to="/admin/products" className="inline-flex items-center gap-2 rounded-lg bg-cyan-500 px-4 py-2 text-sm font-medium text-background shadow-lg shadow-cyan-500/30 transition hover:bg-cyan-400">
            <Plus className="h-4 w-4" /> {t("admin.addProduct")}
          </Link>
          <Link to="/admin/categories" className="inline-flex items-center gap-2 rounded-lg border border-cyan-500/30 px-4 py-2 text-sm font-medium hover:bg-cyan-500/10">
            <FolderTree className="h-4 w-4" /> {t("admin.addCategory")}
          </Link>
          <Link to="/" className="inline-flex items-center gap-2 rounded-lg border border-cyan-500/20 px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground">
            <Eye className="h-4 w-4" /> {t("admin.viewStore")}
          </Link>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {cards.map((c) => (
          <div key={c.label} className={`group relative overflow-hidden rounded-2xl border border-cyan-500/10 bg-gradient-to-br ${c.gradient} bg-card p-5 transition hover:border-cyan-500/30`}>
            <div className="flex items-start justify-between">
              <div className={`grid h-10 w-10 place-items-center rounded-xl ${c.iconBg}`}>
                <c.icon className="h-5 w-5" />
              </div>
              {typeof c.trend === "number" && (
                <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${c.trend >= 0 ? "bg-emerald-500/10 text-emerald-400" : "bg-red-500/10 text-red-400"}`}>
                  {c.trend >= 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                  {Math.abs(c.trend).toFixed(1)}%
                </span>
              )}
            </div>
            <div className="mt-4 text-xs uppercase tracking-wider text-muted-foreground">{c.label}</div>
            <div className="mt-1 font-mono text-2xl font-bold">{c.value}</div>
            {c.sub && <div className="mt-1 text-xs text-muted-foreground">{c.sub}</div>}
          </div>
        ))}
      </div>

      {/* Revenue chart + Status pie */}
      <div className="grid gap-4 lg:grid-cols-3">
        <div className="rounded-2xl border border-cyan-500/10 bg-card p-5 lg:col-span-2">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="font-display text-lg font-bold">{t("admin.revenue")}</h2>
              <p className="text-xs text-muted-foreground">{t("admin.last14Days")}</p>
            </div>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={stats?.days ?? []} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="rev" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#06b6d4" stopOpacity={0.6} />
                    <stop offset="100%" stopColor="#06b6d4" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke="#06b6d422" vertical={false} />
                <XAxis dataKey="label" stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} />
                <Tooltip
                  contentStyle={{ background: "#0a0f1a", border: "1px solid #06b6d433", borderRadius: 8, fontSize: 12 }}
                  formatter={(v: number) => formatPrice(v)}
                />
                <Area type="monotone" dataKey="revenue" stroke="#06b6d4" strokeWidth={2} fill="url(#rev)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="rounded-2xl border border-cyan-500/10 bg-card p-5">
          <h2 className="mb-4 font-display text-lg font-bold">{t("admin.ordersByStatus")}</h2>
          {(stats?.statusData ?? []).length === 0 ? (
            <div className="grid h-64 place-items-center text-sm text-muted-foreground">{t("admin.noData")}</div>
          ) : (
            <>
              <div className="h-40">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={stats?.statusData} dataKey="value" nameKey="name" innerRadius={40} outerRadius={70} paddingAngle={2}>
                      {(stats?.statusData ?? []).map((s) => (
                        <Cell key={s.name} fill={STATUS_COLORS[s.name] ?? "#64748b"} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={{ background: "#0a0f1a", border: "1px solid #06b6d433", borderRadius: 8, fontSize: 12 }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="mt-3 space-y-1.5">
                {(stats?.statusData ?? []).map((s) => (
                  <div key={s.name} className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <span className="h-2 w-2 rounded-full" style={{ background: STATUS_COLORS[s.name] ?? "#64748b" }} />
                      <span className="capitalize text-muted-foreground">{s.name}</span>
                    </div>
                    <span className="font-mono font-semibold">{s.value}</span>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Recent orders + Top products / low stock */}
      <div className="grid gap-4 lg:grid-cols-3">
        <div className="rounded-2xl border border-cyan-500/10 bg-card lg:col-span-2">
          <div className="flex items-center justify-between border-b border-cyan-500/10 p-5">
            <h2 className="font-display text-lg font-bold">{t("admin.recentOrders")}</h2>
            <Link to="/admin/orders" className="inline-flex items-center gap-1 text-xs text-cyan-400 hover:text-cyan-300">
              {t("admin.viewAll")} <ArrowRight className="h-3 w-3 rtl:rotate-180" />
            </Link>
          </div>
          {(recent ?? []).length === 0 ? (
            <div className="p-12 text-center text-sm text-muted-foreground">{t("admin.noData")}</div>
          ) : (
            <div className="divide-y divide-cyan-500/10">
              {(recent ?? []).map((o) => (
                <div key={o.id} className="flex flex-wrap items-center gap-3 p-4 text-sm hover:bg-cyan-500/5">
                  <div className="grid h-9 w-9 place-items-center rounded-lg bg-cyan-500/10 text-cyan-400">
                    <ShoppingBag className="h-4 w-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="truncate font-mono text-xs text-cyan-400">{o.order_number}</div>
                    <div className="truncate text-xs text-muted-foreground">{o.buyer_email}</div>
                  </div>
                  <span
                    className="rounded-full px-2 py-0.5 text-[10px] font-medium capitalize"
                    style={{ background: `${STATUS_COLORS[o.status] ?? "#64748b"}22`, color: STATUS_COLORS[o.status] ?? "#94a3b8" }}
                  >
                    {o.status}
                  </span>
                  <span className="font-mono text-sm font-bold">{formatPrice(Number(o.total), o.currency)}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="space-y-4">
          {/* Top products */}
          <div className="rounded-2xl border border-cyan-500/10 bg-card">
            <div className="border-b border-cyan-500/10 p-5">
              <h2 className="font-display text-lg font-bold">{t("admin.topProducts")}</h2>
            </div>
            {(topProducts ?? []).length === 0 ? (
              <div className="p-6 text-center text-xs text-muted-foreground">{t("admin.noData")}</div>
            ) : (
              <div className="divide-y divide-cyan-500/10">
                {(topProducts ?? []).map((p, i) => (
                  <div key={i} className="flex items-center gap-3 p-3 text-sm">
                    <span className="grid h-7 w-7 place-items-center rounded-full bg-cyan-500/10 font-mono text-xs font-bold text-cyan-400">
                      {i + 1}
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-xs font-medium">{localizedName(p.product, "name", lang)}</div>
                      <div className="text-[10px] text-muted-foreground">{p.qty} × {formatPrice(p.revenue / Math.max(p.qty, 1))}</div>
                    </div>
                    <span className="font-mono text-xs font-bold">{formatPrice(p.revenue)}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Low stock alerts */}
          <div className="rounded-2xl border border-amber-500/20 bg-gradient-to-br from-amber-500/5 to-transparent">
            <div className="flex items-center gap-2 border-b border-amber-500/20 p-5">
              <AlertTriangle className="h-4 w-4 text-amber-400" />
              <h2 className="font-display text-lg font-bold">{t("admin.lowStock")}</h2>
            </div>
            {(lowStock ?? []).length === 0 ? (
              <div className="p-6 text-center text-xs text-muted-foreground">{t("admin.noData")}</div>
            ) : (
              <div className="divide-y divide-amber-500/10">
                {(lowStock ?? []).map((p) => (
                  <Link
                    key={p.id}
                    to="/admin/products"
                    className="flex items-center gap-3 p-3 text-sm hover:bg-amber-500/5"
                  >
                    <Package className="h-4 w-4 text-amber-400" />
                    <span className="min-w-0 flex-1 truncate text-xs">{localizedName(p, "name", lang)}</span>
                    <span className="rounded-full bg-amber-500/15 px-2 py-0.5 text-[10px] font-bold text-amber-400">
                      {p.stock}
                    </span>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
