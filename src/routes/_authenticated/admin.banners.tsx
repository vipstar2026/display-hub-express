import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { toast } from "sonner";
import { Image as ImageIcon, Plus, Pencil, Trash2, Eye, EyeOff, ArrowUp, ArrowDown, ExternalLink } from "lucide-react";

export const Route = createFileRoute("/_authenticated/admin/banners")({
  component: AdminBanners,
});

type Banner = {
  id: string;
  title_ar: string | null; title_en: string | null; title_ur: string | null;
  subtitle_ar: string | null; subtitle_en: string | null; subtitle_ur: string | null;
  image_url: string;
  link_url: string | null;
  cta_label_ar: string | null; cta_label_en: string | null; cta_label_ur: string | null;
  sort_order: number;
  is_active: boolean;
  starts_at: string | null;
  ends_at: string | null;
  created_at: string;
};

const empty: Partial<Banner> = {
  title_ar: "", title_en: "", title_ur: "", title_bn: "",
  subtitle_ar: "", subtitle_en: "", subtitle_ur: "", subtitle_bn: "",
  image_url: "", link_url: "",
  cta_label_ar: "", cta_label_en: "", cta_label_ur: "", cta_label_bn: "",
  sort_order: 0, is_active: true,
  starts_at: null, ends_at: null,
};

