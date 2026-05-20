import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Loader2, Trash2 } from "lucide-react";

export const Route = createFileRoute("/_authenticated/admin/products")({
  component: AdminProducts,
});

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
};

function AdminProducts() {
  const [items, setItems] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "active" | "draft" | "inactive" | "out_of_stock">("all");
  const [search, setSearch] = useState("");

  async function load() {
    setLoading(true);
    let q = supabase
      .from("products")
      .select("id, title, slug, price, sale_price, currency, stock, status, vendor_id, created_at, vendors(name)")
      .order("created_at", { ascending: false })
      .limit(200);
    if (filter !== "all") q = q.eq("status", filter);
    if (search.trim()) q = q.ilike("title", `%${search.trim()}%`);
    const { data, error } = await q;
    if (error) toast.error(error.message);
    setItems((data as unknown as Product[]) || []);
    setLoading(false);
  }

  useEffect(() => { load(); }, [filter]);

  async function setStatus(id: string, status: Product["status"]) {
    const { error } = await supabase.from("products").update({ status }).eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Updated");
    load();
  }

  async function remove(id: string) {
    if (!confirm("Delete this product permanently?")) return;
    const { error } = await supabase.from("products").delete().eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Deleted");
    load();
  }

  return (
    <div>
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Products</h1>
          <p className="text-sm text-muted-foreground mt-1">Moderate listings across all vendors.</p>
        </div>
        <div className="flex gap-1 bg-card border border-border rounded-md p-1">
          {(["all", "active", "draft", "inactive", "out_of_stock"] as const).map((s) => (
            <button key={s} onClick={() => setFilter(s)} className={`px-3 py-1.5 text-xs rounded capitalize ${filter === s ? "bg-brand text-brand-foreground font-semibold" : "text-foreground hover:bg-accent"}`}>{s.replace("_", " ")}</button>
          ))}
        </div>
      </div>

      <form
        onSubmit={(e) => { e.preventDefault(); load(); }}
        className="mt-4 flex gap-2"
      >
        <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search title…" className="flex-1 h-10 px-3 rounded-md border border-border bg-background text-sm outline-none focus:border-brand" />
        <button className="h-10 px-4 rounded-md bg-brand text-brand-foreground text-sm font-semibold">Search</button>
      </form>

      {loading ? (
        <div className="grid place-items-center py-16"><Loader2 className="w-6 h-6 animate-spin text-brand" /></div>
      ) : items.length === 0 ? (
        <div className="bg-card border border-border rounded-xl p-10 text-center text-muted-foreground mt-6">No products.</div>
      ) : (
        <div className="mt-4 bg-card border border-border rounded-xl overflow-hidden overflow-x-auto">
          <table className="w-full text-sm min-w-[700px]">
            <thead className="bg-muted/50 text-xs uppercase text-muted-foreground">
              <tr>
                <th className="text-start p-3">Title</th>
                <th className="text-start p-3">Vendor</th>
                <th className="text-start p-3">Price</th>
                <th className="text-start p-3">Stock</th>
                <th className="text-start p-3">Status</th>
                <th className="text-end p-3">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {items.map((p) => (
                <tr key={p.id} className="hover:bg-muted/30">
                  <td className="p-3">
                    <div className="font-medium text-foreground line-clamp-1">{p.title}</div>
                    <div className="text-xs text-muted-foreground">{p.slug}</div>
                  </td>
                  <td className="p-3 text-muted-foreground">{p.vendors?.name ?? "—"}</td>
                  <td className="p-3 font-semibold text-sale">{p.currency} {Number(p.sale_price || p.price).toFixed(2)}</td>
                  <td className="p-3">{p.stock}</td>
                  <td className="p-3">
                    <select
                      value={p.status}
                      onChange={(e) => setStatus(p.id, e.target.value as Product["status"])}
                      className="text-xs rounded border border-border bg-background px-2 py-1 capitalize"
                    >
                      <option value="draft">draft</option>
                      <option value="active">active</option>
                      <option value="inactive">inactive</option>
                      <option value="out_of_stock">out of stock</option>
                    </select>
                  </td>
                  <td className="p-3 text-end">
                    <button onClick={() => remove(p.id)} className="p-1.5 rounded hover:bg-rose-100 text-rose-700" title="Delete"><Trash2 className="w-4 h-4" /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
