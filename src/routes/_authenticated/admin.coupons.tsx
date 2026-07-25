import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useI18n } from "@/lib/i18n";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Ticket, Plus, Pencil, Trash2, Percent, Coins } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/admin/coupons")({
  component: CouponsPage,
});

type Coupon = {
  id: string;
  code: string;
  description: string | null;
  discount_type: string;
  discount_value: number;
  min_total: number | null;
  max_uses: number | null;
  used_count: number;
  starts_at: string | null;
  expires_at: string | null;
  is_active: boolean;
};

function toLocalInput(v: string | null) {
  if (!v) return "";
  const d = new Date(v);
  const off = d.getTimezoneOffset();
  const iso = new Date(d.getTime() - off * 60000).toISOString();
  return iso.slice(0, 16);
}

function statusOf(c: Coupon, t: (k: string) => string) {
  const now = Date.now();
  if (!c.is_active) return { label: t("coupons.status.disabled"), cls: "bg-muted text-muted-foreground" };
  if (c.starts_at && new Date(c.starts_at).getTime() > now) return { label: t("coupons.status.scheduled"), cls: "bg-blue-500/15 text-blue-400" };
  if (c.expires_at && new Date(c.expires_at).getTime() < now) return { label: t("coupons.status.expired"), cls: "bg-red-500/15 text-red-400" };
  return { label: t("coupons.status.active"), cls: "bg-primary/15 text-primary" };
}

