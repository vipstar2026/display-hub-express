import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Loader2, Plus, Trash2, Pencil, X } from "lucide-react";
import { useAdminI18n } from "@/lib/i18n-admin";

export const Route = createFileRoute("/_authenticated/admin/categories")({
  component: AdminCategories,
});

type Category = { id: string; name: string; slug: string; icon: string | null; image_url: string | null; sort_order: number };

function slugify(s: string) {
  return s.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
}

function AdminCategories() {
  const { L } = useAdminI18n();
  const [cats, setCats] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Partial<Category> | null>(null);

  async function load() {
    setLoading(true);
    const { data } = await supabase.from("categories").select("*").order("sort_order");
    setCats((data as Category[]) || []);
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  async function save() {
    if (!editing?.name) return toast.error(L.catNameReq);
    const payload = {
      name: editing.name,
      slug: editing.slug || slugify(editing.name),
      icon: editing.icon || null,
      image_url: editing.image_url || null,
      sort_order: editing.sort_order ?? 0,
    };
    const { error } = editing.id
      ? await supabase.from("categories").update(payload).eq("id", editing.id)
      : await supabase.from("categories").insert(payload);
    if (error) return toast.error(error.message);
    toast.success(L.saved);
    setEditing(null);
    load();
  }

  async function remove(id: string) {
    if (!confirm(L.confirmDelete)) return;
    const { error } = await supabase.from("categories").delete().eq("id", id);
    if (error) return toast.error(error.message);
    toast.success(L.deleted);
    load();
  }

  return (
    <div>
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-foreground">{L.catTitle}</h1>
          <p className="text-sm text-muted-foreground mt-1">{L.catSub}</p>
        </div>
        <button onClick={() => setEditing({ name: "", sort_order: cats.length })} className="h-10 px-4 rounded-md bg-brand text-brand-foreground text-sm font-semibold flex items-center gap-2">
          <Plus className="w-4 h-4" /> {L.new}
        </button>
      </div>

      {loading ? (
        <div className="grid place-items-center py-16"><Loader2 className="w-6 h-6 animate-spin text-brand" /></div>
      ) : (
        <div className="mt-6 bg-card border border-border rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 text-xs uppercase text-muted-foreground">
              <tr>
                <th className="text-start p-3 w-16">#</th>
                <th className="text-start p-3">{L.catName}</th>
                <th className="text-start p-3 hidden sm:table-cell">{L.catSlug}</th>
                <th className="text-start p-3 hidden md:table-cell">{L.catIcon}</th>
                <th className="text-end p-3">{L.actions}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {cats.map((c) => (
                <tr key={c.id} className="hover:bg-muted/30">
                  <td className="p-3 text-muted-foreground">{c.sort_order}</td>
                  <td className="p-3 font-medium text-foreground">{c.name}</td>
                  <td className="p-3 hidden sm:table-cell text-muted-foreground">{c.slug}</td>
                  <td className="p-3 hidden md:table-cell text-muted-foreground">{c.icon ?? L.none}</td>
                  <td className="p-3 text-end">
                    <button onClick={() => setEditing(c)} className="p-1.5 rounded hover:bg-accent text-brand" title={L.edit}><Pencil className="w-4 h-4" /></button>
                    <button onClick={() => remove(c.id)} className="p-1.5 rounded hover:bg-rose-100 text-rose-700" title={L.delete}><Trash2 className="w-4 h-4" /></button>
                  </td>
                </tr>
              ))}
              {cats.length === 0 && (
                <tr><td colSpan={5} className="p-10 text-center text-muted-foreground">{L.catNo}</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {editing && (
        <div className="fixed inset-0 bg-black/50 z-50 grid place-items-center p-4" onClick={() => setEditing(null)}>
          <div className="bg-card rounded-xl border border-border w-full max-w-md p-5" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-foreground">{editing.id ? L.catEditTitle : L.catNewTitle}</h2>
              <button onClick={() => setEditing(null)} className="p-1 rounded hover:bg-accent"><X className="w-4 h-4" /></button>
            </div>
            <div className="mt-4 space-y-3">
              <div>
                <label className="text-xs font-medium">{L.catName} *</label>
                <input value={editing.name ?? ""} onChange={(e) => setEditing({ ...editing, name: e.target.value })} className="mt-1 w-full h-10 rounded-md border border-border px-3 text-sm bg-background outline-none focus:border-brand" />
              </div>
              <div>
                <label className="text-xs font-medium">{L.catSlug} ({L.optional})</label>
                <input value={editing.slug ?? ""} onChange={(e) => setEditing({ ...editing, slug: e.target.value })} placeholder={L.catSlugAuto} className="mt-1 w-full h-10 rounded-md border border-border px-3 text-sm bg-background outline-none focus:border-brand" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium">{L.catIcon}</label>
                  <input value={editing.icon ?? ""} onChange={(e) => setEditing({ ...editing, icon: e.target.value })} placeholder={L.catIconHint} className="mt-1 w-full h-10 rounded-md border border-border px-3 text-sm bg-background outline-none focus:border-brand" />
                </div>
                <div>
                  <label className="text-xs font-medium">{L.catOrder}</label>
                  <input type="number" value={editing.sort_order ?? 0} onChange={(e) => setEditing({ ...editing, sort_order: Number(e.target.value) })} className="mt-1 w-full h-10 rounded-md border border-border px-3 text-sm bg-background outline-none focus:border-brand" />
                </div>
              </div>
              <div>
                <label className="text-xs font-medium">{L.catImage}</label>
                <input value={editing.image_url ?? ""} onChange={(e) => setEditing({ ...editing, image_url: e.target.value })} placeholder="https://..." className="mt-1 w-full h-10 rounded-md border border-border px-3 text-sm bg-background outline-none focus:border-brand" />
              </div>
            </div>
            <button onClick={save} className="mt-5 w-full h-11 rounded-md bg-brand text-brand-foreground font-semibold">{L.save}</button>
          </div>
        </div>
      )}
    </div>
  );
}
