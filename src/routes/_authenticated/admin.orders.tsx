import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { useAdminI18n, statusLabel } from "@/lib/i18n-admin";

export const Route = createFileRoute("/_authenticated/admin/orders")({
  component: AdminOrders,
});

type Order = {
  id: string;
  status: "pending" | "processing" | "paid" | "shipped" | "completed" | "cancelled";
  total: number;
  currency: string;
  buyer_id: string;
  ship_full_name: string;
  ship_city: string;
  payment_method: string;
  created_at: string;
};

const STATUS_COLOR: Record<string, string> = {
  pending: "bg-amber-100 text-amber-800",
  processing: "bg-blue-100 text-blue-800",
  paid: "bg-emerald-100 text-emerald-800",
  shipped: "bg-indigo-100 text-indigo-800",
  completed: "bg-green-100 text-green-800",
  cancelled: "bg-rose-100 text-rose-800",
};

function AdminOrders() {
  const { L } = useAdminI18n();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | Order["status"]>("all");

  async function load() {
    setLoading(true);
    let q = supabase.from("orders").select("*").order("created_at", { ascending: false }).limit(200);
    if (filter !== "all") q = q.eq("status", filter);
    const { data, error } = await q;
    if (error) toast.error(error.message);
    setOrders((data as Order[]) || []);
    setLoading(false);
  }

  useEffect(() => { load(); }, [filter]);

  async function setStatus(id: string, status: Order["status"]) {
    const { error } = await supabase.from("orders").update({ status }).eq("id", id);
    if (error) return toast.error(error.message);
    toast.success(L.updated);
    load();
  }

  const statuses: Order["status"][] = ["pending", "processing", "paid", "shipped", "completed", "cancelled"];
  const filterLabel = (s: "all" | Order["status"]) => (s === "all" ? L.all : statusLabel(L, s));

  return (
    <div>
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-foreground">{L.orTitle}</h1>
          <p className="text-sm text-muted-foreground mt-1">{L.orSub}</p>
        </div>
        <div className="flex gap-1 bg-card border border-border rounded-md p-1 overflow-x-auto max-w-full">
          {(["all", ...statuses] as const).map((s) => (
            <button key={s} onClick={() => setFilter(s as typeof filter)} className={`px-3 py-1.5 text-xs rounded whitespace-nowrap ${filter === s ? "bg-brand text-brand-foreground font-semibold" : "text-foreground hover:bg-accent"}`}>{filterLabel(s)}</button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="grid place-items-center py-16"><Loader2 className="w-6 h-6 animate-spin text-brand" /></div>
      ) : orders.length === 0 ? (
        <div className="bg-card border border-border rounded-xl p-10 text-center text-muted-foreground mt-6">{L.orNo}</div>
      ) : (
        <div className="mt-6 bg-card border border-border rounded-xl overflow-hidden overflow-x-auto">
          <table className="w-full text-sm min-w-[700px]">
            <thead className="bg-muted/50 text-xs uppercase text-muted-foreground">
              <tr>
                <th className="text-start p-3">{L.orCol_order}</th>
                <th className="text-start p-3">{L.orCol_customer}</th>
                <th className="text-start p-3">{L.orCol_total}</th>
                <th className="text-start p-3">{L.orCol_payment}</th>
                <th className="text-start p-3">{L.status}</th>
                <th className="text-end p-3">{L.actions}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {orders.map((o) => (
                <tr key={o.id} className="hover:bg-muted/30">
                  <td className="p-3">
                    <Link to="/orders/$id" params={{ id: o.id }} className="font-medium text-brand hover:underline">#{o.id.slice(0, 8)}</Link>
                    <div className="text-xs text-muted-foreground">{new Date(o.created_at).toLocaleString()}</div>
                  </td>
                  <td className="p-3">
                    <div className="font-medium text-foreground">{o.ship_full_name}</div>
                    <div className="text-xs text-muted-foreground">{o.ship_city}</div>
                  </td>
                  <td className="p-3 font-bold text-sale">{o.currency} {Number(o.total).toFixed(2)}</td>
                  <td className="p-3 text-muted-foreground">{o.payment_method === "cod" ? L.orCod : o.payment_method}</td>
                  <td className="p-3"><span className={`text-xs px-2 py-1 rounded-full font-semibold ${STATUS_COLOR[o.status]}`}>{statusLabel(L, o.status)}</span></td>
                  <td className="p-3 text-end">
                    <select value={o.status} onChange={(e) => setStatus(o.id, e.target.value as Order["status"])} className="text-xs rounded border border-border bg-background px-2 py-1">
                      {statuses.map((s) => <option key={s} value={s}>{statusLabel(L, s)}</option>)}
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
