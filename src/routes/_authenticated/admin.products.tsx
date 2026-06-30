import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, Edit, Trash2, Package } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { formatPrice, firstImage } from "@/lib/format";

export const Route = createFileRoute("/_authenticated/admin/products")({
  component: AdminProducts,
});

interface ProductForm {
  id?: string;
  slug: string;
  name_ar: string;
  name_en: string;
  name_ur: string;
  description_ar: string;
  description_en: string;
  description_ur: string;
  category_id: string;
  type: "physical" | "digital" | "subscription";
  status: "draft" | "active" | "archived";
  price: string;
  compare_price: string;
  currency: string;
  stock: string;
  is_featured: boolean;
  image_url: string;
}

const empty: ProductForm = {
  slug: "", name_ar: "", name_en: "", name_ur: "",
  description_ar: "", description_en: "", description_ur: "",
  category_id: "", type: "physical", status: "active",
  price: "0", compare_price: "", currency: "USD", stock: "0",
  is_featured: false, image_url: "",
};

function AdminProducts() {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<ProductForm>(empty);

  const { data: products } = useQuery({
    queryKey: ["admin-products"],
    queryFn: async () => (await supabase.from("products").select("*").order("created_at", { ascending: false })).data ?? [],
  });

  const { data: cats } = useQuery({
    queryKey: ["admin-cats-list"],
    queryFn: async () => (await supabase.from("categories").select("id, name_en").order("sort_order")).data ?? [],
  });

  const handleEdit = (p: { id: string; slug: string; name_ar: string; name_en: string; name_ur: string | null; description_ar: string | null; description_en: string | null; description_ur: string | null; category_id: string | null; type: string; status: string; price: number; compare_price: number | null; currency: string; stock: number; is_featured: boolean; images: unknown }) => {
    setForm({
      id: p.id, slug: p.slug,
      name_ar: p.name_ar, name_en: p.name_en, name_ur: p.name_ur ?? "",
      description_ar: p.description_ar ?? "", description_en: p.description_en ?? "", description_ur: p.description_ur ?? "",
      category_id: p.category_id ?? "",
      type: p.type as ProductForm["type"], status: p.status as ProductForm["status"],
      price: String(p.price), compare_price: p.compare_price ? String(p.compare_price) : "",
      currency: p.currency, stock: String(p.stock), is_featured: p.is_featured,
      image_url: firstImage(p.images) ?? "",
    });
    setOpen(true);
  };

  const handleSave = async () => {
    const payload = {
      slug: form.slug || form.name_en.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, ""),
      name_ar: form.name_ar, name_en: form.name_en, name_ur: form.name_ur || null,
      description_ar: form.description_ar || null, description_en: form.description_en || null, description_ur: form.description_ur || null,
      category_id: form.category_id || null,
      type: form.type, status: form.status,
      price: Number(form.price),
      compare_price: form.compare_price ? Number(form.compare_price) : null,
      currency: form.currency, stock: Number(form.stock),
      is_featured: form.is_featured,
      images: form.image_url ? [form.image_url] : [],
    };
    const { error } = form.id
      ? await supabase.from("products").update(payload).eq("id", form.id)
      : await supabase.from("products").insert(payload);
    if (error) { toast.error(error.message); return; }
    toast.success("Saved");
    setOpen(false); setForm(empty); qc.invalidateQueries({ queryKey: ["admin-products"] });
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this product?")) return;
    const { error } = await supabase.from("products").delete().eq("id", id);
    if (error) { toast.error(error.message); return; }
    toast.success("Deleted"); qc.invalidateQueries({ queryKey: ["admin-products"] });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-2xl font-bold">Products</h1>
        <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) setForm(empty); }}>
          <DialogTrigger asChild>
            <Button className="bg-cyan-500 text-background hover:bg-cyan-400"><Plus className="me-1 h-4 w-4" />New</Button>
          </DialogTrigger>
          <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
            <DialogHeader><DialogTitle>{form.id ? "Edit" : "New"} Product</DialogTitle></DialogHeader>
            <div className="grid gap-3 md:grid-cols-2">
              <div><Label>Name (AR)</Label><Input value={form.name_ar} onChange={(e) => setForm({ ...form, name_ar: e.target.value })} /></div>
              <div><Label>Name (EN)</Label><Input value={form.name_en} onChange={(e) => setForm({ ...form, name_en: e.target.value })} /></div>
              <div><Label>Name (UR)</Label><Input value={form.name_ur} onChange={(e) => setForm({ ...form, name_ur: e.target.value })} /></div>
              <div><Label>Slug</Label><Input value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} placeholder="auto-from-en" /></div>
              <div className="md:col-span-2"><Label>Description (AR)</Label><Textarea value={form.description_ar} onChange={(e) => setForm({ ...form, description_ar: e.target.value })} /></div>
              <div className="md:col-span-2"><Label>Description (EN)</Label><Textarea value={form.description_en} onChange={(e) => setForm({ ...form, description_en: e.target.value })} /></div>
              <div><Label>Category</Label>
                <Select value={form.category_id} onValueChange={(v) => setForm({ ...form, category_id: v })}>
                  <SelectTrigger><SelectValue placeholder="—" /></SelectTrigger>
                  <SelectContent>{(cats ?? []).map((c) => <SelectItem key={c.id} value={c.id}>{c.name_en}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div><Label>Type</Label>
                <Select value={form.type} onValueChange={(v) => setForm({ ...form, type: v as ProductForm["type"] })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="physical">Physical</SelectItem>
                    <SelectItem value="digital">Digital</SelectItem>
                    <SelectItem value="subscription">Subscription (IPTV)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div><Label>Price</Label><Input type="number" step="0.01" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} /></div>
              <div><Label>Compare Price</Label><Input type="number" step="0.01" value={form.compare_price} onChange={(e) => setForm({ ...form, compare_price: e.target.value })} /></div>
              <div><Label>Currency</Label><Input value={form.currency} onChange={(e) => setForm({ ...form, currency: e.target.value })} /></div>
              <div><Label>Stock</Label><Input type="number" value={form.stock} onChange={(e) => setForm({ ...form, stock: e.target.value })} /></div>
              <div><Label>Status</Label>
                <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v as ProductForm["status"] })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="draft">Draft</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="archived">Archived</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-end gap-2">
                <input type="checkbox" id="feat" checked={form.is_featured} onChange={(e) => setForm({ ...form, is_featured: e.target.checked })} />
                <Label htmlFor="feat">Featured</Label>
              </div>
              <div className="md:col-span-2"><Label>Image URL</Label><Input value={form.image_url} onChange={(e) => setForm({ ...form, image_url: e.target.value })} placeholder="https://..." /></div>
            </div>
            <Button onClick={handleSave} className="bg-cyan-500 text-background hover:bg-cyan-400">Save</Button>
          </DialogContent>
        </Dialog>
      </div>

      <div className="rounded-xl border border-cyan-500/10 bg-card">
        {(products ?? []).length === 0 && <div className="p-8 text-center text-muted-foreground">No products yet</div>}
        <div className="divide-y divide-cyan-500/10">
          {(products ?? []).map((p) => {
            const img = firstImage(p.images);
            return (
              <div key={p.id} className="flex items-center gap-3 p-3">
                <div className="h-12 w-12 shrink-0 overflow-hidden rounded bg-background/50">
                  {img ? <img src={img} alt="" className="h-full w-full object-cover" /> : <div className="flex h-full items-center justify-center"><Package className="h-5 w-5 text-cyan-500/30" /></div>}
                </div>
                <div className="flex-1">
                  <div className="font-medium">{p.name_en}</div>
                  <div className="text-xs text-muted-foreground">{p.slug} · {p.type} · {p.status} · stock: {p.stock}</div>
                </div>
                <div className="font-mono text-cyan-400">{formatPrice(Number(p.price), p.currency)}</div>
                <Button size="sm" variant="ghost" onClick={() => handleEdit(p)}><Edit className="h-4 w-4" /></Button>
                <Button size="sm" variant="ghost" onClick={() => handleDelete(p.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