function AdminBanners() {
  const qc = useQueryClient();
  const [editing, setEditing] = useState<Partial<Banner> | null>(null);
  const [saving, setSaving] = useState(false);

  const { data: banners, isFetching } = useQuery({
    queryKey: ["admin-banners"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("banners" as any)
        .select("*")
        .order("sort_order", { ascending: true });
      if (error) throw error;
      return (data ?? []) as unknown as Banner[];
    },
  });

  const stats = useMemo(() => {
    const total = banners?.length ?? 0;
    const active = banners?.filter((b) => b.is_active).length ?? 0;
    return { total, active, inactive: total - active };
  }, [banners]);

  const save = async () => {
    if (!editing) return;
    if (!editing.image_url) return toast.error("Image URL is required");
    const payload: any = {
      title_ar: editing.title_ar || null, title_en: editing.title_en || null, title_ur: editing.title_ur || null, title_bn: (editing as any).title_bn || null,
      subtitle_ar: editing.subtitle_ar || null, subtitle_en: editing.subtitle_en || null, subtitle_ur: editing.subtitle_ur || null, subtitle_bn: (editing as any).subtitle_bn || null,
      image_url: editing.image_url,
      link_url: editing.link_url || null,
      cta_label_ar: editing.cta_label_ar || null, cta_label_en: editing.cta_label_en || null, cta_label_ur: editing.cta_label_ur || null, cta_label_bn: (editing as any).cta_label_bn || null,
      sort_order: Number(editing.sort_order ?? 0),
      is_active: editing.is_active ?? true,
      starts_at: editing.starts_at || null,
      ends_at: editing.ends_at || null,
    };
    setSaving(true);
    try {
      if (editing.id) {
        const { error } = await supabase.from("banners" as any).update(payload).eq("id", editing.id);
        if (error) throw error;
        toast.success("Banner updated");
      } else {
        const { error } = await supabase.from("banners" as any).insert(payload);
        if (error) throw error;
        toast.success("Banner created");
      }
      setEditing(null);
      qc.invalidateQueries({ queryKey: ["admin-banners"] });
      qc.invalidateQueries({ queryKey: ["home-banners"] });
    } catch (e: any) {
      toast.error(e.message ?? "Save failed");
    } finally {
      setSaving(false);
    }
  };

  const remove = async (id: string) => {
    if (!confirm("Delete this banner?")) return;
    const { error } = await supabase.from("banners" as any).delete().eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Deleted");
    qc.invalidateQueries({ queryKey: ["admin-banners"] });
    qc.invalidateQueries({ queryKey: ["home-banners"] });
  };

  const toggle = async (b: Banner) => {
    const { error } = await supabase.from("banners" as any).update({ is_active: !b.is_active }).eq("id", b.id);
    if (error) return toast.error(error.message);
    qc.invalidateQueries({ queryKey: ["admin-banners"] });
    qc.invalidateQueries({ queryKey: ["home-banners"] });
  };

  const move = async (b: Banner, dir: -1 | 1) => {
    const { error } = await supabase.from("banners" as any)
      .update({ sort_order: (b.sort_order ?? 0) + dir })
      .eq("id", b.id);
    if (error) return toast.error(error.message);
    qc.invalidateQueries({ queryKey: ["admin-banners"] });
    qc.invalidateQueries({ queryKey: ["home-banners"] });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-bold flex items-center gap-2">
            <ImageIcon className="h-6 w-6 text-primary" /> Homepage Banners
          </h1>
          <p className="text-sm text-muted-foreground">Rotating hero slider — schedule, reorder, translate</p>
        </div>
        <Button onClick={() => setEditing({ ...empty })} className="gap-2"><Plus className="h-4 w-4" /> New banner</Button>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <Stat label="Total" value={stats.total} />
        <Stat label="Active" value={stats.active} />
        <Stat label="Inactive" value={stats.inactive} />
      </div>

      <div className="rounded-xl border border-primary/20 bg-card/60 backdrop-blur">
        {isFetching && !banners ? (
          <div className="p-8 text-center text-sm text-muted-foreground">Loading…</div>
        ) : (banners ?? []).length === 0 ? (
          <div className="p-12 text-center text-sm text-muted-foreground">No banners yet</div>
        ) : (
          <div className="divide-y divide-primary/10">
            {(banners ?? []).map((b) => {
              const title = b.title_ar || b.title_en || b.title_ur || "(untitled)";
              return (
                <div key={b.id} className="flex flex-wrap items-center gap-3 p-4 hover:bg-primary/5">
                  <div className="h-16 w-28 flex-shrink-0 overflow-hidden rounded bg-primary/5">
                    {b.image_url && <img src={b.image_url} alt="" className="h-full w-full object-cover" />}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="font-medium truncate">{title}</div>
                    <div className="mt-0.5 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                      <span>#{b.sort_order}</span>
                      {b.link_url && (<><span>·</span><a href={b.link_url} target="_blank" rel="noreferrer" className="hover:text-primary flex items-center gap-1"><ExternalLink className="h-3 w-3" />{b.link_url}</a></>)}
                      {b.starts_at && (<><span>·</span><span>from {new Date(b.starts_at).toLocaleDateString()}</span></>)}
                      {b.ends_at && (<><span>·</span><span>until {new Date(b.ends_at).toLocaleDateString()}</span></>)}
                    </div>
                  </div>
                  <span className={`rounded-md border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${
                    b.is_active
                      ? "bg-emerald-500/15 text-emerald-400 border-emerald-500/30"
                      : "bg-zinc-500/15 text-zinc-400 border-zinc-500/30"
                  }`}>{b.is_active ? "active" : "hidden"}</span>
                  <Button size="sm" variant="outline" onClick={() => move(b, -1)}><ArrowUp className="h-3.5 w-3.5" /></Button>
                  <Button size="sm" variant="outline" onClick={() => move(b, 1)}><ArrowDown className="h-3.5 w-3.5" /></Button>
                  <Button size="sm" variant="outline" onClick={() => toggle(b)} className="gap-1">
                    {b.is_active ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => setEditing({ ...b })}><Pencil className="h-3.5 w-3.5" /></Button>
                  <Button size="sm" variant="outline" onClick={() => remove(b.id)} className="text-red-400 hover:text-red-400"><Trash2 className="h-3.5 w-3.5" /></Button>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <Dialog open={!!editing} onOpenChange={(o) => !o && setEditing(null)}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editing?.id ? "Edit banner" : "New banner"}</DialogTitle>
          </DialogHeader>
          {editing && (
            <div className="space-y-4">
              <div>
                <label className="text-xs text-muted-foreground">Image URL *</label>
                <Input value={editing.image_url ?? ""} onChange={(e) => setEditing({ ...editing, image_url: e.target.value })} placeholder="https://…" />
                {editing.image_url && (
                  <div className="mt-2 aspect-[21/9] w-full overflow-hidden rounded-lg border border-primary/10 bg-black">
                    <img src={editing.image_url} alt="" className="h-full w-full object-cover" />
                  </div>
                )}
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label className="text-xs text-muted-foreground">Link URL</label>
                  <Input value={editing.link_url ?? ""} onChange={(e) => setEditing({ ...editing, link_url: e.target.value })} placeholder="/shop or https://…" />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground">Sort order</label>
                  <Input type="number" value={editing.sort_order ?? 0} onChange={(e) => setEditing({ ...editing, sort_order: Number(e.target.value) })} />
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label className="text-xs text-muted-foreground">Starts at</label>
                  <Input type="datetime-local" value={editing.starts_at ? editing.starts_at.slice(0,16) : ""} onChange={(e) => setEditing({ ...editing, starts_at: e.target.value ? new Date(e.target.value).toISOString() : null })} />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground">Ends at</label>
                  <Input type="datetime-local" value={editing.ends_at ? editing.ends_at.slice(0,16) : ""} onChange={(e) => setEditing({ ...editing, ends_at: e.target.value ? new Date(e.target.value).toISOString() : null })} />
                </div>
              </div>

              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={editing.is_active ?? true} onChange={(e) => setEditing({ ...editing, is_active: e.target.checked })} />
                Active
              </label>

              {(["ar", "en", "ur", "bn"] as const).map((L) => (
                <div key={L} className="rounded-lg border border-primary/10 p-3 space-y-2">
                  <div className="text-xs font-semibold uppercase text-primary">{L === "ar" ? "العربية" : L === "en" ? "English" : L === "ur" ? "اردو" : "বাংলা"}</div>
                  <Input
                    placeholder="Title"
                    value={(editing as any)[`title_${L}`] ?? ""}
                    onChange={(e) => setEditing({ ...editing, [`title_${L}`]: e.target.value })}
                    dir={L === "en" ? "ltr" : "rtl"}
                  />
                  <Textarea
                    placeholder="Subtitle"
                    rows={2}
                    value={(editing as any)[`subtitle_${L}`] ?? ""}
                    onChange={(e) => setEditing({ ...editing, [`subtitle_${L}`]: e.target.value })}
                    dir={L === "en" ? "ltr" : "rtl"}
                  />
                  <Input
                    placeholder="Button label (CTA)"
                    value={(editing as any)[`cta_label_${L}`] ?? ""}
                    onChange={(e) => setEditing({ ...editing, [`cta_label_${L}`]: e.target.value })}
                    dir={L === "en" ? "ltr" : "rtl"}
                  />
                </div>
              ))}
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditing(null)}>Cancel</Button>
            <Button onClick={save} disabled={saving}>{saving ? "Saving…" : "Save"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-xl border border-primary/20 bg-card/60 p-4 backdrop-blur">
      <div className="text-xs uppercase tracking-wider text-muted-foreground">{label}</div>
      <div className="mt-1 font-display text-2xl font-bold text-primary">{value.toLocaleString()}</div>
    </div>
  );
}
