import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { PageShell } from "@/components/PageShell";
import { ProductCard } from "@/components/ProductCard";
import { useI18n } from "@/lib/i18n";
import { useCategoryProducts } from "@/lib/db-products";
import { Loader2 } from "lucide-react";
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

export type ProductGroup = {
  key: string;
  labelKey: string;
  match: (title: string, categorySlug?: string) => boolean;
};

export function CategoryPage({ category, img, titleKey, subKey, groups }: { category: string; img: string; titleKey: string; subKey: string; groups?: ProductGroup[] }) {
  const { t } = useI18n();
  const { items, loading } = useCategoryProducts(category);
  const [sort, setSort] = useState<"pop" | "low" | "high" | "rating">("pop");
  const [group, setGroup] = useState<string>("all");

  const filtered = useMemo(() => {
    if (!groups || group === "all") return items;
    const g = groups.find((x) => x.key === group);
    if (!g) return items;
    return items.filter((p) => g.match(p.title || "", p.category_slug));
  }, [items, group, groups]);

  const sorted = useMemo(() => {
    const arr = [...filtered];
    const price = (p: typeof filtered[number]) => Number(p.sale_price ?? p.price);
    if (sort === "low") arr.sort((a, b) => price(a) - price(b));
    else if (sort === "high") arr.sort((a, b) => price(b) - price(a));
    else if (sort === "rating") arr.sort((a, b) => Number(b.rating) - Number(a.rating));
    else arr.sort((a, b) => b.sales_count - a.sales_count);
    return arr;
  }, [filtered, sort]);

  return (
    <PageShell>
      <section className="mx-auto max-w-7xl px-4 py-4">
        <div className="relative rounded-md overflow-hidden bg-gradient-brand h-[200px] md:h-[260px] shadow-card">
          <img src={img} alt="" className="absolute inset-0 w-full h-full object-cover opacity-40" />
          <div className="relative h-full p-6 md:p-10 flex flex-col justify-center text-white">
            <h1 className="text-2xl md:text-4xl font-extrabold">{t(titleKey)}</h1>
            <p className="mt-2 text-sm md:text-base text-white/90 max-w-2xl">{t(subKey)}</p>
          </div>
        </div>
      </section>

      {groups && groups.length > 0 && (
        <section className="mx-auto max-w-7xl px-4 mt-4">
          <div className="flex gap-2 flex-wrap">
            <button
              onClick={() => setGroup("all")}
              className={`px-4 py-2 rounded-md text-sm font-semibold border transition-smooth ${group === "all" ? "bg-brand text-brand-foreground border-brand" : "bg-card text-foreground border-border hover:border-brand"}`}
            >
              {t("dish.gAll")}
            </button>
            {groups.map((g) => {
              const count = items.filter((p) => g.match(p.title || "", p.category_slug)).length;
              return (
                <button
                  key={g.key}
                  onClick={() => setGroup(g.key)}
                  className={`px-4 py-2 rounded-md text-sm font-semibold border transition-smooth ${group === g.key ? "bg-brand text-brand-foreground border-brand" : "bg-card text-foreground border-border hover:border-brand"}`}
                >
                  {t(g.labelKey)} <span className="opacity-70">({count})</span>
                </button>
              );
            })}
          </div>
        </section>
      )}

      <section className="mx-auto max-w-7xl px-4 mt-4">
        <div className="bg-card rounded-md border border-border shadow-card p-3 flex items-center justify-between flex-wrap gap-2">
          <div className="text-sm text-muted-foreground">{sorted.length} {t("cat.products")}</div>
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

      <section className="mx-auto max-w-7xl px-4 mt-4 mb-10">
        {loading ? (
          <div className="grid place-items-center py-20"><Loader2 className="w-6 h-6 animate-spin text-brand" /></div>
        ) : sorted.length === 0 ? (
          <div className="bg-card border border-border rounded-xl p-12 text-center text-muted-foreground">
            لا توجد منتجات بعد في هذا القسم.
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
            {sorted.map((p) => (
              <ProductCard
                key={p.id}
                id={p.id}
                name={p.title}
                price={Number(p.sale_price ?? p.price)}
                oldPrice={p.sale_price ? Number(p.price) : undefined}
                image={p.image}
                rating={Number(p.rating)}
                sold={p.sales_count}
                currency={(p.currency as any) || undefined}
              />
            ))}
          </div>
        )}
      </section>
    </PageShell>
  );
}

