import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, Edit, Trash2, Package, ArrowLeft } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { formatPrice, firstImage } from "@/lib/format";

export const Route = createFileRoute("/_authenticated/admin/categories/$slug")({
  component: AdminCategoryProducts,
});

interface ProductForm {
  id?: string;
  slug: string;
  name_ar: string; name_en: string; name_ur: string;
  description_ar: string; description_en: string; description_ur: string;
  type: "physical" | "digital" | "subscription";
  status: "draft" | "active" | "archived";
  price: string; compare_price: string; currency: string; stock: string;
  is_featured: boolean; image_url: string;
}

function AdminCategoryProducts() {
  const { slug } = Route.useParams();
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);

  const { data: category } = useQuery({
    queryKey: ["admin-cat", slug],
    queryFn: async () => (await supabase.from("categories").select("*").eq("slug", slug).maybeSingle()).data,
  });

  const empty: ProductForm = {
    slug: "", name_ar: "", name_en: "", name_ur: "",
    description_ar: "", description_en: "", description_ur: "",
    type: "subscription", status: "active",
    price: "10.000", compare_price: "", currency: "BHD", stock: "100",
    is_featured: false, image_url: "",
  };
  const [form, setForm] = useState<ProductForm>(empty);

  const { data: products } = useQuery({
    queryKey: ["admin-cat-products", category?.id],
    enabled: !!category?.id,
    queryFn: async () => (await supabase.from("products").select("*").eq("category_id", category!.id).order("created_at", { ascending: false })).data ?? [],
  });

  const handleEdit = (p: any) => {
    setForm({
      id: p.id, slug: p.slug,
      name_ar: p.name_ar, name_en: p.name_en, name_ur: p.name_ur ?? "",
      description_ar: p.description_ar ?? "", description_en: p.description_en ?? "", description_ur: p.description_ur ?? "",
      type: p.type, status: p.status,
      price: String(p.price), compare_price: p.compare_price ? String(p.compare_price) : "",
      currency: p.currency, stock: String(p.stock), is_featured: p.is_featured,
      image_url: firstImage(p.images) ?? "",
    });
    setOpen(true);
  };

  const handleSave = async () => {
    if (!category) return;
    const payload = {
      slug: form.slug || form.name_en.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, ""),
      name_ar: form.name_ar, name_en: form.name_en, name_ur: form.name_ur || null,
      description_ar: form.description_ar || null, description_en: form.description_en || null, description_ur: form.description_ur || null,
      category_id: category.id,
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
    setOpen(false); setForm(empty);
    qc.invalidateQueries({ queryKey: ["admin-cat-products", category.id] });
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this product?")) return;
    const { error } = await supabase.from("products").delete().eq("id", id);
    if (error) { toast.error(error.message); return; }
    toast.success("Deleted");
    qc.invalidateQueries({ queryKey: ["admin-cat-products", category?.id] });
  };

  if (!category) return <div className="p-8 text-center text-muted-foreground">Loading…</div>;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <Link to="/admin/categories" className="rounded-md p-2 text-muted-foreground hover:bg-cyan-500/10 hover:text-cyan-400">
            <ArrowLeft className="h-4 w-4 rtl:rotate-180" />
          </Link>
          <div className="min-w-0">
            <h1 className="font-display truncate text-2xl font-bold">{category.name_ar} · {category.name_en}</h1>
            <div className="text-xs text-muted-foreground">/{category.slug} · {products?.length ?? 0} products</div>
          </div>
        </div>
        <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) setForm(empty); }}>
          <DialogTrigger asChild>
            <Button className="bg-cyan-500 text-background hover:bg-cyan-400"><Plus className="me-1 h-4 w-4" />Add product</Button>
          </DialogTrigger>
          <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
            <DialogHeader><DialogTitle>{form.id ? "Edit" : "New"} Product in {category.name_en}</DialogTitle></DialogHeader>
            <div className="grid gap-3 md:grid-cols-2">
              <div><Label>Name (AR)</Label><Input value={form.name_ar} onChange={(e) => setForm({ ...form, name_ar: e.target.value })} /></div>
              <div><Label>Name (EN)</Label><Input value={form.name_en} onChange={(e) => setForm({ ...form, name_en: e.target.value })} /></div>
              <div><Label>Name (UR)</Label><Input value={form.name_ur} onChange={(e) => setForm({ ...form, name_ur: e.target.value })} /></div>
              <div><Label>Slug</Label><Input value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} placeholder="auto-from-en" /></div>
              <div className="md:col-span-2"><Label>Description (AR)</Label><Textarea value={form.description_ar} onChange={(e) => setForm({ ...form, description_ar: e.target.value })} /></div>
              <div className="md:col-span-2"><Label>Description (EN)</Label><Textarea value={form.description_en} onChange={(e) => setForm({ ...form, description_en: e.target.value })} /></div>
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
              <div><Label>Price</Label><Input type="number" step="0.001" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} /></div>
              <div><Label>Compare Price</Label><Input type="number" step="0.001" value={form.compare_price} onChange={(e) => setForm({ ...form, compare_price: e.target.value })} /></div>
              <div><Label>Currency</Label><Input value={form.currency} onChange={(e) => setForm({ ...form, currency: e.target.value })} /></div>
              <div><Label>Stock</Label><Input type="number" value={form.stock} onChange={(e) => setForm({ ...form, stock: e.target.value })} /></div>
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
        {(products ?? []).length === 0 && <div className="p-8 text-center text-muted-foreground">No products in this category yet</div>}
        <div className="divide-y divide-cyan-500/10">
          {(products ?? []).map((p) => {
            const img = firstImage(p.images);
            return (
              <div key={p.id} className="flex items-center gap-3 p-3">
                <div className="h-12 w-12 shrink-0 overflow-hidden rounded bg-background/50">
                  {img ? <img src={img} alt="" className="h-full w-full object-cover" /> : <div className="flex h-full items-center justify-center"><Package className="h-5 w-5 text-cyan-500/30" /></div>}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="truncate font-medium">{p.name_en}</div>
                  <div className="truncate text-xs text-muted-foreground">{p.slug} · {p.type} · {p.status} · stock: {p.stock}</div>
                </div>
                <div className="shrink-0 font-mono text-cyan-400">{formatPrice(Number(p.price), p.currency)}</div>
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
