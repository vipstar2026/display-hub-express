import { createFileRoute, Link } from "@tanstack/react-router";
import { PageShell } from "@/components/PageShell";
import { useCart } from "@/lib/cart";
import { getProduct } from "@/lib/products";
import { useI18n } from "@/lib/i18n";
import { useCurrency } from "@/lib/currency";
import { Minus, Plus, Trash2, ShoppingBag } from "lucide-react";

export const Route = createFileRoute("/cart")({
  head: () => ({ meta: [{ title: "Cart — VIP STAR" }] }),
  component: CartPage,
});

function CartPage() {
  const { items, setQty, remove } = useCart();
  const { t } = useI18n();
  const { format } = useCurrency();

  const rows = items.map((it) => ({ item: it, product: getProduct(it.id) })).filter((r) => r.product);
  const subtotal = rows.reduce((sum, r) => sum + r.product!.price * r.item.qty, 0);
  const shipping = subtotal > 200 || subtotal === 0 ? 0 : 20;
  const total = subtotal + shipping;

  if (rows.length === 0) {
    return (
      <PageShell>
        <section className="mx-auto max-w-3xl px-4 py-20 text-center">
          <div className="w-20 h-20 mx-auto rounded-full bg-accent grid place-items-center text-brand">
            <ShoppingBag className="w-10 h-10" />
          </div>
          <h1 className="mt-5 text-2xl font-bold text-foreground">{t("cart.empty")}</h1>
          <Link to="/" className="mt-6 inline-block px-6 py-3 rounded-md bg-brand hover:bg-brand-dark text-white font-semibold transition-smooth">
            {t("cart.continue")}
          </Link>
        </section>
      </PageShell>
    );
  }

  return (
    <PageShell>
      <section className="mx-auto max-w-7xl px-4 py-6">
        <h1 className="text-xl font-bold text-foreground mb-4">{t("cart.title")} ({items.length})</h1>

        <div className="grid gap-4 lg:grid-cols-[1fr_340px]">
          <div className="bg-card rounded-md border border-border shadow-card divide-y divide-border">
            {rows.map(({ item, product }) => (
              <div key={item.id} className="p-4 flex gap-4">
                <Link to="/product/$id" params={{ id: product!.id }} className="w-24 h-24 shrink-0 rounded bg-secondary overflow-hidden">
                  <img src={product!.image} alt={product!.name} className="w-full h-full object-cover" />
                </Link>
                <div className="flex-1 min-w-0">
                  <Link to="/product/$id" params={{ id: product!.id }} className="text-sm font-medium text-foreground hover:text-brand line-clamp-2">
                    {product!.name}
                  </Link>
                  <div className="mt-1 text-xs text-muted-foreground">{product!.brand}</div>
                  <div className="mt-2 flex items-center justify-between flex-wrap gap-2">
                    <div className="flex items-baseline gap-2">
                      <span className="text-base font-bold text-sale">{format(product!.price)}</span>
                      {product!.oldPrice && <span className="text-xs text-muted-foreground line-through">{format(product!.oldPrice)}</span>}
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="flex items-center border border-border rounded-md overflow-hidden">
                        <button onClick={() => setQty(item.id, item.qty - 1)} className="w-8 h-8 grid place-items-center hover:bg-accent"><Minus className="w-3.5 h-3.5" /></button>
                        <span className="w-8 text-center text-sm font-semibold">{item.qty}</span>
                        <button onClick={() => setQty(item.id, item.qty + 1)} className="w-8 h-8 grid place-items-center hover:bg-accent"><Plus className="w-3.5 h-3.5" /></button>
                      </div>
                      <button onClick={() => remove(item.id)} aria-label={t("cart.remove")} className="text-muted-foreground hover:text-sale">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <aside className="bg-card rounded-md border border-border shadow-card p-5 h-fit lg:sticky lg:top-44">
            <h2 className="text-base font-bold text-foreground mb-4">{t("cart.total")}</h2>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between"><span className="text-muted-foreground">{t("cart.subtotal")}</span><span className="font-semibold">{format(subtotal)}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">{t("cart.shipping")}</span><span className="font-semibold">{shipping === 0 ? t("cart.free") : format(shipping)}</span></div>
              <div className="border-t border-border pt-2 mt-2 flex justify-between text-base">
                <span className="font-bold">{t("cart.total")}</span><span className="font-extrabold text-sale">{format(total)}</span>
              </div>
            </div>
            <Link to="/checkout" className="mt-5 w-full h-12 rounded-md bg-sale hover:opacity-90 text-white font-semibold flex items-center justify-center transition-smooth">
              {t("cart.checkout")}
            </Link>
            <Link to="/" className="mt-2 block text-center text-sm text-brand hover:underline">{t("cart.continue")}</Link>
          </aside>
        </div>
      </section>
    </PageShell>
  );
}
