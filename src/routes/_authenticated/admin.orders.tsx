import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { formatPrice } from "@/lib/format";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { CheckCircle2, XCircle, FileImage, Eye, Clock, Download, Search, Truck, Package, ExternalLink, RotateCcw, Loader2 } from "lucide-react";
import { refundAfsPayment } from "@/lib/afs-refund.functions";
import { generateInvoicePDF } from "@/lib/invoice-pdf";
import { toast } from "sonner";
import { useMemo, useState } from "react";
import { useI18n } from "@/lib/i18n";
import { makeAdminTE } from "@/lib/admin-i18n";

type OrderStatus = "pending" | "paid" | "processing" | "shipped" | "delivered" | "cancelled" | "refunded";
type PayStatus = "pending" | "succeeded" | "failed" | "refunded";

const ORDER_STATUSES: OrderStatus[] = ["pending", "paid", "processing", "shipped", "delivered", "cancelled", "refunded"];

export const Route = createFileRoute("/_authenticated/admin/orders")({
  component: AdminOrders,
});

function AdminOrders() {
  const { lang } = useI18n();
  const te = useMemo(() => makeAdminTE(lang), [lang]);
  const qc = useQueryClient();
  const [statusFilter, setStatusFilter] = useState<"all" | OrderStatus>("all");
  const [payFilter, setPayFilter] = useState<"all" | PayStatus>("all");
  const [search, setSearch] = useState("");

  const { data } = useQuery({
    queryKey: ["admin-orders"],
    queryFn: async () => (await supabase.from("orders").select("*, order_items(*), payment_methods(name_en, name_ar, type)").order("created_at", { ascending: false })).data ?? [],
  });

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return (data ?? []).filter((o) => {
      if (statusFilter !== "all" && o.status !== statusFilter) return false;
      if (payFilter !== "all" && o.payment_status !== payFilter) return false;
      if (!q) return true;
      return [o.order_number, o.buyer_email, o.buyer_name ?? "", o.buyer_phone ?? "", o.tracking_number ?? ""]
        .some((s) => String(s).toLowerCase().includes(q));
    });
  }, [data, statusFilter, payFilter, search]);

  const kpis = useMemo(() => {
    const all = data ?? [];
    return {
      total: all.length,
      pending: all.filter((o) => o.payment_status === "pending").length,
      processing: all.filter((o) => o.status === "processing").length,
      shipped: all.filter((o) => o.status === "shipped").length,
    };
  }, [data]);

  const updateStatus = async (id: string, status: OrderStatus) => {
    const { error } = await supabase.from("orders").update({ status }).eq("id", id);
    if (error) toast.error(error.message); else { toast.success(te("Status updated")); qc.invalidateQueries({ queryKey: ["admin-orders"] }); }
  };

  const confirmPayment = async (id: string) => {
    const { data: u } = await supabase.auth.getUser();
    const { error } = await supabase.from("orders").update({
      payment_status: "succeeded" as PayStatus,
      status: "processing" as OrderStatus,
      payment_confirmed_at: new Date().toISOString(),
      payment_confirmed_by: u.user?.id ?? null,
    }).eq("id", id);
    if (error) toast.error(error.message);
    else { toast.success(te("Payment confirmed")); qc.invalidateQueries({ queryKey: ["admin-orders"] }); }
  };

  const rejectPayment = async (id: string, notes: string) => {
    const { error } = await supabase.from("orders").update({
      payment_status: "failed" as PayStatus,
      status: "cancelled" as OrderStatus,
      admin_notes: notes,
    }).eq("id", id);
    if (error) toast.error(error.message);
    else { toast.success(te("Payment rejected")); qc.invalidateQueries({ queryKey: ["admin-orders"] }); }
  };

  const saveNotes = async (id: string, notes: string) => {
    const { error } = await supabase.from("orders").update({ admin_notes: notes }).eq("id", id);
    if (error) toast.error(error.message); else { toast.success(te("Saved")); qc.invalidateQueries({ queryKey: ["admin-orders"] }); }
  };

  const saveTracking = async (id: string, tracking_number: string, tracking_carrier: string, tracking_url: string) => {
    const patch = {
      tracking_number: tracking_number || null,
      tracking_carrier: tracking_carrier || null,
      tracking_url: tracking_url || null,
    };
    const { error } = await supabase.from("orders").update(patch as never).eq("id", id);
    if (error) toast.error(error.message);
    else { toast.success(te("Tracking saved")); qc.invalidateQueries({ queryKey: ["admin-orders"] }); }
  };

  const payBadge = (s: string) => {
    const map: Record<string, string> = {
      pending: "bg-amber-500/20 text-amber-300 border-amber-500/30",
      succeeded: "bg-emerald-500/20 text-emerald-300 border-emerald-500/30",
      failed: "bg-red-500/20 text-red-300 border-red-500/30",
      refunded: "bg-blue-500/20 text-blue-300 border-blue-500/30",
    };
    return map[s] ?? "bg-muted";
  };

  const statusLabel = (v: string) => te(v.charAt(0).toUpperCase() + v.slice(1));

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <h1 className="font-display text-2xl font-bold">{te("Orders")}</h1>
      </div>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <KpiCard label={te("Total")} value={kpis.total} tone="text-primary" />
        <KpiCard label={te("Pending payment")} value={kpis.pending} tone="text-amber-400" />
        <KpiCard label={te("Processing")} value={kpis.processing} tone="text-blue-400" />
        <KpiCard label={te("Shipped")} value={kpis.shipped} tone="text-emerald-400" />
      </div>

      <div className="flex flex-wrap items-center gap-2 rounded-xl border border-primary/10 bg-card/40 p-3">
        <div className="relative min-w-[240px] flex-1">
          <Search className="pointer-events-none absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder={te("Search order #, email, name, tracking...")} className="ps-9" />
        </div>
        <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as "all" | OrderStatus)}>
          <SelectTrigger className="w-40"><SelectValue placeholder={te("Status")} /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{te("All statuses")}</SelectItem>
            {ORDER_STATUSES.map((s) => <SelectItem key={s} value={s}>{statusLabel(s)}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={payFilter} onValueChange={(v) => setPayFilter(v as "all" | PayStatus)}>
          <SelectTrigger className="w-40"><SelectValue placeholder={te("Payment")} /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{te("All payments")}</SelectItem>
            <SelectItem value="pending">{statusLabel("pending")}</SelectItem>
            <SelectItem value="succeeded">{statusLabel("succeeded")}</SelectItem>
            <SelectItem value="failed">{statusLabel("failed")}</SelectItem>
            <SelectItem value="refunded">{statusLabel("refunded")}</SelectItem>
          </SelectContent>
        </Select>
        <div className="text-xs text-muted-foreground">{filtered.length} {te("results")}</div>
      </div>

      <div className="space-y-3">
        {filtered.length === 0 && <div className="rounded-xl border border-primary/10 bg-card p-8 text-center text-muted-foreground">{te("No orders")}</div>}
        {filtered.map((o) => <OrderCard key={o.id} order={o} onConfirm={confirmPayment} onReject={rejectPayment} onStatus={updateStatus} onNotes={saveNotes} onTracking={saveTracking} payBadge={payBadge} statusLabel={statusLabel} te={te} />)}
      </div>
    </div>
  );
}

