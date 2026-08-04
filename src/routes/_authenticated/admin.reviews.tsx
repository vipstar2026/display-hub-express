import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Star, Check, X, Trash2, Search, MessageSquare } from "lucide-react";
import { toast } from "sonner";
import { useMemo, useState } from "react";
import { useI18n } from "@/lib/i18n";
import { makeAdminTE } from "@/lib/admin-i18n";

export const Route = createFileRoute("/_authenticated/admin/reviews")({
  component: AdminReviews,
});

type Row = {
  id: string; product_id: string; product_name: string | null; product_slug: string | null;
  user_id: string; user_email: string | null; rating: number;
  title: string | null; body: string | null; is_approved: boolean; created_at: string;
};

function AdminReviews() {
  const qc = useQueryClient();
  const { lang } = useI18n();
  const te = useMemo(() => makeAdminTE(lang), [lang]);
  const [q, setQ] = useState("");
  const [filter, setFilter] = useState<"all" | "pending" | "approved">("all");

  const { data = [], isLoading } = useQuery({
    queryKey: ["admin-reviews"],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("admin_list_reviews");
      if (error) throw error;
      return (data ?? []) as Row[];
    },
  });

  const rows = useMemo(() => data.filter((r) => {
    if (filter === "pending" && r.is_approved) return false;
    if (filter === "approved" && !r.is_approved) return false;
    if (!q) return true;
    const s = q.toLowerCase();
    return (r.product_name ?? "").toLowerCase().includes(s)
      || (r.user_email ?? "").toLowerCase().includes(s)
      || (r.title ?? "").toLowerCase().includes(s)
      || (r.body ?? "").toLowerCase().includes(s);
  }), [data, q, filter]);

  const stats = useMemo(() => {
    const total = data.length;
    const approved = data.filter((r) => r.is_approved).length;
    const avg = total > 0 ? data.reduce((s, r) => s + r.rating, 0) / total : 0;
    return { total, approved, pending: total - approved, avg };
  }, [data]);

  const toggle = async (r: Row) => {
    const { error } = await supabase.rpc("admin_set_review_approved", { _id: r.id, _approved: !r.is_approved });
    if (error) return toast.error(error.message);
    toast.success(r.is_approved ? te("Unapproved") : te("Approved"));
    qc.invalidateQueries({ queryKey: ["admin-reviews"] });
  };

  const remove = async (id: string) => {
    if (!confirm(te("Delete this review permanently?"))) return;
    const { error } = await supabase.rpc("admin_delete_review", { _id: id });
    if (error) return toast.error(error.message);
    toast.success(te("Deleted"));
    qc.invalidateQueries({ queryKey: ["admin-reviews"] });
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="flex items-center gap-2 font-display text-2xl font-bold">
          <MessageSquare className="h-6 w-6 text-primary" /> {te("Reviews")}
        </h1>
        <p className="text-sm text-muted-foreground">{te("Approve, unapprove, or delete customer product reviews.")}</p>
      </div>

      <div className="grid gap-3 sm:grid-cols-4">
        <Kpi label={te("Total")} value={stats.total} />
        <Kpi label={te("Pending")} value={stats.pending} accent="text-amber-400" />
        <Kpi label={te("Approved")} value={stats.approved} accent="text-emerald-400" />
        <Kpi label={te("Avg rating")} value={stats.avg.toFixed(2)} accent="text-primary" />
      </div>

      <div className="flex flex-wrap gap-2">
        <div className="relative min-w-[220px] flex-1">
          <Search className="pointer-events-none absolute start-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder={te("Search product / email / text…")} className="h-9 ps-8" />
        </div>
        <Select value={filter} onValueChange={(v) => setFilter(v as typeof filter)}>
          <SelectTrigger className="h-9 w-40"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{te("All")}</SelectItem>
            <SelectItem value="pending">{te("Pending")}</SelectItem>
            <SelectItem value="approved">{te("Approved")}</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="rounded-2xl border border-primary/10 bg-card">
        {isLoading ? (
          <div className="p-10 text-center text-muted-foreground">{te("Loading…")}</div>
        ) : rows.length === 0 ? (
          <div className="p-12 text-center text-muted-foreground">
            <MessageSquare className="mx-auto mb-2 h-10 w-10 text-primary/30" />
            {te("No reviews.")}
          </div>
        ) : (
          <div className="divide-y divide-primary/10">
            {rows.map((r) => (
              <div key={r.id} className="flex flex-col gap-3 p-4 sm:flex-row sm:items-start">
                <div className="min-w-0 flex-1 space-y-1.5">
                  <div className="flex flex-wrap items-center gap-2">
                    <div className="flex items-center">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star key={i} className={`h-3.5 w-3.5 ${i < r.rating ? "fill-amber-400 text-amber-400" : "text-muted-foreground/30"}`} />
                      ))}
                    </div>
                    <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${r.is_approved ? "bg-emerald-500/15 text-emerald-400" : "bg-amber-500/15 text-amber-400"}`}>
                      {r.is_approved ? te("Approved") : te("Pending")}
                    </span>
                    <span className="text-xs text-muted-foreground">{new Date(r.created_at).toLocaleString()}</span>
                  </div>
                  <div className="text-sm font-medium truncate">{r.title || "—"}</div>
                  <div className="text-sm text-muted-foreground whitespace-pre-wrap break-words">{r.body || "—"}</div>
                  <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
                    <span>🛒 <span className="text-foreground">{r.product_name ?? r.product_id.slice(0, 8)}</span></span>
                    <span>👤 <span className="text-foreground">{r.user_email ?? r.user_id.slice(0, 8)}</span></span>
                  </div>
                </div>
                <div className="flex shrink-0 gap-1.5">
                  <Button size="sm" variant={r.is_approved ? "outline" : "default"} onClick={() => toggle(r)} className={r.is_approved ? "" : "bg-primary text-background hover:bg-primary"}>
                    {r.is_approved ? <><X className="me-1 h-3.5 w-3.5" /> {te("Unapprove")}</> : <><Check className="me-1 h-3.5 w-3.5" /> {te("Approve")}</>}
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => remove(r.id)} className="text-red-400 hover:text-red-300">
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function Kpi({ label, value, accent }: { label: string; value: number | string; accent?: string }) {
  return (
    <div className="rounded-xl border border-primary/15 bg-card p-4">
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className={`mt-1 font-display text-2xl font-bold ${accent ?? ""}`}>{value}</div>
    </div>
  );
}
