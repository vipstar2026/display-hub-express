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
import { Trash2, ShoppingBag, Package, Upload, CheckCircle2, Landmark, Smartphone, Banknote, Wallet, CreditCard } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useEffect, useState } from "react";
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

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUserId(data.user?.id ?? null));
  }, []);

  const { data: methods } = useQuery({
    queryKey: ["payment-methods-active"],
    queryFn: async () => (await supabase.from("payment_methods").select("*").eq("is_active", true).order("sort_order")).data ?? [],
  });

  const method = methods?.find((m) => m.id === selectedMethod) ?? null;
  const fee = method ? Number(method.fee_amount) + (subtotal * Number(method.fee_percent)) / 100 : 0;
  const total = subtotal + fee;

  const nameOf = (m: { name_ar: string; name_en: string; name_ur: string | null }) =>
    lang === "ar" ? m.name_ar : lang === "ur" ? (m.name_ur || m.name_en) : m.name_en;
  const instrOf = (m: { instructions_ar: string | null; instructions_en: string | null; instructions_ur: string | null }) =>
    (lang === "ar" ? m.instructions_ar : lang === "ur" ? m.instructions_ur : m.instructions_en) ?? m.instructions_en ?? "";

  const handleCheckout = async () => {
    if (!userId) { nav({ to: "/auth" }); return; }
    if (items.length === 0) return;
    if (!method) { toast.error("Select a payment method"); return; }
    if (method.requires_proof && !proofFile) { toast.error("Upload payment proof"); return; }

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

      const { data: user } = await supabase.auth.getUser();
      const { data: order, error } = await supabase.from("orders").insert({
        buyer_id: userId,
        buyer_email: user.user?.email ?? "",
        buyer_name: user.user?.user_metadata?.display_name ?? null,
        subtotal,
        total,
        currency: "BHD",
        status: "pending",
        payment_status: "pending",
        payment_method_id: method.id,
        payment_proof_url: proofUrl,
        payment_reference: reference || null,
        customer_notes: customerNotes || null,
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

      clear();
      toast.success("Order placed! We will review your payment shortly.");
      nav({ to: "/account" });
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
          <div className="rounded-xl border border-cyan-500/10 bg-card p-12 text-center">
            <ShoppingBag className="mx-auto mb-4 h-16 w-16 text-cyan-500/30" />
            <p className="text-muted-foreground">{t("shop.emptyCart")}</p>
            <Link to="/shop"><Button className="mt-4 bg-cyan-500 text-background hover:bg-cyan-400">{t("shop.continueShopping")}</Button></Link>
          </div>
        ) : (
          <div className="grid gap-6 lg:grid-cols-3">
            <div className="space-y-6 lg:col-span-2">
              {/* Items */}
              <div className="space-y-3">
                {items.map((i) => (
                  <div key={i.product_id} className="flex gap-3 rounded-xl border border-cyan-500/10 bg-card p-3">
                    <div className="h-20 w-20 shrink-0 overflow-hidden rounded-md bg-background/50">
                      {i.image ? <img src={i.image} alt={i.name} className="h-full w-full object-cover" /> : <div className="flex h-full items-center justify-center"><Package className="h-8 w-8 text-cyan-500/30" /></div>}
                    </div>
                    <div className="flex flex-1 flex-col">
                      <Link to="/product/$slug" params={{ slug: i.slug }} className="font-medium hover:text-cyan-400">{i.name}</Link>
                      <div className="mt-1 font-mono text-cyan-400">{formatPrice(i.price)}</div>
                      <div className="mt-auto flex items-center gap-2">
                        <div className="flex items-center rounded-md border border-cyan-500/20">
                          <button onClick={() => setQty(i.product_id, i.quantity - 1)} className="px-2 py-1 hover:bg-cyan-500/10">−</button>
                          <span className="w-8 text-center text-sm">{i.quantity}</span>
                          <button onClick={() => setQty(i.product_id, i.quantity + 1)} className="px-2 py-1 hover:bg-cyan-500/10">+</button>
                        </div>
                        <button onClick={() => remove(i.product_id)} className="ms-auto text-muted-foreground hover:text-destructive">
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Payment methods */}
              <div className="rounded-xl border border-cyan-500/20 bg-card p-5">
                <h2 className="mb-3 font-display text-lg font-bold">
                  {lang === "ar" ? "طريقة الدفع" : lang === "ur" ? "طریقہ ادائیگی" : "Payment Method"}
                </h2>
                {(methods ?? []).length === 0 && (
                  <p className="text-sm text-muted-foreground">
                    {lang === "ar" ? "لا توجد طرق دفع متاحة حالياً." : "No payment methods available."}
                  </p>
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
                          active ? "border-cyan-500 bg-cyan-500/10 shadow-lg shadow-cyan-500/10" : "border-cyan-500/20 hover:border-cyan-500/50"
                        }`}
                      >
                        <div className={`grid h-9 w-9 place-items-center rounded-md ${active ? "bg-cyan-500 text-background" : "bg-cyan-500/10 text-cyan-400"}`}>
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
                        {active && <CheckCircle2 className="h-4 w-4 text-cyan-400" />}
                      </button>
                    );
                  })}
                </div>

                {method && (
                  <div className="mt-4 space-y-3 rounded-lg border border-cyan-500/20 bg-background/50 p-4">
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
                        <Label className="text-xs">
                          {lang === "ar" ? "رقم مرجع التحويل (اختياري)" : "Payment reference (optional)"}
                        </Label>
                        <Input value={reference} onChange={(e) => setReference(e.target.value)} placeholder="TXN123..." />
                      </div>
                      {method.requires_proof && (
                        <div>
                          <Label className="text-xs">
                            {lang === "ar" ? "صورة إيصال الدفع *" : "Payment proof screenshot *"}
                          </Label>
                          <label className="mt-1 flex cursor-pointer items-center gap-2 rounded-md border border-dashed border-cyan-500/40 bg-card/50 p-3 text-sm hover:bg-cyan-500/5">
                            <Upload className="h-4 w-4 text-cyan-400" />
                            <span className="flex-1 truncate">
                              {proofFile ? proofFile.name : (lang === "ar" ? "اختر صورة..." : "Choose image...")}
                            </span>
                            <input type="file" accept="image/*" className="hidden" onChange={(e) => setProofFile(e.target.files?.[0] ?? null)} />
                          </label>
                        </div>
                      )}
                      <div>
                        <Label className="text-xs">
                          {lang === "ar" ? "ملاحظات (اختياري)" : "Notes (optional)"}
                        </Label>
                        <Textarea rows={2} value={customerNotes} onChange={(e) => setCustomerNotes(e.target.value)} />
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Summary */}
            <div className="h-fit rounded-xl border border-cyan-500/20 bg-card p-6">
              <div className="flex justify-between py-2"><span>{t("shop.subtotal")}</span><span className="font-mono">{formatPrice(subtotal)}</span></div>
              {fee > 0 && (
                <div className="flex justify-between py-2 text-sm text-muted-foreground">
                  <span>{lang === "ar" ? "رسوم الدفع" : "Payment fee"}</span>
                  <span className="font-mono">{formatPrice(fee)}</span>
                </div>
              )}
              <div className="my-3 border-t border-cyan-500/20" />
              <div className="flex justify-between py-2 text-lg font-bold"><span>{t("shop.total")}</span><span className="font-mono text-cyan-400">{formatPrice(total)}</span></div>
              <Button onClick={handleCheckout} disabled={placing || !method} className="mt-4 w-full bg-cyan-500 text-background hover:bg-cyan-400">
                {placing ? "..." : t("shop.checkout")}
              </Button>
              {!method && <p className="mt-2 text-center text-xs text-muted-foreground">
                {lang === "ar" ? "اختر طريقة دفع للمتابعة" : "Select a payment method to continue"}
              </p>}
            </div>
          </div>
        )}
      </div>
      <Footer />
    </div>
  );
}
