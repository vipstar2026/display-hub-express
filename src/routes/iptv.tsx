import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { PageShell } from "@/components/PageShell";
import { ProductCard } from "@/components/ProductCard";
import { getProductsByCategory, type Product } from "@/lib/products";
import { useI18n } from "@/lib/i18n";
import iptvImg from "@/assets/iptv.jpg";

export const Route = createFileRoute("/iptv")({
  head: () => ({
    meta: [
      { title: "IPTV — VIP STAR" },
      { name: "description", content: "IPTV boxes, subscriptions and accessories." },
      { property: "og:image", content: iptvImg },
    ],
  }),
  component: () => <CategoryPage category="iptv" img={iptvImg} titleKey="iptv.title" subKey="iptv.sub" />,
});

export function CategoryPage({ category, img, titleKey, subKey }: { category: Product["category"]; img: string; titleKey: string; subKey: string }) {
  const { t } = useI18n();
  const products = getProductsByCategory(category);
  const [sort, setSort] = useState<"pop" | "low" | "high" | "rating">("pop");

  const sorted = useMemo(() => {
    const arr = [...products];
    if (sort === "low") arr.sort((a, b) => a.price - b.price);
    else if (sort === "high") arr.sort((a, b) => b.price - a.price);
    else if (sort === "rating") arr.sort((a, b) => b.rating - a.rating);
    else arr.sort((a, b) => b.sold - a.sold);
    return arr;
  }, [products, sort]);

  return (
    <PageShell>
      {/* Hero banner */}
      <section className="mx-auto max-w-7xl px-4 py-4">
        <div className="relative rounded-md overflow-hidden bg-gradient-brand h-[200px] md:h-[260px] shadow-card">
          <img src={img} alt="" className="absolute inset-0 w-full h-full object-cover opacity-40" />
          <div className="relative h-full p-6 md:p-10 flex flex-col justify-center text-white">
            <h1 className="text-2xl md:text-4xl font-extrabold">{t(titleKey)}</h1>
            <p className="mt-2 text-sm md:text-base text-white/90 max-w-2xl">{t(subKey)}</p>
          </div>
        </div>
      </section>

      {/* Toolbar */}
      <section className="mx-auto max-w-7xl px-4 mt-4">
        <div className="bg-card rounded-md border border-border shadow-card p-3 flex items-center justify-between flex-wrap gap-2">
          <div className="text-sm text-muted-foreground">{products.length} {t("cat.products")}</div>
          <div className="flex items-center gap-2 text-sm">
            <span className="text-muted-foreground">{t("cat.sort")}:</span>
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value as typeof sort)}
              className="border border-border rounded-md px-3 py-1.5 bg-card text-foreground text-sm outline-none focus:border-brand"
            >
              <option value="pop">{t("cat.sortPop")}</option>
              <option value="low">{t("cat.sortLow")}</option>
              <option value="high">{t("cat.sortHigh")}</option>
              <option value="rating">{t("cat.sortRating")}</option>
            </select>
          </div>
        </div>
      </section>

      {/* Grid */}
      <section className="mx-auto max-w-7xl px-4 mt-4 mb-10">
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          {sorted.map((p) => (
            <ProductCard
              key={p.id}
              id={p.id}
              name={p.name}
              price={p.price}
              oldPrice={p.oldPrice}
              image={p.image}
              rating={p.rating}
              sold={p.sold}
              badge={p.badge}
              freeShipping={p.freeShipping}
            />
          ))}
        </div>
      </section>
    </PageShell>
  );
}
