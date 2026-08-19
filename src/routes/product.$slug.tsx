import { createFileRoute, notFound } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { useI18n, localizedName } from "@/lib/i18n";
import { useCart } from "@/lib/cart";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { formatPrice, firstImage } from "@/lib/format";
import { Package, ShoppingCart, Download, Copy, Tv, Calendar, Sparkles, ShieldCheck } from "lucide-react";
import { warrantyLabel, WARRANTY_LABEL_I18N } from "@/lib/category-presets";
import { toast } from "sonner";
import { analytics } from "@/lib/analytics";
import { useState } from "react";
import { WishlistButton } from "@/components/WishlistButton";
import { ReviewSection } from "@/components/ReviewSection";
import { RelatedProducts, RecentlyViewed, trackRecentlyViewed } from "@/components/RelatedProducts";
import { useEffect } from "react";

export const Route = createFileRoute("/product/$slug")({
  component: ProductPage,
  loader: async ({ params, context }) =>
    context.queryClient.ensureQueryData({
      queryKey: ["product-meta", params.slug],
      queryFn: async () => {
        const { data } = await supabase
          .from("products")
          .select("name_en, name_ar, description_en, description_ar, images, price, currency, stock, track_stock")
          .eq("slug", params.slug)
          .eq("status", "active")
          .maybeSingle();
        return data;
      },
    }),
  head: ({ params, loaderData }) => {
    const p = loaderData as { name_en?: string; name_ar?: string; description_en?: string; description_ar?: string; images?: unknown; price?: number | string; currency?: string; stock?: number; track_stock?: boolean } | null;
    if (!p) {
      return { meta: [{ title: "Product — VIPSTAR" }, { name: "robots", content: "noindex" }] };
    }
    const title = `${p.name_en || p.name_ar || "Product"} — VIPSTAR`;
    const desc = (p.description_en || p.description_ar || "").toString().slice(0, 160) || "VIPSTAR product.";
    const imgs = Array.isArray(p.images) ? (p.images as string[]) : [];
    const img = imgs[0] ?? "";
    const url = `https://vipstar.cc/product/${params.slug}`;
    const inStock = !p.track_stock || (p.stock ?? 0) > 0;
    const meta: Array<Record<string, string>> = [
      { title },
      { name: "description", content: desc },
      { property: "og:title", content: title },
      { property: "og:description", content: desc },
      { property: "og:type", content: "product" },
      { property: "og:url", content: url },
      { name: "twitter:card", content: "summary_large_image" },
    ];
    if (img) {
      meta.push({ property: "og:image", content: img });
      meta.push({ name: "twitter:image", content: img });
    }
    return {
      meta,
      links: [{ rel: "canonical", href: url }],
      scripts: [{
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "Product",
          name: p.name_en || p.name_ar,
          description: desc,
          image: img || undefined,
          offers: {
            "@type": "Offer",
            price: p.price,
            priceCurrency: p.currency || "BHD",
            availability: inStock ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
            url,
          },
        }),
      }],
    };
  },
});

