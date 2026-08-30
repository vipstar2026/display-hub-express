import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { formatPrice } from "@/lib/format";
import { BASE_CURRENCY, convertToBase } from "@/lib/payments/money";

/** Every roll-up below normalises to the base currency first — mixed
 *  currencies are never added together raw. */
const base = (amount: unknown, currency?: string | null) => convertToBase(Number(amount || 0), currency || BASE_CURRENCY) ?? 0;
import { useI18n } from "@/lib/i18n";
import { useMemo, useState } from "react";
import { subDays, startOfDay, format, eachDayOfInterval } from "date-fns";
import {
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid,
  BarChart, Bar, PieChart, Pie, Cell, LineChart, Line, Legend,
} from "recharts";
import { TrendingUp, TrendingDown, ShoppingBag, DollarSign, Users, Package, Percent, Activity } from "lucide-react";

export const Route = createFileRoute("/_authenticated/admin/analytics")({
  component: Analytics,
});

type Range = 7 | 30 | 90 | 365;
const COLORS = ["hsl(var(--primary))", "#f59e0b", "#10b981", "#3b82f6", "#ef4444", "#8b5cf6", "#ec4899", "#14b8a6"];

function Analytics() {
  const { t, lang } = useI18n();
  const [range, setRange] = useState<Range>(30);

  const since = useMemo(() => subDays(new Date(), range).toISOString(), [range]);
  const prevSince = useMemo(() => subDays(new Date(), range * 2).toISOString(), [range]);

  const { data, isLoading } = useQuery({
    queryKey: ["analytics", range],
    queryFn: async () => {
      const [orders, prevOrders, items, products, customers] = await Promise.all([
        supabase.from("orders").select("id,total,subtotal,discount,tax,shipping,currency,status,payment_status,created_at,buyer_email").gte("created_at", since).order("created_at"),
        supabase.from("orders").select("id,total,currency,created_at").gte("created_at", prevSince).lt("created_at", since),
        supabase.from("order_items").select("product_id,product_name,quantity,unit_price,order_id,orders!inner(created_at,payment_status,currency)").gte("orders.created_at", since),
        supabase.from("products").select("id,name_ar,name_en,category_id,stock,price,categories(name_ar,name_en)"),
        supabase.from("orders").select("buyer_email,total,currency,created_at").not("buyer_email", "is", null),
      ]);
      return {
        orders: orders.data ?? [],
        prevOrders: prevOrders.data ?? [],
        items: items.data ?? [],
        products: products.data ?? [],
        customers: customers.data ?? [],
      };
    },
  });

  const kpis = useMemo(() => {
    if (!data) return null;
    const paid = data.orders.filter((o: any) => o.payment_status === "paid" || o.payment_status === "succeeded");
    const revenue = paid.reduce((s: number, o: any) => s + base(o.total, o.currency), 0);
    const prevPaid = data.prevOrders;
    const prevRevenue = prevPaid.reduce((s: number, o: any) => s + base(o.total, o.currency), 0);
    const revGrowth = prevRevenue > 0 ? ((revenue - prevRevenue) / prevRevenue) * 100 : 0;
    const aov = paid.length ? revenue / paid.length : 0;
    const conversion = data.orders.length ? (paid.length / data.orders.length) * 100 : 0;
    const uniqueBuyers = new Set(paid.map((o: any) => o.buyer_email).filter(Boolean)).size;
    return {
      revenue, revGrowth,
      orders: paid.length, ordersGrowth: prevPaid.length ? ((paid.length - prevPaid.length) / prevPaid.length) * 100 : 0,
      aov, conversion, uniqueBuyers,
      pending: data.orders.filter((o: any) => o.payment_status === "pending").length,
    };
  }, [data]);

  const trend = useMemo(() => {
    if (!data) return [];
    const days = eachDayOfInterval({ start: subDays(new Date(), range - 1), end: new Date() });
    const byDay = new Map<string, { revenue: number; orders: number; date: string }>();
    days.forEach((d) => byDay.set(format(d, "yyyy-MM-dd"), { revenue: 0, orders: 0, date: format(d, "MMM d") }));
    data.orders.forEach((o: any) => {
      const k = format(startOfDay(new Date(o.created_at)), "yyyy-MM-dd");
      const bucket = byDay.get(k);
      if (!bucket) return;
      if (o.payment_status === "paid" || o.payment_status === "succeeded") {
        bucket.revenue += base(o.total, o.currency);
        bucket.orders += 1;
      }
    });
    return Array.from(byDay.values());
  }, [data, range]);

  const topProducts = useMemo(() => {
    if (!data) return [];
    const map = new Map<string, { name: string; qty: number; revenue: number }>();
    data.items.forEach((it: any) => {
      const orderPaid = it.orders?.payment_status === "paid" || it.orders?.payment_status === "succeeded";
      if (!orderPaid) return;
      const cur = map.get(it.product_id) ?? { name: it.product_name, qty: 0, revenue: 0 };
      cur.qty += Number(it.quantity || 0);
      cur.revenue += base(Number(it.quantity || 0) * Number(it.unit_price || 0), it.orders?.currency);
      map.set(it.product_id, cur);
    });
    return Array.from(map.values()).sort((a, b) => b.revenue - a.revenue).slice(0, 8);
  }, [data]);

  const categoryShare = useMemo(() => {
    if (!data) return [];
    const catByProduct = new Map(data.products.map((p: any) => [p.id, p.categories?.name_en ?? p.categories?.name_ar ?? "—"]));
    const map = new Map<string, number>();
    data.items.forEach((it: any) => {
      const orderPaid = it.orders?.payment_status === "paid" || it.orders?.payment_status === "succeeded";
      if (!orderPaid) return;
      const cat = String(catByProduct.get(it.product_id) ?? "—");
      map.set(cat, (map.get(cat) ?? 0) + base(Number(it.quantity || 0) * Number(it.unit_price || 0), it.orders?.currency));
    });
    return Array.from(map.entries()).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value).slice(0, 6);
  }, [data]);

  const hourlyHeat = useMemo(() => {
    if (!data) return [];
    const arr = Array.from({ length: 24 }, (_, h) => ({ hour: `${h}:00`, orders: 0 }));
    data.orders.forEach((o: any) => {
      const h = new Date(o.created_at).getHours();
      arr[h].orders += 1;
    });
    return arr;
  }, [data]);

  const customerSegments = useMemo(() => {
    if (!data) return { new: 0, returning: 0, vip: 0 };
    const counts = new Map<string, { count: number; total: number }>();
    data.customers.forEach((c: any) => {
      if (!c.buyer_email) return;
      const cur = counts.get(c.buyer_email) ?? { count: 0, total: 0 };
      cur.count += 1;
      cur.total += Number(c.total || 0);
      counts.set(c.buyer_email, cur);
    });
    let n = 0, r = 0, v = 0;
    counts.forEach((c) => {
      if (c.total >= 500) v++;
      else if (c.count > 1) r++;
      else n++;
    });
    return { new: n, returning: r, vip: v };
  }, [data]);

  const lowStock = useMemo(() => {
    if (!data) return [];
    return data.products.filter((p: any) => p.stock !== null && p.stock <= 5).sort((a: any, b: any) => a.stock - b.stock).slice(0, 6);
  }, [data]);

  const L = {
    ar: { title: "التحليلات المتقدمة", sub: "رؤية شاملة لأداء المتجر", revenue: "الإيرادات", orders: "الطلبات", aov: "متوسط قيمة الطلب", conversion: "التحويل", customers: "العملاء", pending: "قيد الانتظار", trend: "اتجاه الإيرادات", top: "أفضل المنتجات", cats: "حصة الأقسام", hours: "الطلبات حسب الساعة", segments: "شرائح العملاء", low: "منتجات مخزون منخفض", new: "جديد", returning: "متكرر", vip: "VIP", qty: "الكمية", stock: "المخزون" },
    en: { title: "Advanced Analytics", sub: "Full store performance overview", revenue: "Revenue", orders: "Orders", aov: "Avg Order Value", conversion: "Conversion", customers: "Customers", pending: "Pending", trend: "Revenue Trend", top: "Top Products", cats: "Category Share", hours: "Orders by Hour", segments: "Customer Segments", low: "Low Stock", new: "New", returning: "Returning", vip: "VIP", qty: "Qty", stock: "Stock" },
    ur: { title: "ایڈوانسڈ تجزیات", sub: "مکمل کارکردگی کا جائزہ", revenue: "آمدنی", orders: "آرڈرز", aov: "اوسط آرڈر", conversion: "تبدیلی", customers: "گاہک", pending: "زیر التوا", trend: "آمدنی رجحان", top: "اعلی مصنوعات", cats: "زمرہ حصہ", hours: "گھنٹے کے حساب سے", segments: "گاہک طبقات", low: "کم اسٹاک", new: "نیا", returning: "واپس آنے والا", vip: "VIP", qty: "مقدار", stock: "اسٹاک" },
    bn: { title: "উন্নত বিশ্লেষণ", sub: "দোকানের সম্পূর্ণ পারফরম্যান্স", revenue: "আয়", orders: "অর্ডার", aov: "গড় অর্ডার মূল্য", conversion: "কনভার্শন", customers: "গ্রাহক", pending: "অপেক্ষমাণ", trend: "আয়ের প্রবণতা", top: "সেরা পণ্য", cats: "বিভাগের অংশ", hours: "ঘণ্টাভিত্তিক অর্ডার", segments: "গ্রাহক শ্রেণি", low: "কম স্টক", new: "নতুন", returning: "পুনরাবৃত্ত", vip: "VIP", qty: "পরিমাণ", stock: "স্টক" },
  }[lang as "ar" | "en" | "ur" | "bn"] ?? { title: "Analytics" } as any;

  const ranges: Range[] = [7, 30, 90, 365];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">{L.title}</h1>
          <p className="text-sm text-muted-foreground">{L.sub}</p>
        </div>
        <div className="flex gap-1 rounded-lg border border-border bg-card p-1">
          {ranges.map((r) => (
            <button key={r} onClick={() => setRange(r)} className={`rounded-md px-3 py-1.5 text-sm ${range === r ? "bg-primary text-background" : "hover:bg-muted"}`}>
              {r === 365 ? "1y" : `${r}d`}
            </button>
          ))}
        </div>
      </div>

      {isLoading || !kpis ? (
        <div className="grid gap-4 md:grid-cols-4">{Array.from({ length: 4 }).map((_, i) => <div key={i} className="h-28 animate-pulse rounded-xl bg-muted" />)}</div>
      ) : (
        <>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <KpiCard icon={DollarSign} label={L.revenue} value={formatPrice(kpis.revenue, BASE_CURRENCY)} growth={kpis.revGrowth} />
            <KpiCard icon={ShoppingBag} label={L.orders} value={String(kpis.orders)} growth={kpis.ordersGrowth} />
            <KpiCard icon={TrendingUp} label={L.aov} value={formatPrice(kpis.aov, BASE_CURRENCY)} />
            <KpiCard icon={Percent} label={L.conversion} value={`${kpis.conversion.toFixed(1)}%`} />
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <StatChip icon={Users} label={L.customers} value={kpis.uniqueBuyers} />
            <StatChip icon={Activity} label={L.pending} value={kpis.pending} tone="warn" />
            <StatChip icon={Package} label={L.low} value={lowStock.length} tone="danger" />
          </div>

          <Card title={L.trend}>
            <div dir="ltr" className="h-full w-full"><ResponsiveContainer width="100%" height={280}>
              <AreaChart data={trend}>
                <defs>
                  <linearGradient id="rev" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="date" stroke="#888" fontSize={11} />
                <YAxis stroke="#888" fontSize={11} />
                <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8 }} />
                <Area type="monotone" dataKey="revenue" stroke="hsl(var(--primary))" strokeWidth={2} fill="url(#rev)" />
              </AreaChart>
            </ResponsiveContainer></div>
          </Card>

          <div className="grid gap-4 lg:grid-cols-2">
            <Card title={L.top}>
              <div className="space-y-2">
                {topProducts.length === 0 && <p className="py-6 text-center text-sm text-muted-foreground">—</p>}
                {topProducts.map((p, i) => (
                  <div key={i} className="flex items-center gap-3 rounded-md bg-muted/30 p-2 text-sm">
                    <div className="grid h-8 w-8 place-items-center rounded-md bg-primary/20 font-bold text-primary">{i + 1}</div>
                    <div className="min-w-0 flex-1">
                      <div className="truncate font-medium">{p.name}</div>
                      <div className="text-xs text-muted-foreground">{L.qty}: {p.qty}</div>
                    </div>
                    <div className="text-end font-mono text-sm">{formatPrice(p.revenue, BASE_CURRENCY)}</div>
                  </div>
                ))}
              </div>
            </Card>

            <Card title={L.cats}>
              {categoryShare.length === 0 ? (
                <p className="py-16 text-center text-sm text-muted-foreground">—</p>
              ) : (
                <div dir="ltr" className="h-full w-full"><ResponsiveContainer width="100%" height={260}>
                  <PieChart>
                    <Pie data={categoryShare} dataKey="value" nameKey="name" innerRadius={50} outerRadius={90} paddingAngle={2}>
                      {categoryShare.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                    </Pie>
                    <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8 }} formatter={(v: any) => formatPrice(Number(v), BASE_CURRENCY)} />
                    <Legend wrapperStyle={{ fontSize: 12 }} />
                  </PieChart>
                </ResponsiveContainer></div>
              )}
            </Card>
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <Card title={L.hours}>
              <div dir="ltr" className="h-full w-full"><ResponsiveContainer width="100%" height={220}>
                <BarChart data={hourlyHeat}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                  <XAxis dataKey="hour" stroke="#888" fontSize={10} interval={2} />
                  <YAxis stroke="#888" fontSize={11} />
                  <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8 }} />
                  <Bar dataKey="orders" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer></div>
            </Card>

            <Card title={L.segments}>
              <div className="flex h-[220px] flex-col justify-center gap-3">
                <SegBar label={L.vip} value={customerSegments.vip} max={customerSegments.new + customerSegments.returning + customerSegments.vip} color="hsl(var(--primary))" />
                <SegBar label={L.returning} value={customerSegments.returning} max={customerSegments.new + customerSegments.returning + customerSegments.vip} color="#10b981" />
                <SegBar label={L.new} value={customerSegments.new} max={customerSegments.new + customerSegments.returning + customerSegments.vip} color="#3b82f6" />
              </div>
            </Card>
          </div>

          {lowStock.length > 0 && (
            <Card title={L.low}>
              <div className="grid gap-2 md:grid-cols-2">
                {lowStock.map((p: any) => (
                  <div key={p.id} className="flex items-center justify-between rounded-md border border-red-500/30 bg-red-500/5 p-2 text-sm">
                    <span className="truncate">{p.name_en ?? p.name_ar}</span>
                    <span className="font-mono text-red-400">{L.stock}: {p.stock}</span>
                  </div>
                ))}
              </div>
            </Card>
          )}
        </>
      )}
    </div>
  );
}

