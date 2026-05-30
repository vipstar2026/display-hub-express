import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { useCart } from "@/lib/cart";
import { useCurrency, type CurrencyCode } from "@/lib/currency";
import { toast } from "sonner";
import { MapPin, Package, CreditCard, Truck, Loader2, Lock, ShieldCheck, Check, Wallet, Building2, Smartphone, Apple } from "lucide-react";

export const Route = createFileRoute("/_authenticated/checkout")({
  component: CheckoutPage,
  head: () => ({ meta: [{ title: "إتمام الشراء | VIP STAR" }] }),
});

type DBProduct = {
  id: string; vendor_id: string; title: string; price: number; sale_price: number | null;
  stock: number; currency: string; product_images: { url: string }[];
};

type Address = {
  id: string; full_name: string; phone: string; line1: string; line2: string | null;
  city: string; country: string; is_default: boolean;
};

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

type PaymentMethod = "cod" | "card" | "benefit" | "apple_pay" | "google_pay" | "bank_transfer";

const PAYMENT_OPTIONS: { id: PaymentMethod; label: string; sub: string; icon: any; badge?: string }[] = [
  { id: "card",          label: "بطاقة ائتمان / مدى",  sub: "Visa · Mastercard · Mada",        icon: CreditCard, badge: "الأكثر استخداماً" },
  { id: "benefit",       label: "بِنِفت (BenefitPay)",  sub: "الدفع عبر تطبيق Benefit البحريني", icon: Smartphone },
  { id: "apple_pay",     label: "Apple Pay",            sub: "دفع سريع وآمن بلمسة واحدة",       icon: Apple },
  { id: "google_pay",    label: "Google Pay",           sub: "ادفع ببطاقتك المحفوظة في Google", icon: Wallet },
  { id: "bank_transfer", label: "تحويل بنكي",            sub: "حوالة مباشرة إلى حساب المتجر",    icon: Building2 },
  { id: "cod",           label: "الدفع عند الاستلام",   sub: "ادفع نقداً عند وصول طلبك",       icon: Truck },
];

