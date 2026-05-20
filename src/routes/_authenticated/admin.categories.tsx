import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Loader2, Plus, Trash2, Pencil, X } from "lucide-react";

export const Route = createFileRoute("/_authenticated/admin/categories")({
  component: AdminCategories,
});

type Category = { id: string; name: string; slug: string; icon: string | null; image_url: string | null; sort_order: number };

function slugify(s: string) {
  return s.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
}

function AdminCategories() {
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
    if (!editing?.name) return toast.error("Name is required");
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
    toast.success("Saved");
    setEditing(null);
    load();
  }

  async function remove(id: string) {
    if (!confirm("Delete this category?")) return;
    const { error } = await supabase.from("categories").delete().eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Deleted");
    load();
  }

  return (
    <div>
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Categories</h1>
          <p className="text-sm text-muted-foreground mt-1">Organize the catalog taxonomy.</p>
        </div>
        <button onClick={() => setEditing({ name: "", sort_order: cats.length })} className="h-10 px-4 rounded-md bg-brand text-brand-foreground text-sm font-semibold flex items-center gap-2">
          <Plus className="w-4 h-4" /> New
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
                <th className="text-start p-3">Name</th>
                <th className="text-start p-3 hidden sm:table-cell">Slug</th>
                <th className="text-start p-3 hidden md:table-cell">Icon</th>
                <th className="text-end p-3">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {cats.map((c) => (
                <tr key={c.id} className="hover:bg-muted/30">
                  <td className="p-3 text-muted-foreground">{c.sort_order}</td>
                  <td className="p-3 font-medium text-foreground">{c.name}</td>
                  <td className="p-3 hidden sm:table-cell text-muted-foreground">{c.slug}</td>
                  <td className="p-3 hidden md:table-cell text-muted-foreground">{c.icon ?? "—"}</td>
                  <td className="p-3 text-end">
                    <button onClick={() => setEditing(c)} className="p-1.5 rounded hover:bg-accent text-brand" title="Edit"><Pencil className="w-4 h-4" /></button>
                    <button onClick={() => remove(c.id)} className="p-1.5 rounded hover:bg-rose-100 text-rose-700" title="Delete"><Trash2 className="w-4 h-4" /></button>
                  </td>
                </tr>
              ))}
              {cats.length === 0 && (
                <tr><td colSpan={5} className="p-10 text-center text-muted-foreground">No categories yet.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {editing && (
        <div className="fixed inset-0 bg-black/50 z-50 grid place-items-center p-4" onClick={() => setEditing(null)}>
          <div className="bg-card rounded-xl border border-border w-full max-w-md p-5" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-foreground">{editing.id ? "Edit" : "New"} category</h2>
              <button onClick={() => setEditing(null)} className="p-1 rounded hover:bg-accent"><X className="w-4 h-4" /></button>
            </div>
            <div className="mt-4 space-y-3">
              <div>
                <label className="text-xs font-medium">Name *</label>
                <input value={editing.name ?? ""} onChange={(e) => setEditing({ ...editing, name: e.target.value })} className="mt-1 w-full h-10 rounded-md border border-border px-3 text-sm bg-background outline-none focus:border-brand" />
              </div>
              <div>
                <label className="text-xs font-medium">Slug (optional)</label>
                <input value={editing.slug ?? ""} onChange={(e) => setEditing({ ...editing, slug: e.target.value })} placeholder="auto-generated" className="mt-1 w-full h-10 rounded-md border border-border px-3 text-sm bg-background outline-none focus:border-brand" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium">Icon name</label>
                  <input value={editing.icon ?? ""} onChange={(e) => setEditing({ ...editing, icon: e.target.value })} placeholder="lucide name" className="mt-1 w-full h-10 rounded-md border border-border px-3 text-sm bg-background outline-none focus:border-brand" />
                </div>
                <div>
                  <label className="text-xs font-medium">Order</label>
                  <input type="number" value={editing.sort_order ?? 0} onChange={(e) => setEditing({ ...editing, sort_order: Number(e.target.value) })} className="mt-1 w-full h-10 rounded-md border border-border px-3 text-sm bg-background outline-none focus:border-brand" />
                </div>
              </div>
              <div>
                <label className="text-xs font-medium">Image URL</label>
                <input value={editing.image_url ?? ""} onChange={(e) => setEditing({ ...editing, image_url: e.target.value })} placeholder="https://..." className="mt-1 w-full h-10 rounded-md border border-border px-3 text-sm bg-background outline-none focus:border-brand" />
              </div>
            </div>
            <button onClick={save} className="mt-5 w-full h-11 rounded-md bg-brand text-brand-foreground font-semibold">Save</button>
          </div>
        </div>
      )}
    </div>
  );
}
