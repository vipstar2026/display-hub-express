import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Edit, Trash2, Zap, Clock, Package } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { formatPrice } from "@/lib/format";

export const Route = createFileRoute("/_authenticated/admin/flash-sales")({
  component: AdminFlashSales,
});

type Form = {
  id?: string;
  product_id: string;
  name_ar: string; name_en: string; name_ur: string;
  sale_price: string; original_price: string;
  starts_at: string; ends_at: string;
  stock_limit: string;
  is_active: boolean;
  sort_order: string;
};

const nowLocal = () => new Date(Date.now() - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 16);
const in7Days = () => new Date(Date.now() + 7 * 86400000 - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 16);

const empty: Form = {
  product_id: "", name_ar: "", name_en: "", name_ur: "",
  sale_price: "", original_price: "",
  starts_at: nowLocal(), ends_at: in7Days(),
  stock_limit: "", is_active: true, sort_order: "0",
};

function AdminFlashSales() {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<Form>(empty);

  const { data: sales = [] } = useQuery({
    queryKey: ["admin-flash-sales"],
    queryFn: async () => {
      const { data } = await supabase
        .from("flash_sales")
        .select("*, products(name_en, slug, price, currency, images)")
        .order("sort_order");
      return data ?? [];
    },
  });

  const { data: products = [] } = useQuery({
    queryKey: ["admin-products-min"],
    queryFn: async () => {
      const { data } = await supabase.from("products").select("id, name_en, name_ar, price, currency").eq("status", "active").order("name_en").limit(500);
      return data ?? [];
    },
  });

  const handleSave = async () => {
    if (!form.product_id) { toast.error("Select a product"); return; }
    if (!form.sale_price) { toast.error("Enter sale price"); return; }
    if (new Date(form.ends_at) <= new Date(form.starts_at)) { toast.error("End must be after start"); return; }

    const payload = {
      product_id: form.product_id,
      name_ar: form.name_ar, name_en: form.name_en, name_ur: form.name_ur || null,
      sale_price: Number(form.sale_price),
      original_price: form.original_price ? Number(form.original_price) : null,
      starts_at: new Date(form.starts_at).toISOString(),
      ends_at: new Date(form.ends_at).toISOString(),
      stock_limit: form.stock_limit ? Number(form.stock_limit) : null,
      is_active: form.is_active,
      sort_order: Number(form.sort_order),
    };

    const { error } = form.id
      ? await supabase.from("flash_sales").update(payload).eq("id", form.id)
      : await supabase.from("flash_sales").insert(payload);
    if (error) { toast.error(error.message); return; }
    toast.success("Saved");
    setOpen(false); setForm(empty);
    qc.invalidateQueries({ queryKey: ["admin-flash-sales"] });
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this flash sale?")) return;
    const { error } = await supabase.from("flash_sales").delete().eq("id", id);
    if (error) toast.error(error.message);
    else { toast.success("Deleted"); qc.invalidateQueries({ queryKey: ["admin-flash-sales"] }); }
  };

  const toggleActive = async (id: string, val: boolean) => {
    const { error } = await supabase.from("flash_sales").update({ is_active: val }).eq("id", id);
    if (error) toast.error(error.message);
    else qc.invalidateQueries({ queryKey: ["admin-flash-sales"] });
  };

  const statusOf = (s: { starts_at: string; ends_at: string; is_active: boolean }) => {
    const now = Date.now();
    if (!s.is_active) return { label: "Paused", cls: "bg-muted text-muted-foreground" };
    if (new Date(s.starts_at).getTime() > now) return { label: "Scheduled", cls: "bg-amber-500/20 text-amber-300" };
    if (new Date(s.ends_at).getTime() < now) return { label: "Ended", cls: "bg-red-500/20 text-red-300" };
    return { label: "Live", cls: "bg-emerald-500/20 text-emerald-300" };
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="flex items-center gap-2 font-display text-2xl font-bold">
            <Zap className="h-6 w-6 text-red-400" /> Flash Sales
          </h1>
          <p className="text-sm text-muted-foreground">Time-limited discount campaigns with countdown</p>
        </div>
        <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) setForm(empty); }}>
          <DialogTrigger asChild>
            <Button className="bg-primary text-background hover:bg-primary"><Plus className="me-1 h-4 w-4" />New Flash Sale</Button>
          </DialogTrigger>
          <DialogContent className="max-h-[90vh] overflow-y-auto">
            <DialogHeader><DialogTitle>{form.id ? "Edit" : "New"} Flash Sale</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <div>
                <Label>Product</Label>
                <Select value={form.product_id} onValueChange={(v) => {
                  const p = products.find((pp) => pp.id === v);
                  setForm({
                    ...form,
                    product_id: v,
                    name_ar: form.name_ar || (p as { name_ar?: string })?.name_ar || "",
                    name_en: form.name_en || (p as { name_en?: string })?.name_en || "",
                    original_price: form.original_price || (p ? String(p.price) : ""),
                  });
                }}>
                  <SelectTrigger><SelectValue placeholder="Select product" /></SelectTrigger>
                  <SelectContent>
                    {products.map((p) => (
                      <SelectItem key={p.id} value={p.id}>{p.name_en} · {formatPrice(Number(p.price), p.currency ?? "BHD")}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <div><Label>Name AR</Label><Input value={form.name_ar} onChange={(e) => setForm({ ...form, name_ar: e.target.value })} /></div>
                <div><Label>Name EN</Label><Input value={form.name_en} onChange={(e) => setForm({ ...form, name_en: e.target.value })} /></div>
                <div><Label>Name UR</Label><Input value={form.name_ur} onChange={(e) => setForm({ ...form, name_ur: e.target.value })} /></div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div><Label>Sale Price</Label><Input type="number" step="0.001" value={form.sale_price} onChange={(e) => setForm({ ...form, sale_price: e.target.value })} /></div>
                <div><Label>Original Price (optional)</Label><Input type="number" step="0.001" value={form.original_price} onChange={(e) => setForm({ ...form, original_price: e.target.value })} /></div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div><Label>Starts</Label><Input type="datetime-local" value={form.starts_at} onChange={(e) => setForm({ ...form, starts_at: e.target.value })} /></div>
                <div><Label>Ends</Label><Input type="datetime-local" value={form.ends_at} onChange={(e) => setForm({ ...form, ends_at: e.target.value })} /></div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div><Label>Stock Limit (optional)</Label><Input type="number" value={form.stock_limit} onChange={(e) => setForm({ ...form, stock_limit: e.target.value })} /></div>
                <div><Label>Sort Order</Label><Input type="number" value={form.sort_order} onChange={(e) => setForm({ ...form, sort_order: e.target.value })} /></div>
              </div>
              <div className="flex items-center gap-2"><Switch checked={form.is_active} onCheckedChange={(v) => setForm({ ...form, is_active: v })} /><Label>Active</Label></div>
              <Button onClick={handleSave} className="w-full bg-primary text-background hover:bg-primary">Save</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="space-y-3">
        {sales.length === 0 && (
          <div className="rounded-xl border border-primary/10 bg-card p-8 text-center text-muted-foreground">No flash sales yet</div>
        )}
        {sales.map((s) => {
          const st = statusOf(s as { starts_at: string; ends_at: string; is_active: boolean });
          const prod = (s as unknown as { products?: { name_en?: string; slug?: string; price?: number; currency?: string; images?: string[] } }).products;
          const currency = prod?.currency ?? "BHD";
          const original = s.original_price ?? prod?.price ?? 0;
          const discount = original > 0 ? Math.round(((original - s.sale_price) / original) * 100) : 0;

          return (
            <div key={s.id} className="rounded-xl border border-primary/10 bg-card p-4">
              <div className="flex flex-wrap items-center gap-3">
                {prod?.images?.[0] && <img src={prod.images[0]} alt="" className="h-12 w-12 rounded-md object-cover" />}
                <div className="min-w-0 flex-1">
                  <div className="font-medium">{s.name_en}</div>
                  <div className="text-xs text-muted-foreground">{prod?.name_en ?? "—"}</div>
                </div>
                <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${st.cls}`}>{st.label}</span>
                {discount > 0 && (
                  <span className="rounded-md bg-gradient-to-r from-red-500 to-orange-500 px-2 py-0.5 text-xs font-bold text-white">-{discount}%</span>
                )}
                <div className="text-end">
                  <div className="font-mono font-bold text-red-400">{formatPrice(Number(s.sale_price), currency)}</div>
                  {original > s.sale_price && (
                    <div className="font-mono text-xs text-muted-foreground line-through">{formatPrice(Number(original), currency)}</div>
                  )}
                </div>
              </div>

              <div className="mt-2 flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
                <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{new Date(s.starts_at).toLocaleString()} → {new Date(s.ends_at).toLocaleString()}</span>
                {s.stock_limit && <span className="flex items-center gap-1"><Package className="h-3 w-3" />{s.sold_count}/{s.stock_limit} sold</span>}
              </div>

              <div className="mt-3 flex flex-wrap items-center gap-2">
                <Switch checked={s.is_active} onCheckedChange={(v) => toggleActive(s.id, v)} />
                <span className="text-xs text-muted-foreground">Active</span>
                <div className="ms-auto flex gap-1">
                  <Button size="sm" variant="ghost" onClick={() => {
                    setForm({
                      id: s.id, product_id: s.product_id,
                      name_ar: s.name_ar, name_en: s.name_en, name_ur: s.name_ur ?? "",
                      sale_price: String(s.sale_price),
                      original_price: s.original_price ? String(s.original_price) : "",
                      starts_at: new Date(s.starts_at).toISOString().slice(0, 16),
                      ends_at: new Date(s.ends_at).toISOString().slice(0, 16),
                      stock_limit: s.stock_limit ? String(s.stock_limit) : "",
                      is_active: s.is_active,
                      sort_order: String(s.sort_order),
                    });
                    setOpen(true);
                  }}>
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => handleDelete(s.id)}>
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
