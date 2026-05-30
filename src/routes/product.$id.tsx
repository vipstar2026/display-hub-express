import { createFileRoute, Link, useParams } from "@tanstack/react-router";
import { PageShell } from "@/components/PageShell";
import { useCart } from "@/lib/cart";
import { useI18n } from "@/lib/i18n";
import { useState } from "react";
import { useDbProduct } from "@/lib/db-products";
import { useCurrency, type CurrencyCode } from "@/lib/currency";
import { Star, Heart, Minus, Plus, ShoppingCart, Truck, ShieldCheck, RotateCcw, Check, Loader2 } from "lucide-react";

export const Route = createFileRoute("/product/$id")({
  component: ProductPage,
});

function ProductPage() {
  const { id } = useParams({ from: "/product/$id" });
  const { t } = useI18n();
  const { add, toggleWishlist, isWished } = useCart();
  const [qty, setQty] = useState(1);
  const [added, setAdded] = useState(false);
  const { product, loading } = useDbProduct(id);
  const { format } = useCurrency();

  if (loading) {
    return (
      <PageShell>
        <div className="mx-auto max-w-7xl px-4 py-20 grid place-items-center">
          <Loader2 className="w-6 h-6 animate-spin text-brand" />
        </div>
      </PageShell>
    );
  }

  if (!product) {
    return (
      <PageShell>
        <div className="mx-auto max-w-7xl px-4 py-20 text-center">
          <h1 className="text-2xl font-bold text-foreground">{t("pd.notFound")}</h1>
          <Link to="/" className="mt-4 inline-block text-brand hover:underline">{t("cart.continue")}</Link>
        </div>
      </PageShell>
    );
  }

  const price = Number(product.sale_price ?? product.price);
  const oldPrice = product.sale_price ? Number(product.price) : null;
  const discount = oldPrice ? Math.round((1 - price / oldPrice) * 100) : 0;
  const wished = isWished(product.id);

  const handleAdd = () => {
    add(product.id, qty);
    setAdded(true);
    setTimeout(() => setAdded(false), 1500);
  };

  const handleBuyNow = () => {
    add(product.id, qty);
    window.location.assign("/checkout");
  };


  return (
    <PageShell>
      <section className="mx-auto max-w-7xl px-4 py-6">
        <div className="text-xs text-muted-foreground mb-3">
          <Link to="/" className="hover:text-brand">{t("pd.home")}</Link>
          {product.category_slug && (
            <>
              <span className="mx-2">/</span>
              <Link to={`/${product.category_slug}` as any} className="hover:text-brand capitalize">{product.category_slug}</Link>
            </>
          )}
          <span className="mx-2">/</span>
          <span className="text-foreground">{product.title}</span>
        </div>

        <div className="grid gap-6 lg:grid-cols-[1fr_1fr_300px]">
          <div className="bg-card rounded-md border border-border shadow-card overflow-hidden">
            <div className="aspect-square bg-secondary">
              {product.image ? (
                <img src={product.image} alt={product.title} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full grid place-items-center text-muted-foreground">{t("pd.noImage")}</div>
              )}
            </div>
            {product.images.length > 1 && (
              <div className="p-2 flex gap-2 overflow-x-auto">
                {product.images.map((u, i) => (
                  <img key={i} src={u} alt="" className="w-16 h-16 object-cover rounded border border-border" />
                ))}
              </div>
            )}
          </div>

          <div className="bg-card rounded-md border border-border shadow-card p-5">
            <h1 className="text-xl md:text-2xl font-semibold text-foreground leading-snug">{product.title}</h1>
            <div className="mt-2 flex items-center gap-3 text-sm text-muted-foreground">
              <div className="flex">
                {[1, 2, 3, 4, 5].map((i) => (
                  <Star key={i} className={`w-4 h-4 ${i <= Math.round(Number(product.rating)) ? "fill-yellow-400 text-yellow-400" : "text-border"}`} />
                ))}
              </div>
              <span>{Number(product.rating).toFixed(1)}</span>
              <span className="opacity-60">|</span>
              <span>{product.sales_count} sold</span>
            </div>

            <div className="mt-4 bg-accent/40 rounded-md p-4">
              <div className="flex items-baseline gap-3 flex-wrap">
                <span className="text-3xl font-extrabold text-sale">{format(price, (product.currency as CurrencyCode) || undefined)}</span>
                {oldPrice && <span className="text-base text-muted-foreground line-through">{format(oldPrice, (product.currency as CurrencyCode) || undefined)}</span>}
                {discount > 0 && <span className="text-sm bg-sale text-white font-bold px-2 py-0.5 rounded">-{discount}%</span>}
              </div>
            </div>

            <div className="mt-4 space-y-2 text-sm">
              {product.brand && (
                <div className="flex justify-between border-b border-border pb-2">
                  <span className="text-muted-foreground">{t("pd.brand")}</span>
                  <span className="font-medium text-foreground">{product.brand}</span>
                </div>
              )}
              <div className="flex justify-between border-b border-border pb-2">
                <span className="text-muted-foreground">{t("pd.stock")}</span>
                <span className={`font-medium ${product.stock > 0 ? "text-emerald-600" : "text-sale"}`}>
                  {product.stock > 0 ? `${t("pd.stock")} (${product.stock})` : t("pd.outStock")}
                </span>
              </div>
              {product.vendor_name && (
                <div className="flex justify-between border-b border-border pb-2">
                  <span className="text-muted-foreground">Seller</span>
                  <span className="font-medium text-foreground">{product.vendor_name}</span>
                </div>
              )}
            </div>

            {product.description && (
              <p className="mt-5 text-sm text-muted-foreground leading-relaxed whitespace-pre-line">{product.description}</p>
            )}
          </div>

          <div className="bg-card rounded-md border border-border shadow-card p-5 h-fit lg:sticky lg:top-44">
            <div className="flex items-center justify-between gap-4">
              <span className="text-sm text-muted-foreground">{t("pd.qty")}</span>
              <div className="flex items-center border border-border rounded-md overflow-hidden">
                <button onClick={() => setQty((q) => Math.max(1, q - 1))} className="w-9 h-9 grid place-items-center hover:bg-accent"><Minus className="w-4 h-4" /></button>
                <span className="w-10 text-center text-sm font-semibold">{qty}</span>
                <button onClick={() => setQty((q) => Math.min(product.stock, q + 1))} className="w-9 h-9 grid place-items-center hover:bg-accent"><Plus className="w-4 h-4" /></button>
              </div>
            </div>

            <button
              onClick={handleAdd}
              disabled={product.stock === 0}
              className="mt-4 w-full h-12 rounded-md bg-brand hover:bg-brand-dark text-white font-semibold flex items-center justify-center gap-2 transition-smooth disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {added ? <Check className="w-5 h-5" /> : <ShoppingCart className="w-5 h-5" />}
              {t("pd.addCart")}
            </button>
            <button
              onClick={handleBuyNow}
              disabled={product.stock === 0}
              className="mt-2 w-full h-12 rounded-md bg-sale hover:opacity-90 text-white font-semibold flex items-center justify-center transition-smooth disabled:opacity-50"
            >
              {t("pd.buyNow")}
            </button>

            <button
              onClick={() => toggleWishlist(product.id)}
              className="mt-2 w-full h-10 rounded-md border border-border hover:bg-accent text-sm flex items-center justify-center gap-2"
            >
              <Heart className={`w-4 h-4 ${wished ? "fill-sale text-sale" : ""}`} />
              {wished ? "Wishlisted" : "Add to Wishlist"}
            </button>

            <div className="mt-5 pt-5 border-t border-border space-y-3 text-xs">
              <div className="flex items-center gap-2 text-foreground">
                <Truck className="w-4 h-4 text-brand" />
                <span>Standard Shipping</span>
              </div>
              <div className="flex items-center gap-2 text-foreground">
                <RotateCcw className="w-4 h-4 text-brand" />
                <span>7-day return policy</span>
              </div>
              <div className="flex items-center gap-2 text-foreground">
                <ShieldCheck className="w-4 h-4 text-brand" />
                <span>1 year warranty</span>
              </div>
            </div>
          </div>
        </div>
      </section>
    </PageShell>
  );
}