function ProductPage() {
  const { slug } = Route.useParams();
  const { t, lang } = useI18n();
  const { add } = useCart();
  const [qty, setQty] = useState(1);

  const { data: p, isLoading } = useQuery({
    queryKey: ["product", slug],
    queryFn: async () => {
      const { data } = await supabase.from("products").select("*").eq("slug", slug).eq("status", "active").maybeSingle();
      if (!data) throw notFound();
      return data;
    },
  });

  useEffect(() => { if (p?.id) trackRecentlyViewed(p.id); }, [p?.id]);

  if (isLoading) return <div className="min-h-screen bg-background"><Header /><div className="container mx-auto py-20 text-center text-muted-foreground">...</div></div>;
  if (!p) return null;

  const name = localizedName(p, "name", lang);
  const description = localizedName(p, "description", lang);
  const img = firstImage(p.images);
  const oos = p.track_stock && p.stock <= 0;

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="container mx-auto grid gap-8 px-4 py-8 md:grid-cols-2">
        <div className="aspect-square overflow-hidden rounded-2xl border border-primary/20 bg-card">
          {img ? (
            <img src={img} alt={name} className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full items-center justify-center text-primary/30"><Package className="h-32 w-32" /></div>
          )}
        </div>
        <div>
          <div className="flex items-start justify-between gap-3">
            <h1 className="font-display text-3xl font-bold">{name}</h1>
            <WishlistButton productId={p.id} className="h-10 w-10 shrink-0" size={18} />
          </div>
          <div className="mt-4 flex items-baseline gap-3">
            <span className="font-mono text-3xl font-bold text-primary">{formatPrice(Number(p.price), p.currency)}</span>
            {p.compare_price && Number(p.compare_price) > Number(p.price) && (
              <span className="text-lg text-muted-foreground line-through">{formatPrice(Number(p.compare_price), p.currency)}</span>
            )}
          </div>

          {description && <p className="mt-6 whitespace-pre-line leading-relaxed text-foreground/80">{description}</p>}

          {(() => {
            const feats = (p.features as Record<string, unknown> | null) ?? {};
            const w = warrantyLabel(feats.warranty, lang, feats.warranty_custom);
            if (!w) return null;
            return (
              <div className="mt-6 flex items-center gap-3 rounded-xl border border-primary/20 bg-primary/5 px-4 py-3">
                <ShieldCheck className="h-5 w-5 text-primary" />
                <span className="text-sm text-muted-foreground">{WARRANTY_LABEL_I18N[lang]}:</span>
                <span className="font-semibold text-primary">{w}</span>
              </div>
            );
          })()}

          {p.type === "subscription" && p.features && typeof p.features === "object" && (
            <div className="mt-6 space-y-3 rounded-xl border border-primary/20 bg-card/50 p-5">
              <div className="grid grid-cols-2 gap-3 text-sm">
                {(p.features as any).channels && (
                  <div className="flex items-center gap-2"><Tv className="h-4 w-4 text-primary" /><span className="text-muted-foreground">{t("product.channels")}:</span><span className="font-mono">{(p.features as any).channels}</span></div>
                )}
                {(p.features as any).quality && (
                  <div className="flex items-center gap-2"><Sparkles className="h-4 w-4 text-primary" /><span className="text-muted-foreground">{t("product.quality")}:</span><span className="font-mono">{(p.features as any).quality}</span></div>
                )}
                {(p.features as any).duration_months && (
                  <div className="flex items-center gap-2 col-span-2"><Calendar className="h-4 w-4 text-primary" /><span className="text-muted-foreground">{t("product.duration")}:</span><span className="font-mono">{(p.features as any).duration_months} {t("product.months")}</span></div>
                )}
              </div>

              {(p.features as any).downloader_code && (
                <div className="rounded-lg border border-primary/30 bg-background/60 p-3">
                  <div className="mb-1 text-xs uppercase tracking-wider text-primary/80">{t("product.downloader_code")}</div>
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-mono text-2xl font-bold tracking-widest text-primary">{(p.features as any).downloader_code}</span>
                    <Button size="sm" variant="ghost" onClick={() => { navigator.clipboard.writeText((p.features as any).downloader_code); toast.success(t("product.copied")); }}><Copy className="h-4 w-4" /></Button>
                  </div>
                </div>
              )}

              {(p.features as any).app_download_url && (
                <a href={(p.features as any).app_download_url} target="_blank" rel="noopener noreferrer" className="flex w-full items-center justify-center gap-2 rounded-lg border border-primary/30 bg-primary/10 px-4 py-2.5 text-sm font-medium text-primary transition hover:bg-primary/20">
                  <Download className="h-4 w-4" />
                  {t("product.download_app")}
                </a>
              )}
            </div>
          )}

          <div className="mt-6 flex items-center gap-4">
            <div className="flex items-center rounded-md border border-primary/20">
              <button onClick={() => setQty(Math.max(1, qty - 1))} className="px-3 py-2 hover:bg-primary/10">−</button>
              <span className="w-12 text-center font-mono">{qty}</span>
              <button onClick={() => setQty(qty + 1)} className="px-3 py-2 hover:bg-primary/10">+</button>
            </div>
            <Button
              size="lg"
              disabled={oos}
              onClick={() => {
                add({ product_id: p.id, slug: p.slug, name, image: img, price: Number(p.price), type: p.type }, qty);
                analytics.addToCart({ id: p.id, name, price: Number(p.price), quantity: qty });
                toast.success(t("shop.addToCart"));
              }}
              className="flex-1 bg-primary text-background hover:bg-primary"
            >
              <ShoppingCart className="me-2 h-4 w-4" />
              {oos ? t("shop.outOfStock") : t("shop.addToCart")}
            </Button>
      </div>
      <div className="container mx-auto px-4 pb-12"><ReviewSection productId={p.id} /></div>
        </div>
      </div>
      <div className="container mx-auto px-4 pb-12">
        <RelatedProducts productId={p.id} categoryId={p.category_id} />
        <RecentlyViewed excludeId={p.id} />
      </div>
      <Footer />
    </div>
  );
}
