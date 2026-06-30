import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { formatPrice } from "@/lib/format";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";

type OrderStatus = "pending" | "paid" | "processing" | "shipped" | "delivered" | "cancelled" | "refunded";

export const Route = createFileRoute("/_authenticated/admin/orders")({
  component: AdminOrders,
});

function AdminOrders() {
  const qc = useQueryClient();
  const { data } = useQuery({
    queryKey: ["admin-orders"],
    queryFn: async () => (await supabase.from("orders").select("*, order_items(*)").order("created_at", { ascending: false })).data ?? [],
  });

  const updateStatus = async (id: string, status: OrderStatus) => {
    const { error } = await supabase.from("orders").update({ status }).eq("id", id);
    if (error) toast.error(error.message); else { toast.success("Updated"); qc.invalidateQueries({ queryKey: ["admin-orders"] }); }
  };

  return (
    <div className="space-y-4">
      <h1 className="font-display text-2xl font-bold">Orders</h1>
      <div className="space-y-3">
        {(data ?? []).length === 0 && <div className="rounded-xl border border-cyan-500/10 bg-card p-8 text-center text-muted-foreground">No orders</div>}
        {(data ?? []).map((o) => (
          <div key={o.id} className="rounded-xl border border-cyan-500/10 bg-card p-4">
            <div className="flex flex-wrap items-center gap-3">
              <span className="font-mono text-cyan-400">{o.order_number}</span>
              <span className="text-sm text-muted-foreground">{o.buyer_email}</span>
              <span className="text-xs text-muted-foreground">{new Date(o.created_at).toLocaleString()}</span>
              <span className="ms-auto font-mono font-bold">{formatPrice(Number(o.total), o.currency)}</span>
              <Select value={o.status} onValueChange={(v) => updateStatus(o.id, v as OrderStatus)}>
                <SelectTrigger className="w-36"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {(["pending","paid","processing","shipped","delivered","cancelled","refunded"] as OrderStatus[]).map((s) => (
                    <SelectItem key={s} value={s}>{s}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="mt-3 space-y-1 text-sm">
              {o.order_items?.map((it: { id: string; product_name: string; quantity: number; total: number }) => (
                <div key={it.id} className="flex justify-between">
                  <span>{it.product_name} × {it.quantity}</span>
                  <span className="font-mono">{formatPrice(Number(it.total), o.currency)}</span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
