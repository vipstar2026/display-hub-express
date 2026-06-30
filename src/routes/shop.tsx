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
      let query = supabase.from("products").select("*, categories!inner(slug)").eq("status", "active");
      if (category) query = query.eq("categories.slug", category);
      if (q) query = query.or(`name_ar.ilike.%${q}%,name_en.ilike.%${q}%`);
      const { data } = await query.order("created_at", { ascending: false });
      return data ?? [];
    },
  });

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

        <div className="mb-6 flex flex-wrap gap-2">
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

        {products && products.length > 0 ? (
          <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
            {products.map((p) => <ProductCard key={p.id} p={p} />)}
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
