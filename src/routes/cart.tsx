import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { useI18n } from "@/lib/i18n";
import { useCart } from "@/lib/cart";
import { Button } from "@/components/ui/button";
import { formatPrice } from "@/lib/format";
import { Trash2, ShoppingBag, Package } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useEffect, useState } from "react";
import { toast } from "sonner";

export const Route = createFileRoute("/cart")({
  component: CartPage,
});

function CartPage() {
  const { t } = useI18n();
  const { items, setQty, remove, subtotal, clear } = useCart();
  const nav = useNavigate();
  const [userId, setUserId] = useState<string | null>(null);
  const [placing, setPlacing] = useState(false);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUserId(data.user?.id ?? null));
  }, []);

  const handleCheckout = async () => {
    if (!userId) { nav({ to: "/auth" }); return; }
    if (items.length === 0) return;
    setPlacing(true);
    try {
      const { data: user } = await supabase.auth.getUser();
      const { data: order, error } = await supabase.from("orders").insert({
        buyer_id: userId,
        buyer_email: user.user?.email ?? "",
        buyer_name: user.user?.user_metadata?.display_name ?? null,
        subtotal,
        total: subtotal,
        currency: "USD",
        status: "pending",
        payment_status: "pending",
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
      toast.success("Order placed! We will contact you shortly.");
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
            <div className="space-y-3 lg:col-span-2">
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
            <div className="h-fit rounded-xl border border-cyan-500/20 bg-card p-6">
              <div className="flex justify-between py-2"><span>{t("shop.subtotal")}</span><span className="font-mono">{formatPrice(subtotal)}</span></div>
              <div className="my-3 border-t border-cyan-500/20" />
              <div className="flex justify-between py-2 text-lg font-bold"><span>{t("shop.total")}</span><span className="font-mono text-cyan-400">{formatPrice(subtotal)}</span></div>
              <Button onClick={handleCheckout} disabled={placing} className="mt-4 w-full bg-cyan-500 text-background hover:bg-cyan-400">
                {t("shop.checkout")}
              </Button>
            </div>
          </div>
        )}
      </div>
      <Footer />
    </div>
  );
}
