import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Loader2, Check, X, Pause } from "lucide-react";

export const Route = createFileRoute("/_authenticated/admin/vendors")({
  component: AdminVendors,
});

type Vendor = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  logo_url: string | null;
  status: "pending" | "approved" | "rejected" | "suspended";
  owner_id: string;
  created_at: string;
};

const STATUS_STYLES: Record<string, string> = {
  pending: "bg-amber-100 text-amber-800",
  approved: "bg-emerald-100 text-emerald-800",
  rejected: "bg-rose-100 text-rose-800",
  suspended: "bg-slate-200 text-slate-700",
};

function AdminVendors() {
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "pending" | "approved" | "rejected" | "suspended">("all");

  async function load() {
    setLoading(true);
    let q = supabase.from("vendors").select("*").order("created_at", { ascending: false });
    if (filter !== "all") q = q.eq("status", filter);
    const { data, error } = await q;
    if (error) toast.error(error.message);
    setVendors((data as Vendor[]) || []);
    setLoading(false);
  }

  useEffect(() => { load(); }, [filter]);

  async function setStatus(id: string, status: Vendor["status"]) {
    const { error } = await supabase.from("vendors").update({ status }).eq("id", id);
    if (error) return toast.error(error.message);
    toast.success(`Vendor ${status}`);
    load();
  }

  return (
    <div>
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Vendors</h1>
          <p className="text-sm text-muted-foreground mt-1">Approve, reject, or suspend seller stores.</p>
        </div>
        <div className="flex gap-1 bg-card border border-border rounded-md p-1">
          {(["all", "pending", "approved", "rejected", "suspended"] as const).map((s) => (
            <button
              key={s}
              onClick={() => setFilter(s)}
              className={`px-3 py-1.5 text-xs rounded capitalize ${filter === s ? "bg-brand text-brand-foreground font-semibold" : "text-foreground hover:bg-accent"}`}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="grid place-items-center py-16"><Loader2 className="w-6 h-6 animate-spin text-brand" /></div>
      ) : vendors.length === 0 ? (
        <div className="bg-card border border-border rounded-xl p-10 text-center text-muted-foreground mt-6">No vendors.</div>
      ) : (
        <div className="mt-6 bg-card border border-border rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 text-xs uppercase text-muted-foreground">
              <tr>
                <th className="text-start p-3">Store</th>
                <th className="text-start p-3 hidden md:table-cell">Slug</th>
                <th className="text-start p-3">Status</th>
                <th className="text-start p-3 hidden lg:table-cell">Joined</th>
                <th className="text-end p-3">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {vendors.map((v) => (
                <tr key={v.id} className="hover:bg-muted/30">
                  <td className="p-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded bg-secondary overflow-hidden shrink-0">
                        {v.logo_url && <img src={v.logo_url} alt="" className="w-full h-full object-cover" />}
                      </div>
                      <div className="min-w-0">
                        <div className="font-medium text-foreground truncate">{v.name}</div>
                        {v.description && <div className="text-xs text-muted-foreground truncate max-w-xs">{v.description}</div>}
                      </div>
                    </div>
                  </td>
                  <td className="p-3 hidden md:table-cell text-muted-foreground">{v.slug}</td>
                  <td className="p-3"><span className={`text-xs px-2 py-1 rounded-full font-semibold capitalize ${STATUS_STYLES[v.status]}`}>{v.status}</span></td>
                  <td className="p-3 hidden lg:table-cell text-muted-foreground">{new Date(v.created_at).toLocaleDateString()}</td>
                  <td className="p-3">
                    <div className="flex items-center justify-end gap-1">
                      {v.status !== "approved" && (
                        <button onClick={() => setStatus(v.id, "approved")} className="p-1.5 rounded hover:bg-emerald-100 text-emerald-700" title="Approve"><Check className="w-4 h-4" /></button>
                      )}
                      {v.status !== "rejected" && (
                        <button onClick={() => setStatus(v.id, "rejected")} className="p-1.5 rounded hover:bg-rose-100 text-rose-700" title="Reject"><X className="w-4 h-4" /></button>
                      )}
                      {v.status !== "suspended" && (
                        <button onClick={() => setStatus(v.id, "suspended")} className="p-1.5 rounded hover:bg-slate-200 text-slate-700" title="Suspend"><Pause className="w-4 h-4" /></button>
                      )}
                    </div>
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
