import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Plus, Edit3, Trash2, Package, Store as StoreIcon, TrendingUp, DollarSign } from "lucide-react";

export const Route = createFileRoute("/_authenticated/sell/dashboard")({
  component: VendorDashboard,
  head: () => ({ meta: [{ title: "Vendor Dashboard | VIP STAR" }] }),
});

type Vendor = { id: string; name: string; slug: string; status: string; logo_url: string | null };
type Product = { id: string; title: string; price: number; sale_price: number | null; stock: number; status: string; sales_count: number };

function VendorDashboard() {
  const { user } = useAuth();
  const nav = useNavigate();
  const [vendor, setVendor] = useState<Vendor | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data: v } = await supabase.from("vendors").select("id,name,slug,status,logo_url").eq("owner_id", user.id).maybeSingle();
      if (!v) { nav({ to: "/sell/register" }); return; }
      setVendor(v as Vendor);
      const { data: p } = await supabase.from("products")
        .select("id,title,price,sale_price,stock,status,sales_count")
        .eq("vendor_id", v.id).order("created_at", { ascending: false });
      setProducts((p ?? []) as Product[]);
      setLoading(false);
    })();
  }, [user, nav]);

  async function onDelete(id: string) {
    if (!confirm("Delete this product?")) return;
    const { error } = await supabase.from("products").delete().eq("id", id);
    if (error) return toast.error(error.message);
    setProducts((prev) => prev.filter((p) => p.id !== id));
    toast.success("Product deleted");
  }

  if (loading) return <div className="min-h-screen grid place-items-center">Loading…</div>;

  const totalStock = products.reduce((s, p) => s + p.stock, 0);
  const totalSales = products.reduce((s, p) => s + p.sales_count, 0);
  const active = products.filter((p) => p.status === "active").length;

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <SiteHeader />
      <main className="flex-1 mx-auto max-w-7xl w-full px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-4">
            {vendor?.logo_url ? (
              <img src={vendor.logo_url} alt={vendor.name} className="w-14 h-14 rounded-full object-cover border border-border" />
            ) : (
              <div className="w-14 h-14 rounded-full bg-brand/10 text-brand grid place-items-center"><StoreIcon className="w-6 h-6" /></div>
            )}
            <div>
              <h1 className="text-2xl font-bold text-foreground">{vendor?.name}</h1>
              <p className="text-xs text-muted-foreground">
                Status: <span className={vendor?.status === "approved" ? "text-green-600 font-semibold" : "text-amber-600 font-semibold"}>{vendor?.status}</span>
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Link to="/sell/orders" className="h-10 px-4 grid place-items-center rounded-md border border-border hover:bg-accent text-sm font-semibold">
              <span className="flex items-center gap-2"><Package className="w-4 h-4" /> Orders</span>
            </Link>
            <Link to="/sell/products/new" className="h-10 px-5 grid place-items-center rounded-md bg-brand text-brand-foreground font-semibold hover:bg-brand-dark transition-smooth">
              <span className="flex items-center gap-2"><Plus className="w-4 h-4" /> New Product</span>
            </Link>
          </div>
        </div>

        {/* Stats */}
        <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: "Products", value: products.length, icon: Package },
            { label: "Active", value: active, icon: TrendingUp },
            { label: "Total Stock", value: totalStock, icon: Package },
            { label: "Sales", value: totalSales, icon: DollarSign },
          ].map((s) => (
            <div key={s.label} className="bg-card border border-border rounded-xl p-4">
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">{s.label}</span>
                <s.icon className="w-4 h-4 text-brand" />
              </div>
              <div className="mt-2 text-2xl font-bold text-foreground">{s.value}</div>
            </div>
          ))}
        </div>

        {/* Products table */}
        <div className="mt-8 bg-card border border-border rounded-xl overflow-hidden">
          <div className="px-5 py-4 border-b border-border flex items-center justify-between">
            <h2 className="font-semibold text-foreground">Products</h2>
          </div>
          {products.length === 0 ? (
            <div className="p-10 text-center text-sm text-muted-foreground">
              No products yet. <Link to="/sell/products/new" className="text-brand font-semibold hover:underline">Add your first product</Link>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-muted/40 text-xs uppercase text-muted-foreground">
                  <tr>
                    <th className="text-start px-5 py-3 font-medium">Title</th>
                    <th className="text-start px-5 py-3 font-medium">Price</th>
                    <th className="text-start px-5 py-3 font-medium">Stock</th>
                    <th className="text-start px-5 py-3 font-medium">Status</th>
                    <th className="text-end px-5 py-3 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {products.map((p) => (
                    <tr key={p.id} className="border-t border-border">
                      <td className="px-5 py-3 font-medium text-foreground">{p.title}</td>
                      <td className="px-5 py-3">
                        {p.sale_price ? (
                          <><span className="text-sale font-semibold">{p.sale_price}</span> <span className="text-xs text-muted-foreground line-through">{p.price}</span></>
                        ) : p.price}
                      </td>
                      <td className="px-5 py-3">{p.stock}</td>
                      <td className="px-5 py-3"><span className={`px-2 py-0.5 rounded text-xs font-medium ${p.status === "active" ? "bg-green-100 text-green-700" : "bg-muted text-muted-foreground"}`}>{p.status}</span></td>
                      <td className="px-5 py-3 text-end">
                        <div className="inline-flex gap-2">
                          <Link to="/sell/products/$id" params={{ id: p.id }} className="p-2 rounded hover:bg-accent text-foreground"><Edit3 className="w-4 h-4" /></Link>
                          <button onClick={() => onDelete(p.id)} className="p-2 rounded hover:bg-sale/10 text-sale"><Trash2 className="w-4 h-4" /></button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
