import { createFileRoute, Link, useParams } from "@tanstack/react-router";
import { PageShell } from "@/components/PageShell";
import { ProductCard } from "@/components/ProductCard";
import { getProduct, PRODUCTS } from "@/lib/products";
import { useCart } from "@/lib/cart";
import { useI18n } from "@/lib/i18n";
import { useState } from "react";
import { Star, Heart, Minus, Plus, ShoppingCart, Truck, ShieldCheck, RotateCcw, Check } from "lucide-react";

export const Route = createFileRoute("/product/$id")({
  component: ProductPage,
});

function ProductPage() {
  const { id } = useParams({ from: "/product/$id" });
  const { t } = useI18n();
  const { add, toggleWishlist, isWished } = useCart();
  const [qty, setQty] = useState(1);
  const [added, setAdded] = useState(false);
  const product = getProduct(id);

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

  const discount = product.oldPrice ? Math.round((1 - product.price / product.oldPrice) * 100) : 0;
  const related = PRODUCTS.filter((p) => p.category === product.category && p.id !== product.id).slice(0, 6);
  const wished = isWished(product.id);

  const handleAdd = () => {
    add(product.id, qty);
    setAdded(true);
    setTimeout(() => setAdded(false), 1500);
  };

  return (
    <PageShell>
      <section className="mx-auto max-w-7xl px-4 py-6">
        {/* Breadcrumb */}
        <div className="text-xs text-muted-foreground mb-3">
          <Link to="/" className="hover:text-brand">Home</Link>
          <span className="mx-2">/</span>
          <Link to={`/${product.category}` as any} className="hover:text-brand capitalize">{product.category}</Link>
          <span className="mx-2">/</span>
          <span className="text-foreground">{product.name}</span>
        </div>

        <div className="grid gap-6 lg:grid-cols-[1fr_1fr_300px]">
          {/* Image */}
          <div className="bg-card rounded-md border border-border shadow-card overflow-hidden">
            <div className="aspect-square bg-secondary">
              <img src={product.image} alt={product.name} className="w-full h-full object-cover" />
            </div>
          </div>

          {/* Info */}
          <div className="bg-card rounded-md border border-border shadow-card p-5">
            <h1 className="text-xl md:text-2xl font-semibold text-foreground leading-snug">{product.name}</h1>
            <div className="mt-2 flex items-center gap-3 text-sm text-muted-foreground">
              <div className="flex">
                {[1, 2, 3, 4, 5].map((i) => (
                  <Star key={i} className={`w-4 h-4 ${i <= Math.round(product.rating) ? "fill-yellow-400 text-yellow-400" : "text-border"}`} />
                ))}
              </div>
              <span>{product.rating.toFixed(1)}</span>
              <span className="opacity-60">|</span>
              <span>{product.sold} sold</span>
            </div>

            <div className="mt-4 bg-accent/40 rounded-md p-4">
              <div className="flex items-baseline gap-3 flex-wrap">
                <span className="text-3xl font-extrabold text-sale">QAR {product.price}</span>
                {product.oldPrice && <span className="text-base text-muted-foreground line-through">QAR {product.oldPrice}</span>}
                {discount > 0 && <span className="text-sm bg-sale text-white font-bold px-2 py-0.5 rounded">-{discount}%</span>}
              </div>
            </div>

            <div className="mt-4 space-y-2 text-sm">
              <div className="flex justify-between border-b border-border pb-2">
                <span className="text-muted-foreground">{t("pd.brand")}</span>
                <span className="font-medium text-foreground">{product.brand}</span>
              </div>
              <div className="flex justify-between border-b border-border pb-2">
                <span className="text-muted-foreground">{t("pd.stock")}</span>
                <span className={`font-medium ${product.stock > 0 ? "text-emerald-600" : "text-sale"}`}>
                  {product.stock > 0 ? `${t("pd.stock")} (${product.stock})` : t("pd.outStock")}
                </span>
              </div>
            </div>

            <div className="mt-5">
              <h3 className="text-sm font-semibold text-foreground">{t("pd.features")}</h3>
              <ul className="mt-2 space-y-1.5">
                {product.features.map((f) => (
                  <li key={f} className="flex items-start gap-2 text-sm text-foreground">
                    <Check className="w-4 h-4 text-brand mt-0.5 shrink-0" />
                    <span>{f}</span>
                  </li>
                ))}
              </ul>
            </div>

            <p className="mt-5 text-sm text-muted-foreground leading-relaxed">{product.description}</p>
          </div>

          {/* Action card */}
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
            <Link to="/cart" className="mt-2 w-full h-12 rounded-md bg-sale hover:opacity-90 text-white font-semibold flex items-center justify-center transition-smooth">
              {t("pd.buyNow")}
            </Link>
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
                <span>{product.freeShipping ? "Free Shipping" : "Standard Shipping"}</span>
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

        {/* Related */}
        {related.length > 0 && (
          <div className="mt-10">
            <h2 className="text-lg font-bold text-foreground mb-4">{t("pd.related")}</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
              {related.map((p) => (
                <ProductCard key={p.id} id={p.id} name={p.name} price={p.price} oldPrice={p.oldPrice} image={p.image} rating={p.rating} sold={p.sold} badge={p.badge} freeShipping={p.freeShipping} />
              ))}
            </div>
          </div>
        )}
      </section>
    </PageShell>
  );
}
