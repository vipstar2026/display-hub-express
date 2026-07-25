import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { z } from "zod";

import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { ProductCard } from "@/components/ProductCard";
import { useI18n, localizedName } from "@/lib/i18n";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, SlidersHorizontal, X } from "lucide-react";
import { useState } from "react";

type ShopSearch = { category: string; q: string; sort: string; min: string; max: string };
const search = z.object({
  category: z.string().optional().default(""),
  q: z.string().optional().default(""),
  sort: z.string().optional().default("newest"),
  min: z.string().optional().default(""),
  max: z.string().optional().default(""),
});

export const Route = createFileRoute("/shop")({
  validateSearch: search,
  component: ShopPage,
});

function ShopPage() {
  const { t, lang } = useI18n();
  const { category, q, sort, min, max } = Route.useSearch();
  const nav = Route.useNavigate();
  const [searchText, setSearchText] = useState(q);
  const [showFilters, setShowFilters] = useState(false);
  const [minPrice, setMinPrice] = useState(min);
  const [maxPrice, setMaxPrice] = useState(max);

  const { data: categories } = useQuery({
    queryKey: ["shop-cats"],
    queryFn: async () => (await supabase.from("categories").select("*").eq("is_active", true).order("sort_order")).data ?? [],
  });

  const { data: products } = useQuery({
    queryKey: ["shop-products", category, q, sort, min, max],
    queryFn: async () => {
      let query = supabase.from("products").select("*, categories!inner(id, slug, name_ar, name_en, name_ur, sort_order)").eq("status", "active");
      if (category) query = query.eq("categories.slug", category);
      if (q) query = query.or(`name_ar.ilike.%${q}%,name_en.ilike.%${q}%`);
      if (min) query = query.gte("price", Number(min));
      if (max) query = query.lte("price", Number(max));
      if (sort === "price_asc") query = query.order("price", { ascending: true });
      else if (sort === "price_desc") query = query.order("price", { ascending: false });
      else if (sort === "name") query = query.order("name_en", { ascending: true });
      else query = query.order("created_at", { ascending: false });
      const { data } = await query;
      return data ?? [];
    },
  });

  const grouped = (() => {
    if (sort !== "newest" || category) return null; // only group when default view
    const cats = categories ?? [];
    const buckets = new Map<string, { cat: any; items: any[] }>();
    cats.forEach((c) => buckets.set(c.id, { cat: c, items: [] }));
    (products ?? []).forEach((p: any) => {
      const cid = p.categories?.id ?? p.category_id;
      if (!cid) return;
      if (!buckets.has(cid)) buckets.set(cid, { cat: p.categories ?? { id: cid, name_en: "Other", name_ar: "أخرى", name_ur: "دیگر", slug: "" }, items: [] });
      buckets.get(cid)!.items.push(p);
    });
    return Array.from(buckets.values()).filter((g) => g.items.length > 0);
  })();

  const applyPriceFilter = () => nav({ search: (s) => ({ ...s, min: minPrice, max: maxPrice }) });
  const clearFilters = () => { setSearchText(""); setMinPrice(""); setMaxPrice(""); nav({ search: { category: "", q: "", sort: "newest", min: "", max: "" } }); };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="container mx-auto px-4 py-8">
        <div className="mb-4 flex flex-wrap items-center gap-3">
          <h1 className="font-display text-3xl font-bold">{t("nav.shop")}</h1>
          <form
            className="relative ms-auto flex-1 md:max-w-md"
            onSubmit={(e) => { e.preventDefault(); nav({ search: (s) => ({ ...s, q: searchText }) }); }}
          >
            <Search className="absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder={t("shop.search")}
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              className="ps-9"
            />
          </form>
          <select
            value={sort}
            onChange={(e) => nav({ search: (s) => ({ ...s, sort: e.target.value }) })}
            className="h-9 rounded-md border border-primary/20 bg-card px-3 text-sm"
          >
            <option value="newest">{t("shop.sort.newest")}</option>
            <option value="price_asc">{t("shop.sort.price_asc")}</option>
            <option value="price_desc">{t("shop.sort.price_desc")}</option>
            <option value="name">{t("shop.sort.name")}</option>
          </select>
          <Button variant="outline" size="sm" onClick={() => setShowFilters((v) => !v)}>
            <SlidersHorizontal className="me-1 h-4 w-4" />{t("shop.filter")}
          </Button>
        </div>

        {showFilters && (
          <div className="mb-4 flex flex-wrap items-end gap-3 rounded-lg border border-primary/20 bg-card p-3">
            <div><label className="text-xs text-muted-foreground">{t("shop.price_min")}</label><Input type="number" value={minPrice} onChange={(e) => setMinPrice(e.target.value)} className="mt-1 w-32" /></div>
            <div><label className="text-xs text-muted-foreground">{t("shop.price_max")}</label><Input type="number" value={maxPrice} onChange={(e) => setMaxPrice(e.target.value)} className="mt-1 w-32" /></div>
            <Button size="sm" onClick={applyPriceFilter} className="bg-primary text-background hover:bg-primary">{t("cart.apply")}</Button>
            {(category || q || min || max || sort !== "newest") && (
              <Button size="sm" variant="ghost" onClick={clearFilters}><X className="me-1 h-3 w-3" />{t("shop.clear")}</Button>
            )}
          </div>
        )}

        <div className="mb-8 flex flex-wrap gap-2">
          <button
            onClick={() => nav({ search: (s) => ({ ...s, category: "" }) })}
            className={`rounded-full border px-3 py-1 text-sm transition ${!category ? "border-primary bg-primary/10 text-primary" : "border-primary/20 hover:border-primary/50"}`}
          >
            {t("shop.all")}
          </button>
          {(categories ?? []).map((c) => (
            <button
              key={c.id}
              onClick={() => nav({ search: (s) => ({ ...s, category: c.slug }) })}
              className={`rounded-full border px-3 py-1 text-sm transition ${category === c.slug ? "border-primary bg-primary/10 text-primary" : "border-primary/20 hover:border-primary/50"}`}
            >
              {localizedName(c, "name", lang)}
            </button>
          ))}
        </div>

        {grouped ? (
          grouped.length > 0 ? (
            <div className="space-y-12">
              {grouped.map(({ cat, items }) => (
                <section key={cat.id} id={cat.slug} className="scroll-mt-24">
                  <div className="mb-5 flex items-end justify-between gap-3 border-b border-primary/20 pb-3">
                    <div className="flex items-center gap-3">
                      <span className="h-6 w-1 rounded-full bg-gradient-to-b from-primary to-primary/70" />
                      <h2 className="font-display text-2xl font-bold tracking-tight">{localizedName(cat, "name", lang)}</h2>
                      <span className="rounded-full border border-primary/20 bg-primary/5 px-2 py-0.5 text-xs text-primary">{items.length}</span>
                    </div>
                    {cat.slug && (
                      <button onClick={() => nav({ search: (s) => ({ ...s, category: cat.slug }) })} className="text-xs text-primary hover:text-primary">{t("shop.all")} →</button>
                    )}
                  </div>
                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
                    {items.map((p) => <ProductCard key={p.id} p={p} />)}
                  </div>
                </section>
              ))}
            </div>
          ) : (
            <div className="rounded-xl border border-primary/10 bg-card p-12 text-center text-muted-foreground">{t("shop.empty")}</div>
          )
        ) : (products ?? []).length > 0 ? (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
            {(products ?? []).map((p) => <ProductCard key={p.id} p={p as never} />)}
          </div>
        ) : (
          <div className="rounded-xl border border-primary/10 bg-card p-12 text-center text-muted-foreground">{t("shop.empty")}</div>
        )}
      </div>
      <Footer />
    </div>
  );
}