function CheckoutPage() {
  const { user } = useAuth();
  const { items, clear } = useCart();
  const { format, toBase } = useCurrency();
  const nav = useNavigate();

  const [products, setProducts] = useState<DBProduct[]>([]);
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [selectedAddr, setSelectedAddr] = useState<string | "new">("new");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [payment, setPayment] = useState<PaymentMethod>("cod");
  const [notes, setNotes] = useState("");
  const [step, setStep] = useState<1 | 2 | 3>(1);

  // Card form state (UI ready, gateway plug-in pending)
  const [card, setCard] = useState({ number: "", name: "", expiry: "", cvc: "", save: false });
  const [benefitPhone, setBenefitPhone] = useState("");

  const [form, setForm] = useState({
    full_name: "", phone: "", line1: "", line2: "", city: "", country: "Bahrain", save: true,
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

  // Totals in BASE currency for display formatting.
  const subtotalBase = rows.reduce((s, r) => s + toBase(r.line, (r.product.currency as CurrencyCode) || undefined), 0);
  const freeShipBase = toBase(200, "QAR");
  const shippingBase = subtotalBase === 0 || subtotalBase >= freeShipBase ? 0 : toBase(20, "QAR");
  const totalBase = subtotalBase + shippingBase;

  // Numbers persisted to DB stay in the product's source currency (for orders.currency).
  const orderCurrency = (rows[0]?.product.currency as CurrencyCode) || "BHD";
  const subtotalSrc = rows.reduce((s, r) => s + r.line, 0);
  const shippingSrc = subtotalSrc === 0 || subtotalSrc >= 200 ? 0 : 20; // simple legacy rule
  const totalSrc = subtotalSrc + shippingSrc;

  async function placeOrder() {
    if (!user) return;
    if (rows.length === 0) { toast.error("لا توجد منتجات قابلة للشراء في السلة."); return; }

    let addr = addresses.find((a) => a.id === selectedAddr);
    if (!addr) {
      if (!form.full_name || !form.phone || !form.line1 || !form.city) {
        toast.error("يرجى إكمال بيانات الشحن.");
        setStep(1);
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
            full_name: form.full_name, phone: form.phone, line1: form.line1,
            line2: form.line2 || null, city: form.city, country: form.country,
            is_default: addresses.length === 0,
          })
          .select().single();
        if (aErr) throw aErr;
        if (saved) addr = saved as Address;
      }

      const { data: order, error: oErr } = await supabase
        .from("orders")
        .insert({
          buyer_id: user.id,
          status: payment === "cod" ? "processing" : "pending",
          subtotal: subtotalSrc, shipping: shippingSrc, total: totalSrc,
          currency: orderCurrency,
          payment_method: payment,
          ship_full_name: addr!.full_name, ship_phone: addr!.phone,
          ship_line1: addr!.line1, ship_line2: addr!.line2,
          ship_city: addr!.city, ship_country: addr!.country,
          notes: notes || null,
        })
        .select().single();
      if (oErr) throw oErr;

      const itemsPayload = rows.map((r) => ({
        order_id: order!.id, vendor_id: r.product.vendor_id, product_id: r.product.id,
        title: r.product.title, image_url: r.product.product_images?.[0]?.url ?? null,
        price: r.unit, qty: r.qty,
      }));
      const { error: iErr } = await supabase.from("order_items").insert(itemsPayload);
      if (iErr) throw iErr;

      clear();
      toast.success("تم تأكيد طلبك بنجاح");
      nav({ to: "/orders/$id", params: { id: order!.id } });
    } catch (e: any) {
      toast.error(e.message || "فشل إنشاء الطلب");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div dir="rtl" className="min-h-screen flex flex-col bg-background">
      <SiteHeader />
      <main className="flex-1 mx-auto max-w-7xl w-full px-4 py-8">
        <h1 className="text-2xl md:text-3xl font-bold text-foreground mb-2 flex items-center gap-2">
          <Lock className="w-6 h-6 text-brand" /> إتمام الشراء
        </h1>
        <p className="text-sm text-muted-foreground mb-6">دفع آمن ومشفّر بالكامل</p>

        {/* Stepper */}
        <div className="flex items-center gap-2 md:gap-4 mb-8">
          {[
            { n: 1, label: "العنوان" },
            { n: 2, label: "الدفع" },
            { n: 3, label: "المراجعة" },
          ].map((s, i) => (
            <div key={s.n} className="flex items-center gap-2 md:gap-4 flex-1">
              <button
                onClick={() => setStep(s.n as 1 | 2 | 3)}
                className={`flex items-center gap-2 ${step >= s.n ? "text-brand" : "text-muted-foreground"}`}
              >
                <span className={`w-8 h-8 rounded-full grid place-items-center text-xs font-bold border-2 transition-smooth ${
                  step > s.n ? "bg-brand text-brand-foreground border-brand"
                  : step === s.n ? "border-brand text-brand bg-brand/10"
                  : "border-border"
                }`}>
                  {step > s.n ? <Check className="w-4 h-4" /> : s.n}
                </span>
                <span className="text-sm font-semibold hidden sm:inline">{s.label}</span>
              </button>
              {i < 2 && <div className={`h-0.5 flex-1 ${step > s.n ? "bg-brand" : "bg-border"}`} />}
            </div>
          ))}
        </div>

        {demoCount > 0 && (
          <div className="mb-4 rounded-xl border border-sale/40 bg-sale/10 text-foreground px-4 py-3 text-sm">
            {demoCount} منتج تجريبي في سلتك لن يتم شراؤه. سيتم احتساب المنتجات الحقيقية فقط.
          </div>
        )}

        {loading ? (
          <div className="grid place-items-center py-16"><Loader2 className="w-6 h-6 animate-spin text-brand" /></div>
        ) : rows.length === 0 ? (
          <div className="bg-card border border-border rounded-2xl p-10 text-center shadow-card">
            <Package className="w-10 h-10 text-muted-foreground mx-auto" />
            <p className="mt-3 text-foreground font-medium">لا توجد منتجات قابلة للشراء في السلة.</p>
            <Link to="/" className="mt-4 inline-block text-brand hover:underline">متابعة التسوق</Link>
          </div>
        ) : (
          <div className="grid gap-6 lg:grid-cols-[1fr_380px]">
            <div className="space-y-6">
              {/* Address */}
              <section className={`bg-card border border-border rounded-2xl p-5 shadow-card transition-smooth ${step === 1 ? "ring-1 ring-brand/40" : ""}`}>
                <h2 className="flex items-center gap-2 font-bold text-foreground"><MapPin className="w-4 h-4 text-brand" /> عنوان الشحن</h2>
                {addresses.length > 0 && (
                  <div className="mt-4 grid sm:grid-cols-2 gap-3">
                    {addresses.map((a) => (
                      <label key={a.id} className={`block border rounded-xl p-3 cursor-pointer text-sm transition-smooth ${selectedAddr === a.id ? "border-brand ring-1 ring-brand bg-brand/5" : "border-border hover:border-brand/40"}`}>
                        <input type="radio" name="addr" className="sr-only" checked={selectedAddr === a.id} onChange={() => setSelectedAddr(a.id)} />
                        <div className="font-semibold text-foreground">{a.full_name} · {a.phone}</div>
                        <div className="text-muted-foreground mt-1">{a.line1}{a.line2 ? `, ${a.line2}` : ""}, {a.city}, {a.country}</div>
                        {a.is_default && <span className="mt-2 inline-block text-[10px] px-2 py-0.5 rounded bg-brand text-brand-foreground font-semibold">افتراضي</span>}
                      </label>
                    ))}
                    <label className={`block border border-dashed rounded-xl p-3 cursor-pointer text-sm transition-smooth ${selectedAddr === "new" ? "border-brand ring-1 ring-brand bg-brand/5" : "border-border hover:border-brand/40"}`}>
                      <input type="radio" name="addr" className="sr-only" checked={selectedAddr === "new"} onChange={() => setSelectedAddr("new")} />
                      <div className="font-semibold text-foreground">+ إضافة عنوان جديد</div>
                    </label>
                  </div>
                )}

                {selectedAddr === "new" && (
                  <div className="mt-4 grid sm:grid-cols-2 gap-3">
                    <Input label="الاسم الكامل" value={form.full_name} onChange={(v) => setForm({ ...form, full_name: v })} />
                    <Input label="رقم الهاتف" value={form.phone} onChange={(v) => setForm({ ...form, phone: v })} />
                    <Input label="العنوان" value={form.line1} onChange={(v) => setForm({ ...form, line1: v })} className="sm:col-span-2" />
                    <Input label="تفاصيل إضافية (اختياري)" value={form.line2} onChange={(v) => setForm({ ...form, line2: v })} className="sm:col-span-2" />
                    <Input label="المدينة" value={form.city} onChange={(v) => setForm({ ...form, city: v })} />
                    <Input label="الدولة" value={form.country} onChange={(v) => setForm({ ...form, country: v })} />
                    <label className="sm:col-span-2 flex items-center gap-2 text-sm text-foreground">
                      <input type="checkbox" checked={form.save} onChange={(e) => setForm({ ...form, save: e.target.checked })} />
                      حفظ هذا العنوان في حسابي
                    </label>
                  </div>
                )}
              </section>

              {/* Items */}
              <section className="bg-card border border-border rounded-2xl p-5 shadow-card">
                <h2 className="flex items-center gap-2 font-bold text-foreground"><Package className="w-4 h-4 text-brand" /> المنتجات ({rows.length})</h2>
                <div className="mt-4 divide-y divide-border">
                  {rows.map((r) => (
                    <div key={r.product.id} className="py-3 flex gap-3 items-center">
                      <div className="w-16 h-16 rounded-xl bg-secondary overflow-hidden shrink-0">
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

              {/* Payment */}
              <section className={`bg-card border border-border rounded-2xl p-5 shadow-card transition-smooth ${step === 2 ? "ring-1 ring-brand/40" : ""}`}>
                <h2 className="flex items-center gap-2 font-bold text-foreground"><CreditCard className="w-4 h-4 text-brand" /> طريقة الدفع</h2>
                <div className="mt-3 grid sm:grid-cols-2 gap-3">
                  <label className={`flex items-center gap-3 border rounded-xl p-3 cursor-pointer text-sm transition-smooth ${payment === "cod" ? "border-brand ring-1 ring-brand bg-brand/5" : "border-border hover:border-brand/40"}`}>
                    <input type="radio" name="pay" className="sr-only" checked={payment === "cod"} onChange={() => setPayment("cod")} />
                    <Truck className="w-5 h-5 text-brand" />
                    <div>
                      <div className="font-semibold text-foreground">الدفع عند الاستلام</div>
                      <div className="text-xs text-muted-foreground">ادفع نقداً عند وصول طلبك</div>
                    </div>
                  </label>
                  <label className="flex items-center gap-3 border border-border rounded-xl p-3 cursor-not-allowed text-sm opacity-50">
                    <input type="radio" name="pay" className="sr-only" disabled />
                    <CreditCard className="w-5 h-5 text-brand" />
                    <div>
                      <div className="font-semibold text-foreground">بطاقة ائتمان (قريباً)</div>
                      <div className="text-xs text-muted-foreground">Visa · Mastercard · Apple Pay</div>
                    </div>
                  </label>
                </div>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="ملاحظات على الطلب (اختياري)"
                  className="mt-4 w-full min-h-[80px] rounded-xl border border-border bg-background/60 p-3 text-sm outline-none focus:border-brand text-foreground"
                />
              </section>
            </div>

            <aside className="bg-card border border-border rounded-2xl p-5 shadow-card h-fit lg:sticky lg:top-32">
              <h2 className="font-bold text-foreground">ملخص الطلب</h2>
              <div className="mt-3 space-y-2 text-sm">
                <Row label="المجموع الفرعي" value={format(subtotalBase)} />
                <Row label="الشحن" value={shippingBase === 0 ? "مجاني" : format(shippingBase)} />
                <div className="border-t border-border pt-3 mt-2 flex items-baseline justify-between">
                  <span className="text-base font-bold">الإجمالي</span>
                  <span className="text-2xl font-extrabold text-sale tabular-nums">{format(totalBase)}</span>
                </div>
              </div>
              <button
                onClick={placeOrder}
                disabled={submitting}
                className="mt-5 w-full h-12 rounded-xl bg-gradient-brand text-brand-foreground font-bold flex items-center justify-center gap-2 shadow-glow hover:opacity-90 transition-smooth disabled:opacity-50"
              >
                {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Lock className="w-4 h-4" />}
                تأكيد وإتمام الطلب
              </button>
              <Link to="/cart" className="mt-2 block text-center text-sm text-brand hover:underline">← العودة إلى السلة</Link>

              <div className="mt-5 pt-5 border-t border-border space-y-2 text-xs text-muted-foreground">
                <div className="flex items-center gap-2"><ShieldCheck className="w-4 h-4 text-brand" /> معاملاتك محمية ومشفّرة</div>
                <div className="flex items-center gap-2"><Truck className="w-4 h-4 text-brand" /> شحن سريع لجميع دول الخليج</div>
              </div>
            </aside>
          </div>
        )}
      </main>
      <SiteFooter />
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return <div className="flex justify-between"><span className="text-muted-foreground">{label}</span><span className="font-semibold text-foreground tabular-nums">{value}</span></div>;
}

function Input({ label, value, onChange, className = "" }: { label: string; value: string; onChange: (v: string) => void; className?: string }) {
  return (
    <div className={className}>
      <label className="text-xs font-medium text-muted-foreground">{label}</label>
      <input value={value} onChange={(e) => onChange(e.target.value)} className="mt-1 w-full h-10 rounded-xl border border-border px-3 text-sm bg-background/60 outline-none focus:border-brand text-foreground" />
    </div>
  );
}
