import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, Edit, Trash2, ChevronRight } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";


export const Route = createFileRoute("/_authenticated/admin/categories")({
  component: AdminCategories,
});

interface CatForm { id?: string; slug: string; name_ar: string; name_en: string; name_ur: string; icon: string; sort_order: string; }
const empty: CatForm = { slug: "", name_ar: "", name_en: "", name_ur: "", icon: "satellite", sort_order: "0" };

function AdminCategories() {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<CatForm>(empty);

  const { data } = useQuery({
    queryKey: ["admin-cats"],
    queryFn: async () => (await supabase.from("categories").select("*").order("sort_order")).data ?? [],
  });

  const handleSave = async () => {
    const payload = {
      slug: form.slug,
      name_ar: form.name_ar, name_en: form.name_en, name_ur: form.name_ur || null,
      icon: form.icon || null, sort_order: Number(form.sort_order),
    };
    const { error } = form.id
      ? await supabase.from("categories").update(payload).eq("id", form.id)
      : await supabase.from("categories").insert(payload);
    if (error) { toast.error(error.message); return; }
    toast.success("Saved"); setOpen(false); setForm(empty); qc.invalidateQueries({ queryKey: ["admin-cats"] });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-2xl font-bold">Categories</h1>
        <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) setForm(empty); }}>
          <DialogTrigger asChild><Button className="bg-cyan-500 text-background hover:bg-cyan-400"><Plus className="me-1 h-4 w-4" />New</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>{form.id ? "Edit" : "New"} Category</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <div><Label>Slug</Label><Input value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} /></div>
              <div><Label>Name AR</Label><Input value={form.name_ar} onChange={(e) => setForm({ ...form, name_ar: e.target.value })} /></div>
              <div><Label>Name EN</Label><Input value={form.name_en} onChange={(e) => setForm({ ...form, name_en: e.target.value })} /></div>
              <div><Label>Name UR</Label><Input value={form.name_ur} onChange={(e) => setForm({ ...form, name_ur: e.target.value })} /></div>
              <div><Label>Icon (lucide name)</Label><Input value={form.icon} onChange={(e) => setForm({ ...form, icon: e.target.value })} /></div>
              <div><Label>Sort Order</Label><Input type="number" value={form.sort_order} onChange={(e) => setForm({ ...form, sort_order: e.target.value })} /></div>
              <Button onClick={handleSave} className="w-full bg-cyan-500 text-background hover:bg-cyan-400">Save</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="rounded-xl border border-cyan-500/10 bg-card divide-y divide-cyan-500/10">
        {(data ?? []).map((c) => (
          <div key={c.id} className="flex items-center gap-3 p-3">
            <div className="flex-1">
              <div className="font-medium">{c.name_en} <span className="text-muted-foreground">· {c.name_ar}</span></div>
              <div className="text-xs text-muted-foreground">/{c.slug}</div>
            </div>
            <Button size="sm" variant="ghost" onClick={() => { setForm({ id: c.id, slug: c.slug, name_ar: c.name_ar, name_en: c.name_en, name_ur: c.name_ur ?? "", icon: c.icon ?? "", sort_order: String(c.sort_order) }); setOpen(true); }}>
              <Edit className="h-4 w-4" />
            </Button>
            <Button size="sm" variant="ghost" onClick={async () => {
              if (!confirm("Delete?")) return;
              const { error } = await supabase.from("categories").delete().eq("id", c.id);
              if (error) toast.error(error.message); else { toast.success("Deleted"); qc.invalidateQueries({ queryKey: ["admin-cats"] }); }
            }}><Trash2 className="h-4 w-4 text-destructive" /></Button>
          </div>
        ))}
      </div>
    </div>
  );
}