function KpiCard({ icon: Icon, label, value, growth }: any) {
  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <div className="flex items-center justify-between">
        <span className="text-xs uppercase tracking-wider text-muted-foreground">{label}</span>
        <Icon className="h-4 w-4 text-primary" />
      </div>
      <div className="mt-2 text-2xl font-bold">{value}</div>
      {typeof growth === "number" && (
        <div className={`mt-1 flex items-center gap-1 text-xs ${growth >= 0 ? "text-green-500" : "text-red-500"}`}>
          {growth >= 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
          {Math.abs(growth).toFixed(1)}%
        </div>
      )}
    </div>
  );
}

function StatChip({ icon: Icon, label, value, tone }: any) {
  const tones: Record<string, string> = { warn: "border-amber-500/30 bg-amber-500/5 text-amber-400", danger: "border-red-500/30 bg-red-500/5 text-red-400" };
  return (
    <div className={`flex items-center gap-3 rounded-lg border p-3 ${tones[tone] ?? "border-border bg-card"}`}>
      <Icon className="h-5 w-5" />
      <div className="flex-1"><div className="text-xs text-muted-foreground">{label}</div><div className="text-lg font-semibold">{value}</div></div>
    </div>
  );
}

function SegBar({ label, value, max, color }: any) {
  const pct = max > 0 ? (value / max) * 100 : 0;
  return (
    <div>
      <div className="mb-1 flex justify-between text-sm"><span>{label}</span><span className="font-mono">{value}</span></div>
      <div className="h-2 overflow-hidden rounded-full bg-muted"><div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, background: color }} /></div>
    </div>
  );
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <h3 className="mb-3 text-sm font-semibold uppercase tracking-wider text-muted-foreground">{title}</h3>
      {children}
    </div>
  );
}
