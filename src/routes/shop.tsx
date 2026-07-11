import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { z } from "zod";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { ProductCard } from "@/components/ProductCard";
import { useI18n, localizedName } from "@/lib/i18n";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import { useState } from "react";

const search = z.object({
  category: z.string().optional(),
  q: z.string().optional(),
});

export const Route = createFileRoute("/shop")({
  validateSearch: search,
  component: ShopPage,
});

function ShopPage() {
  const { t, lang } = useI18n();
  const { category, q } = Route.useSearch();
  const nav = Route.useNavigate();
  const [search, setSearch] = useState(q ?? "");

  const { data: categories } = useQuery({
    queryKey: ["shop-cats"],
    queryFn: async () => (await supabase.from("categories").select("*").eq("is_active", true).order("sort_order")).data ?? [],
  });

  const { data: products } = useQuery({
    queryKey: ["shop-products", category, q],
    queryFn: async () => {
      let query = supabase.from("products").select("*, categories!inner(id, slug, name_ar, name_en, name_ur, sort_order)").eq("status", "active");
      if (category) query = query.eq("categories.slug", category);
      if (q) query = query.or(`name_ar.ilike.%${q}%,name_en.ilike.%${q}%`);
      const { data } = await query.order("created_at", { ascending: false });
      return data ?? [];
    },
  });

  // Group products by category (respect categories sort_order)
  const grouped = (() => {
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

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="container mx-auto px-4 py-8">
        <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-center">
          <h1 className="font-display text-3xl font-bold">{t("nav.shop")}</h1>
          <form
            className="relative md:ms-auto md:w-80"
            onSubmit={(e) => { e.preventDefault(); nav({ search: (s: { category?: string; q?: string }) => ({ ...s, q: search || undefined }) }); }}
          >
            <Search className="absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder={t("shop.search")}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="ps-9"
            />
          </form>
        </div>

        <div className="mb-8 flex flex-wrap gap-2">
          <button
            onClick={() => nav({ search: { q } })}
            className={`rounded-full border px-3 py-1 text-sm transition ${!category ? "border-cyan-500 bg-cyan-500/10 text-cyan-400" : "border-cyan-500/20 hover:border-cyan-500/50"}`}
          >
            {t("shop.all")}
          </button>
          {(categories ?? []).map((c) => (
            <button
              key={c.id}
              onClick={() => nav({ search: { category: c.slug, q } })}
              className={`rounded-full border px-3 py-1 text-sm transition ${category === c.slug ? "border-cyan-500 bg-cyan-500/10 text-cyan-400" : "border-cyan-500/20 hover:border-cyan-500/50"}`}
            >
              {localizedName(c, "name", lang)}
            </button>
          ))}
        </div>

        {grouped.length > 0 ? (
          <div className="space-y-12">
            {grouped.map(({ cat, items }) => (
              <section key={cat.id} id={cat.slug} className="scroll-mt-24">
                <div className="mb-5 flex items-end justify-between gap-3 border-b border-cyan-500/20 pb-3">
                  <div className="flex items-center gap-3">
                    <span className="h-6 w-1 rounded-full bg-gradient-to-b from-cyan-400 to-cyan-600" />
                    <h2 className="font-display text-2xl font-bold tracking-tight">
                      {localizedName(cat, "name", lang)}
                    </h2>
                    <span className="rounded-full border border-cyan-500/20 bg-cyan-500/5 px-2 py-0.5 text-xs text-cyan-300">
                      {items.length}
                    </span>
                  </div>
                  {!category && cat.slug && (
                    <button
                      onClick={() => nav({ search: { category: cat.slug, q } })}
                      className="text-xs text-cyan-400 hover:text-cyan-300"
                    >
                      {t("shop.all")} →
                    </button>
                  )}
                </div>
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
                  {items.map((p) => <ProductCard key={p.id} p={p} />)}
                </div>
              </section>
            ))}
          </div>
        ) : (
          <div className="rounded-xl border border-cyan-500/10 bg-card p-12 text-center text-muted-foreground">
            {t("shop.empty")}
          </div>
        )}
      </div>
      <Footer />
    </div>
  );
}
