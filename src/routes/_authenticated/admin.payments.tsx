import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useI18n } from "@/lib/i18n";
import { formatPrice } from "@/lib/format";
import { BASE_CURRENCY, sumInBase } from "@/lib/payments/money";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, RefreshCw, CreditCard, CheckCircle2, Clock, XCircle, RotateCcw, Download } from "lucide-react";

export const Route = createFileRoute("/_authenticated/admin/payments")({
  component: AdminPaymentsPage,
  head: () => ({
    meta: [
      { title: "Payment Records · VIPSTAR Admin" },
      { name: "description", content: "Full log of online payment transactions, refunds and gateway responses." },
    ],
  }),
});

type Tx = {
  id: string;
  record_source: string;
  order_id: string | null;
  provider: string;
  reference: string | null;
  amount: number;
  currency: string;
  status: string;
  payment_method: string | null;
  failure_reason: string | null;
  paid_at: string | null;
  created_at: string;
  orders: { order_number: string; buyer_email: string; buyer_name: string | null } | null;
};

const STATUSES = ["all", "succeeded", "pending", "failed", "refunded"] as const;

function AdminPaymentsPage() {
  const { lang } = useI18n();
  const [q, setQ] = useState("");
  const [status, setStatus] = useState<(typeof STATUSES)[number]>("all");

  const txt = (ar: string, en: string, ur: string, bn?: string) => (lang === "ar" ? ar : lang === "ur" ? ur : lang === "bn" ? (bn ?? en) : en);

  const { data: rows = [], isLoading, refetch, isFetching } = useQuery({
    queryKey: ["admin-payment-tx"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("payment_ledger")
        .select("*, orders(order_number, buyer_email, buyer_name)")
        .order("created_at", { ascending: false })
        .limit(500);
      if (error) throw error;
      return (data ?? []) as unknown as Tx[];
    },
  });

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    return rows.filter((r) => {
      if (status !== "all" && r.status !== status) return false;
      if (!s) return true;
      return (
        (r.orders?.order_number ?? "").toLowerCase().includes(s) ||
        (r.orders?.buyer_email ?? "").toLowerCase().includes(s) ||
        (r.reference ?? "").toLowerCase().includes(s) ||
        r.provider.toLowerCase().includes(s)
      );
    });
  }, [rows, q, status]);

  const kpis = useMemo(() => {
    const succeeded = rows.filter((r) => r.status === "succeeded" && Number(r.amount) > 0);
    const refunds = rows.filter((r) => Number(r.amount) < 0 || r.status === "refunded");
    const grossBase = sumInBase(succeeded.map((r) => ({ amount: r.amount, currency: r.currency })));
    const refundBase = sumInBase(refunds.map((r) => ({ amount: r.amount, currency: r.currency })));
    return {
      gross: grossBase.total,
      refunded: Math.abs(refundBase.total),
      skipped: [...new Set([...grossBase.skipped, ...refundBase.skipped])],
      pending: rows.filter((r) => r.status === "pending").length,
      failed: rows.filter((r) => r.status === "failed").length,
    };
  }, [rows]);

  const exportCsv = () => {
    const head = ["created_at", "order", "email", "provider", "reference", "method", "amount", "currency", "status", "failure"];
    const body = filtered.map((r) => [
      r.created_at, r.orders?.order_number ?? "", r.orders?.buyer_email ?? "", r.provider,
      r.reference ?? "", r.payment_method ?? "", r.amount, r.currency, r.status, r.failure_reason ?? "",
    ]);
    const csv = [head, ...body].map((l) => l.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(",")).join("\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = `payments-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const statusLabel = (s: string) => {
    const map: Record<string, string> = {
      all: txt("الكل", "All", "سب", "সব"),
      succeeded: txt("ناجحة", "Succeeded", "کامیاب", "সফল"),
      pending: txt("قيد الانتظار", "Pending", "زیر التواء", "মুলতুবি"),
      failed: txt("فاشلة", "Failed", "ناکام", "ব্যর্থ"),
      refunded: txt("مسترجعة", "Refunded", "واپس شدہ", "ফেরত"),
    };
    return map[s] ?? s;
  };

  const badge = (s: string) => {
    const map: Record<string, { cls: string; Icon: typeof CheckCircle2 }> = {
      succeeded: { cls: "border-primary/40 bg-primary/10 text-primary", Icon: CheckCircle2 },
      pending: { cls: "border-amber-500/40 bg-amber-500/10 text-amber-500", Icon: Clock },
      failed: { cls: "border-destructive/40 bg-destructive/10 text-destructive", Icon: XCircle },
      refunded: { cls: "border-muted-foreground/40 bg-muted text-muted-foreground", Icon: RotateCcw },
    };
    const { cls, Icon } = map[s] ?? map.pending;
    return (
      <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-medium ${cls}`}>
        <Icon className="h-3 w-3" />{statusLabel(s)}
      </span>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="flex items-center gap-2 font-display text-2xl font-bold">
            <CreditCard className="h-6 w-6 text-primary" />
            {txt("سجل المدفوعات", "Payment records", "ادائیگی ریکارڈ", "পেমেন্ট রেকর্ড")}
          </h1>
          <p className="text-sm text-muted-foreground">
            {txt("كل عمليات الدفع الإلكتروني والاسترجاع مع ردود البوابة.", "Every online payment and refund with gateway responses.", "ہر آن لائن ادائیگی اور رقم کی واپسی۔", "গেটওয়ে প্রতিক্রিয়াসহ প্রতিটি অনলাইন পেমেন্ট ও ফেরত।")}
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => refetch()} disabled={isFetching} className="gap-2">
            <RefreshCw className={`h-4 w-4 ${isFetching ? "animate-spin" : ""}`} />{txt("تحديث", "Refresh", "ریفریش", "রিফ্রেশ")}
          </Button>
          <Button variant="outline" onClick={exportCsv} className="gap-2">
            <Download className="h-4 w-4" />CSV
          </Button>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: txt("إجمالي المحصّل", "Collected", "وصول شدہ", "সংগৃহীত"), value: formatPrice(kpis.gross, BASE_CURRENCY) },
          { label: txt("المسترجع", "Refunded", "واپس", "ফেরত"), value: formatPrice(kpis.refunded, BASE_CURRENCY) },
          { label: txt("قيد المعالجة", "Pending", "زیر عمل", "মুলতুবি"), value: String(kpis.pending) },
          { label: txt("فاشلة", "Failed", "ناکام", "ব্যর্থ"), value: String(kpis.failed) },
        ].map((k) => (
          <div key={k.label} className="rounded-xl border border-primary/10 bg-card p-4">
            <div className="text-xs text-muted-foreground">{k.label}</div>
            <div className="mt-1 font-mono text-xl font-bold text-primary">{k.value}</div>
          </div>
        ))}
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <div className="relative min-w-[240px] flex-1">
          <Search className="absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder={txt("بحث برقم الطلب أو البريد أو المرجع", "Search order, email or reference", "تلاش کریں", "অর্ডার, ইমেইল বা রেফারেন্স দিয়ে খুঁজুন")} className="ps-9" />
        </div>
        {STATUSES.map((s) => (
          <Button key={s} size="sm" variant={status === s ? "default" : "outline"} onClick={() => setStatus(s)}>
            {statusLabel(s)}
          </Button>
        ))}
      </div>

      <div className="overflow-x-auto rounded-xl border border-primary/10 bg-card">
        <table className="w-full text-sm">
          <thead className="border-b border-primary/10 text-start text-xs uppercase text-muted-foreground">
            <tr>
              <th className="p-3 text-start">{txt("التاريخ", "Date", "تاریخ", "তারিখ")}</th>
              <th className="p-3 text-start">{txt("الطلب", "Order", "آرڈر", "অর্ডার")}</th>
              <th className="p-3 text-start">{txt("البوابة", "Gateway", "گیٹ وے", "গেটওয়ে")}</th>
              <th className="p-3 text-start">{txt("المرجع", "Reference", "حوالہ", "রেফারেন্স")}</th>
              <th className="p-3 text-start">{txt("المبلغ", "Amount", "رقم", "পরিমাণ")}</th>
              <th className="p-3 text-start">{txt("الحالة", "Status", "حالت", "অবস্থা")}</th>
            </tr>
          </thead>
          <tbody>
            {isLoading && (
              <tr><td colSpan={6} className="p-8 text-center text-muted-foreground">…</td></tr>
            )}
            {!isLoading && filtered.length === 0 && (
              <tr><td colSpan={6} className="p-8 text-center text-muted-foreground">{txt("لا توجد عمليات", "No transactions", "کوئی ریکارڈ نہیں", "কোনো লেনদেন নেই")}</td></tr>
            )}
            {filtered.map((r) => (
              <tr key={r.id} className="border-b border-primary/5 last:border-0">
                <td className="whitespace-nowrap p-3 text-muted-foreground">{new Date(r.created_at).toLocaleString()}</td>
                <td className="p-3">
                  <div className="font-mono font-medium">{r.orders?.order_number ?? "—"}</div>
                  <div className="text-xs text-muted-foreground">{r.orders?.buyer_email}</div>
                </td>
                <td className="p-3 uppercase">{r.provider}{r.payment_method ? ` · ${r.payment_method}` : ""}</td>
                <td className="max-w-[220px] truncate p-3 font-mono text-xs text-muted-foreground">{r.reference ?? "—"}</td>
                <td className={`p-3 font-mono ${Number(r.amount) < 0 ? "text-destructive" : ""}`}>{formatPrice(Number(r.amount), r.currency)}</td>
                <td className="p-3">
                  {badge(r.status)}
                  {r.failure_reason && <div className="mt-1 text-xs text-destructive">{r.failure_reason}</div>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
