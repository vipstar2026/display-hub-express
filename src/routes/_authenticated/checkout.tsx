import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { useCart } from "@/lib/cart";
import { useCurrency, type CurrencyCode } from "@/lib/currency";
import { toast } from "sonner";
import { MapPin, Package, CreditCard, Truck, Loader2 } from "lucide-react";

export const Route = createFileRoute("/_authenticated/checkout")({
  component: CheckoutPage,
  head: () => ({ meta: [{ title: "Checkout | VIP STAR" }] }),
});

type DBProduct = {
  id: string;
  vendor_id: string;
  title: string;
  price: number;
  sale_price: number | null;
  stock: number;
  currency: string;
  product_images: { url: string }[];
};

type Address = {
  id: string;
  full_name: string;
  phone: string;
  line1: string;
  line2: string | null;
  city: string;
  country: string;
  is_default: boolean;
};

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function CheckoutPage() {
  const { user } = useAuth();
  const { items, clear } = useCart();
  const { format } = useCurrency();
  const nav = useNavigate();

  const [products, setProducts] = useState<DBProduct[]>([]);
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [selectedAddr, setSelectedAddr] = useState<string | "new">("new");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [payment, setPayment] = useState<"cod" | "card">("cod");
  const [notes, setNotes] = useState("");

  const [form, setForm] = useState({
    full_name: "", phone: "", line1: "", line2: "", city: "", country: "Qatar", save: true,
  });

  const uuidIds = useMemo(() => items.map((i) => i.id).filter((id) => UUID_RE.test(id)), [items]);
  const demoCount = items.length - uuidIds.length;

  useEffect(() => {
    if (!user) return;
    (async () => {
      setLoading(true);
      const [{ data: prods }, { data: addrs }] = await Promise.all([
        uuidIds.length
          ? supabase
              .from("products")
              .select("id, vendor_id, title, price, sale_price, stock, currency, product_images(url)")
              .in("id", uuidIds)
          : Promise.resolve({ data: [] as DBProduct[] } as any),
        supabase.from("addresses").select("*").eq("user_id", user.id).order("is_default", { ascending: false }),
      ]);
      setProducts((prods as DBProduct[]) || []);
      const list = (addrs as Address[]) || [];
      setAddresses(list);
      if (list.length > 0) setSelectedAddr(list.find((a) => a.is_default)?.id || list[0].id);
      setLoading(false);
    })();
  }, [user, uuidIds.join(",")]);

  const rows = useMemo(() => {
    return products
      .map((p) => {
        const it = items.find((x) => x.id === p.id);
        if (!it) return null;
        const unit = Number(p.sale_price ?? p.price);
        return { product: p, qty: it.qty, unit, line: unit * it.qty };
      })
      .filter(Boolean) as { product: DBProduct; qty: number; unit: number; line: number }[];
  }, [products, items]);

  const subtotal = rows.reduce((s, r) => s + r.line, 0);
  const shipping = subtotal > 200 || subtotal === 0 ? 0 : 20;
  const total = subtotal + shipping;

  async function placeOrder() {
    if (!user) return;
    if (rows.length === 0) {
      toast.error("Your cart has no orderable items.");
      return;
    }

    let addr = addresses.find((a) => a.id === selectedAddr);
    if (!addr) {
      if (!form.full_name || !form.phone || !form.line1 || !form.city) {
        toast.error("Please fill in shipping details.");
        return;
      }
      addr = { id: "tmp", ...form, is_default: addresses.length === 0, line2: form.line2 || null } as Address;
    }

    setSubmitting(true);
    try {
      if (selectedAddr === "new" && form.save) {
        const { data: saved, error: aErr } = await supabase
          .from("addresses")
          .insert({
            user_id: user.id,
            full_name: form.full_name,
            phone: form.phone,
            line1: form.line1,
            line2: form.line2 || null,
            city: form.city,
            country: form.country,
            is_default: addresses.length === 0,
          })
          .select()
          .single();
        if (aErr) throw aErr;
        if (saved) addr = saved as Address;
      }

      const { data: order, error: oErr } = await supabase
        .from("orders")
        .insert({
          buyer_id: user.id,
          status: payment === "cod" ? "processing" : "pending",
          subtotal,
          shipping,
          total,
          currency: rows[0]?.product.currency || "QAR",
          payment_method: payment,
          ship_full_name: addr!.full_name,
          ship_phone: addr!.phone,
          ship_line1: addr!.line1,
          ship_line2: addr!.line2,
          ship_city: addr!.city,
          ship_country: addr!.country,
          notes: notes || null,
        })
        .select()
        .single();
      if (oErr) throw oErr;

      const itemsPayload = rows.map((r) => ({
        order_id: order!.id,
        vendor_id: r.product.vendor_id,
        product_id: r.product.id,
        title: r.product.title,
        image_url: r.product.product_images?.[0]?.url ?? null,
        price: r.unit,
        qty: r.qty,
      }));
      const { error: iErr } = await supabase.from("order_items").insert(itemsPayload);
      if (iErr) throw iErr;

      clear();
      toast.success("Order placed successfully");
      nav({ to: "/orders/$id", params: { id: order!.id } });
    } catch (e: any) {
      toast.error(e.message || "Failed to place order");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <SiteHeader />
      <main className="flex-1 mx-auto max-w-7xl w-full px-4 py-8">
        <h1 className="text-2xl font-bold text-foreground mb-6">Checkout</h1>

        {demoCount > 0 && (
          <div className="mb-4 rounded-md border border-amber-300 bg-amber-50 text-amber-900 px-4 py-3 text-sm">
            {demoCount} demo item(s) in your cart cannot be ordered. Only live store products will be checked out.
          </div>
        )}

        {loading ? (
          <div className="grid place-items-center py-16"><Loader2 className="w-6 h-6 animate-spin text-brand" /></div>
        ) : rows.length === 0 ? (
          <div className="bg-card border border-border rounded-xl p-10 text-center">
            <Package className="w-10 h-10 text-muted-foreground mx-auto" />
            <p className="mt-3 text-foreground font-medium">No orderable items in your cart.</p>
            <Link to="/" className="mt-4 inline-block text-brand hover:underline">Continue shopping</Link>
          </div>
        ) : (
          <div className="grid gap-6 lg:grid-cols-[1fr_380px]">
            <div className="space-y-6">
              <section className="bg-card border border-border rounded-xl p-5">
                <h2 className="flex items-center gap-2 font-semibold text-foreground"><MapPin className="w-4 h-4 text-brand" /> Shipping address</h2>
                {addresses.length > 0 && (
                  <div className="mt-4 grid sm:grid-cols-2 gap-3">
                    {addresses.map((a) => (
                      <label key={a.id} className={`block border rounded-lg p-3 cursor-pointer text-sm ${selectedAddr === a.id ? "border-brand ring-1 ring-brand bg-accent/30" : "border-border"}`}>
                        <input type="radio" name="addr" className="sr-only" checked={selectedAddr === a.id} onChange={() => setSelectedAddr(a.id)} />
                        <div className="font-semibold text-foreground">{a.full_name} · {a.phone}</div>
                        <div className="text-muted-foreground mt-1">{a.line1}{a.line2 ? `, ${a.line2}` : ""}, {a.city}, {a.country}</div>
                        {a.is_default && <span className="mt-1 inline-block text-[10px] px-1.5 py-0.5 rounded bg-brand text-brand-foreground">Default</span>}
                      </label>
                    ))}
                    <label className={`block border rounded-lg p-3 cursor-pointer text-sm ${selectedAddr === "new" ? "border-brand ring-1 ring-brand bg-accent/30" : "border-border"}`}>
                      <input type="radio" name="addr" className="sr-only" checked={selectedAddr === "new"} onChange={() => setSelectedAddr("new")} />
                      <div className="font-semibold text-foreground">+ Use a new address</div>
                    </label>
                  </div>
                )}

                {selectedAddr === "new" && (
                  <div className="mt-4 grid sm:grid-cols-2 gap-3">
                    <Input label="Full name" value={form.full_name} onChange={(v) => setForm({ ...form, full_name: v })} />
                    <Input label="Phone" value={form.phone} onChange={(v) => setForm({ ...form, phone: v })} />
                    <Input label="Address line 1" value={form.line1} onChange={(v) => setForm({ ...form, line1: v })} className="sm:col-span-2" />
                    <Input label="Address line 2 (optional)" value={form.line2} onChange={(v) => setForm({ ...form, line2: v })} className="sm:col-span-2" />
                    <Input label="City" value={form.city} onChange={(v) => setForm({ ...form, city: v })} />
                    <Input label="Country" value={form.country} onChange={(v) => setForm({ ...form, country: v })} />
                    <label className="sm:col-span-2 flex items-center gap-2 text-sm text-foreground">
                      <input type="checkbox" checked={form.save} onChange={(e) => setForm({ ...form, save: e.target.checked })} />
                      Save this address to my account
                    </label>
                  </div>
                )}
              </section>

              <section className="bg-card border border-border rounded-xl p-5">
                <h2 className="flex items-center gap-2 font-semibold text-foreground"><Package className="w-4 h-4 text-brand" /> Items ({rows.length})</h2>
                <div className="mt-4 divide-y divide-border">
                  {rows.map((r) => (
                    <div key={r.product.id} className="py-3 flex gap-3 items-center">
                      <div className="w-16 h-16 rounded bg-secondary overflow-hidden shrink-0">
                        {r.product.product_images?.[0]?.url && <img src={r.product.product_images[0].url} alt={r.product.title} className="w-full h-full object-cover" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium text-foreground line-clamp-2">{r.product.title}</div>
                        <div className="text-xs text-muted-foreground mt-1">{format(r.unit, (r.product.currency as CurrencyCode) || undefined)} × {r.qty}</div>
                      </div>
                      <div className="text-sm font-bold text-sale">{format(r.line, (r.product.currency as CurrencyCode) || undefined)}</div>
                    </div>
                  ))}
                </div>
              </section>

              <section className="bg-card border border-border rounded-xl p-5">
                <h2 className="flex items-center gap-2 font-semibold text-foreground"><CreditCard className="w-4 h-4 text-brand" /> Payment method</h2>
                <div className="mt-3 grid sm:grid-cols-2 gap-3">
                  <label className={`flex items-center gap-3 border rounded-lg p-3 cursor-pointer text-sm ${payment === "cod" ? "border-brand ring-1 ring-brand bg-accent/30" : "border-border"}`}>
                    <input type="radio" name="pay" className="sr-only" checked={payment === "cod"} onChange={() => setPayment("cod")} />
                    <Truck className="w-4 h-4 text-brand" />
                    <div>
                      <div className="font-semibold text-foreground">Cash on Delivery</div>
                      <div className="text-xs text-muted-foreground">Pay when your order arrives</div>
                    </div>
                  </label>
                  <label className={`flex items-center gap-3 border rounded-lg p-3 cursor-not-allowed text-sm opacity-50`}>
                    <input type="radio" name="pay" className="sr-only" disabled />
                    <CreditCard className="w-4 h-4 text-brand" />
                    <div>
                      <div className="font-semibold text-foreground">Card (coming soon)</div>
                      <div className="text-xs text-muted-foreground">Stripe checkout</div>
                    </div>
                  </label>
                </div>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Order notes (optional)"
                  className="mt-4 w-full min-h-[80px] rounded-md border border-border bg-background p-3 text-sm outline-none focus:border-brand"
                />
              </section>
            </div>

            <aside className="bg-card border border-border rounded-xl p-5 h-fit lg:sticky lg:top-32">
              <h2 className="font-bold text-foreground">Order summary</h2>
              <div className="mt-3 space-y-2 text-sm">
                <Row label="Subtotal" value={format(subtotal)} />
                <Row label="Shipping" value={shipping === 0 ? "Free" : format(shipping)} />
                <div className="border-t border-border pt-2 mt-2 flex justify-between text-base">
                  <span className="font-bold">Total</span>
                  <span className="font-extrabold text-sale">{format(total)}</span>
                </div>
              </div>
              <button
                onClick={placeOrder}
                disabled={submitting}
                className="mt-5 w-full h-12 rounded-md bg-sale hover:opacity-90 text-white font-semibold flex items-center justify-center gap-2 transition-smooth disabled:opacity-50"
              >
                {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
                Place order
              </button>
              <Link to="/cart" className="mt-2 block text-center text-sm text-brand hover:underline">Back to cart</Link>
            </aside>
          </div>
        )}
      </main>
      <SiteFooter />
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return <div className="flex justify-between"><span className="text-muted-foreground">{label}</span><span className="font-semibold">{value}</span></div>;
}

function Input({ label, value, onChange, className = "" }: { label: string; value: string; onChange: (v: string) => void; className?: string }) {
  return (
    <div className={className}>
      <label className="text-xs font-medium text-muted-foreground">{label}</label>
      <input value={value} onChange={(e) => onChange(e.target.value)} className="mt-1 w-full h-10 rounded-md border border-border px-3 text-sm bg-background outline-none focus:border-brand" />
    </div>
  );
}
