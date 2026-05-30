import { createFileRoute, Link } from "@tanstack/react-router";
import { PageShell } from "@/components/PageShell";
import { ProductCard } from "@/components/ProductCard";
import { useCart } from "@/lib/cart";
import { getProduct } from "@/lib/products";
import { useI18n } from "@/lib/i18n";
import { Heart } from "lucide-react";

export const Route = createFileRoute("/wishlist")({
  head: () => ({ meta: [{ title: "Wishlist — VIP STAR" }] }),
  component: WishlistPage,
});

function WishlistPage() {
  const { wishlist } = useCart();
  const { t } = useI18n();
  const products = wishlist.map(getProduct).filter(Boolean);

  return (
    <PageShell>
      <section className="mx-auto max-w-7xl px-4 py-6">
        <h1 className="text-xl font-bold text-foreground mb-4">{t("wish.title")} ({products.length})</h1>
        {products.length === 0 ? (
          <div className="text-center py-20">
            <div className="w-20 h-20 mx-auto rounded-full bg-accent grid place-items-center text-brand">
              <Heart className="w-10 h-10" />
            </div>
            <p className="mt-5 text-muted-foreground">{t("wish.empty")}</p>
            <Link to="/" className="mt-6 inline-block px-6 py-3 rounded-md bg-brand hover:bg-brand-dark text-white font-semibold transition-smooth">
              {t("cart.continue")}
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
            {products.map((p) => (
              <ProductCard key={p!.id} id={p!.id} name={p!.name} price={p!.price} oldPrice={p!.oldPrice} image={p!.image} rating={p!.rating} sold={p!.sold} badge={p!.badge} freeShipping={p!.freeShipping} currency="QAR" />
            ))}
          </div>
        )}
      </section>
    </PageShell>
  );
}
