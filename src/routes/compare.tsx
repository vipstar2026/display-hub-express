import { createFileRoute, Link } from "@tanstack/react-router";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { useCompare } from "@/lib/compare";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useI18n, localizedName } from "@/lib/i18n";
import { formatPrice, firstImage } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { Check, X, GitCompareArrows, ShoppingCart, Package } from "lucide-react";
import { useCart } from "@/lib/cart";
import { toast } from "sonner";

export const Route = createFileRoute("/compare")({
  component: ComparePage,
  head: () => ({
    meta: [
      { title: "Compare Products — VIPSTAR" },
      { name: "description", content: "Compare satellite receivers and IPTV subscriptions side by side to pick the best one for you." },
      { property: "og:title", content: "Compare Products — VIPSTAR" },
      { property: "og:description", content: "Side-by-side comparison of specs, price and stock." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
});

function ComparePage() {
  const { ids, remove, clear } = useCompare();
  const { t, lang } = useI18n();
  const { add } = useCart();

  const { data: products, isLoading } = useQuery({
    queryKey: ["compare-products", ids],
    queryFn: async () => {
      if (ids.length === 0) return [];
      const { data } = await supabase.from("products").select("*").in("id", ids);
      return data ?? [];
    },
    enabled: ids.length > 0,
  });

  const rows: { key: string; label: string; render: (p: any) => React.ReactNode }[] = [
    { key: "price", label: t("shop.price"), render: (p) => <span className="font-mono font-bold text-primary">{formatPrice(Number(p.price), p.currency)}</span> },
    { key: "compare_price", label: t("compare.wasPrice"), render: (p) => p.compare_price ? <span className="line-through text-muted-foreground">{formatPrice(Number(p.compare_price), p.currency)}</span> : <span className="text-muted-foreground">—</span> },
    { key: "stock", label: t("compare.stock"), render: (p) => p.track_stock ? (p.stock > 0 ? <span className="inline-flex items-center gap-1 text-emerald-400"><Check className="h-4 w-4" /> {p.stock}</span> : <span className="inline-flex items-center gap-1 text-red-400"><X className="h-4 w-4" /> {t("shop.outOfStock")}</span>) : <Check className="h-4 w-4 text-emerald-400" /> },
    { key: "type", label: t("compare.type"), render: (p) => <span className="capitalize">{p.type}</span> },
    { key: "warranty", label: t("compare.warranty"), render: (p) => (p.meta as any)?.warranty || <span className="text-muted-foreground">—</span> },
    { key: "duration", label: t("compare.duration"), render: (p) => (p.meta as any)?.duration || <span className="text-muted-foreground">—</span> },
    { key: "channels", label: t("compare.channels"), render: (p) => (p.meta as any)?.channels || <span className="text-muted-foreground">—</span> },
    { key: "resolution", label: t("compare.resolution"), render: (p) => (p.meta as any)?.resolution || <span className="text-muted-foreground">—</span> },
  ];

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 py-10">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="flex items-center gap-2 font-display text-3xl font-bold">
              <GitCompareArrows className="h-7 w-7 text-primary" /> {t("compare.title")}
            </h1>
            <p className="text-sm text-muted-foreground">{t("compare.subtitle")}</p>
          </div>
          {ids.length > 0 && (
            <Button variant="ghost" onClick={clear}>{t("compare.clear")}</Button>
          )}
        </div>

        {ids.length === 0 ? (
          <div className="rounded-2xl border border-primary/20 bg-card/40 p-12 text-center">
            <GitCompareArrows className="mx-auto mb-4 h-16 w-16 text-primary/30" />
            <p className="mb-4 text-muted-foreground">{t("compare.emptyHint")}</p>
            <Link to="/shop"><Button>{t("shop.all")}</Button></Link>
          </div>
        ) : isLoading ? (
          <div className="p-8 text-center text-muted-foreground">...</div>
        ) : (
          <div className="overflow-x-auto rounded-2xl border border-primary/20 bg-card/40 backdrop-blur">
            <table className="min-w-full">
              <thead>
                <tr>
                  <th className="sticky start-0 z-10 w-40 border-b border-primary/10 bg-card/60 p-3 text-start text-xs font-semibold uppercase text-muted-foreground"></th>
                  {(products ?? []).map((p: any) => {
                    const img = firstImage(p.images);
                    const name = localizedName(p, "name", lang);
                    return (
                      <th key={p.id} className="min-w-56 border-b border-primary/10 p-3 text-center align-top">
                        <div className="relative">
                          <button onClick={() => remove(p.id)} aria-label="remove" className="absolute end-0 top-0 grid h-7 w-7 place-items-center rounded-full border border-primary/20 bg-background text-muted-foreground transition hover:text-red-400">
                            <X className="h-3.5 w-3.5" />
                          </button>
                          <Link to="/product/$slug" params={{ slug: p.slug }} className="block">
                            <div className="mx-auto grid h-32 w-32 place-items-center overflow-hidden rounded-xl bg-background/60 p-2 ring-1 ring-primary/10">
                              {img ? <img src={img} alt={name} className="h-full w-full object-contain" /> : <Package className="h-10 w-10 text-primary/30" />}
                            </div>
                            <div className="mt-2 line-clamp-2 text-sm font-medium hover:text-primary">{name}</div>
                          </Link>
                        </div>
                      </th>
                    );
                  })}
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.key} className="border-b border-primary/5">
                    <td className="sticky start-0 z-10 bg-card/60 p-3 text-xs font-semibold uppercase text-muted-foreground">{r.label}</td>
                    {(products ?? []).map((p: any) => (
                      <td key={p.id} className="p-3 text-center text-sm">{r.render(p)}</td>
                    ))}
                  </tr>
                ))}
                <tr>
                  <td className="sticky start-0 z-10 bg-card/60 p-3 text-xs font-semibold uppercase text-muted-foreground">{t("shop.addToCart")}</td>
                  {(products ?? []).map((p: any) => {
                    const oos = p.track_stock && p.stock <= 0;
                    const name = localizedName(p, "name", lang);
                    return (
                      <td key={p.id} className="p-3 text-center">
                        <Button
                          size="sm"
                          disabled={oos}
                          className="gap-1"
                          onClick={() => {
                            add({ product_id: p.id, slug: p.slug, name, image: firstImage(p.images), price: Number(p.price), type: p.type });
                            toast.success(t("shop.addToCart"));
                          }}
                        >
                          <ShoppingCart className="h-3.5 w-3.5" />
                          {oos ? t("shop.outOfStock") : t("shop.addToCart")}
                        </Button>
                      </td>
                    );
                  })}
                </tr>
              </tbody>
            </table>
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
}
