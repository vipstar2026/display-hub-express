import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, Edit, Trash2, Package, ArrowLeft, X } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { formatPrice, firstImage } from "@/lib/format";
import { CATEGORY_PRESETS, RESERVED_FEATURE_KEYS } from "@/lib/category-presets";

export const Route = createFileRoute("/_authenticated/admin/categories/$slug")({
  component: AdminCategoryProducts,
});

interface ProductForm {
  id?: string;
  slug: string; sku: string;
  name_ar: string; name_en: string; name_ur: string;
  description_ar: string; description_en: string; description_ur: string;
  type: "physical" | "digital" | "subscription";
  status: "draft" | "active" | "archived";
  price: string; compare_price: string; currency: string;
  stock: string; track_stock: boolean; weight_grams: string;
  is_featured: boolean;
  images: string[];
  features: Record<string, string | number | boolean>;
  extra_features: string;
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
    slug: "", sku: "",
    name_ar: "", name_en: "", name_ur: "",
    description_ar: "", description_en: "", description_ur: "",
    type: "subscription", status: "active",
    price: "10.000", compare_price: "", currency: "BHD",
    stock: "999", track_stock: false, weight_grams: "",
    is_featured: false,
    images: [],
    duration_months: "12", channels: "", quality: "4K/FHD",
    downloader_code: "", app_download_url: "",
    extra_features: "",
  };
  const [form, setForm] = useState<ProductForm>(empty);
  const [newImage, setNewImage] = useState("");

  const { data: products } = useQuery({
    queryKey: ["admin-cat-products", category?.id],
    enabled: !!category?.id,
    queryFn: async () => (await supabase.from("products").select("*").eq("category_id", category!.id).order("created_at", { ascending: false })).data ?? [],
  });

  const handleEdit = (p: any) => {
    const feats = (p.features ?? {}) as Record<string, any>;
    const known = new Set(["duration_months", "channels", "quality", "downloader_code", "app_download_url"]);
    const extras = Object.entries(feats).filter(([k]) => !known.has(k)).map(([k, v]) => `${k}: ${v}`).join("\n");
    setForm({
      id: p.id, slug: p.slug, sku: p.sku ?? "",
      name_ar: p.name_ar, name_en: p.name_en, name_ur: p.name_ur ?? "",
      description_ar: p.description_ar ?? "", description_en: p.description_en ?? "", description_ur: p.description_ur ?? "",
      type: p.type, status: p.status,
      price: String(p.price), compare_price: p.compare_price ? String(p.compare_price) : "",
      currency: p.currency,
      stock: String(p.stock), track_stock: !!p.track_stock,
      weight_grams: p.weight_grams ? String(p.weight_grams) : "",
      is_featured: p.is_featured,
      images: Array.isArray(p.images) ? p.images : (p.images ? [p.images] : []),
      duration_months: feats.duration_months ? String(feats.duration_months) : "",
      channels: feats.channels ?? "",
      quality: feats.quality ?? "",
      downloader_code: feats.downloader_code ?? "",
      app_download_url: feats.app_download_url ?? "",
      extra_features: extras,
    });
    setOpen(true);
  };

  const handleFileUpload = async (file: File) => {
    const ext = file.name.split(".").pop();
    const name = `${crypto.randomUUID()}.${ext}`;
    const path = `products/${name}`;
    const { error } = await supabase.storage.from("vendor-assets").upload(path, file);
    if (error) { toast.error(error.message); return; }
    const { data: pub } = supabase.storage.from("vendor-assets").getPublicUrl(path);
    setForm((f) => ({ ...f, images: [...f.images, pub.publicUrl] }));
    toast.success("Image uploaded");
  };

  const handleSave = async () => {
    if (!category) return;
    const features: Record<string, any> = {};
    if (form.duration_months) features.duration_months = Number(form.duration_months);
    if (form.channels) features.channels = form.channels;
    if (form.quality) features.quality = form.quality;
    if (form.downloader_code) features.downloader_code = form.downloader_code;
    if (form.app_download_url) features.app_download_url = form.app_download_url;
    form.extra_features.split("\n").forEach((line) => {
      const idx = line.indexOf(":");
      if (idx > 0) {
        const k = line.slice(0, idx).trim();
        const v = line.slice(idx + 1).trim();
        if (k && v) features[k] = v;
      }
    });

    const payload = {
      slug: form.slug || form.name_en.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, ""),
      sku: form.sku || null,
      name_ar: form.name_ar, name_en: form.name_en, name_ur: form.name_ur || null,
      description_ar: form.description_ar || null, description_en: form.description_en || null, description_ur: form.description_ur || null,
      category_id: category.id,
      type: form.type, status: form.status,
      price: Number(form.price),
      compare_price: form.compare_price ? Number(form.compare_price) : null,
      currency: form.currency,
      stock: Number(form.stock), track_stock: form.track_stock,
      weight_grams: form.weight_grams ? Number(form.weight_grams) : null,
      is_featured: form.is_featured,
      images: form.images,
      features,
    };
    const { error } = form.id
      ? await supabase.from("products").update(payload).eq("id", form.id)
      : await supabase.from("products").insert(payload);
    if (error) { toast.error(error.message); return; }
    toast.success("Saved");
    setOpen(false); setForm(empty); setNewImage("");
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

  const isSubscription = form.type === "subscription";

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
        <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) { setForm(empty); setNewImage(""); } }}>
          <DialogTrigger asChild>
            <Button className="bg-cyan-500 text-background hover:bg-cyan-400"><Plus className="me-1 h-4 w-4" />Add product</Button>
          </DialogTrigger>
          <DialogContent className="max-h-[90vh] max-w-3xl overflow-y-auto">
            <DialogHeader><DialogTitle>{form.id ? "Edit" : "New"} Product in {category.name_en}</DialogTitle></DialogHeader>

            <div className="space-y-5">
              {/* Names */}
              <section className="grid gap-3 md:grid-cols-3">
                <div><Label>Name (AR) *</Label><Input value={form.name_ar} onChange={(e) => setForm({ ...form, name_ar: e.target.value })} /></div>
                <div><Label>Name (EN) *</Label><Input value={form.name_en} onChange={(e) => setForm({ ...form, name_en: e.target.value })} /></div>
                <div><Label>Name (UR)</Label><Input value={form.name_ur} onChange={(e) => setForm({ ...form, name_ur: e.target.value })} /></div>
                <div><Label>Slug</Label><Input value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} placeholder="auto-from-en" /></div>
                <div><Label>SKU</Label><Input value={form.sku} onChange={(e) => setForm({ ...form, sku: e.target.value })} /></div>
              </section>

              {/* Descriptions */}
              <section className="grid gap-3">
                <div><Label>Description (AR)</Label><Textarea rows={2} value={form.description_ar} onChange={(e) => setForm({ ...form, description_ar: e.target.value })} /></div>
                <div><Label>Description (EN)</Label><Textarea rows={2} value={form.description_en} onChange={(e) => setForm({ ...form, description_en: e.target.value })} /></div>
                <div><Label>Description (UR)</Label><Textarea rows={2} value={form.description_ur} onChange={(e) => setForm({ ...form, description_ur: e.target.value })} /></div>
              </section>

              {/* Type / Status / Pricing */}
              <section className="grid gap-3 md:grid-cols-3">
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
                <div><Label>Currency</Label><Input value={form.currency} onChange={(e) => setForm({ ...form, currency: e.target.value })} /></div>
                <div><Label>Price *</Label><Input type="number" step="0.001" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} /></div>
                <div><Label>Compare Price</Label><Input type="number" step="0.001" value={form.compare_price} onChange={(e) => setForm({ ...form, compare_price: e.target.value })} /></div>
                <div><Label>Stock</Label><Input type="number" value={form.stock} onChange={(e) => setForm({ ...form, stock: e.target.value })} /></div>
                <div className="flex items-center gap-2 pt-6">
                  <input type="checkbox" id="track" checked={form.track_stock} onChange={(e) => setForm({ ...form, track_stock: e.target.checked })} />
                  <Label htmlFor="track">Track stock</Label>
                </div>
                <div className="flex items-center gap-2 pt-6">
                  <input type="checkbox" id="feat" checked={form.is_featured} onChange={(e) => setForm({ ...form, is_featured: e.target.checked })} />
                  <Label htmlFor="feat">Featured</Label>
                </div>
                {form.type === "physical" && (
                  <div><Label>Weight (g)</Label><Input type="number" value={form.weight_grams} onChange={(e) => setForm({ ...form, weight_grams: e.target.value })} /></div>
                )}
              </section>

              {/* Subscription / IPTV details */}
              {isSubscription && (
                <section className="space-y-3 rounded-lg border border-cyan-500/20 bg-cyan-500/5 p-3">
                  <div className="text-sm font-semibold text-cyan-400">IPTV / Subscription details</div>
                  <div className="grid gap-3 md:grid-cols-3">
                    <div><Label>Duration (months)</Label><Input type="number" value={form.duration_months} onChange={(e) => setForm({ ...form, duration_months: e.target.value })} /></div>
                    <div><Label>Channels</Label><Input value={form.channels} onChange={(e) => setForm({ ...form, channels: e.target.value })} placeholder="25,000+" /></div>
                    <div><Label>Quality</Label><Input value={form.quality} onChange={(e) => setForm({ ...form, quality: e.target.value })} placeholder="4K/FHD" /></div>
                    <div><Label>Downloader Code</Label><Input value={form.downloader_code} onChange={(e) => setForm({ ...form, downloader_code: e.target.value })} placeholder="123456" /></div>
                    <div className="md:col-span-2"><Label>App Download URL (APK)</Label><Input value={form.app_download_url} onChange={(e) => setForm({ ...form, app_download_url: e.target.value })} placeholder="https://..." /></div>
                  </div>
                </section>
              )}

              {/* Extra features */}
              <section>
                <Label>Extra features (one per line, key: value)</Label>
                <Textarea rows={3} value={form.extra_features} onChange={(e) => setForm({ ...form, extra_features: e.target.value })} placeholder="warranty: 1 year&#10;color: black" />
              </section>

              {/* Images */}
              <section className="space-y-2">
                <Label>Images</Label>
                <div className="flex flex-wrap gap-2">
                  {form.images.map((url, i) => (
                    <div key={i} className="group relative h-20 w-20 overflow-hidden rounded border border-cyan-500/20">
                      <img src={url} alt="" className="h-full w-full object-cover" />
                      <button onClick={() => setForm({ ...form, images: form.images.filter((_, j) => j !== i) })} className="absolute right-0 top-0 rounded-bl bg-destructive p-0.5 text-destructive-foreground opacity-0 group-hover:opacity-100">
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                </div>
                <div className="flex gap-2">
                  <Input value={newImage} onChange={(e) => setNewImage(e.target.value)} placeholder="Paste image URL…" />
                  <Button type="button" variant="outline" onClick={() => { if (newImage) { setForm({ ...form, images: [...form.images, newImage] }); setNewImage(""); } }}>Add URL</Button>
                  <Input type="file" accept="image/*" onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFileUpload(f); e.target.value = ""; }} className="max-w-[180px]" />
                </div>
              </section>
            </div>

            <Button onClick={handleSave} className="mt-4 w-full bg-cyan-500 text-background hover:bg-cyan-400">Save Product</Button>
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
