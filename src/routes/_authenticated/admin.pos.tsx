import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { useI18n } from "@/lib/i18n";
import { Search, Plus, Minus, Trash2, ShoppingCart, Receipt, Printer, X } from "lucide-react";

export const Route = createFileRoute("/_authenticated/admin/pos")({
  ssr: false,
  component: POSPage,
});

type Product = {
  id: string;
  name_en: string | null;
  name_ar: string | null;
  sku: string | null;
  price: number;
  stock: number | null;
  images: string[] | null;
  category_id: string | null;
};

type CartLine = {
  product_id: string;
  name: string;
  sku: string | null;
  unit_price: number;
  quantity: number;
  discount: number;
};

function POSPage() {
  const { t, lang } = useI18n();
  const currency = "BHD";
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<{ id: string; name_en: string | null; name_ar: string | null }[]>([]);
  const [activeCat, setActiveCat] = useState<string | "all">("all");
  const [query, setQuery] = useState("");
  const [cart, setCart] = useState<CartLine[]>([]);
  const [session, setSession] = useState<any>(null);
  const [openingCash, setOpeningCash] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("cash");
  const [paidAmount, setPaidAmount] = useState("");
  const [paymentRef, setPaymentRef] = useState("");
  const [processing, setProcessing] = useState(false);
  const [lastSale, setLastSale] = useState<any>(null);

  useEffect(() => {
    (async () => {
      const [{ data: p }, { data: c }, { data: s }] = await Promise.all([
        supabase.from("products").select("id,name_en,name_ar,sku,price,stock,images,category_id").eq("status", "active").order("name_en"),
        supabase.from("categories").select("id,name_en,name_ar").eq("is_active", true).order("sort_order"),
        supabase.from("pos_sessions").select("*").eq("status", "open").maybeSingle(),
      ]);
      setProducts((p ?? []) as Product[]);
      setCategories(c ?? []);
      setSession(s);
    })();
  }, []);

  const nameOf = (p: { name_en: string | null; name_ar: string | null }) =>
    (lang === "ar" ? p.name_ar : p.name_en) || p.name_en || p.name_ar || "—";

  const filtered = useMemo(() => {
    return products.filter((p) => {
      if (activeCat !== "all" && p.category_id !== activeCat) return false;
      if (query) {
        const q = query.toLowerCase();
        return (p.name_en ?? "").toLowerCase().includes(q) || (p.name_ar ?? "").includes(query) || (p.sku ?? "").toLowerCase().includes(q);
      }
      return true;
    });
  }, [products, activeCat, query]);

  const addToCart = (p: Product) => {
    setCart((c) => {
      const existing = c.find((l) => l.product_id === p.id);
      if (existing) return c.map((l) => (l.product_id === p.id ? { ...l, quantity: l.quantity + 1 } : l));
      return [...c, { product_id: p.id, name: nameOf(p), sku: p.sku, unit_price: Number(p.price), quantity: 1, discount: 0 }];
    });
  };
  const updateQty = (id: string, delta: number) =>
    setCart((c) => c.flatMap((l) => (l.product_id === id ? (l.quantity + delta <= 0 ? [] : [{ ...l, quantity: l.quantity + delta }]) : [l])));
  const removeLine = (id: string) => setCart((c) => c.filter((l) => l.product_id !== id));
  const setLineDiscount = (id: string, d: number) => setCart((c) => c.map((l) => (l.product_id === id ? { ...l, discount: Math.max(0, d) } : l)));

  const subtotal = cart.reduce((s, l) => s + l.unit_price * l.quantity, 0);
  const totalDiscount = cart.reduce((s, l) => s + l.discount * l.quantity, 0);
  const taxable = Math.max(0, subtotal - totalDiscount);
  const tax = 0;
  const total = taxable + tax;
  const change = Math.max(0, Number(paidAmount || 0) - total);

  const openSession = async () => {
    const opening = Number(openingCash || 0);
    const { data: u } = await supabase.auth.getUser();
    if (!u.user) return;
    const { data, error } = await supabase
      .from("pos_sessions")
      .insert({ cashier_id: u.user.id, opening_cash: opening, status: "open" })
      .select()
      .single();
    if (error) return toast.error(error.message);
    setSession(data);
    toast.success(t("pos.sessionOpened"));
  };

  const closeSession = async () => {
    if (!session) return;
    const { error } = await supabase.from("pos_sessions").update({ status: "closed", closed_at: new Date().toISOString() }).eq("id", session.id);
    if (error) return toast.error(error.message);
    setSession(null);
    toast.success(t("pos.sessionClosed"));
  };

  const checkout = async () => {
    if (!session) return toast.error(t("pos.openFirst"));
    if (cart.length === 0) return;
    if (paymentMethod === "cash" && Number(paidAmount || 0) < total) return toast.error(t("pos.insufficient"));

    setProcessing(true);
    try {
      const { data: u } = await supabase.auth.getUser();
      const saleNumber = `POS-${Date.now().toString(36).toUpperCase()}`;
      const { data: sale, error: e1 } = await supabase
        .from("pos_sales")
        .insert({
          sale_number: saleNumber,
          session_id: session.id,
          cashier_id: u.user!.id,
          customer_name: customerName || null,
          customer_phone: customerPhone || null,
          subtotal,
          tax,
          discount: totalDiscount,
          total,
          payment_method: paymentMethod,
          payment_reference: paymentRef || null,
          paid_amount: paymentMethod === "cash" ? Number(paidAmount || 0) : total,
          change_amount: paymentMethod === "cash" ? change : 0,
          status: "completed",
        })
        .select()
        .single();
      if (e1) throw e1;

      const items = cart.map((l) => ({
        sale_id: sale.id,
        product_id: l.product_id,
        product_name: l.name,
        sku: l.sku,
        quantity: l.quantity,
        unit_price: l.unit_price,
        discount: l.discount,
        total: (l.unit_price - l.discount) * l.quantity,
      }));
      const { error: e2 } = await supabase.from("pos_sale_items").insert(items);
      if (e2) throw e2;

      // decrement stock
      await Promise.all(
        cart.map((l) => {
          const p = products.find((x) => x.id === l.product_id);
          if (!p || p.stock == null) return null;
          return supabase.from("products").update({ stock: Math.max(0, (p.stock ?? 0) - l.quantity) }).eq("id", l.product_id);
        }),
      );

      setLastSale({ ...sale, items });
      setCart([]);
      setCustomerName("");
      setCustomerPhone("");
      setPaidAmount("");
      setPaymentRef("");
      toast.success(t("pos.saleComplete"));
    } catch (err: any) {
      toast.error(err.message ?? "Error");
    } finally {
      setProcessing(false);
    }
  };

  const printReceipt = () => {
    if (!lastSale) return;
    const w = window.open("", "_blank", "width=380,height=600");
    if (!w) return;
    const rows = lastSale.items
      .map((i: any) => `<tr><td>${i.product_name}</td><td style="text-align:center">${i.quantity}</td><td style="text-align:end">${i.total.toFixed(3)}</td></tr>`)
      .join("");
    w.document.write(`<!doctype html><html><head><title>Receipt ${lastSale.sale_number}</title>
<style>body{font-family:monospace;padding:12px;font-size:12px}h2{text-align:center;margin:4px 0}table{width:100%;border-collapse:collapse;margin-top:8px}td,th{padding:3px 0;border-bottom:1px dashed #999}.tot{font-weight:bold;font-size:14px}.c{text-align:center}</style>
</head><body>
<h2>VIPSTAR</h2><div class="c">CR: 158814-1</div>
<div class="c">${new Date(lastSale.created_at).toLocaleString()}</div>
<div class="c">#${lastSale.sale_number}</div>
${lastSale.customer_name ? `<div>Customer: ${lastSale.customer_name}</div>` : ""}
<table><thead><tr><th align="start">Item</th><th>Qty</th><th align="end">Total</th></tr></thead><tbody>${rows}</tbody></table>
<table><tr><td>Subtotal</td><td style="text-align:end">${Number(lastSale.subtotal).toFixed(3)}</td></tr>
<tr><td>Discount</td><td style="text-align:end">${Number(lastSale.discount).toFixed(3)}</td></tr>
<tr class="tot"><td>Total ${currency}</td><td style="text-align:end">${Number(lastSale.total).toFixed(3)}</td></tr>
<tr><td>Paid (${lastSale.payment_method})</td><td style="text-align:end">${Number(lastSale.paid_amount).toFixed(3)}</td></tr>
<tr><td>Change</td><td style="text-align:end">${Number(lastSale.change_amount).toFixed(3)}</td></tr></table>
<p class="c">Thank you!</p>
<script>window.print();</script></body></html>`);
    w.document.close();
  };

  if (!session) {
    return (
      <div className="mx-auto max-w-md">
        <Card className="border-primary/20 p-6">
          <h1 className="mb-1 text-xl font-bold">{t("pos.openSession")}</h1>
          <p className="mb-4 text-sm text-muted-foreground">{t("pos.openSessionHint")}</p>
          <label className="mb-1 block text-xs">{t("pos.openingCash")} ({currency})</label>
          <Input type="number" step="0.001" value={openingCash} onChange={(e) => setOpeningCash(e.target.value)} placeholder="0.000" />
          <Button className="mt-4 w-full" onClick={openSession}>{t("pos.startSession")}</Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="grid gap-4 lg:grid-cols-[1fr_400px]">
      {/* Products */}
      <div className="min-w-0">
        <div className="mb-3 flex flex-wrap items-center gap-2">
          <div className="relative min-w-0 flex-1">
            <Search className="pointer-events-none absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder={t("pos.searchProducts")} className="ps-9" />
          </div>
          <Button variant="outline" size="sm" onClick={closeSession}>
            <X className="me-1 h-4 w-4" />{t("pos.closeSession")}
          </Button>
        </div>

        <div className="mb-3 flex gap-2 overflow-x-auto pb-1">
          <Badge variant={activeCat === "all" ? "default" : "outline"} className="cursor-pointer whitespace-nowrap" onClick={() => setActiveCat("all")}>
            {t("shop.all")}
          </Badge>
          {categories.map((c) => (
            <Badge key={c.id} variant={activeCat === c.id ? "default" : "outline"} className="cursor-pointer whitespace-nowrap" onClick={() => setActiveCat(c.id)}>
              {nameOf(c)}
            </Badge>
          ))}
        </div>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-4">
          {filtered.map((p) => (
            <button
              key={p.id}
              onClick={() => addToCart(p)}
              className="group flex flex-col overflow-hidden rounded-lg border border-primary/20 bg-card text-start transition hover:border-primary hover:shadow-lg hover:shadow-primary/20"
            >
              <div className="aspect-square w-full bg-muted/40">
                {p.images?.[0] ? (
                  <img src={p.images[0]} alt="" className="h-full w-full object-cover transition group-hover:scale-105" />
                ) : (
                  <div className="grid h-full place-items-center text-xs text-muted-foreground">—</div>
                )}
              </div>
              <div className="flex flex-1 flex-col gap-1 p-2">
                <div className="line-clamp-2 text-xs font-medium">{nameOf(p)}</div>
                <div className="mt-auto flex items-center justify-between">
                  <span className="text-sm font-bold text-primary">{Number(p.price).toFixed(3)}</span>
                  {p.stock != null && <span className="text-[10px] text-muted-foreground">×{p.stock}</span>}
                </div>
              </div>
            </button>
          ))}
          {filtered.length === 0 && (
            <div className="col-span-full grid place-items-center rounded-lg border border-dashed border-primary/20 p-8 text-sm text-muted-foreground">
              {t("shop.empty")}
            </div>
          )}
        </div>
      </div>

      {/* Cart */}
      <Card className="sticky top-4 flex h-fit max-h-[calc(100vh-2rem)] flex-col border-primary/20 p-4">
        <div className="mb-3 flex items-center gap-2">
          <ShoppingCart className="h-4 w-4 text-primary" />
          <h2 className="font-bold">{t("pos.cart")}</h2>
          <Badge variant="outline" className="ms-auto">{cart.length}</Badge>
        </div>

        <div className="mb-3 flex-1 space-y-2 overflow-y-auto">
          {cart.length === 0 && <div className="grid h-32 place-items-center text-xs text-muted-foreground">{t("shop.emptyCart")}</div>}
          {cart.map((l) => (
            <div key={l.product_id} className="rounded-md border border-primary/10 p-2 text-xs">
              <div className="flex items-start gap-2">
                <div className="flex-1">
                  <div className="line-clamp-1 font-medium">{l.name}</div>
                  <div className="text-muted-foreground">{Number(l.unit_price).toFixed(3)} × {l.quantity}</div>
                </div>
                <button onClick={() => removeLine(l.product_id)} className="text-muted-foreground hover:text-red-500">
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
              <div className="mt-2 flex items-center gap-1">
                <Button size="icon" variant="outline" className="h-6 w-6" onClick={() => updateQty(l.product_id, -1)}><Minus className="h-3 w-3" /></Button>
                <span className="w-6 text-center">{l.quantity}</span>
                <Button size="icon" variant="outline" className="h-6 w-6" onClick={() => updateQty(l.product_id, 1)}><Plus className="h-3 w-3" /></Button>
                <Input
                  type="number"
                  step="0.001"
                  value={l.discount || ""}
                  onChange={(e) => setLineDiscount(l.product_id, Number(e.target.value))}
                  placeholder={t("pos.discount")}
                  className="ms-auto h-7 w-20 text-xs"
                />
              </div>
            </div>
          ))}
        </div>

        <div className="space-y-2 border-t border-primary/10 pt-3">
          <div className="grid grid-cols-2 gap-2">
            <Input value={customerName} onChange={(e) => setCustomerName(e.target.value)} placeholder={t("pos.customerName")} className="h-8 text-xs" />
            <Input value={customerPhone} onChange={(e) => setCustomerPhone(e.target.value)} placeholder={t("pos.customerPhone")} className="h-8 text-xs" />
          </div>

          <div className="flex gap-1">
            {(["cash", "card", "benefit", "transfer"] as const).map((m) => (
              <button
                key={m}
                onClick={() => setPaymentMethod(m)}
                className={`flex-1 rounded-md border px-2 py-1.5 text-[11px] capitalize transition ${
                  paymentMethod === m ? "border-primary bg-primary/15 text-primary" : "border-primary/20 text-muted-foreground hover:border-primary/50"
                }`}
              >
                {t(`pos.pay.${m}`)}
              </button>
            ))}
          </div>

          {paymentMethod === "cash" ? (
            <Input type="number" step="0.001" value={paidAmount} onChange={(e) => setPaidAmount(e.target.value)} placeholder={t("pos.paidAmount")} className="h-8 text-xs" />
          ) : (
            <Input value={paymentRef} onChange={(e) => setPaymentRef(e.target.value)} placeholder={t("pos.reference")} className="h-8 text-xs" />
          )}

          <div className="space-y-1 rounded-md bg-muted/40 p-2 text-xs">
            <div className="flex justify-between"><span>{t("shop.subtotal")}</span><span>{subtotal.toFixed(3)}</span></div>
            <div className="flex justify-between"><span>{t("pos.discount")}</span><span>-{totalDiscount.toFixed(3)}</span></div>
            <div className="flex justify-between border-t border-primary/10 pt-1 text-sm font-bold text-primary"><span>{t("shop.total")} {currency}</span><span>{total.toFixed(3)}</span></div>
            {paymentMethod === "cash" && Number(paidAmount || 0) > 0 && (
              <div className="flex justify-between text-emerald-500"><span>{t("pos.change")}</span><span>{change.toFixed(3)}</span></div>
            )}
          </div>

          <Button className="w-full" onClick={checkout} disabled={processing || cart.length === 0}>
            <Receipt className="me-2 h-4 w-4" />
            {processing ? "…" : t("pos.completeSale")}
          </Button>

          {lastSale && (
            <Button variant="outline" className="w-full" onClick={printReceipt}>
              <Printer className="me-2 h-4 w-4" />
              {t("pos.printLast")} — {lastSale.sale_number}
            </Button>
          )}
        </div>
      </Card>
    </div>
  );
}