function KpiCard({ label, value, tone }: { label: string; value: number; tone: string }) {
  return (
    <div className="rounded-xl border border-primary/10 bg-card/60 p-4">
      <div className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">{label}</div>
      <div className={`mt-1 font-display text-2xl font-bold ${tone}`}>{value}</div>
    </div>
  );
}

type OrderRow = {
  id: string; order_number: string; buyer_email: string; buyer_name: string | null; buyer_phone: string | null;
  created_at: string; total: number; currency: string; status: string; payment_status: string;
  payment_reference: string | null; payment_proof_url: string | null; customer_notes: string | null;
  admin_notes: string | null; payment_confirmed_at: string | null;
  tracking_number: string | null; tracking_carrier: string | null; tracking_url: string | null;
  payment_methods: { name_en: string; name_ar: string; type: string } | null;
  order_items: { id: string; product_name: string; quantity: number; total: number }[] | null;
};

function OrderCard({ order: o, onConfirm, onReject, onStatus, onNotes, onTracking, payBadge, statusLabel, te }: {
  order: OrderRow;
  onConfirm: (id: string) => void;
  onReject: (id: string, notes: string) => void;
  onStatus: (id: string, s: OrderStatus) => void;
  onNotes: (id: string, n: string) => void;
  onTracking: (id: string, num: string, carrier: string, url: string) => void;
  payBadge: (s: string) => string;
  statusLabel: (s: string) => string;
  te: (en: string) => string;
}) {
  const [notes, setNotes] = useState(o.admin_notes ?? "");
  const [proofUrl, setProofUrl] = useState<string | null>(null);
  const [trackNum, setTrackNum] = useState(o.tracking_number ?? "");
  const [trackCarrier, setTrackCarrier] = useState(o.tracking_carrier ?? "");
  const [trackUrl, setTrackUrl] = useState(o.tracking_url ?? "");

  const openProof = async () => {
    if (!o.payment_proof_url) return;
    const { data } = await supabase.storage.from("payment-proofs").createSignedUrl(o.payment_proof_url, 60 * 10);
    if (data?.signedUrl) setProofUrl(data.signedUrl);
  };

  const quickAdvance: OrderStatus | null =
    o.status === "pending" && o.payment_status === "succeeded" ? "processing"
    : o.status === "paid" ? "processing"
    : o.status === "processing" ? "shipped"
    : o.status === "shipped" ? "delivered"
    : null;

  return (
    <div className="rounded-xl border border-primary/10 bg-card p-4">
      <div className="flex flex-wrap items-center gap-3">
        <span className="font-mono text-primary">{o.order_number}</span>
        <Badge className={payBadge(o.payment_status)}>{statusLabel(o.payment_status)}</Badge>
        <Badge variant="outline" className="border-primary/20 text-[10px] capitalize">{statusLabel(o.status)}</Badge>
        <span className="text-sm text-muted-foreground">{o.buyer_name || o.buyer_email}</span>
        <span className="text-xs text-muted-foreground"><Clock className="me-1 inline h-3 w-3" />{new Date(o.created_at).toLocaleString()}</span>
        <span className="ms-auto font-mono font-bold">{formatPrice(Number(o.total), o.currency)}</span>
        <Select value={o.status} onValueChange={(v) => onStatus(o.id, v as OrderStatus)}>
          <SelectTrigger className="w-36"><SelectValue /></SelectTrigger>
          <SelectContent>
            {ORDER_STATUSES.map((s) => (
              <SelectItem key={s} value={s}>{statusLabel(s)}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        {quickAdvance && (
          <Button size="sm" variant="outline" onClick={() => onStatus(o.id, quickAdvance)}>
            <Package className="me-1 h-3 w-3" /> → {statusLabel(quickAdvance)}
          </Button>
        )}
      </div>

      <div className="mt-3 grid gap-3 md:grid-cols-2">
        <div>
          <div className="mb-1 text-xs font-semibold uppercase text-muted-foreground">{te("Items")}</div>
          <div className="space-y-1 text-sm">
            {o.order_items?.map((it) => (
              <div key={it.id} className="flex justify-between">
                <span>{it.product_name} × {it.quantity}</span>
                <span className="font-mono">{formatPrice(Number(it.total), o.currency)}</span>
              </div>
            ))}
          </div>
        </div>
        <div>
          <div className="mb-1 text-xs font-semibold uppercase text-muted-foreground">{te("Payment")}</div>
          <div className="space-y-1 text-sm">
            <div>{te("Method:")} <span className="font-medium">{o.payment_methods?.name_en ?? "—"}</span></div>
            {o.payment_reference && <div>{te("Ref:")} <code className="text-xs">{o.payment_reference}</code></div>}
            {o.customer_notes && <div className="text-muted-foreground">"{o.customer_notes}"</div>}
            {o.payment_proof_url && (
              <Dialog>
                <DialogTrigger asChild>
                  <Button size="sm" variant="outline" onClick={openProof} className="mt-1"><FileImage className="me-1 h-3.5 w-3.5" />{te("View proof")}</Button>
                </DialogTrigger>
                <DialogContent className="max-w-3xl">
                  <DialogHeader><DialogTitle>{te("Payment proof")} · {o.order_number}</DialogTitle></DialogHeader>
                  {proofUrl ? <img src={proofUrl} alt="proof" className="w-full rounded-md" /> : <div className="p-8 text-center text-muted-foreground">{te("Loading...")}</div>}
                </DialogContent>
              </Dialog>
            )}
          </div>
        </div>
      </div>

      <div className="mt-3 rounded-lg border border-primary/10 bg-muted/20 p-3">
        <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase text-muted-foreground">
          <Truck className="h-3.5 w-3.5" /> {te("Tracking")}
          {o.tracking_url && (
            <a href={o.tracking_url} target="_blank" rel="noreferrer" className="ms-auto inline-flex items-center gap-1 text-primary hover:underline">
              {te("Open")} <ExternalLink className="h-3 w-3" />
            </a>
          )}
        </div>
        <div className="grid gap-2 md:grid-cols-3">
          <Input placeholder={te("Carrier (Aramex, DHL...)")} value={trackCarrier} onChange={(e) => setTrackCarrier(e.target.value)} className="text-sm" />
          <Input placeholder={te("Tracking number")} value={trackNum} onChange={(e) => setTrackNum(e.target.value)} className="text-sm" />
          <Input placeholder={te("Tracking URL")} value={trackUrl} onChange={(e) => setTrackUrl(e.target.value)} className="text-sm" />
        </div>
        <div className="mt-2">
          <Button size="sm" variant="outline" onClick={() => onTracking(o.id, trackNum, trackCarrier, trackUrl)}>{te("Save tracking")}</Button>
        </div>
      </div>

      <div className="mt-3">
        <Textarea placeholder={te("Admin notes...")} value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} className="text-sm" />
        <div className="mt-2 flex flex-wrap gap-2">
          <Button size="sm" variant="outline" onClick={() => onNotes(o.id, notes)}>{te("Save notes")}</Button>
          <Button size="sm" variant="outline" onClick={() => generateInvoicePDF(o as unknown as Parameters<typeof generateInvoicePDF>[0])}>
            <Download className="me-1 h-4 w-4" />{te("Invoice PDF")}
          </Button>
          {o.payment_status === "pending" && (
            <>
              <Button size="sm" className="bg-emerald-500 text-background hover:bg-emerald-400" onClick={() => onConfirm(o.id)}>
                <CheckCircle2 className="me-1 h-4 w-4" />{te("Confirm payment")}
              </Button>
              <Button size="sm" variant="destructive" onClick={() => onReject(o.id, notes)}>
                <XCircle className="me-1 h-4 w-4" />{te("Reject")}
              </Button>
            </>
          )}
          {o.payment_status === "succeeded" && (
            <RefundButton order={o} te={te} />
          )}
          {o.payment_confirmed_at && (
            <span className="ms-auto text-xs text-emerald-400">
              <Eye className="me-1 inline h-3 w-3" />{te("Confirmed")} {new Date(o.payment_confirmed_at).toLocaleString()}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

function RefundButton({ order: o, te }: { order: OrderRow; te: (en: string) => string }) {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [amount, setAmount] = useState(String(Number(o.total).toFixed(2)));
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);

  const run = async () => {
    setBusy(true);
    try {
      const res = await refundAfsPayment({ data: { order_id: o.id, amount: Number(amount), reason: reason || undefined } });
      if (res.success) {
        toast.success(`${te("Refunded")} ${res.amount} ${o.currency}`);
        setOpen(false);
        qc.invalidateQueries({ queryKey: ["admin-orders"] });
      } else {
        toast.error(res.message || res.code || te("Refund failed"));
      }
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline"><RotateCcw className="me-1 h-4 w-4" />{te("Refund")}</Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader><DialogTitle>{te("Refund")} · {o.order_number}</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <div className="text-xs text-muted-foreground">
            {te("Paid total:")} <span className="font-mono">{formatPrice(Number(o.total), o.currency)}</span>. {te("Partial refunds are allowed.")}
          </div>
          <Input type="number" step="0.01" min="0" value={amount} onChange={(e) => setAmount(e.target.value)} />
          <Textarea placeholder={te("Reason (saved to admin notes)")} rows={2} value={reason} onChange={(e) => setReason(e.target.value)} />
          <Button disabled={busy} onClick={run} className="w-full">
            {busy ? <Loader2 className="me-1 h-4 w-4 animate-spin" /> : <RotateCcw className="me-1 h-4 w-4" />}
            {te("Send refund to AFS")}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
