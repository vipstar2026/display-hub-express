import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Ticket, Search, Download, TrendingDown } from "lucide-react";
import { formatPrice } from "@/lib/format";
import { useMemo, useState } from "react";

export const Route = createFileRoute("/_authenticated/admin/coupon-usage")({
  component: CouponUsagePage,
});

type Row = {
  id: string; coupon_id: string; coupon_code: string | null;
  user_id: string | null; user_email: string | null;
  order_id: string | null; order_number: string | null; order_total: number | null;
  discount_amount: number; created_at: string;
};

function CouponUsagePage() {
  const [q, setQ] = useState("");
  const [code, setCode] = useState<string>("__all__");

  const { data = [], isLoading } = useQuery({
    queryKey: ["admin-coupon-usage"],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("admin_coupon_usage_report");
      if (error) throw error;
      return (data ?? []) as Row[];
    },
  });

  const codes = useMemo(() => Array.from(new Set(data.map((r) => r.coupon_code).filter(Boolean))) as string[], [data]);

  const rows = useMemo(() => data.filter((r) => {
    if (code !== "__all__" && r.coupon_code !== code) return false;
    if (!q) return true;
    const s = q.toLowerCase();
    return (r.coupon_code ?? "").toLowerCase().includes(s)
      || (r.user_email ?? "").toLowerCase().includes(s)
      || (r.order_number ?? "").toLowerCase().includes(s);
  }), [data, q, code]);

  const totals = useMemo(() => ({
    uses: rows.length,
    discount: rows.reduce((s, r) => s + Number(r.discount_amount ?? 0), 0),
    revenue: rows.reduce((s, r) => s + Number(r.order_total ?? 0), 0),
  }), [rows]);

  const exportCsv = () => {
    const header = "date,code,customer,order,order_total,discount";
    const body = rows.map((r) => [
      r.created_at, r.coupon_code ?? "", r.user_email ?? "",
      r.order_number ?? "", r.order_total ?? "", r.discount_amount,
    ].map((v) => String(v).replace(/,/g, " ")).join(",")).join("\n");
    const blob = new Blob(["\uFEFF" + header + "\n" + body], { type: "text/csv;charset=utf-8;" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `coupon-usage-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="flex items-center gap-2 font-display text-2xl font-bold">
          <Ticket className="h-6 w-6 text-primary" /> Coupon usage
        </h1>
        <p className="text-sm text-muted-foreground">Every redemption with customer, order, and discount amount.</p>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <Kpi label="Redemptions" value={String(totals.uses)} />
        <Kpi label="Discount given" value={formatPrice(totals.discount, "BHD")} accent="text-amber-400" />
        <Kpi label="Orders revenue" value={formatPrice(totals.revenue, "BHD")} accent="text-emerald-400" />
      </div>

      <div className="flex flex-wrap gap-2">
        <div className="relative min-w-[220px] flex-1">
          <Search className="pointer-events-none absolute start-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search code / email / order…" className="h-9 ps-8" />
        </div>
        <select
          value={code}
          onChange={(e) => setCode(e.target.value)}
          className="h-9 rounded-md border border-primary/20 bg-background px-2 text-sm"
        >
          <option value="__all__">All coupons</option>
          {codes.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
        <Button size="sm" variant="outline" onClick={exportCsv} disabled={rows.length === 0}>
          <Download className="me-1.5 h-3.5 w-3.5" /> Export CSV
        </Button>
      </div>

      <div className="overflow-x-auto rounded-2xl border border-primary/10 bg-card">
        {isLoading ? (
          <div className="p-10 text-center text-muted-foreground">Loading…</div>
        ) : rows.length === 0 ? (
          <div className="p-12 text-center text-muted-foreground">
            <TrendingDown className="mx-auto mb-2 h-10 w-10 text-primary/30" />
            No redemptions yet.
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="border-b border-primary/10 text-xs uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="p-3 text-start">Date</th>
                <th className="p-3 text-start">Code</th>
                <th className="p-3 text-start">Customer</th>
                <th className="p-3 text-start">Order</th>
                <th className="p-3 text-end">Order total</th>
                <th className="p-3 text-end">Discount</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id} className="border-b border-primary/5 last:border-0 hover:bg-primary/5">
                  <td className="p-3 text-xs text-muted-foreground">{new Date(r.created_at).toLocaleString()}</td>
                  <td className="p-3"><span className="rounded bg-primary/10 px-1.5 py-0.5 font-mono text-xs text-primary">{r.coupon_code ?? "—"}</span></td>
                  <td className="p-3 text-xs">{r.user_email ?? <span className="text-muted-foreground">guest</span>}</td>
                  <td className="p-3 font-mono text-xs">{r.order_number ?? "—"}</td>
                  <td className="p-3 text-end">{r.order_total != null ? formatPrice(Number(r.order_total), "BHD") : "—"}</td>
                  <td className="p-3 text-end text-amber-400">−{formatPrice(Number(r.discount_amount), "BHD")}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

function Kpi({ label, value, accent }: { label: string; value: string; accent?: string }) {
  return (
    <div className="rounded-xl border border-primary/15 bg-card p-4">
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className={`mt-1 font-display text-2xl font-bold ${accent ?? ""}`}>{value}</div>
    </div>
  );
}
