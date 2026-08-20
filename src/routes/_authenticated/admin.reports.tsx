import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { formatPrice } from "@/lib/format";
import { useI18n } from "@/lib/i18n";
import { useMemo, useState } from "react";
import { subDays, startOfDay, format } from "date-fns";
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid, BarChart, Bar } from "recharts";
import { Button } from "@/components/ui/button";
import { Download, TrendingUp, ShoppingBag, DollarSign, Users } from "lucide-react";

export const Route = createFileRoute("/_authenticated/admin/reports")({
  component: Reports,
});

type Range = 7 | 14 | 30 | 90;

function Reports() {
  const { t } = useI18n();
  const [range, setRange] = useState<Range>(30);

  const { data } = useQuery({
    queryKey: ["admin-reports", range],
    queryFn: async () => {
      const since = subDays(startOfDay(new Date()), range - 1).toISOString();
      const [orders, items, posSales, posItems] = await Promise.all([
        supabase.from("orders").select("id, total, subtotal, discount, tax, shipping, payment_status, status, buyer_email, created_at, payment_method").gte("created_at", since),
        supabase.from("order_items").select("product_id, product_name, quantity, total, unit_price, created_at").gte("created_at", since),
        supabase.from("pos_sales").select("id, total, subtotal, discount, tax, customer_name, customer_phone, created_at, payment_method, status").gte("created_at", since),
        supabase.from("pos_sale_items").select("product_id, product_name, quantity, total, unit_price, pos_sales!inner(created_at)").gte("pos_sales.created_at", since),
      ]);
      return { orders: orders.data ?? [], items: items.data ?? [], posSales: posSales.data ?? [], posItems: posItems.data ?? [] };
    },
  });

  const stats = useMemo(() => {
    const orders = data?.orders ?? [];
    const items = data?.items ?? [];
    const posSales = data?.posSales ?? [];
    const posItems = data?.posItems ?? [];
    const paid = orders.filter((o) => o.payment_status === "succeeded");
    const posOk = posSales.filter((s) => s.status === "completed");

    const revenue = paid.reduce((s, o) => s + Number(o.total), 0) + posOk.reduce((s, o) => s + Number(o.total), 0);
    const discount = paid.reduce((s, o) => s + Number(o.discount ?? 0), 0) + posOk.reduce((s, o) => s + Number(o.discount ?? 0), 0);
    const tax = paid.reduce((s, o) => s + Number(o.tax ?? 0), 0) + posOk.reduce((s, o) => s + Number(o.tax ?? 0), 0);
    const buyers = new Set([
      ...paid.map((o) => o.buyer_email),
      ...posOk.map((s) => s.customer_phone || s.customer_name || `walk-in-${s.id}`),
    ]).size;
    const orderCount = paid.length + posOk.length;
    const aov = orderCount ? revenue / orderCount : 0;

    // Time series (online + POS)
    const days: { d: string; label: string; revenue: number; orders: number }[] = [];
    for (let i = range - 1; i >= 0; i--) {
      const d = subDays(startOfDay(new Date()), i);
      days.push({ d: d.toISOString().slice(0, 10), label: format(d, "MMM d"), revenue: 0, orders: 0 });
    }
    const byDay = new Map(days.map((x) => [x.d, x]));
    orders.forEach((o) => {
      const b = byDay.get(o.created_at.slice(0, 10));
      if (!b) return;
      b.orders += 1;
      if (o.payment_status === "succeeded") b.revenue += Number(o.total);
    });
    posOk.forEach((s) => {
      const b = byDay.get(s.created_at.slice(0, 10));
      if (!b) return;
      b.orders += 1;
      b.revenue += Number(s.total);
    });

    // Top products (online + POS combined)
    const productMap = new Map<string, { name: string; qty: number; revenue: number }>();
    [...items, ...posItems].forEach((it: any) => {
      const key = it.product_id || it.product_name || "unknown";
      const cur = productMap.get(key) ?? { name: it.product_name ?? "—", qty: 0, revenue: 0 };
      cur.qty += Number(it.quantity);
      cur.revenue += Number(it.total ?? Number(it.unit_price) * Number(it.quantity));
      productMap.set(key, cur);
    });
    const topProducts = Array.from(productMap.values()).sort((a, b) => b.revenue - a.revenue).slice(0, 10);

    // Payment methods (online + POS)
    const pmMap = new Map<string, number>();
    paid.forEach((o) => {
      const k = o.payment_method || "other";
      pmMap.set(k, (pmMap.get(k) ?? 0) + Number(o.total));
    });
    posOk.forEach((s) => {
      const k = `pos-${s.payment_method || "cash"}`;
      pmMap.set(k, (pmMap.get(k) ?? 0) + Number(s.total));
    });
    const paymentMethods = Array.from(pmMap.entries()).map(([name, value]) => ({ name, value }));

    return { revenue, discount, tax, buyers, aov, orders: orderCount, days, topProducts, paymentMethods };
  }, [data, range]);

  const exportCSV = () => {
    const rows = [["Order ID", "Date", "Email", "Method", "Status", "Payment", "Subtotal", "Discount", "Tax", "Shipping", "Total"]];
    (data?.orders ?? []).forEach((o) => {
      rows.push([
        o.id, o.created_at, o.buyer_email, o.payment_method ?? "", o.status, o.payment_status,
        String(o.subtotal), String(o.discount ?? 0), String(o.tax ?? 0), String(o.shipping ?? 0), String(o.total),
      ]);
    });
    const csv = rows.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(",")).join("\n");
    const blob = new Blob(["\ufeff" + csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `sales-report-${range}d.csv`; a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-3">
        <div>
          <h1 className="font-display text-2xl font-bold">{t("reports.title")}</h1>
          <p className="text-sm text-muted-foreground">{t("reports.subtitle")}</p>
        </div>
        <div className="ms-auto flex items-center gap-2">
          <div className="flex gap-1 rounded-lg border border-primary/20 p-1">
            {([7, 14, 30, 90] as Range[]).map((r) => (
              <button key={r} onClick={() => setRange(r)}
                className={`rounded-md px-3 py-1.5 text-xs font-medium transition ${range === r ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"}`}>
                {r}d
              </button>
            ))}
          </div>
          <Button onClick={exportCSV} variant="outline" size="sm" className="gap-2">
            <Download className="h-4 w-4" /> {t("reports.exportCsv")}
          </Button>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
        <Kpi icon={DollarSign} label={t("reports.revenue")} value={formatPrice(stats.revenue)} />
        <Kpi icon={ShoppingBag} label={t("reports.orders")} value={String(stats.orders)} />
        <Kpi icon={TrendingUp} label={t("reports.aov")} value={formatPrice(stats.aov)} />
        <Kpi icon={Users} label={t("reports.buyers")} value={String(stats.buyers)} />
        <Kpi icon={DollarSign} label={t("reports.tax")} value={formatPrice(stats.tax)} />
      </div>

      {/* Revenue chart */}
      <div className="rounded-xl border border-primary/20 bg-card/60 p-5 backdrop-blur">
        <h3 className="mb-4 font-display text-lg font-semibold">{t("reports.revenueOverTime")}</h3>
        <div className="h-72">
          <div dir="ltr" className="h-full w-full"><ResponsiveContainer width="100%" height="100%">
            <AreaChart data={stats.days}>
              <defs>
                <linearGradient id="rv" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.4} />
                  <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
              <XAxis dataKey="label" fontSize={11} />
              <YAxis fontSize={11} />
              <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--primary) / 0.3)", borderRadius: 8 }} />
              <Area type="monotone" dataKey="revenue" stroke="hsl(var(--primary))" fill="url(#rv)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer></div>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        {/* Top products */}
        <div className="rounded-xl border border-primary/20 bg-card/60 p-5 backdrop-blur">
          <h3 className="mb-4 font-display text-lg font-semibold">{t("reports.topProducts")}</h3>
          <div className="space-y-2">
            {stats.topProducts.length === 0 && <p className="text-sm text-muted-foreground">{t("admin.noData")}</p>}
            {stats.topProducts.map((p, i) => (
              <div key={i} className="flex items-center gap-3 rounded-lg border border-primary/10 bg-background/40 p-3">
                <div className="grid h-8 w-8 place-items-center rounded-md bg-primary/15 text-xs font-bold text-primary">{i + 1}</div>
                <div className="min-w-0 flex-1 truncate text-sm font-medium">{p.name}</div>
                <div className="text-xs text-muted-foreground">×{p.qty}</div>
                <div className="text-sm font-semibold">{formatPrice(p.revenue)}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Payment methods */}
        <div className="rounded-xl border border-primary/20 bg-card/60 p-5 backdrop-blur">
          <h3 className="mb-4 font-display text-lg font-semibold">{t("reports.byPaymentMethod")}</h3>
          <div className="h-64">
            <div dir="ltr" className="h-full w-full"><ResponsiveContainer width="100%" height="100%">
              <BarChart data={stats.paymentMethods}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
                <XAxis dataKey="name" fontSize={11} />
                <YAxis fontSize={11} />
                <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--primary) / 0.3)", borderRadius: 8 }} />
                <Bar dataKey="value" fill="hsl(var(--primary))" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer></div>
          </div>
        </div>
      </div>
    </div>
  );
}

function Kpi({ icon: Icon, label, value }: { icon: React.ComponentType<{ className?: string }>; label: string; value: string }) {
  return (
    <div className="rounded-xl border border-primary/20 bg-card/60 p-4 backdrop-blur">
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <Icon className="h-3.5 w-3.5" /> {label}
      </div>
      <div className="mt-1 font-display text-xl font-bold">{value}</div>
    </div>
  );
}
