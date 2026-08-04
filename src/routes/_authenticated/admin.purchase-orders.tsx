import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "sonner";
import { Plus, Search, Eye, Trash2, PackageCheck, FileText } from "lucide-react";
import { useI18n } from "@/lib/i18n";
import { makeAdminTE } from "@/lib/admin-i18n";

export const Route = createFileRoute("/_authenticated/admin/purchase-orders")({
  ssr: false,
  component: POPage,
});

type Supplier = { id: string; name: string };
type Product = { id: string; name_en: string | null; name_ar: string | null; sku: string | null; stock: number | null; cost_price: number | null };
type POItem = { id?: string; product_id: string | null; product_name: string; quantity: number; cost_per_unit: number; total: number };
type PO = {
  id: string; po_number: string; supplier_id: string; status: string;
  subtotal: number; tax: number; total: number; currency: string;
  notes: string | null; received_at: string | null; created_at: string;
};

function POPage() {
  const { lang } = useI18n();
  const te = useMemo(() => makeAdminTE(lang), [lang]);
  const [pos, setPos] = useState<PO[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const [open, setOpen] = useState(false);
  const [viewing, setViewing] = useState<PO | null>(null);
  const [items, setItems] = useState<POItem[]>([]);
  const [form, setForm] = useState({ supplier_id: "", notes: "", tax: 0 });

  async function load() {
    setLoading(true);
    const [{ data: p }, { data: s }, { data: pr }] = await Promise.all([
      supabase.from("purchase_orders").select("*").order("created_at", { ascending: false }),
      supabase.from("suppliers").select("id,name").order("name"),
      supabase.from("products").select("id,name_en,name_ar,sku,stock,cost_price").order("name_en"),
    ]);
    setPos((p as PO[]) ?? []);
    setSuppliers((s as Supplier[]) ?? []);
    setProducts((pr as Product[]) ?? []);
    setLoading(false);
  }
  useEffect(() => { load(); }, []);

  const filtered = pos.filter((p) => {
    if (statusFilter !== "all" && p.status !== statusFilter) return false;
    if (q && !p.po_number.toLowerCase().includes(q.toLowerCase())) return false;
    return true;
  });

  const kpi = useMemo(() => ({
    total: pos.length,
    draft: pos.filter((p) => p.status === "draft").length,
    received: pos.filter((p) => p.status === "received").length,
    spend: pos.reduce((s, p) => s + Number(p.total || 0), 0),
  }), [pos]);

  function openNew() {
    setForm({ supplier_id: suppliers[0]?.id ?? "", notes: "", tax: 0 });
    setItems([{ product_id: null, product_name: "", quantity: 1, cost_per_unit: 0, total: 0 }]);
    setOpen(true);
  }

  function updateItem(idx: number, patch: Partial<POItem>) {
    setItems((arr) => arr.map((it, i) => {
      if (i !== idx) return it;
      const next = { ...it, ...patch };
      next.total = Number(next.quantity || 0) * Number(next.cost_per_unit || 0);
      return next;
    }));
  }

  function selectProduct(idx: number, productId: string) {
    const p = products.find((x) => x.id === productId);
    if (!p) return;
    updateItem(idx, {
      product_id: p.id,
      product_name: p.name_en || p.name_ar || p.sku || "Product",
      cost_per_unit: Number(p.cost_price || 0),
    });
  }

  const subtotal = items.reduce((s, it) => s + Number(it.total || 0), 0);
  const total = subtotal + Number(form.tax || 0);

  async function savePO() {
    if (!form.supplier_id) { toast.error(te("Select a supplier")); return; }
    const valid = items.filter((it) => it.product_name.trim() && it.quantity > 0);
    if (valid.length === 0) { toast.error(te("Add at least one item")); return; }

    const po_number = "PO-" + Date.now().toString().slice(-8);
    const { data: created, error } = await supabase.from("purchase_orders").insert({
      po_number,
      supplier_id: form.supplier_id,
      status: "draft",
      subtotal, tax: Number(form.tax || 0), total,
      notes: form.notes || null,
    }).select().single();
    if (error || !created) { toast.error(error?.message ?? te("Failed")); return; }

    const itemRows = valid.map((it) => ({
      purchase_order_id: created.id,
      product_id: it.product_id,
      product_name: it.product_name,
      quantity: it.quantity,
      cost_per_unit: it.cost_per_unit,
      total: it.total,
    }));
    const { error: iErr } = await supabase.from("purchase_order_items").insert(itemRows);
    if (iErr) { toast.error(iErr.message); return; }

    toast.success(`${te("Created")} ${po_number}`);
    setOpen(false);
    load();
  }

  async function markReceived(po: PO) {
    if (!confirm(`Mark ${po.po_number} as received? This will add stock to products.`)) return;
    const { data: rows, error } = await supabase.from("purchase_order_items").select("*").eq("purchase_order_id", po.id);
    if (error) { toast.error(error.message); return; }
    for (const it of rows as any[]) {
      if (!it.product_id) continue;
      const { data: prod } = await supabase.from("products").select("stock").eq("id", it.product_id).single();
      const newStock = Number((prod as any)?.stock ?? 0) + Number(it.quantity);
      await supabase.from("products").update({ stock: newStock } as any).eq("id", it.product_id);
      await supabase.from("inventory_movements").insert({
        product_id: it.product_id, quantity: it.quantity, movement_type: "purchase",
        reference_id: po.id, notes: `PO ${po.po_number}`,
      } as any);
    }
    await supabase.from("purchase_orders").update({ status: "received", received_at: new Date().toISOString() }).eq("id", po.id);
    toast.success(te("Received & stock updated"));
    load();
  }

  async function remove(po: PO) {
    if (po.status === "received") { toast.error(te("Cannot delete received PO")); return; }
    if (!confirm(`Delete ${po.po_number}?`)) return;
    const { error } = await supabase.from("purchase_orders").delete().eq("id", po.id);
    if (error) return toast.error(error.message);
    toast.success(te("Deleted"));
    load();
  }

  async function openView(po: PO) {
    setViewing(po);
    const { data } = await supabase.from("purchase_order_items").select("*").eq("purchase_order_id", po.id);
    setItems((data as any) ?? []);
  }

  const supplierName = (id: string) => suppliers.find((s) => s.id === id)?.name ?? "—";

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h1 className="text-2xl font-bold">{te("Purchase Orders")}</h1>
          <p className="text-sm text-muted-foreground">{te("Create and receive supplier orders")}</p>
        </div>
        <Button onClick={openNew} disabled={suppliers.length === 0}>
          <Plus className="h-4 w-4 me-1" /> {te("New PO")}
        </Button>
      </div>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <Kpi label={te("Total POs")} value={kpi.total.toString()} />
        <Kpi label={te("Draft")} value={kpi.draft.toString()} />
        <Kpi label={te("Received")} value={kpi.received.toString()} />
        <Kpi label={te("Total Spend")} value={`${kpi.spend.toFixed(3)} BHD`} />
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <div className="relative flex-1 min-w-[220px] max-w-md">
          <Search className="pointer-events-none absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder={te("Search PO number")} value={q} onChange={(e) => setQ(e.target.value)} className="ps-9" />
        </div>
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="h-10 rounded-md border border-border bg-background px-3 text-sm">
          <option value="all">{te("All statuses")}</option>
          <option value="draft">{te("Draft")}</option>
          <option value="ordered">{te("Ordered")}</option>
          <option value="received">{te("Received")}</option>
          <option value="cancelled">{te("Cancelled")}</option>
        </select>
      </div>

      <div className="overflow-x-auto rounded-lg border border-border">
        <table className="w-full text-sm">
          <thead className="bg-muted/40 text-xs uppercase text-muted-foreground">
            <tr>
              <th className="p-3 text-start">{te("PO #")}</th>
              <th className="p-3 text-start">{te("Supplier")}</th>
              <th className="p-3 text-start">{te("Status")}</th>
              <th className="p-3 text-end">{te("Total")}</th>
              <th className="p-3 text-start">{te("Created At")}</th>
              <th className="p-3 text-end">{te("Actions")}</th>
            </tr>
          </thead>
          <tbody>
            {loading && <tr><td colSpan={6} className="p-6 text-center text-muted-foreground">{te("Loading…")}</td></tr>}
            {!loading && filtered.length === 0 && <tr><td colSpan={6} className="p-6 text-center text-muted-foreground">{te("No purchase orders")}</td></tr>}
            {filtered.map((p) => (
              <tr key={p.id} className="border-t border-border/60">
                <td className="p-3 font-mono">{p.po_number}</td>
                <td className="p-3">{supplierName(p.supplier_id)}</td>
                <td className="p-3">
                  <span className={`rounded px-2 py-0.5 text-xs ${
                    p.status === "received" ? "bg-green-500/15 text-green-500" :
                    p.status === "draft" ? "bg-muted text-muted-foreground" :
                    p.status === "cancelled" ? "bg-red-500/15 text-red-500" :
                    "bg-primary/15 text-primary"
                  }`}>{p.status}</span>
                </td>
                <td className="p-3 text-end font-mono">{Number(p.total).toFixed(3)} {p.currency}</td>
                <td className="p-3 text-muted-foreground">{new Date(p.created_at).toLocaleDateString()}</td>
                <td className="p-3 text-end">
                  <Button variant="ghost" size="icon" onClick={() => openView(p)}><Eye className="h-4 w-4" /></Button>
                  {p.status !== "received" && (
                    <Button variant="ghost" size="icon" onClick={() => markReceived(p)} title={te("Receive")}><PackageCheck className="h-4 w-4 text-green-500" /></Button>
                  )}
                  {p.status !== "received" && (
                    <Button variant="ghost" size="icon" onClick={() => remove(p)}><Trash2 className="h-4 w-4 text-red-500" /></Button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Create dialog */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader><DialogTitle>{te("New Purchase Order")}</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              <div>
                <label className="text-xs text-muted-foreground">{te("Supplier")}</label>
                <select value={form.supplier_id} onChange={(e) => setForm({ ...form, supplier_id: e.target.value })} className="mt-1 w-full h-10 rounded-md border border-border bg-background px-3 text-sm">
                  {suppliers.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs text-muted-foreground">{te("Tax (BHD)")}</label>
                <Input type="number" step="0.001" value={form.tax} onChange={(e) => setForm({ ...form, tax: Number(e.target.value) })} />
              </div>
            </div>
            <div>
              <div className="mb-2 flex items-center justify-between">
                <label className="text-sm font-medium">{te("Items")}</label>
                <Button size="sm" variant="outline" onClick={() => setItems([...items, { product_id: null, product_name: "", quantity: 1, cost_per_unit: 0, total: 0 }])}>
                  <Plus className="h-3 w-3 me-1" /> {te("Add row")}
                </Button>
              </div>
              <div className="space-y-2">
                {items.map((it, idx) => (
                  <div key={idx} className="grid grid-cols-12 gap-2 items-center">
                    <select value={it.product_id ?? ""} onChange={(e) => selectProduct(idx, e.target.value)} className="col-span-5 h-9 rounded-md border border-border bg-background px-2 text-sm">
                      <option value="">{te("— select product —")}</option>
                      {products.map((p) => <option key={p.id} value={p.id}>{p.name_en || p.name_ar} {p.sku ? `(${p.sku})` : ""}</option>)}
                    </select>
                    <Input className="col-span-2" type="number" min={1} value={it.quantity} onChange={(e) => updateItem(idx, { quantity: Number(e.target.value) })} />
                    <Input className="col-span-2" type="number" step="0.001" value={it.cost_per_unit} onChange={(e) => updateItem(idx, { cost_per_unit: Number(e.target.value) })} />
                    <div className="col-span-2 text-end font-mono text-sm">{it.total.toFixed(3)}</div>
                    <Button className="col-span-1" variant="ghost" size="icon" onClick={() => setItems(items.filter((_, i) => i !== idx))}>
                      <Trash2 className="h-4 w-4 text-red-500" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
            <Textarea placeholder={te("Notes")} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
            <div className="rounded-md border border-border p-3 text-sm">
              <div className="flex justify-between"><span>{te("Subtotal")}</span><span className="font-mono">{subtotal.toFixed(3)}</span></div>
              <div className="flex justify-between"><span>{te("Tax")}</span><span className="font-mono">{Number(form.tax || 0).toFixed(3)}</span></div>
              <div className="mt-1 flex justify-between border-t border-border pt-1 font-semibold"><span>{te("Total")}</span><span className="font-mono">{total.toFixed(3)} BHD</span></div>
            </div>
          </div>
          <DialogFooter><Button onClick={savePO}>{te("Create PO")}</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View dialog */}
      <Dialog open={!!viewing} onOpenChange={(v) => !v && setViewing(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader><DialogTitle className="flex items-center gap-2"><FileText className="h-5 w-5" /> {viewing?.po_number}</DialogTitle></DialogHeader>
          {viewing && (
            <div className="space-y-3 text-sm">
              <div className="grid grid-cols-2 gap-2">
                <div><span className="text-muted-foreground">{te("Supplier: ")}</span>{supplierName(viewing.supplier_id)}</div>
                <div><span className="text-muted-foreground">{te("Status: ")}</span>{viewing.status}</div>
                <div><span className="text-muted-foreground">{te("Created: ")}</span>{new Date(viewing.created_at).toLocaleString()}</div>
                <div><span className="text-muted-foreground">{te("Received: ")}</span>{viewing.received_at ? new Date(viewing.received_at).toLocaleString() : "—"}</div>
              </div>
              <div className="rounded border border-border">
                <table className="w-full text-sm">
                  <thead className="bg-muted/40 text-xs uppercase text-muted-foreground">
                    <tr><th className="p-2 text-start">{te("Product")}</th><th className="p-2 text-end">{te("Qty")}</th><th className="p-2 text-end">{te("Cost")}</th><th className="p-2 text-end">{te("Total")}</th></tr>
                  </thead>
                  <tbody>
                    {items.map((it, i) => (
                      <tr key={i} className="border-t border-border/60">
                        <td className="p-2">{it.product_name}</td>
                        <td className="p-2 text-end">{it.quantity}</td>
                        <td className="p-2 text-end font-mono">{Number(it.cost_per_unit).toFixed(3)}</td>
                        <td className="p-2 text-end font-mono">{Number(it.total).toFixed(3)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="flex justify-between border-t border-border pt-2 font-semibold"><span>{te("Total")}</span><span className="font-mono">{Number(viewing.total).toFixed(3)} {viewing.currency}</span></div>
              {viewing.notes && <div className="rounded border border-border p-2 text-muted-foreground">{viewing.notes}</div>}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function Kpi({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-border bg-card p-4">
      <div className="text-xs uppercase text-muted-foreground">{label}</div>
      <div className="mt-1 text-2xl font-bold">{value}</div>
    </div>
  );
}
