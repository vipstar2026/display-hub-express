import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { toast } from "sonner";
import { Loader2, Plus, Pencil, Trash2, Package, ArrowLeft } from "lucide-react";
import { useAdminI18n, statusLabel } from "@/lib/i18n-admin";

export const Route = createFileRoute("/_authenticated/admin/catalog/$slug")({
  component: AdminCategoryProducts,
});

type Category = { id: string; name: string; slug: string; image_url: string | null };
type Product = {
  id: string;
  title: string;
  slug: string;
  price: number;
  sale_price: number | null;
  currency: string;
  stock: number;
  status: "draft" | "active" | "inactive" | "out_of_stock";
  vendor_id: string;
  created_at: string;
  vendors: { name: string } | null;
  product_images: { url: string; sort_order: number }[];
};

function AdminCategoryProducts() {
  const { slug } = Route.useParams();
  const { user } = useAuth();
  const { L } = useAdminI18n();
  const nav = useNavigate();
  const [category, setCategory] = useState<Category | null>(null);
  const [items, setItems] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [filter, setFilter] = useState<"all" | "active" | "draft" | "inactive" | "out_of_stock">("all");
  const [search, setSearch] = useState("");

  async function load() {
    setLoading(true);
    const { data: cat } = await supabase.from("categories").select("id,name,slug,image_url").eq("slug", slug).maybeSingle();
    if (!cat) { setCategory(null); setItems([]); setLoading(false); return; }
    setCategory(cat as Category);

    let q = supabase
      .from("products")
      .select("id, title, slug, price, sale_price, currency, stock, status, vendor_id, created_at, vendors(name), product_images(url, sort_order)")
      .eq("category_id", cat.id)
      .order("created_at", { ascending: false })
      .limit(300);
    if (filter !== "all") q = q.eq("status", filter);
    if (search.trim()) q = q.ilike("title", `%${search.trim()}%`);

    const { data, error } = await q;
    if (error) toast.error(error.message);
    setItems((data as unknown as Product[]) || []);
    setLoading(false);
  }

  useEffect(() => { load(); /* eslint-disable-next-line */ }, [slug, filter]);

  async function ensureAdminVendor(): Promise<string | null> {
    if (!user) return null;
    const { data: existing } = await supabase.from("vendors").select("id").eq("owner_id", user.id).maybeSingle();
    if (existing) return existing.id;
    const vslug = `admin-store-${Math.random().toString(36).slice(2, 6)}`;
    const { data, error } = await supabase
      .from("vendors")
      .insert({ owner_id: user.id, name: "Admin Store", slug: vslug, description: "Official store" })
      .select("id")
      .single();
    if (error) { toast.error(error.message); return null; }
    return data.id;
  }

  async function handleNew() {
    setCreating(true);
    const vid = await ensureAdminVendor();
    setCreating(false);
    if (vid) nav({ to: "/sell/products/new" });
  }

  async function setStatus(id: string, status: Product["status"]) {
    const { error } = await supabase.from("products").update({ status }).eq("id", id);
    if (error) return toast.error(error.message);
    toast.success(L.updated);
    load();
  }

  async function remove(id: string) {
    if (!confirm(L.confirmDelete)) return;
    const { error } = await supabase.from("products").delete().eq("id", id);
    if (error) return toast.error(error.message);
    toast.success(L.deleted);
    load();
  }

  const filterLabel = (s: "all" | "active" | "draft" | "inactive" | "out_of_stock") =>
    s === "all" ? L.all : statusLabel(L, s);

  if (!loading && !category) {
    return (
      <div className="text-center py-16">
        <p className="text-muted-foreground">{L.caNotFound}</p>
        <Link to="/admin/products" className="text-brand text-sm mt-2 inline-block">{L.caBackToProducts}</Link>
      </div>
    );
  }

  return (
    <div>
      <Link to="/admin/products" className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-brand mb-3">
        <ArrowLeft className="w-3.5 h-3.5" /> {L.caBack}
      </Link>
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-400 to-amber-600 grid place-items-center shadow">
            <Package className="w-6 h-6 text-slate-900" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground">{category?.name ?? L.none}</h1>
            <p className="text-sm text-muted-foreground">{L.caTitleSub(items.length)} · <span className="font-mono">/{slug}</span></p>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <button onClick={handleNew} disabled={creating} className="inline-flex items-center gap-1.5 h-10 px-4 rounded-md bg-brand text-brand-foreground text-sm font-semibold hover:bg-brand-dark disabled:opacity-50">
            {creating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />} {L.caAddProduct}
          </button>
          <div className="flex gap-1 bg-card border border-border rounded-md p-1">
            {(["all", "active", "draft", "inactive", "out_of_stock"] as const).map((s) => (
              <button key={s} onClick={() => setFilter(s)} className={`px-3 py-1.5 text-xs rounded ${filter === s ? "bg-brand text-brand-foreground font-semibold" : "text-foreground hover:bg-accent"}`}>{filterLabel(s)}</button>
            ))}
          </div>
        </div>
      </div>

      <form onSubmit={(e) => { e.preventDefault(); load(); }} className="mt-4 flex gap-2">
        <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder={L.searchPlaceholder} className="flex-1 h-10 px-3 rounded-md border border-border bg-background text-sm outline-none focus:border-brand" />
        <button className="h-10 px-4 rounded-md bg-brand text-brand-foreground text-sm font-semibold">{L.search}</button>
      </form>

      {loading ? (
        <div className="grid place-items-center py-16"><Loader2 className="w-6 h-6 animate-spin text-brand" /></div>
      ) : items.length === 0 ? (
        <div className="bg-card border border-border rounded-xl p-12 text-center mt-6">
          <Package className="w-10 h-10 text-muted-foreground/40 mx-auto mb-3" />
          <p className="text-muted-foreground">{L.caNoProducts}</p>
          <button onClick={handleNew} className="mt-4 inline-flex items-center gap-1.5 h-10 px-4 rounded-md bg-brand text-brand-foreground text-sm font-semibold">
            <Plus className="w-4 h-4" /> {L.caAddFirst}
          </button>
        </div>
      ) : (
        <div className="mt-4 bg-card border border-border rounded-xl overflow-hidden overflow-x-auto">
          <table className="w-full text-sm min-w-[760px]">
            <thead className="bg-muted/50 text-xs uppercase text-muted-foreground">
              <tr>
                <th className="text-start p-3">{L.caCol_product}</th>
                <th className="text-start p-3">{L.prCol_vendor}</th>
                <th className="text-start p-3">{L.prCol_price}</th>
                <th className="text-start p-3">{L.prCol_stock}</th>
                <th className="text-start p-3">{L.status}</th>
                <th className="text-end p-3">{L.actions}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {items.map((p) => {
                const img = (p.product_images ?? []).slice().sort((a, b) => a.sort_order - b.sort_order)[0]?.url;
                return (
                  <tr key={p.id} className="hover:bg-muted/30">
                    <td className="p-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-md bg-muted overflow-hidden shrink-0">
                          {img ? <img src={img} alt="" className="w-full h-full object-cover" /> : null}
                        </div>
                        <div>
                          <div className="font-medium text-foreground line-clamp-1">{p.title}</div>
                          <div className="text-xs text-muted-foreground">{p.slug}</div>
                        </div>
                      </div>
                    </td>
                    <td className="p-3 text-muted-foreground">{p.vendors?.name ?? L.none}</td>
                    <td className="p-3 font-semibold text-sale">{p.currency} {Number(p.sale_price || p.price).toFixed(2)}</td>
                    <td className="p-3">{p.stock}</td>
                    <td className="p-3">
                      <select value={p.status} onChange={(e) => setStatus(p.id, e.target.value as Product["status"])} className="text-xs rounded border border-border bg-background px-2 py-1">
                        <option value="draft">{L.st_draft}</option>
                        <option value="active">{L.st_active}</option>
                        <option value="inactive">{L.st_inactive}</option>
                        <option value="out_of_stock">{L.st_out_of_stock}</option>
                      </select>
                    </td>
                    <td className="p-3 text-end">
                      <div className="inline-flex gap-1">
                        <button onClick={() => nav({ to: "/sell/products/$id", params: { id: p.id } })} className="p-1.5 rounded hover:bg-accent text-foreground" title={L.edit}><Pencil className="w-4 h-4" /></button>
                        <button onClick={() => remove(p.id)} className="p-1.5 rounded hover:bg-rose-100 text-rose-700" title={L.delete}><Trash2 className="w-4 h-4" /></button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
