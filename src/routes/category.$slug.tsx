import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Breadcrumbs, breadcrumbJsonLd } from "@/components/Breadcrumbs";
import { ProductCard } from "@/components/ProductCard";
import { supabase } from "@/integrations/supabase/client";
import { useI18n, localizedName } from "@/lib/i18n";
import { Button } from "@/components/ui/button";
import { PackageSearch } from "lucide-react";
import { BASE } from "@/lib/site-url";


export const Route = createFileRoute("/category/$slug")({
  component: CategoryPage,
  loader: async ({ params, context }) =>
    context.queryClient.ensureQueryData({
      queryKey: ["category-meta", params.slug],
      queryFn: async () => {
        const { data } = await supabase
          .from("categories")
          .select("id, slug, name_ar, name_en, name_ur, name_bn, description")
          .eq("slug", params.slug)
          .eq("is_active", true)
          .maybeSingle();
        return data;
      },
    }),
  head: ({ params, loaderData }) => {
    const c = loaderData as { name_en?: string | null; name_ar?: string | null; description?: string | null } | null;
    const url = `${BASE}/category/${params.slug}`;
    if (!c) {
      return { meta: [{ title: "Category — VIPSTAR" }, { name: "robots", content: "noindex" }] };
    }
    const name = c.name_en || c.name_ar || "Category";
    const title = `${name} — VIPSTAR Bahrain`;
    const desc =
      (c.description || `Shop ${name} at VIPSTAR Satellite & Electronics in Riffa, Bahrain. Fast delivery, in-store pickup and instant digital delivery.`).slice(0, 160);
    return {
      meta: [
        { title },
        { name: "description", content: desc },
        { property: "og:title", content: title },
        { property: "og:description", content: desc },
        { property: "og:type", content: "website" },
        { property: "og:url", content: url },
        { name: "twitter:card", content: "summary_large_image" },
      ],
      links: [{ rel: "canonical", href: url }],
      scripts: [
        {
          type: "application/ld+json",
          children: JSON.stringify(
            breadcrumbJsonLd([
              { name: "Home", url: BASE },
              { name: "Shop", url: `${BASE}/shop` },
              { name, url },
            ]),
          ),
        },
      ],
    };
  },
});

function CategoryPage() {
  const { slug } = Route.useParams();
  const { t, lang } = useI18n();

  const { data: cat } = useQuery({
    queryKey: ["category", slug],
    queryFn: async () =>
      (
        await supabase
          .from("categories")
          .select("*")
          .eq("slug", slug)
          .eq("is_active", true)
          .maybeSingle()
      ).data,
  });

  const { data: products, isLoading } = useQuery({
    queryKey: ["category-products", cat?.id],
    enabled: !!cat?.id,
    queryFn: async () =>
      (
        await supabase
          .from("products")
          .select("id, slug, name_ar, name_en, name_ur, name_bn, price, compare_price, currency, stock, track_stock, images, type")
          .eq("category_id", cat!.id)
          .eq("status", "active")
          .order("created_at", { ascending: false })
      ).data ?? [],
  });

  const name = cat ? localizedName(cat as unknown as Record<string, unknown>, "name", lang) : slug;

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 py-8">
        <Breadcrumbs
          items={[
            { label: t("bc.home"), to: "/" },
            { label: t("bc.shop"), to: "/shop" },
            { label: name },
          ]}
        />

        <header className="mb-8 border-b border-primary/20 pb-5">
          <div className="flex flex-wrap items-end gap-3">
            <h1 className="font-display text-3xl font-bold tracking-tight">{name}</h1>
            {products && (
              <span className="rounded-full border border-primary/20 bg-primary/5 px-2.5 py-0.5 text-xs text-primary">
                {products.length} {t("cat.count")}
              </span>
            )}
          </div>
          {cat?.description && <p className="mt-3 max-w-3xl text-sm leading-relaxed text-muted-foreground">{cat.description}</p>}
        </header>

        {isLoading ? (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
            {Array.from({ length: 12 }).map((_, i) => (
              <div key={i} className="aspect-[3/4] animate-pulse rounded-xl border border-primary/10 bg-card" />
            ))}
          </div>
        ) : (products ?? []).length > 0 ? (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
            {(products ?? []).map((p) => (
              <ProductCard key={p.id} p={p as never} />
            ))}
          </div>
        ) : (
          <div className="rounded-xl border border-primary/10 bg-card p-12 text-center">
            <PackageSearch className="mx-auto mb-3 h-10 w-10 text-primary/40" aria-hidden />
            <p className="text-muted-foreground">{t("cat.empty")}</p>
            <Link to="/shop" className="mt-4 inline-block">
              <Button className="bg-primary text-background hover:bg-primary">{t("cat.browse_all")}</Button>
            </Link>
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
}