function CouponsPage() {
  const { t } = useI18n();
  const qc = useQueryClient();
  const { data: coupons } = useQuery({
    queryKey: ["admin-coupons"],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("admin_list_coupons");
      if (error) throw error;
      return (data ?? []) as Coupon[];
    },
  });
  const [editing, setEditing] = useState<Partial<Coupon> | null>(null);

  const save = useMutation({
    mutationFn: async (payload: Partial<Coupon>) => {
      const { error } = await supabase.rpc("admin_upsert_coupon", { _data: payload as never });
      if (error) throw error;
    },
    onSuccess: () => { toast.success("✓"); setEditing(null); qc.invalidateQueries({ queryKey: ["admin-coupons"] }); },
    onError: (e: Error) => toast.error(e.message),
  });

  const del = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.rpc("admin_delete_coupon", { _id: id });
      if (error) throw error;
    },
    onSuccess: () => { toast.success("✓"); qc.invalidateQueries({ queryKey: ["admin-coupons"] }); },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="flex items-center gap-2 font-display text-2xl font-bold"><Ticket className="h-6 w-6 text-primary" />{t("coupons.title")}</h1>
          <p className="mt-1 text-sm text-muted-foreground">{t("coupons.subtitle")}</p>
        </div>
        <Button onClick={() => setEditing({ discount_type: "percent", is_active: true, discount_value: 10 })} className="bg-primary text-background hover:bg-primary">
          <Plus className="me-1 h-4 w-4" />{t("coupons.new")}
        </Button>
      </div>

      <div className="rounded-2xl border border-primary/10 bg-card">
        {(coupons ?? []).length === 0 ? (
          <div className="p-12 text-center text-muted-foreground">
            <Ticket className="mx-auto mb-2 h-10 w-10 text-primary/30" />
            {t("coupons.empty")}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b border-primary/10 text-xs uppercase tracking-wider text-muted-foreground">
                <tr>
                  <th className="p-3 text-start">{t("coupons.code")}</th>
                  <th className="p-3 text-start">{t("coupons.value")}</th>
                  <th className="p-3 text-start">{t("coupons.used")}</th>
                  <th className="p-3 text-start">{t("coupons.starts_at")}</th>
                  <th className="p-3 text-start">{t("coupons.expires_at")}</th>
                  <th className="p-3 text-start">{t("admin.status")}</th>
                  <th className="p-3"></th>
                </tr>
              </thead>
              <tbody>
                {(coupons ?? []).map((c) => {
                  const s = statusOf(c, t);
                  return (
                    <tr key={c.id} className="border-b border-primary/5 last:border-0 hover:bg-primary/5">
                      <td className="p-3">
                        <div className="font-mono font-bold text-primary">{c.code}</div>
                        {c.description && <div className="text-xs text-muted-foreground">{c.description}</div>}
                      </td>
                      <td className="p-3">
                        <span className="inline-flex items-center gap-1 font-mono">
                          {c.discount_type === "percent" ? <><Percent className="h-3 w-3" />{c.discount_value}%</> : <><Coins className="h-3 w-3" />{c.discount_value}</>}
                        </span>
                      </td>
                      <td className="p-3 font-mono text-xs">{c.used_count}{c.max_uses ? ` / ${c.max_uses}` : ""}</td>
                      <td className="p-3 text-xs text-muted-foreground">{c.starts_at ? new Date(c.starts_at).toLocaleString() : "—"}</td>
                      <td className="p-3 text-xs text-muted-foreground">{c.expires_at ? new Date(c.expires_at).toLocaleString() : "—"}</td>
                      <td className="p-3"><span className={`rounded-full px-2 py-0.5 text-xs ${s.cls}`}>{s.label}</span></td>
                      <td className="p-3 text-end">
                        <Button variant="ghost" size="icon" onClick={() => setEditing(c)}><Pencil className="h-4 w-4" /></Button>
                        <Button variant="ghost" size="icon" onClick={() => { if (confirm(t("coupons.confirm_delete"))) del.mutate(c.id); }}>
                          <Trash2 className="h-4 w-4 text-red-400" />
                        </Button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <Dialog open={!!editing} onOpenChange={(o) => !o && setEditing(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>{editing?.id ? t("coupons.edit") : t("coupons.new")}</DialogTitle></DialogHeader>
          {editing && (
            <div className="grid gap-3">
              <div>
                <label className="mb-1 block text-xs text-muted-foreground">{t("coupons.code")}</label>
                <Input value={editing.code ?? ""} onChange={(e) => setEditing({ ...editing, code: e.target.value.toUpperCase() })} placeholder="SUMMER25" />
              </div>
              <div>
                <label className="mb-1 block text-xs text-muted-foreground">{t("coupons.description")}</label>
                <Input value={editing.description ?? ""} onChange={(e) => setEditing({ ...editing, description: e.target.value })} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block text-xs text-muted-foreground">{t("coupons.type")}</label>
                  <select value={editing.discount_type ?? "percent"} onChange={(e) => setEditing({ ...editing, discount_type: e.target.value })} className="h-10 w-full rounded-md border border-primary/20 bg-background px-3 text-sm">
                    <option value="percent">{t("coupons.percent")}</option>
                    <option value="fixed">{t("coupons.fixed")}</option>
                  </select>
                </div>
                <div>
                  <label className="mb-1 block text-xs text-muted-foreground">{t("coupons.value")}</label>
                  <Input type="number" step="0.01" value={editing.discount_value ?? 0} onChange={(e) => setEditing({ ...editing, discount_value: Number(e.target.value) })} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block text-xs text-muted-foreground">{t("coupons.min_total")}</label>
                  <Input type="number" step="0.01" value={editing.min_total ?? ""} onChange={(e) => setEditing({ ...editing, min_total: e.target.value === "" ? null : Number(e.target.value) })} />
                </div>
                <div>
                  <label className="mb-1 block text-xs text-muted-foreground">{t("coupons.max_uses")}</label>
                  <Input type="number" value={editing.max_uses ?? ""} onChange={(e) => setEditing({ ...editing, max_uses: e.target.value === "" ? null : Number(e.target.value) })} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block text-xs text-muted-foreground">{t("coupons.starts_at")}</label>
                  <Input type="datetime-local" value={toLocalInput(editing.starts_at ?? null)} onChange={(e) => setEditing({ ...editing, starts_at: e.target.value ? new Date(e.target.value).toISOString() : null })} />
                </div>
                <div>
                  <label className="mb-1 block text-xs text-muted-foreground">{t("coupons.expires_at")}</label>
                  <Input type="datetime-local" value={toLocalInput(editing.expires_at ?? null)} onChange={(e) => setEditing({ ...editing, expires_at: e.target.value ? new Date(e.target.value).toISOString() : null })} />
                </div>
              </div>
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={editing.is_active ?? true} onChange={(e) => setEditing({ ...editing, is_active: e.target.checked })} />
                {t("coupons.active")}
              </label>
            </div>
          )}
          <DialogFooter>
            <Button variant="ghost" onClick={() => setEditing(null)}>✕</Button>
            <Button onClick={() => editing && save.mutate(editing)} disabled={save.isPending || !editing?.code || !editing?.discount_value} className="bg-primary text-background hover:bg-primary">
              {t("coupons.save")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
