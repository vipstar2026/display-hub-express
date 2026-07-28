import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { useI18n } from "@/lib/i18n";
import { useCart } from "@/lib/cart";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { formatPrice } from "@/lib/format";
import { Trash2, ShoppingBag, Package, Upload, CheckCircle2, Landmark, Smartphone, Banknote, Wallet, CreditCard, Tag, X, Truck, MapPin } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";

export const Route = createFileRoute("/cart")({
  component: CartPage,
});

const ICONS: Record<string, typeof Landmark> = {
  landmark: Landmark, smartphone: Smartphone, banknote: Banknote, wallet: Wallet, "credit-card": CreditCard,
};

function CartPage() {
  const { t, lang } = useI18n();
  const { items, setQty, remove, subtotal, clear } = useCart();
  const nav = useNavigate();
  const [userId, setUserId] = useState<string | null>(null);
  const [placing, setPlacing] = useState(false);
  const [selectedMethod, setSelectedMethod] = useState<string | null>(null);
  const [proofFile, setProofFile] = useState<File | null>(null);
  const [reference, setReference] = useState("");
  const [customerNotes, setCustomerNotes] = useState("");
  const [selectedRate, setSelectedRate] = useState<string | null>(null);
  const [selectedAddress, setSelectedAddress] = useState<string | null>(null);
  const [manualAddress, setManualAddress] = useState({ full_name: "", phone: "", address_line: "", city: "", country: "Bahrain" });

  // Coupon state
  const [couponInput, setCouponInput] = useState("");
  const [applyingCoupon, setApplyingCoupon] = useState(false);
  const [coupon, setCoupon] = useState<{ id: string; code: string; discount: number } | null>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUserId(data.user?.id ?? null));
  }, []);

  const { data: methods } = useQuery({
    queryKey: ["payment-methods-active"],
    queryFn: async () => (await supabase.from("payment_methods_public").select("*").order("sort_order")).data ?? [],
  });

  const { data: shippingRates } = useQuery({
    queryKey: ["shipping-rates-public"],
    queryFn: async () => (await supabase.from("shipping_rates").select("*, shipping_zones(name_ar,name_en,name_ur)").eq("is_active", true).order("sort_order")).data ?? [],
  });

  const { data: addresses } = useQuery({
    queryKey: ["cart-addresses", userId],
    enabled: !!userId,
    queryFn: async () => (await supabase.from("addresses").select("*").eq("user_id", userId!).order("is_default", { ascending: false })).data ?? [],
  });

  // Auto-select default address on load
  useEffect(() => {
    if (!selectedAddress && addresses && addresses.length > 0) {
      const def = addresses.find((a) => a.is_default) ?? addresses[0];
      setSelectedAddress(def.id);
    }
  }, [addresses, selectedAddress]);

  const rate = useMemo(() => shippingRates?.find((r) => r.id === selectedRate) ?? null, [shippingRates, selectedRate]);
  const shippingCost = useMemo(() => {
    if (!rate) return 0;
    if (rate.free_over && subtotal >= Number(rate.free_over)) return 0;
    return Number(rate.price);
  }, [rate, subtotal]);

  const method = methods?.find((m) => m.id === selectedMethod) ?? null;
  const fee = method ? Number(method.fee_amount) + (subtotal * Number(method.fee_percent)) / 100 : 0;
  const discount = coupon?.discount ?? 0;
  const total = Math.max(0, subtotal + shippingCost + fee - discount);

  const nameOf = (m: { name_ar: string | null; name_en: string | null; name_ur: string | null }) =>
    (lang === "ar" ? m.name_ar : lang === "ur" ? (m.name_ur || m.name_en) : m.name_en) ?? "";
  const instrOf = (m: { instructions_ar: string | null; instructions_en: string | null; instructions_ur: string | null }) =>
    (lang === "ar" ? m.instructions_ar : lang === "ur" ? m.instructions_ur : m.instructions_en) ?? m.instructions_en ?? "";

  const applyCoupon = async () => {
    if (!couponInput.trim()) return;
    setApplyingCoupon(true);
    try {
      const { data, error } = await supabase.rpc("redeem_coupon", { _code: couponInput.trim(), _subtotal: subtotal });
      if (error || !data || (data as unknown[]).length === 0) throw new Error(t("cart.coupon_invalid"));
      const row = (data as { coupon_id: string; code: string; discount: number }[])[0];
      setCoupon({ id: row.coupon_id, code: row.code, discount: Number(row.discount) });
      toast.success(t("cart.coupon_applied"));
    } catch (e) {
      toast.error((e as Error).message || t("cart.coupon_invalid"));
    } finally {
      setApplyingCoupon(false);
    }
  };

  const handleCheckout = async () => {
    if (!userId) { nav({ to: "/auth" }); return; }
    if (items.length === 0) return;
    if (!method) { toast.error(t("cart.select_method_err")); return; }
    if (method.requires_proof && !proofFile) { toast.error(t("cart.upload_proof_err")); return; }

    setPlacing(true);
    try {
      let proofUrl: string | null = null;
      if (proofFile) {
        const ext = proofFile.name.split(".").pop() ?? "jpg";
        const path = `${userId}/${Date.now()}.${ext}`;
        const up = await supabase.storage.from("payment-proofs").upload(path, proofFile, { upsert: false });
        if (up.error) throw up.error;
        proofUrl = up.data.path;
      }

      // Resolve shipping address snapshot
      const addr = selectedAddress ? addresses?.find((a) => a.id === selectedAddress) : null;
      const shipping_address = addr
        ? { full_name: addr.full_name, phone: addr.phone, address_line: addr.address_line, city: addr.city, country: addr.country, postal_code: addr.postal_code }
        : (manualAddress.full_name || manualAddress.address_line
            ? manualAddress
            : null);

      const { data: user } = await supabase.auth.getUser();
      const { data: order, error } = await supabase.from("orders").insert({
        buyer_id: userId,
        buyer_email: user.user?.email ?? "",
        buyer_name: user.user?.user_metadata?.display_name ?? null,
        subtotal,
        discount,
        total,
        currency: "BHD",
        status: "pending",
        payment_status: "pending",
        payment_method_id: method.id,
        payment_proof_url: proofUrl,
        payment_reference: reference || null,
        customer_notes: customerNotes || null,
        coupon_id: coupon?.id ?? null,
        coupon_code: coupon?.code ?? null,
        shipping_rate_id: rate?.id ?? null,
        shipping_method: rate?.method ?? null,
        shipping_cost: shippingCost,
        address_id: selectedAddress,
        shipping_address: shipping_address as never,
      }).select().single();
      if (error) throw error;

      const { error: itemsError } = await supabase.from("order_items").insert(
        items.map((i) => ({
          order_id: order.id,
          product_id: i.product_id,
          product_name: i.name,
          product_type: i.type,
          unit_price: i.price,
          quantity: i.quantity,
          total: i.price * i.quantity,
        }))
      );
      if (itemsError) throw itemsError;

      if (coupon) {
        await supabase.rpc("finalize_coupon_use", { _coupon_id: coupon.id, _order_id: order.id, _discount: discount });
      }

      clear();

      // Online gateway (AFS) → go to hosted card payment page
      if (method.is_gateway && (method.gateway_provider === "afs" || method.code === "afs")) {
        nav({ to: "/pay/$id", params: { id: order.id } });
        return;
      }

      toast.success(t("cart.order_placed"));
      nav({ to: "/order/success/$id", params: { id: order.id } });

    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setPlacing(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="container mx-auto px-4 py-8">
        <h1 className="mb-6 font-display text-3xl font-bold">{t("nav.cart")}</h1>

        {items.length === 0 ? (
          <div className="rounded-xl border border-primary/10 bg-card p-12 text-center">
            <ShoppingBag className="mx-auto mb-4 h-16 w-16 text-primary/30" />
            <p className="text-muted-foreground">{t("shop.emptyCart")}</p>
            <Link to="/shop"><Button className="mt-4 bg-primary text-background hover:bg-primary">{t("shop.continueShopping")}</Button></Link>
          </div>
        ) : (
          <div className="grid gap-6 lg:grid-cols-3">
            <div className="space-y-6 lg:col-span-2">
              {/* Items */}
              <div className="space-y-3">
                {items.map((i) => (
                  <div key={i.product_id} className="flex gap-3 rounded-xl border border-primary/10 bg-card p-3">
                    <div className="h-20 w-20 shrink-0 overflow-hidden rounded-md bg-background/50">
                      {i.image ? <img src={i.image} alt={i.name} className="h-full w-full object-cover" /> : <div className="flex h-full items-center justify-center"><Package className="h-8 w-8 text-primary/30" /></div>}
                    </div>
                    <div className="flex flex-1 flex-col">
                      <Link to="/product/$slug" params={{ slug: i.slug }} className="font-medium hover:text-primary">{i.name}</Link>
                      <div className="mt-1 font-mono text-primary">{formatPrice(i.price)}</div>
                      <div className="mt-auto flex items-center gap-2">
                        <div className="flex items-center rounded-md border border-primary/20">
                          <button onClick={() => setQty(i.product_id, i.quantity - 1)} className="px-2 py-1 hover:bg-primary/10">−</button>
                          <span className="w-8 text-center text-sm">{i.quantity}</span>
                          <button onClick={() => setQty(i.product_id, i.quantity + 1)} className="px-2 py-1 hover:bg-primary/10">+</button>
                        </div>
                        <button onClick={() => remove(i.product_id)} className="ms-auto text-muted-foreground hover:text-destructive">
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Coupon */}
              <div className="rounded-xl border border-primary/20 bg-card p-5">
                <h2 className="mb-3 flex items-center gap-2 font-display text-lg font-bold"><Tag className="h-4 w-4 text-primary" />{t("cart.coupon")}</h2>
                {coupon ? (
                  <div className="flex items-center gap-3 rounded-lg border border-primary/40 bg-primary/10 px-3 py-2">
                    <CheckCircle2 className="h-4 w-4 text-primary" />
                    <span className="font-mono font-bold text-primary">{coupon.code}</span>
                    <span className="text-sm text-muted-foreground">−{formatPrice(coupon.discount)}</span>
                    <button onClick={() => { setCoupon(null); setCouponInput(""); }} className="ms-auto text-muted-foreground hover:text-destructive"><X className="h-4 w-4" /></button>
                  </div>
                ) : (
                  <div className="flex gap-2">
                    <Input value={couponInput} onChange={(e) => setCouponInput(e.target.value.toUpperCase())} placeholder={t("cart.coupon_placeholder")} />
                    <Button onClick={applyCoupon} disabled={applyingCoupon || !couponInput.trim()} className="bg-primary text-background hover:bg-primary">{t("cart.apply")}</Button>
                  </div>
                )}
              </div>

              {/* Shipping Address */}
              <div className="rounded-xl border border-primary/20 bg-card p-5">
                <div className="mb-3 flex items-center justify-between gap-2">
                  <h2 className="flex items-center gap-2 font-display text-lg font-bold"><MapPin className="h-4 w-4 text-primary" />{t("cart.saved_address")}</h2>
                  <Link to="/account/addresses" className="text-xs text-primary hover:underline">{t("cart.manage_addresses")}</Link>
                </div>
                {(addresses ?? []).length > 0 ? (
                  <div className="grid gap-2 sm:grid-cols-2">
                    {(addresses ?? []).map((a) => {
                      const active = a.id === selectedAddress;
                      return (
                        <button
                          key={a.id}
                          type="button"
                          onClick={() => setSelectedAddress(a.id)}
                          className={`rounded-lg border p-3 text-start text-sm transition-all ${active ? "border-primary bg-primary/10" : "border-primary/20 hover:border-primary/50"}`}
                        >
                          <div className="flex items-center gap-2">
                            <span className="font-medium">{a.full_name}</span>
                            {a.is_default && <span className="rounded-full bg-primary/15 px-1.5 py-0 text-[10px] text-primary">{t("addresses.default")}</span>}
                            {active && <CheckCircle2 className="ms-auto h-3.5 w-3.5 text-primary" />}
                          </div>
                          <div className="mt-1 text-xs text-muted-foreground">{a.phone}</div>
                          <div className="text-xs text-muted-foreground">{a.address_line}, {a.city}</div>
                        </button>
                      );
                    })}
                  </div>
                ) : (
                  <div className="grid gap-2 sm:grid-cols-2">
                    <Input placeholder={t("addresses.full_name")} value={manualAddress.full_name} onChange={(e) => setManualAddress({ ...manualAddress, full_name: e.target.value })} />
                    <Input placeholder={t("addresses.phone")} value={manualAddress.phone} onChange={(e) => setManualAddress({ ...manualAddress, phone: e.target.value })} />
                    <Input className="sm:col-span-2" placeholder={t("addresses.address_line")} value={manualAddress.address_line} onChange={(e) => setManualAddress({ ...manualAddress, address_line: e.target.value })} />
                    <Input placeholder={t("addresses.city")} value={manualAddress.city} onChange={(e) => setManualAddress({ ...manualAddress, city: e.target.value })} />
                    <Input placeholder={t("addresses.country")} value={manualAddress.country} onChange={(e) => setManualAddress({ ...manualAddress, country: e.target.value })} />
                  </div>
                )}
              </div>

              {/* Shipping methods */}
              <div className="rounded-xl border border-primary/20 bg-card p-5">
                <h2 className="mb-3 flex items-center gap-2 font-display text-lg font-bold"><Truck className="h-4 w-4 text-primary" />{t("cart.select_shipping")}</h2>
                {(shippingRates ?? []).length === 0 ? (
                  <p className="text-sm text-muted-foreground">{t("cart.no_shipping")}</p>
                ) : (
                  <div className="grid gap-2 sm:grid-cols-2">
                    {(shippingRates ?? []).map((r) => {
                      const active = r.id === selectedRate;
                      const isFree = r.free_over && subtotal >= Number(r.free_over);
                      const rname = lang === "ar" ? r.name_ar : lang === "ur" ? (r.name_ur || r.name_en) : r.name_en;
                      return (
                        <button
                          key={r.id}
                          type="button"
                          onClick={() => setSelectedRate(r.id)}
                          className={`flex items-center gap-3 rounded-lg border p-3 text-start transition-all ${active ? "border-primary bg-primary/10 shadow-lg shadow-primary/10" : "border-primary/20 hover:border-primary/50"}`}
                        >
                          <div className={`grid h-9 w-9 place-items-center rounded-md ${active ? "bg-primary text-background" : "bg-primary/10 text-primary"}`}>
                            <Truck className="h-4 w-4" />
                          </div>
                          <div className="flex-1">
                            <div className="text-sm font-medium">{rname}</div>
                            <div className="text-[11px] text-muted-foreground">{r.min_delivery_days}-{r.max_delivery_days} {t("shipping.days")}</div>
                          </div>
                          <div className="font-mono text-sm font-bold text-primary">
                            {isFree ? t("cart.shipping_free") : formatPrice(Number(r.price))}
                          </div>
                          {active && <CheckCircle2 className="h-4 w-4 text-primary" />}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

              <div className="rounded-xl border border-primary/20 bg-card p-5">
                <h2 className="mb-3 font-display text-lg font-bold">{t("cart.payment_method")}</h2>
                {(methods ?? []).length === 0 && (
                  <p className="text-sm text-muted-foreground">{t("cart.no_methods")}</p>
                )}
                <div className="grid gap-2 sm:grid-cols-2">
                  {(methods ?? []).map((m) => {
                    const Icon = ICONS[m.icon ?? ""] ?? CreditCard;
                    const active = m.id === selectedMethod;
                    return (
                      <button
                        key={m.id}
                        type="button"
                        onClick={() => setSelectedMethod(m.id)}
                        className={`flex items-center gap-3 rounded-lg border p-3 text-start transition-all ${
                          active ? "border-primary bg-primary/10 shadow-lg shadow-primary/10" : "border-primary/20 hover:border-primary/50"
                        }`}
                      >
                        <div className={`grid h-9 w-9 place-items-center rounded-md ${active ? "bg-primary text-background" : "bg-primary/10 text-primary"}`}>
                          <Icon className="h-4 w-4" />
                        </div>
                        <div className="flex-1">
                          <div className="text-sm font-medium">{nameOf(m)}</div>
                          {Number(m.fee_amount) > 0 || Number(m.fee_percent) > 0 ? (
                            <div className="text-[11px] text-muted-foreground">
                              +{formatPrice(Number(m.fee_amount) + (subtotal * Number(m.fee_percent)) / 100)}
                            </div>
                          ) : null}
                        </div>
                        {active && <CheckCircle2 className="h-4 w-4 text-primary" />}
                      </button>
                    );
                  })}
                </div>

                {method && (
                  <div className="mt-4 space-y-3 rounded-lg border border-primary/20 bg-background/50 p-4">
                    {instrOf(method) && <p className="text-sm text-muted-foreground whitespace-pre-line">{instrOf(method)}</p>}
                    {Object.keys((method.account_details ?? {}) as Record<string, unknown>).length > 0 && (
                      <div className="space-y-1.5">
                        {Object.entries((method.account_details ?? {}) as Record<string, unknown>).map(([k, v]) => (
                          <div key={k} className="flex items-center justify-between gap-2 rounded bg-card/50 px-3 py-1.5 text-xs">
                            <span className="text-muted-foreground">{k}</span>
                            <span className="font-mono">{String(v)}</span>
                          </div>
                        ))}
                      </div>
                    )}
                    <div className="grid gap-3 pt-2">
                      <div>
                        <Label className="text-xs">{t("cart.reference")}</Label>
                        <Input value={reference} onChange={(e) => setReference(e.target.value)} placeholder="TXN123..." />
                      </div>
                      {method.requires_proof && (
                        <div>
                          <Label className="text-xs">{t("cart.proof")}</Label>
                          <label className="mt-1 flex cursor-pointer items-center gap-2 rounded-md border border-dashed border-primary/40 bg-card/50 p-3 text-sm hover:bg-primary/5">
                            <Upload className="h-4 w-4 text-primary" />
                            <span className="flex-1 truncate">
                              {proofFile ? proofFile.name : t("cart.choose_image")}
                            </span>
                            <input type="file" accept="image/*" className="hidden" onChange={(e) => setProofFile(e.target.files?.[0] ?? null)} />
                          </label>
                        </div>
                      )}
                      <div>
                        <Label className="text-xs">{t("cart.notes")}</Label>
                        <Textarea rows={2} value={customerNotes} onChange={(e) => setCustomerNotes(e.target.value)} />
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Summary */}
            <div className="h-fit rounded-xl border border-primary/20 bg-card p-6">
              <div className="flex justify-between py-2"><span>{t("shop.subtotal")}</span><span className="font-mono">{formatPrice(subtotal)}</span></div>
              {rate && (
                <div className="flex justify-between py-2 text-sm text-muted-foreground">
                  <span className="flex items-center gap-1"><Truck className="h-3.5 w-3.5" />{t("cart.select_shipping")}</span>
                  <span className="font-mono">{shippingCost === 0 ? t("cart.shipping_free") : formatPrice(shippingCost)}</span>
                </div>
              )}
              {fee > 0 && (
                <div className="flex justify-between py-2 text-sm text-muted-foreground">
                  <span>{t("cart.payment_fee")}</span>
                  <span className="font-mono">{formatPrice(fee)}</span>
                </div>
              )}
              {discount > 0 && (
                <div className="flex justify-between py-2 text-sm text-primary">
                  <span>{t("cart.discount")}</span>
                  <span className="font-mono">−{formatPrice(discount)}</span>
                </div>
              )}
              <div className="my-3 border-t border-primary/20" />
              <div className="flex justify-between py-2 text-lg font-bold"><span>{t("shop.total")}</span><span className="font-mono text-primary">{formatPrice(total)}</span></div>
              <Button onClick={handleCheckout} disabled={placing || !method} className="mt-4 w-full bg-primary text-background hover:bg-primary">
                {placing ? "..." : t("shop.checkout")}
              </Button>
              {!method && <p className="mt-2 text-center text-xs text-muted-foreground">{t("cart.select_method")}</p>}
            </div>
          </div>
        )}
      </div>
      <Footer />
    </div>
  );
}
