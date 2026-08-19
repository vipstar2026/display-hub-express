import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { useI18n, localizedName } from "@/lib/i18n";
import { useCart } from "@/lib/cart";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { formatPrice } from "@/lib/format";
import { Trash2, ShoppingBag, Package, Upload, CheckCircle2, Landmark, Smartphone, Banknote, Wallet, CreditCard, Tag, X, Truck, MapPin, Store, Zap, UserRound, LogIn, AlertTriangle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useEffect, useMemo, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { useSiteSettings } from "@/lib/site-settings";
import { placeGuestOrder } from "@/lib/guest-checkout.functions";
import { analytics } from "@/lib/analytics";


export const Route = createFileRoute("/cart")({
  component: CartPage,
});

const ICONS: Record<string, typeof Landmark> = {
  landmark: Landmark, smartphone: Smartphone, banknote: Banknote, wallet: Wallet, "credit-card": CreditCard,
};

type Lang = "ar" | "en" | "ur" | "bn";
const TX = {
  fulfillment: { ar: "طريقة الاستلام", en: "Fulfillment method", ur: "وصولی کا طریقہ", bn: "ডেলিভারি পদ্ধতি" },
  delivery: { ar: "توصيل إلى العنوان", en: "Delivery to address", ur: "پتے پر ڈیلیوری", bn: "ঠিকানায় ডেলিভারি" },
  pickup: { ar: "استلام من المحل", en: "Pickup from store", ur: "دکان سے وصولی", bn: "দোকান থেকে সংগ্রহ" },
  pickup_free: { ar: "مجاني", en: "Free", ur: "مفت", bn: "ফ্রি" },
  digital_title: { ar: "منتجات رقمية — تسليم فوري", en: "Digital products — instant delivery", ur: "ڈیجیٹل مصنوعات — فوری ترسیل", bn: "ডিজিটাল পণ্য — তাৎক্ষণিক ডেলিভারি" },
  digital_desc: {
    ar: "لا يوجد شحن للمنتجات الرقمية. تُرسل الأكواد/الاشتراكات إلى بريدك الإلكتروني وتظهر في صفحة الطلب فور تأكيد الدفع.",
    en: "No shipping for digital items. Codes/subscriptions are emailed to you and shown on the order page as soon as payment is confirmed.",
    ur: "ڈیجیٹل اشیاء کے لیے شپنگ نہیں۔ ادائیگی کی تصدیق پر کوڈ ای میل کیے جاتے ہیں۔",
    bn: "ডিজিটাল আইটেমে শিপিং নেই। পেমেন্ট নিশ্চিত হলে কোড ইমেইলে পাঠানো হয়।",
  },
  physical_title: { ar: "منتجات تحتاج شحن أو استلام", en: "Items requiring delivery or pickup", ur: "ڈیلیوری یا پک اپ درکار", bn: "ডেলিভারি বা পিকআপ প্রয়োজন" },
  digital_badge: { ar: "رقمي", en: "Digital", ur: "ڈیجیٹل", bn: "ডিজিটাল" },
  physical_badge: { ar: "شحن", en: "Shipped", ur: "شپنگ", bn: "শিপিং" },
  address_required: { ar: "أدخل عنوان التوصيل", en: "Enter a delivery address", ur: "ڈیلیوری پتہ درج کریں", bn: "ডেলিভারি ঠিকানা দিন" },
  shipping_required: { ar: "اختر خدمة الشحن", en: "Select a shipping method", ur: "شپنگ سروس منتخب کریں", bn: "শিপিং পদ্ধতি নির্বাচন করুন" },
  pickup_note: { ar: "سنتواصل معك عند جهوز الطلب للاستلام من المحل.", en: "We will contact you when your order is ready for pickup at the store.", ur: "آرڈر تیار ہونے پر رابطہ کریں گے۔", bn: "অর্ডার প্রস্তুত হলে আমরা যোগাযোগ করব।" },
  order_summary: { ar: "ملخص الطلب", en: "Order summary", ur: "آرڈر کا خلاصہ", bn: "অর্ডার সারাংশ" },
  guest_title: { ar: "بيانات التواصل", en: "Contact details", ur: "رابطہ کی تفصیلات", bn: "যোগাযোগের তথ্য" },
  guest_desc: {
    ar: "أكمل الطلب كضيف — سنرسل تأكيد الطلب والأكواد الرقمية إلى بريدك الإلكتروني.",
    en: "Check out as a guest — we will email your order confirmation and any digital codes.",
    ur: "بطور مہمان خریداری — تصدیق اور کوڈز ای میل کیے جائیں گے۔",
    bn: "গেস্ট হিসেবে অর্ডার করুন — নিশ্চিতকরণ ও কোড ইমেইলে পাঠানো হবে।",
  },
  guest_email: { ar: "البريد الإلكتروني", en: "Email address", ur: "ای میل", bn: "ইমেইল" },
  guest_name: { ar: "الاسم", en: "Full name", ur: "نام", bn: "নাম" },
  guest_phone: { ar: "رقم الهاتف", en: "Phone number", ur: "فون نمبر", bn: "ফোন নম্বর" },
  guest_invalid_email: { ar: "أدخل بريداً إلكترونياً صحيحاً", en: "Enter a valid email address", ur: "درست ای میل درج کریں", bn: "সঠিক ইমেইল দিন" },
  have_account: { ar: "لديك حساب؟ سجّل الدخول", en: "Have an account? Sign in", ur: "اکاؤنٹ ہے؟ سائن ان", bn: "অ্যাকাউন্ট আছে? সাইন ইন" },
  guest_disabled: { ar: "يجب تسجيل الدخول لإتمام الطلب.", en: "Please sign in to complete your order.", ur: "آرڈر مکمل کرنے کے لیے سائن ان کریں۔", bn: "অর্ডার সম্পূর্ণ করতে সাইন ইন করুন।" },
  sign_in: { ar: "تسجيل الدخول", en: "Sign in", ur: "سائن ان", bn: "সাইন ইন" },
  proof_needs_account: { ar: "طريقة الدفع هذه تتطلب تسجيل الدخول لرفع إثبات الدفع.", en: "This payment method requires signing in to upload proof of payment.", ur: "اس طریقے کے لیے سائن ان ضروری ہے۔", bn: "এই পদ্ধতির জন্য সাইন ইন প্রয়োজন।" },
  digital_out: { ar: "نفدت الأكواد المتاحة لهذا المنتج حالياً", en: "This digital product is currently out of stock", ur: "اس ڈیجیٹل پروڈکٹ کا اسٹاک ختم ہے", bn: "এই ডিজিটাল পণ্যের স্টক শেষ" },
} as const;


function CartPage() {
  const { t, lang } = useI18n();
  const L = (k: keyof typeof TX) => TX[k][(lang as Lang) in TX[k] ? (lang as Lang) : "en"];
  const { items, setQty, remove, subtotal, clear } = useCart();
  const nav = useNavigate();
  const { data: settings } = useSiteSettings();
  const [userId, setUserId] = useState<string | null>(null);
  const [placing, setPlacing] = useState(false);
  const [selectedMethod, setSelectedMethod] = useState<string | null>(null);
  const [proofFile, setProofFile] = useState<File | null>(null);
  const [reference, setReference] = useState("");
  const [customerNotes, setCustomerNotes] = useState("");
  const [selectedRate, setSelectedRate] = useState<string | null>(null);
  const [selectedAddress, setSelectedAddress] = useState<string | null>(null);
  const [fulfillment, setFulfillment] = useState<"delivery" | "pickup">("delivery");
  const [manualAddress, setManualAddress] = useState({ full_name: "", phone: "", address_line: "", city: "", country: "Bahrain" });
  const [guest, setGuest] = useState({ email: "", name: "", phone: "" });
  const [authReady, setAuthReady] = useState(false);
  const idemRef = useRef<string | null>(null);
  const checkoutTracked = useRef(false);

  // Coupon state
  const [couponInput, setCouponInput] = useState("");
  const [applyingCoupon, setApplyingCoupon] = useState(false);
  const [coupon, setCoupon] = useState<{ id: string; code: string; discount: number } | null>(null);

  const physicalItems = items.filter((i) => i.type === "physical");
  const digitalItems = items.filter((i) => i.type !== "physical");
  const needsFulfillment = physicalItems.length > 0;
  const guestAllowed = settings?.allow_guest_checkout !== false;
  const isGuest = authReady && !userId;

  const placeGuest = useServerFn(placeGuestOrder);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setUserId(data.user?.id ?? null);
      setAuthReady(true);
    });
  }, []);

  // Analytics: begin_checkout once per cart view
  useEffect(() => {
    if (items.length === 0 || checkoutTracked.current) return;
    checkoutTracked.current = true;
    analytics.beginCheckout(
      items.map((i) => ({ id: i.product_id, name: i.name, price: i.price, quantity: i.quantity })),
      settings?.default_currency || "BHD"
    );
  }, [items, settings?.default_currency]);

  // Availability of digital codes (prevents selling what we cannot deliver)
  const { data: digitalStock } = useQuery({
    queryKey: ["digital-stock", digitalItems.map((i) => i.product_id).sort().join(",")],
    enabled: digitalItems.length > 0,
    queryFn: async () => {
      const out: Record<string, number> = {};
      for (const i of digitalItems) {
        const { data } = await supabase.rpc("digital_stock_available", { _product_id: i.product_id });
        out[i.product_id] = Number(data ?? 0);
      }
      return out;
    },
  });

  const digitalShortage = useMemo(
    () => digitalItems.filter((i) => digitalStock && (digitalStock[i.product_id] ?? 0) < i.quantity),
    [digitalItems, digitalStock]
  );


  const { data: methods } = useQuery({
    queryKey: ["payment-methods-active"],
    queryFn: async () => (await supabase.from("payment_methods_public").select("*").order("sort_order")).data ?? [],
  });

  const { data: shippingRates } = useQuery({
    queryKey: ["shipping-rates-public"],
    queryFn: async () => (await supabase.from("shipping_rates").select("*, shipping_zones(name_ar,name_en,name_ur,name_bn)").eq("is_active", true).order("sort_order")).data ?? [],
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

  const physicalSubtotal = useMemo(() => physicalItems.reduce((s, i) => s + i.price * i.quantity, 0), [physicalItems]);
  const rate = useMemo(() => shippingRates?.find((r) => r.id === selectedRate) ?? null, [shippingRates, selectedRate]);
  const shippingCost = useMemo(() => {
    if (!needsFulfillment || fulfillment === "pickup" || !rate) return 0;
    if (rate.free_over && physicalSubtotal >= Number(rate.free_over)) return 0;
    return Number(rate.price);
  }, [rate, physicalSubtotal, needsFulfillment, fulfillment]);


  const method = methods?.find((m) => m.id === selectedMethod) ?? null;
  const fee = method ? Number(method.fee_amount) + (subtotal * Number(method.fee_percent)) / 100 : 0;
  const discount = coupon?.discount ?? 0;
  const total = Math.max(0, subtotal + shippingCost + fee - discount);
  // VAT (Bahrain) — settings decide the rate and whether prices already include it
  const vatPercent = Number(settings?.vat_percent ?? 0);
  const tax = vatPercent > 0
    ? settings?.prices_include_vat
      ? Number(((total * vatPercent) / (100 + vatPercent)).toFixed(3))
      : Number(((total * vatPercent) / 100).toFixed(3))
    : 0;
  const grandTotal = settings?.prices_include_vat ? total : Number((total + tax).toFixed(3));

  const nameOf = (m: Record<string, unknown>) => localizedName(m, "name", lang);
  const instrOf = (m: Record<string, unknown>) => localizedName(m, "instructions", lang);

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
    if (items.length === 0) return;
    if (!method) { toast.error(t("cart.select_method_err")); return; }
    if (digitalShortage.length > 0) { toast.error(`${digitalShortage[0].name} — ${L("digital_out")}`); return; }
    if (isGuest && !guestAllowed) { nav({ to: "/auth" }); return; }
    if (isGuest && method.requires_proof) { toast.error(L("proof_needs_account")); return; }
    if (isGuest && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(guest.email.trim())) { toast.error(L("guest_invalid_email")); return; }
    if (!isGuest && method.requires_proof && !proofFile) { toast.error(t("cart.upload_proof_err")); return; }
    if (needsFulfillment && fulfillment === "delivery") {
      const hasAddr = isGuest
        ? !!manualAddress.full_name && !!manualAddress.address_line
        : !!selectedAddress || (!!manualAddress.full_name && !!manualAddress.address_line);
      if (!hasAddr) { toast.error(L("address_required")); return; }
      if ((shippingRates ?? []).length > 0 && !rate) { toast.error(L("shipping_required")); return; }
    }

    // Guest checkout runs fully server-side (prices, stock and totals re-verified)
    if (isGuest) {
      setPlacing(true);
      try {
        idemRef.current = idemRef.current ?? (globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random()}`);
        const res = await placeGuest({
          data: {
            items: items.map((i) => ({ product_id: i.product_id, quantity: i.quantity })),
            buyer_email: guest.email.trim(),
            buyer_name: guest.name.trim() || null,
            buyer_phone: guest.phone.trim() || null,
            payment_method_id: String(method.id),

            payment_reference: reference || null,
            customer_notes: customerNotes || null,
            coupon_code: coupon?.code ?? null,
            fulfillment: needsFulfillment ? fulfillment : "pickup",
            shipping_rate_id: needsFulfillment && fulfillment === "delivery" ? rate?.id ?? null : null,
            shipping_address: needsFulfillment && fulfillment === "delivery" ? { ...manualAddress } : null,
            idempotency_key: idemRef.current,
          },
        });
        clear();
        if (res.gateway === "afs") {
          nav({ to: "/guest-pay/$id", params: { id: res.order_id }, search: { t: res.guest_token } });
        } else {
          toast.success(t("cart.order_placed"));
          nav({ to: "/guest-order/$id", params: { id: res.order_id }, search: { t: res.guest_token } });
        }
      } catch (e) {
        const msg = (e as Error).message;
        toast.error(
          msg === "digital_stock_unavailable" ? L("digital_out")
          : msg === "guest_checkout_disabled" ? L("guest_disabled")
          : msg
        );
      } finally {
        setPlacing(false);
      }
      return;
    }




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

      // Resolve shipping address snapshot (only for physical delivery orders)
      const addr = selectedAddress ? addresses?.find((a) => a.id === selectedAddress) : null;
      const shipping_address = !needsFulfillment || fulfillment === "pickup"
        ? null
        : addr
          ? { full_name: addr.full_name, phone: addr.phone, address_line: addr.address_line, city: addr.city, country: addr.country, postal_code: addr.postal_code }
          : (manualAddress.full_name || manualAddress.address_line ? manualAddress : null);


      const { data: user } = await supabase.auth.getUser();
      idemRef.current = idemRef.current ?? (globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random()}`);
      const { data: order, error } = await supabase.from("orders").insert({
        idempotency_key: idemRef.current,
        buyer_id: userId,
        buyer_email: user.user?.email ?? "",

        buyer_name: user.user?.user_metadata?.display_name ?? null,
        subtotal,
        discount,
        tax,
        shipping: shippingCost,
        total: grandTotal,
        currency: settings?.default_currency || "BHD",
        status: "pending",
        payment_status: "pending",
        payment_method_id: method.id,
        payment_proof_url: proofUrl,
        payment_reference: reference || null,
        customer_notes: customerNotes || null,
        coupon_id: coupon?.id ?? null,
        coupon_code: coupon?.code ?? null,
        shipping_rate_id: needsFulfillment && fulfillment === "delivery" ? rate?.id ?? null : null,
        shipping_method: !needsFulfillment ? "digital" : fulfillment === "pickup" ? "pickup" : rate?.method ?? null,
        shipping_cost: shippingCost,
        address_id: needsFulfillment && fulfillment === "delivery" ? selectedAddress : null,

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
      idemRef.current = null;
      const msg = (e as Error).message;
      toast.error(msg.includes("digital_stock_unavailable") ? L("digital_out") : msg);

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
                      <div className="flex items-start gap-2">
                        <Link to="/product/$slug" params={{ slug: i.slug }} className="font-medium hover:text-primary">{i.name}</Link>
                        <span className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-medium ${i.type === "physical" ? "bg-primary/15 text-primary" : "bg-accent/20 text-accent-foreground"}`}>
                          {i.type === "physical" ? L("physical_badge") : L("digital_badge")}
                        </span>
                      </div>
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

              {needsFulfillment && digitalItems.length > 0 && (
                <div className="rounded-xl border border-primary/30 bg-primary/5 p-4">
                  <div className="mb-1 flex items-center gap-2 text-sm font-bold"><Zap className="h-4 w-4 text-primary" />{L("digital_title")}</div>
                  <p className="text-xs text-muted-foreground">{L("digital_desc")}</p>
                </div>
              )}

              {/* Fulfillment: only for physical items */}

              {needsFulfillment ? (
                <>
                  <div className="rounded-xl border border-primary/20 bg-card p-5">
                    <h2 className="mb-3 flex items-center gap-2 font-display text-lg font-bold"><Truck className="h-4 w-4 text-primary" />{L("fulfillment")}</h2>
                    <div className="grid gap-2 sm:grid-cols-2">
                      {([
                        { key: "delivery" as const, icon: Truck, label: L("delivery") },
                        { key: "pickup" as const, icon: Store, label: L("pickup") },
                      ]).map((opt) => {
                        const active = fulfillment === opt.key;
                        const Icon = opt.icon;
                        return (
                          <button
                            key={opt.key}
                            type="button"
                            onClick={() => setFulfillment(opt.key)}
                            className={`flex items-center gap-3 rounded-lg border p-3 text-start transition-all ${active ? "border-primary bg-primary/10 shadow-lg shadow-primary/10" : "border-primary/20 hover:border-primary/50"}`}
                          >
                            <div className={`grid h-9 w-9 place-items-center rounded-md ${active ? "bg-primary text-background" : "bg-primary/10 text-primary"}`}>
                              <Icon className="h-4 w-4" />
                            </div>
                            <div className="flex-1 text-sm font-medium">{opt.label}</div>
                            {opt.key === "pickup" && <span className="font-mono text-sm font-bold text-primary">{L("pickup_free")}</span>}
                            {active && <CheckCircle2 className="h-4 w-4 text-primary" />}
                          </button>
                        );
                      })}
                    </div>
                    {fulfillment === "pickup" && (
                      <p className="mt-3 rounded-lg border border-primary/20 bg-background/50 p-3 text-xs text-muted-foreground">
                        {L("pickup_note")}
                        {settings?.company_address ? <span className="mt-1 block text-foreground">{settings.company_address}</span> : null}
                      </p>
                    )}
                  </div>

                  {fulfillment === "delivery" && (
                    <>
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
                              const isFree = r.free_over && physicalSubtotal >= Number(r.free_over);
                              const rname = localizedName(r as unknown as Record<string, unknown>, "name", lang);
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
                    </>
                  )}
                </>
              ) : (
                <div className="rounded-xl border border-primary/30 bg-primary/5 p-5">
                  <h2 className="mb-1 flex items-center gap-2 font-display text-lg font-bold"><Zap className="h-4 w-4 text-primary" />{L("digital_title")}</h2>
                  <p className="text-sm text-muted-foreground">{L("digital_desc")}</p>
                </div>
              )}

              {/* Guest contact details / sign-in prompt */}
              {isGuest && (
                guestAllowed ? (
                  <div className="rounded-xl border border-primary/20 bg-card p-5">
                    <div className="mb-1 flex items-center justify-between gap-2">
                      <h2 className="flex items-center gap-2 font-display text-lg font-bold"><UserRound className="h-4 w-4 text-primary" />{L("guest_title")}</h2>
                      <Link to="/auth" className="flex items-center gap-1 text-xs text-primary hover:underline"><LogIn className="h-3.5 w-3.5" />{L("have_account")}</Link>
                    </div>
                    <p className="mb-3 text-xs text-muted-foreground">{L("guest_desc")}</p>
                    <div className="grid gap-2 sm:grid-cols-2">
                      <div className="sm:col-span-2">
                        <Label className="text-xs">{L("guest_email")}</Label>
                        <Input type="email" inputMode="email" autoComplete="email" value={guest.email} onChange={(e) => setGuest({ ...guest, email: e.target.value })} placeholder="name@example.com" />
                      </div>
                      <div>
                        <Label className="text-xs">{L("guest_name")}</Label>
                        <Input autoComplete="name" value={guest.name} onChange={(e) => setGuest({ ...guest, name: e.target.value })} />
                      </div>
                      <div>
                        <Label className="text-xs">{L("guest_phone")}</Label>
                        <Input inputMode="tel" autoComplete="tel" value={guest.phone} onChange={(e) => setGuest({ ...guest, phone: e.target.value })} />
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-wrap items-center gap-3 rounded-xl border border-primary/20 bg-card p-5">
                    <p className="text-sm text-muted-foreground">{L("guest_disabled")}</p>
                    <Link to="/auth" className="ms-auto"><Button className="bg-primary text-background hover:bg-primary">{L("sign_in")}</Button></Link>
                  </div>
                )
              )}

              {digitalShortage.length > 0 && (
                <div className="flex items-start gap-2 rounded-xl border border-destructive/40 bg-destructive/10 p-4 text-sm">
                  <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-destructive" />
                  <div>
                    {digitalShortage.map((i) => (
                      <div key={i.product_id}>{i.name} — {L("digital_out")}</div>
                    ))}
                  </div>
                </div>
              )}

              <div className="rounded-xl border border-primary/20 bg-card p-5">
                <h2 className="mb-3 font-display text-lg font-bold">{t("cart.payment_method")}</h2>
                {(methods ?? []).length === 0 && (
                  <p className="text-sm text-muted-foreground">{t("cart.no_methods")}</p>
                )}
                <div className="grid gap-2 sm:grid-cols-2">
                  {(methods ?? []).filter((m) => !(isGuest && m.requires_proof)).map((m) => {

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
              <div className="mb-2 font-display text-sm font-bold text-muted-foreground">{L("order_summary")}</div>
              <div className="mb-3 space-y-1.5 border-b border-primary/10 pb-3">
                {items.map((i) => (
                  <div key={i.product_id} className="flex justify-between gap-2 text-xs">
                    <span className="truncate text-muted-foreground">{i.name} × {i.quantity}</span>
                    <span className="shrink-0 font-mono">{formatPrice(i.price * i.quantity)}</span>
                  </div>
                ))}
              </div>
              <div className="flex justify-between py-2"><span>{t("shop.subtotal")}</span><span className="font-mono">{formatPrice(subtotal)}</span></div>
              {needsFulfillment && (
                <div className="flex justify-between py-2 text-sm text-muted-foreground">
                  <span className="flex items-center gap-1">
                    {fulfillment === "pickup" ? <Store className="h-3.5 w-3.5" /> : <Truck className="h-3.5 w-3.5" />}
                    {fulfillment === "pickup" ? L("pickup") : t("cart.select_shipping")}
                  </span>
                  <span className="font-mono">{shippingCost === 0 ? t("cart.shipping_free") : formatPrice(shippingCost)}</span>
                </div>
              )}
              {!needsFulfillment && (
                <div className="flex justify-between py-2 text-sm text-muted-foreground">
                  <span className="flex items-center gap-1"><Zap className="h-3.5 w-3.5 text-primary" />{L("digital_title")}</span>
                  <span className="font-mono">{t("cart.shipping_free")}</span>
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
              {tax > 0 && (
                <div className="flex justify-between py-2 text-sm text-muted-foreground">
                  <span>
                    {lang === "ar" ? `ضريبة القيمة المضافة (${vatPercent}%)` : lang === "ur" ? `ویٹ (${vatPercent}%)` : lang === "bn" ? `ভ্যাট (${vatPercent}%)` : `VAT (${vatPercent}%)`}
                    {settings?.prices_include_vat ? (lang === "ar" ? " — شاملة" : " — incl.") : ""}
                  </span>
                  <span className="font-mono">{formatPrice(tax)}</span>
                </div>
              )}
              <div className="my-3 border-t border-primary/20" />
              <div className="flex justify-between py-2 text-lg font-bold"><span>{t("shop.total")}</span><span className="font-mono text-primary">{formatPrice(grandTotal)}</span></div>
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
