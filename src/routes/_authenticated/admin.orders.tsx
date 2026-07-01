import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { formatPrice } from "@/lib/format";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { CheckCircle2, XCircle, FileImage, Eye, Clock } from "lucide-react";
import { toast } from "sonner";
import { useState } from "react";

type OrderStatus = "pending" | "paid" | "processing" | "shipped" | "delivered" | "cancelled" | "refunded";
type PayStatus = "pending" | "paid" | "failed" | "refunded";

export const Route = createFileRoute("/_authenticated/admin/orders")({
  component: AdminOrders,
});

function AdminOrders() {
  const qc = useQueryClient();
  const [filter, setFilter] = useState<"all" | "pending" | "paid">("all");

  const { data } = useQuery({
    queryKey: ["admin-orders"],
    queryFn: async () => (await supabase.from("orders").select("*, order_items(*), payment_methods(name_en, name_ar, type)").order("created_at", { ascending: false })).data ?? [],
  });

  const filtered = (data ?? []).filter((o) => filter === "all" ? true : filter === "pending" ? o.payment_status === "pending" : o.payment_status === "paid");

  const updateStatus = async (id: string, status: OrderStatus) => {
    const { error } = await supabase.from("orders").update({ status }).eq("id", id);
    if (error) toast.error(error.message); else { toast.success("Updated"); qc.invalidateQueries({ queryKey: ["admin-orders"] }); }
  };

  const confirmPayment = async (id: string) => {
    const { data: u } = await supabase.auth.getUser();
    const { error } = await supabase.from("orders").update({
      payment_status: "paid" as PayStatus,
      status: "processing" as OrderStatus,
      payment_confirmed_at: new Date().toISOString(),
      payment_confirmed_by: u.user?.id ?? null,
    }).eq("id", id);
    if (error) toast.error(error.message);
    else { toast.success("Payment confirmed"); qc.invalidateQueries({ queryKey: ["admin-orders"] }); }
  };

  const rejectPayment = async (id: string, notes: string) => {
    const { error } = await supabase.from("orders").update({
      payment_status: "failed" as PayStatus,
      status: "cancelled" as OrderStatus,
      admin_notes: notes,
    }).eq("id", id);
    if (error) toast.error(error.message);
    else { toast.success("Payment rejected"); qc.invalidateQueries({ queryKey: ["admin-orders"] }); }
  };

  const saveNotes = async (id: string, notes: string) => {
    const { error } = await supabase.from("orders").update({ admin_notes: notes }).eq("id", id);
    if (error) toast.error(error.message); else { toast.success("Saved"); qc.invalidateQueries({ queryKey: ["admin-orders"] }); }
  };

  const payBadge = (s: string) => {
    const map: Record<string, string> = {
      pending: "bg-amber-500/20 text-amber-300 border-amber-500/30",
      paid: "bg-emerald-500/20 text-emerald-300 border-emerald-500/30",
      failed: "bg-red-500/20 text-red-300 border-red-500/30",
      refunded: "bg-blue-500/20 text-blue-300 border-blue-500/30",
    };
    return map[s] ?? "bg-muted";
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <h1 className="font-display text-2xl font-bold">Orders</h1>
        <div className="ms-auto flex gap-1 rounded-lg border border-cyan-500/20 p-1">
          {(["all", "pending", "paid"] as const).map((f) => (
            <button key={f} onClick={() => setFilter(f)}
              className={`rounded px-3 py-1 text-xs font-medium capitalize transition-colors ${filter === f ? "bg-cyan-500 text-background" : "text-muted-foreground hover:text-foreground"}`}>
              {f}
              {f === "pending" && (data ?? []).some((o) => o.payment_status === "pending") &&
                <span className="ms-1 inline-block h-1.5 w-1.5 rounded-full bg-amber-400" />}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-3">
        {filtered.length === 0 && <div className="rounded-xl border border-cyan-500/10 bg-card p-8 text-center text-muted-foreground">No orders</div>}
        {filtered.map((o) => <OrderCard key={o.id} order={o} onConfirm={confirmPayment} onReject={rejectPayment} onStatus={updateStatus} onNotes={saveNotes} payBadge={payBadge} />)}
      </div>
    </div>
  );
}

type OrderRow = {
  id: string; order_number: string; buyer_email: string; buyer_name: string | null;
  created_at: string; total: number; currency: string; status: string; payment_status: string;
  payment_reference: string | null; payment_proof_url: string | null; customer_notes: string | null;
  admin_notes: string | null; payment_confirmed_at: string | null;
  payment_methods: { name_en: string; name_ar: string; type: string } | null;
  order_items: { id: string; product_name: string; quantity: number; total: number }[] | null;
};

function OrderCard({ order: o, onConfirm, onReject, onStatus, onNotes, payBadge }: {
  order: OrderRow;
  onConfirm: (id: string) => void;
  onReject: (id: string, notes: string) => void;
  onStatus: (id: string, s: OrderStatus) => void;
  onNotes: (id: string, n: string) => void;
  payBadge: (s: string) => string;
}) {
  const [notes, setNotes] = useState(o.admin_notes ?? "");
  const [proofUrl, setProofUrl] = useState<string | null>(null);

  const openProof = async () => {
    if (!o.payment_proof_url) return;
    const { data } = await supabase.storage.from("payment-proofs").createSignedUrl(o.payment_proof_url, 60 * 10);
    if (data?.signedUrl) setProofUrl(data.signedUrl);
  };

  return (
    <div className="rounded-xl border border-cyan-500/10 bg-card p-4">
      <div className="flex flex-wrap items-center gap-3">
        <span className="font-mono text-cyan-400">{o.order_number}</span>
        <Badge className={payBadge(o.payment_status)}>{o.payment_status}</Badge>
        <span className="text-sm text-muted-foreground">{o.buyer_email}</span>
        <span className="text-xs text-muted-foreground"><Clock className="me-1 inline h-3 w-3" />{new Date(o.created_at).toLocaleString()}</span>
        <span className="ms-auto font-mono font-bold">{formatPrice(Number(o.total), o.currency)}</span>
        <Select value={o.status} onValueChange={(v) => onStatus(o.id, v as OrderStatus)}>
          <SelectTrigger className="w-36"><SelectValue /></SelectTrigger>
          <SelectContent>
            {(["pending","paid","processing","shipped","delivered","cancelled","refunded"] as OrderStatus[]).map((s) => (
              <SelectItem key={s} value={s}>{s}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="mt-3 grid gap-3 md:grid-cols-2">
        <div>
          <div className="mb-1 text-xs font-semibold uppercase text-muted-foreground">Items</div>
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
          <div className="mb-1 text-xs font-semibold uppercase text-muted-foreground">Payment</div>
          <div className="space-y-1 text-sm">
            <div>Method: <span className="font-medium">{o.payment_methods?.name_en ?? "—"}</span></div>
            {o.payment_reference && <div>Ref: <code className="text-xs">{o.payment_reference}</code></div>}
            {o.customer_notes && <div className="text-muted-foreground">"{o.customer_notes}"</div>}
            {o.payment_proof_url && (
              <Dialog>
                <DialogTrigger asChild>
                  <Button size="sm" variant="outline" onClick={openProof} className="mt-1"><FileImage className="me-1 h-3.5 w-3.5" />View proof</Button>
                </DialogTrigger>
                <DialogContent className="max-w-3xl">
                  <DialogHeader><DialogTitle>Payment proof · {o.order_number}</DialogTitle></DialogHeader>
                  {proofUrl ? <img src={proofUrl} alt="proof" className="w-full rounded-md" /> : <div className="p-8 text-center text-muted-foreground">Loading...</div>}
                </DialogContent>
              </Dialog>
            )}
          </div>
        </div>
      </div>

      <div className="mt-3">
        <Textarea placeholder="Admin notes..." value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} className="text-sm" />
        <div className="mt-2 flex flex-wrap gap-2">
          <Button size="sm" variant="outline" onClick={() => onNotes(o.id, notes)}>Save notes</Button>
          {o.payment_status === "pending" && (
            <>
              <Button size="sm" className="bg-emerald-500 text-background hover:bg-emerald-400" onClick={() => onConfirm(o.id)}>
                <CheckCircle2 className="me-1 h-4 w-4" />Confirm payment
              </Button>
              <Button size="sm" variant="destructive" onClick={() => onReject(o.id, notes)}>
                <XCircle className="me-1 h-4 w-4" />Reject
              </Button>
            </>
          )}
          {o.payment_confirmed_at && (
            <span className="ms-auto text-xs text-emerald-400">
              <Eye className="me-1 inline h-3 w-3" />Confirmed {new Date(o.payment_confirmed_at).toLocaleString()}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
