import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { PageShell } from "@/components/PageShell";
import { useCart } from "@/lib/cart";
import { getProduct } from "@/lib/products";
import { useCurrency, type CurrencyCode } from "@/lib/currency";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  Minus, Plus, Trash2, ShoppingBag, ShoppingCart, ArrowRight,
  Tag, Truck, ShieldCheck, Loader2, Lock, Package,
} from "lucide-react";

export const Route = createFileRoute("/cart")({
  head: () => ({ meta: [{ title: "سلة التسوق | VIP STAR" }] }),
  component: CartPage,
});

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

type Row = {
  id: string;
  qty: number;
  title: string;
  brand?: string;
  image?: string;
  unit: number;           // selling price in product currency
  oldUnit?: number;       // original price if on sale
  currency?: CurrencyCode; // undefined => assume base currency
  stock: number;
  source: "db" | "demo";
};

function CartPage() {
  const { items, setQty, remove, clear } = useCart();
  const { format, toBase } = useCurrency();
  const { user } = useAuth();
  const nav = useNavigate();

  const [dbRows, setDbRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(false);
  const [coupon, setCoupon] = useState("");
  const [discount, setDiscount] = useState(0); // %

  const uuidIds = useMemo(
    () => items.map((i) => i.id).filter((id) => UUID_RE.test(id)),
    [items],
  );

  useEffect(() => {
    let cancel = false;
    (async () => {
      if (uuidIds.length === 0) { setDbRows([]); return; }
      setLoading(true);
      const { data } = await supabase
        .from("products")
        .select("id, title, brand, price, sale_price, currency, stock, product_images(url, sort_order)")
        .in("id", uuidIds);
      if (cancel) return;
      const rows: Row[] = (data ?? []).map((p: any) => {
        const imgs = (p.product_images ?? []).slice().sort((a: any, b: any) => a.sort_order - b.sort_order);
        const it = items.find((x) => x.id === p.id);
        return {
          id: p.id,
          qty: it?.qty ?? 1,
          title: p.title,
          brand: p.brand ?? undefined,
          image: imgs[0]?.url,
          unit: Number(p.sale_price ?? p.price),
          oldUnit: p.sale_price ? Number(p.price) : undefined,
          currency: (p.currency as CurrencyCode) ?? undefined,
          stock: p.stock ?? 0,
          source: "db",
        };
      });
      setDbRows(rows);
      setLoading(false);
    })();
    return () => { cancel = true; };
  }, [uuidIds.join(","), items]);

  const demoRows: Row[] = useMemo(() => {
    return items
      .filter((it) => !UUID_RE.test(it.id))
      .map((it) => {
        const p = getProduct(it.id);
        if (!p) return null;
        return {
          id: it.id, qty: it.qty, title: p.name, brand: p.brand, image: p.image,
          unit: p.price, oldUnit: p.oldPrice, currency: "QAR", stock: p.stock, source: "demo",
        } as Row;
      })
      .filter(Boolean) as Row[];
  }, [items]);

  const rows: Row[] = useMemo(() => [...dbRows, ...demoRows], [dbRows, demoRows]);

  // Everything stored/summed in BASE currency (BHD), then formatted to user's currency.
  const subtotalBase = rows.reduce((s, r) => s + toBase(r.unit, r.currency) * r.qty, 0);
  const savingsBase = rows.reduce(
    (s, r) => s + (r.oldUnit ? (toBase(r.oldUnit, r.currency) - toBase(r.unit, r.currency)) * r.qty : 0),
    0,
  );
  // Free shipping threshold ~200 QAR expressed in BHD via toBase
  const freeShipBase = toBase(200, "QAR");
  const shippingBase = subtotalBase === 0 || subtotalBase >= freeShipBase ? 0 : toBase(20, "QAR");
  const discountBase = (subtotalBase * discount) / 100;
  const totalBase = Math.max(0, subtotalBase - discountBase + shippingBase);
  const remainingToFreeShip = Math.max(0, freeShipBase - subtotalBase);

  function applyCoupon() {
    const c = coupon.trim().toUpperCase();
    if (!c) return;
    const map: Record<string, number> = { WELCOME10: 10, VIP15: 15, STAR20: 20 };
    if (map[c]) { setDiscount(map[c]); toast.success(`تم تطبيق خصم ${map[c]}%`); }
    else { setDiscount(0); toast.error("كود الخصم غير صالح"); }
  }

  function proceedCheckout() {
    if (rows.length === 0) return;
    if (!user) {
      toast.message("سجل الدخول لإكمال الشراء");
      nav({ to: "/login" });
      return;
    }
    nav({ to: "/checkout" });
  }

  if (!loading && rows.length === 0) {
    return (
      <PageShell>
        <section dir="rtl" className="mx-auto max-w-3xl px-4 py-20 text-center">
          <div className="w-24 h-24 mx-auto rounded-full bg-gradient-brand grid place-items-center shadow-glow">
            <ShoppingBag className="w-12 h-12 text-brand-foreground" />
          </div>
          <h1 className="mt-6 text-3xl font-bold text-foreground">سلتك فارغة</h1>
          <p className="mt-2 text-muted-foreground">ابدأ التسوق واكتشف أحدث عروضنا على IPTV والأقمار وأنظمة المراقبة.</p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Link to="/" className="px-6 py-3 rounded-xl bg-gradient-brand text-brand-foreground font-semibold shadow-glow hover:opacity-90 transition-smooth">
              تسوّق الآن
            </Link>
            <Link to="/wishlist" className="px-6 py-3 rounded-xl border border-border text-foreground hover:bg-card transition-smooth">
              المفضلة
            </Link>
          </div>
        </section>
      </PageShell>
    );
  }

  return (
    <PageShell>
      <section dir="rtl" className="mx-auto max-w-7xl px-4 py-6 md:py-10">
        <div className="flex items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-foreground flex items-center gap-2">
              <ShoppingCart className="w-6 h-6 text-brand" /> سلة التسوق
            </h1>
            <p className="text-sm text-muted-foreground mt-1">{rows.length} منتج · جاهز للشراء</p>
          </div>
          {rows.length > 0 && (
            <button
              onClick={() => { clear(); toast.success("تم تفريغ السلة"); }}
              className="text-xs text-muted-foreground hover:text-sale flex items-center gap-1 transition-smooth"
            >
              <Trash2 className="w-3.5 h-3.5" /> تفريغ السلة
            </button>
          )}
        </div>

        {subtotalBase > 0 && shippingBase > 0 && (
          <div className="mb-6 rounded-2xl border border-border bg-card p-4 shadow-card">
            <div className="flex items-center gap-2 text-sm text-foreground flex-wrap">
              <Truck className="w-4 h-4 text-brand shrink-0" />
              أضف <span className="font-bold text-brand">{format(remainingToFreeShip)}</span>
              <span className="opacity-70">للحصول على شحن مجاني</span>
            </div>
            <div className="mt-3 h-2 rounded-full bg-secondary overflow-hidden">
              <div
                className="h-full bg-gradient-brand transition-smooth"
                style={{ width: `${Math.min(100, (subtotalBase / freeShipBase) * 100)}%` }}
              />
            </div>
          </div>
        )}
        {subtotalBase > 0 && shippingBase === 0 && (
          <div className="mb-6 rounded-2xl border border-brand/40 bg-brand/10 p-4 flex items-center gap-2 text-sm text-foreground">
            <Truck className="w-4 h-4 text-brand" />
            <span className="font-semibold text-brand">رائع!</span> حصلت على شحن مجاني لهذا الطلب.
          </div>
        )}

        <div className="grid gap-6 lg:grid-cols-[1fr_380px]">
          <div className="space-y-4">
            {loading && (
              <div className="grid place-items-center py-10 rounded-2xl bg-card border border-border">
                <Loader2 className="w-6 h-6 animate-spin text-brand" />
              </div>
            )}

            {rows.map((r) => (
              <div
                key={r.id}
                className="bg-card rounded-2xl border border-border shadow-card p-4 md:p-5 flex gap-4 transition-smooth hover:shadow-hover"
              >
                <Link
                  to="/product/$id"
                  params={{ id: r.id }}
                  className="w-24 h-24 md:w-28 md:h-28 shrink-0 rounded-xl bg-secondary overflow-hidden"
                >
                  {r.image ? (
                    <img src={r.image} alt={r.title} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full grid place-items-center text-muted-foreground"><Package className="w-6 h-6" /></div>
                  )}
                </Link>

                <div className="flex-1 min-w-0 flex flex-col">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <Link
                        to="/product/$id"
                        params={{ id: r.id }}
                        className="text-sm md:text-base font-semibold text-foreground hover:text-brand line-clamp-2"
                      >
                        {r.title}
                      </Link>
                      <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground flex-wrap">
                        {r.brand && <span>{r.brand}</span>}
                        {r.source === "demo" && (
                          <span className="px-1.5 py-0.5 rounded bg-accent text-accent-foreground text-[10px]">عرض تجريبي</span>
                        )}
                        {r.stock > 0 && r.stock <= 5 && (
                          <span className="px-1.5 py-0.5 rounded bg-sale/15 text-sale text-[10px] font-semibold">
                            متبقي {r.stock} فقط
                          </span>
                        )}
                        {r.stock === 0 && (
                          <span className="px-1.5 py-0.5 rounded bg-destructive/15 text-destructive text-[10px] font-semibold">
                            غير متوفر
                          </span>
                        )}
                      </div>
                    </div>
                    <button
                      onClick={() => remove(r.id)}
                      aria-label="حذف"
                      className="text-muted-foreground hover:text-sale shrink-0 p-1 rounded-md hover:bg-accent transition-smooth"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="mt-auto pt-3 flex items-end justify-between flex-wrap gap-3">
                    <div className="flex items-center border border-border rounded-xl overflow-hidden bg-background/50">
                      <button
                        onClick={() => setQty(r.id, r.qty - 1)}
                        className="w-9 h-9 grid place-items-center hover:bg-accent transition-smooth"
                        aria-label="-"
                      >
                        <Minus className="w-3.5 h-3.5" />
                      </button>
                      <span className="w-10 text-center text-sm font-bold tabular-nums">{r.qty}</span>
                      <button
                        onClick={() => {
                          if (r.stock > 0 && r.qty + 1 > r.stock) { toast.error("لقد بلغت الحد الأقصى للمخزون"); return; }
                          setQty(r.id, r.qty + 1);
                        }}
                        className="w-9 h-9 grid place-items-center hover:bg-accent transition-smooth"
                        aria-label="+"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <div className="text-end">
                      <div className="text-lg font-extrabold text-sale">
                        {format(r.unit * r.qty, r.currency)}
                      </div>
                      <div className="text-xs text-muted-foreground flex items-baseline gap-1 justify-end flex-wrap">
                        <span>{format(r.unit, r.currency)} × {r.qty}</span>
                        {r.oldUnit && (
                          <span className="line-through opacity-60">{format(r.oldUnit, r.currency)}</span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}

            <Link to="/" className="inline-flex items-center gap-2 text-sm text-brand hover:underline mt-2">
              <ArrowRight className="w-4 h-4 rotate-180" /> متابعة التسوق
            </Link>
          </div>

          <aside className="lg:sticky lg:top-32 h-fit space-y-4">
            <div className="bg-card rounded-2xl border border-border shadow-card p-5">
              <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
                <Tag className="w-4 h-4 text-brand" /> كود الخصم
              </h3>
              <div className="mt-3 flex gap-2">
                <input
                  value={coupon}
                  onChange={(e) => setCoupon(e.target.value)}
                  placeholder="مثال: WELCOME10"
                  className="flex-1 h-10 rounded-xl border border-border bg-background/60 px-3 text-sm outline-none focus:border-brand text-foreground"
                />
                <button
                  onClick={applyCoupon}
                  className="px-4 h-10 rounded-xl bg-accent text-accent-foreground font-semibold text-sm hover:bg-accent/80 transition-smooth"
                >
                  تطبيق
                </button>
              </div>
              {discount > 0 && <p className="mt-2 text-xs text-emerald-400">تم تطبيق خصم {discount}%</p>}
              <p className="mt-2 text-[11px] text-muted-foreground">جرّب: WELCOME10 · VIP15 · STAR20</p>
            </div>

            <div className="bg-card rounded-2xl border border-border shadow-card p-5">
              <h2 className="text-base font-bold text-foreground">ملخص الطلب</h2>
              <div className="mt-4 space-y-2.5 text-sm">
                <Row label="المجموع الفرعي" value={format(subtotalBase)} />
                {savingsBase > 0 && (
                  <Row label="توفير العروض" value={`- ${format(savingsBase)}`} positive />
                )}
                {discount > 0 && (
                  <Row label={`الكوبون (${discount}%)`} value={`- ${format(discountBase)}`} positive />
                )}
                <Row label="الشحن" value={shippingBase === 0 ? "مجاني" : format(shippingBase)} />
                <div className="border-t border-border pt-3 mt-3 flex items-baseline justify-between">
                  <span className="text-base font-bold">الإجمالي</span>
                  <span className="text-2xl font-extrabold text-sale tabular-nums">{format(totalBase)}</span>
                </div>
              </div>

              <button
                onClick={proceedCheckout}
                disabled={rows.length === 0}
                className="mt-5 w-full h-12 rounded-xl bg-gradient-brand text-brand-foreground font-bold flex items-center justify-center gap-2 shadow-glow hover:opacity-90 transition-smooth disabled:opacity-50"
              >
                <Lock className="w-4 h-4" />
                {user ? "إتمام الشراء بأمان" : "سجل الدخول وتابع"}
              </button>

              <div className="mt-5 pt-5 border-t border-border space-y-2.5 text-xs text-muted-foreground">
                <div className="flex items-center gap-2"><ShieldCheck className="w-4 h-4 text-brand" /> دفع آمن ومشفّر</div>
                <div className="flex items-center gap-2"><Truck className="w-4 h-4 text-brand" /> شحن سريع لجميع دول الخليج</div>
                <div className="flex items-center gap-2"><Package className="w-4 h-4 text-brand" /> سياسة إرجاع 7 أيام</div>
              </div>
            </div>
          </aside>
        </div>
      </section>
    </PageShell>
  );
}

function Row({ label, value, positive = false }: { label: string; value: string; positive?: boolean }) {
  return (
    <div className="flex justify-between items-baseline">
      <span className="text-muted-foreground">{label}</span>
      <span className={`font-semibold tabular-nums ${positive ? "text-emerald-400" : "text-foreground"}`}>{value}</span>
    </div>
  );
}
