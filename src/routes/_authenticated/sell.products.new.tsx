import { createFileRoute, Link, useNavigate, useParams } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";
import { slugify, uploadAsset } from "@/lib/uploads";
import { toast } from "sonner";
import { ArrowLeft, X } from "lucide-react";

type Category = { id: string; name: string };

type Form = {
  title: string;
  description: string;
  price: string;
  sale_price: string;
  stock: string;
  brand: string;
  sku: string;
  category_id: string;
  status: "draft" | "active" | "inactive" | "out_of_stock";
};

const empty: Form = { title: "", description: "", price: "", sale_price: "", stock: "0", brand: "", sku: "", category_id: "", status: "draft" };

function ProductForm({ id }: { id?: string }) {
  const { user } = useAuth();
  const nav = useNavigate();
  const [form, setForm] = useState<Form>(empty);
  const [categories, setCategories] = useState<Category[]>([]);
  const [vendorId, setVendorId] = useState<string | null>(null);
  const [images, setImages] = useState<{ id?: string; url: string }[]>([]);
  const [newFiles, setNewFiles] = useState<File[]>([]);
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const [{ data: v }, { data: cats }] = await Promise.all([
        supabase.from("vendors").select("id").eq("owner_id", user.id).maybeSingle(),
        supabase.from("categories").select("id,name").order("sort_order"),
      ]);
      if (!v) { nav({ to: "/sell/register" }); return; }
      setVendorId(v.id);
      setCategories((cats ?? []) as Category[]);

      if (id) {
        const { data: p } = await supabase.from("products").select("*").eq("id", id).maybeSingle();
        if (p) {
          setForm({
            title: p.title, description: p.description ?? "", price: String(p.price),
            sale_price: p.sale_price != null ? String(p.sale_price) : "", stock: String(p.stock),
            brand: p.brand ?? "", sku: p.sku ?? "", category_id: p.category_id ?? "", status: p.status,
          });
        }
        const { data: imgs } = await supabase.from("product_images").select("id,url").eq("product_id", id).order("sort_order");
        setImages((imgs ?? []) as { id: string; url: string }[]);
      }
      setLoading(false);
    })();
  }, [id, user, nav]);

  function update<K extends keyof Form>(k: K, v: Form[K]) { setForm((f) => ({ ...f, [k]: v })); }

  async function removeExistingImage(imgId: string) {
    const { error } = await supabase.from("product_images").delete().eq("id", imgId);
    if (error) return toast.error(error.message);
    setImages((prev) => prev.filter((i) => i.id !== imgId));
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!user || !vendorId) return;
    setBusy(true);
    try {
      const payload = {
        vendor_id: vendorId,
        title: form.title.trim(),
        slug: `${slugify(form.title)}-${Math.random().toString(36).slice(2, 6)}`,
        description: form.description.trim() || null,
        price: Number(form.price),
        sale_price: form.sale_price ? Number(form.sale_price) : null,
        stock: Number(form.stock),
        brand: form.brand.trim() || null,
        sku: form.sku.trim() || null,
        category_id: form.category_id || null,
        status: form.status,
      };

      let productId = id;
      if (id) {
        const { slug, ...upd } = payload;
        const { error } = await supabase.from("products").update(upd).eq("id", id);
        if (error) throw error;
      } else {
        const { data, error } = await supabase.from("products").insert(payload).select("id").single();
        if (error) throw error;
        productId = data.id;
      }

      if (productId && newFiles.length) {
        const uploads = await Promise.all(newFiles.map((f) => uploadAsset(user.id, f, "products")));
        const rows = uploads.map((url, i) => ({ product_id: productId!, url, sort_order: images.length + i }));
        const { error } = await supabase.from("product_images").insert(rows);
        if (error) throw error;
      }

      toast.success(id ? "Product updated" : "Product created");
      nav({ to: "/sell/dashboard" });
    } catch (err: any) {
      toast.error(err.message ?? "Save failed");
    } finally { setBusy(false); }
  }

  if (loading) return <div className="min-h-screen grid place-items-center">Loading…</div>;

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <SiteHeader />
      <main className="flex-1 mx-auto max-w-4xl w-full px-4 py-8">
        <Link to="/sell/dashboard" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-brand mb-4">
          <ArrowLeft className="w-4 h-4" /> Back to Dashboard
        </Link>
        <div className="bg-card border border-border rounded-xl p-6 shadow-card">
          <h1 className="text-xl font-bold text-foreground">{id ? "Edit Product" : "New Product"}</h1>

          <form onSubmit={onSubmit} className="mt-6 grid sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label className="text-sm font-medium">Title *</label>
              <input required maxLength={120} value={form.title} onChange={(e) => update("title", e.target.value)}
                className="mt-1 w-full h-11 rounded-md border border-border px-3 text-sm bg-background outline-none focus:border-brand" />
            </div>
            <div className="sm:col-span-2">
              <label className="text-sm font-medium">Description</label>
              <textarea rows={4} maxLength={2000} value={form.description} onChange={(e) => update("description", e.target.value)}
                className="mt-1 w-full rounded-md border border-border px-3 py-2 text-sm bg-background outline-none focus:border-brand" />
            </div>
            <div>
              <label className="text-sm font-medium">Price (PKR) *</label>
              <input required type="number" min="0" step="0.01" value={form.price} onChange={(e) => update("price", e.target.value)}
                className="mt-1 w-full h-11 rounded-md border border-border px-3 text-sm bg-background outline-none focus:border-brand" />
            </div>
            <div>
              <label className="text-sm font-medium">Sale Price</label>
              <input type="number" min="0" step="0.01" value={form.sale_price} onChange={(e) => update("sale_price", e.target.value)}
                className="mt-1 w-full h-11 rounded-md border border-border px-3 text-sm bg-background outline-none focus:border-brand" />
            </div>
            <div>
              <label className="text-sm font-medium">Stock</label>
              <input required type="number" min="0" value={form.stock} onChange={(e) => update("stock", e.target.value)}
                className="mt-1 w-full h-11 rounded-md border border-border px-3 text-sm bg-background outline-none focus:border-brand" />
            </div>
            <div>
              <label className="text-sm font-medium">Category</label>
              <select value={form.category_id} onChange={(e) => update("category_id", e.target.value)}
                className="mt-1 w-full h-11 rounded-md border border-border px-3 text-sm bg-background outline-none focus:border-brand">
                <option value="">— Select —</option>
                {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div>
              <label className="text-sm font-medium">Brand</label>
              <input maxLength={60} value={form.brand} onChange={(e) => update("brand", e.target.value)}
                className="mt-1 w-full h-11 rounded-md border border-border px-3 text-sm bg-background outline-none focus:border-brand" />
            </div>
            <div>
              <label className="text-sm font-medium">SKU</label>
              <input maxLength={60} value={form.sku} onChange={(e) => update("sku", e.target.value)}
                className="mt-1 w-full h-11 rounded-md border border-border px-3 text-sm bg-background outline-none focus:border-brand" />
            </div>
            <div>
              <label className="text-sm font-medium">Status</label>
              <select value={form.status} onChange={(e) => update("status", e.target.value as Form["status"])}
                className="mt-1 w-full h-11 rounded-md border border-border px-3 text-sm bg-background outline-none focus:border-brand">
                <option value="draft">Draft</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
                <option value="out_of_stock">Out of Stock</option>
              </select>
            </div>

            <div className="sm:col-span-2">
              <label className="text-sm font-medium">Images</label>
              <div className="mt-2 grid grid-cols-3 sm:grid-cols-5 gap-3">
                {images.map((img) => (
                  <div key={img.id ?? img.url} className="relative group aspect-square rounded-md overflow-hidden border border-border">
                    <img src={img.url} className="w-full h-full object-cover" alt="" />
                    {img.id && (
                      <button type="button" onClick={() => removeExistingImage(img.id!)}
                        className="absolute top-1 end-1 p-1 rounded-full bg-sale text-white opacity-0 group-hover:opacity-100 transition">
                        <X className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                ))}
                {newFiles.map((f, i) => (
                  <div key={i} className="relative aspect-square rounded-md overflow-hidden border border-dashed border-brand/50">
                    <img src={URL.createObjectURL(f)} className="w-full h-full object-cover opacity-80" alt="" />
                    <button type="button" onClick={() => setNewFiles((p) => p.filter((_, idx) => idx !== i))}
                      className="absolute top-1 end-1 p-1 rounded-full bg-sale text-white">
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
              <input type="file" accept="image/*" multiple onChange={(e) => setNewFiles((p) => [...p, ...Array.from(e.target.files ?? [])])}
                className="mt-3 w-full text-sm file:mr-3 file:h-10 file:px-4 file:rounded-md file:border-0 file:bg-brand file:text-brand-foreground file:font-medium hover:file:bg-brand-dark" />
            </div>

            <div className="sm:col-span-2 flex gap-3 pt-2">
              <button disabled={busy} type="submit" className="flex-1 h-11 rounded-md bg-brand text-brand-foreground font-semibold hover:bg-brand-dark transition-smooth disabled:opacity-50">
                {busy ? "Saving..." : id ? "Update Product" : "Create Product"}
              </button>
              <Link to="/sell/dashboard" className="h-11 px-6 grid place-items-center rounded-md border border-border hover:bg-accent text-sm">Cancel</Link>
            </div>
          </form>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}

export const Route = createFileRoute("/_authenticated/sell/products/new")({
  component: () => <ProductForm />,
  head: () => ({ meta: [{ title: "New Product | VIP STAR" }] }),
});

export { ProductForm };
