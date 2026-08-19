import { createFileRoute, notFound, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { useI18n, localizedName } from "@/lib/i18n";
import { useCart } from "@/lib/cart";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { formatPrice, firstImage } from "@/lib/format";
import {
  ShoppingCart, Download, Copy, Tv, Calendar, Sparkles, ShieldCheck,
  Truck, Store, RotateCcw, Lock, MessageCircle, Share2, Check, Zap, Hash,
} from "lucide-react";
import { warrantyLabel, WARRANTY_LABEL_I18N } from "@/lib/category-presets";
import { toast } from "sonner";
import { analytics } from "@/lib/analytics";
import { useEffect, useState } from "react";
import { WishlistButton } from "@/components/WishlistButton";
import { ReviewSection } from "@/components/ReviewSection";
import { RelatedProducts, RecentlyViewed, trackRecentlyViewed } from "@/components/RelatedProducts";
import { Breadcrumbs, breadcrumbJsonLd } from "@/components/Breadcrumbs";
import { ProductGallery } from "@/components/ProductGallery";
import { useDigitalStock, isDigital } from "@/lib/digital-stock";

const BASE = "https://vipstar.cc";

export const Route = createFileRoute("/product/$slug")({
  component: ProductPage,
  loader: async ({ params, context }) =>
    context.queryClient.ensureQueryData({
      queryKey: ["product-meta", params.slug],
      queryFn: async () => {
        const { data } = await supabase
          .from("products")
          .select("name_en, name_ar, description_en, description_ar, images, price, currency, stock, track_stock, sku, type")
          .eq("slug", params.slug)
          .eq("status", "active")
          .maybeSingle();
        return data;
      },
    }),
  head: ({ params, loaderData }) => {
    const p = loaderData as {
      name_en?: string; name_ar?: string; description_en?: string; description_ar?: string;
      images?: unknown; price?: number | string; currency?: string; stock?: number; track_stock?: boolean; sku?: string | null;
    } | null;
    if (!p) {
      return { meta: [{ title: "Product — VIPSTAR" }, { name: "robots", content: "noindex" }] };
    }
    const name = p.name_en || p.name_ar || "Product";
    const title = `${name} — VIPSTAR Bahrain`;
    const desc = (p.description_en || p.description_ar || "").toString().slice(0, 160)
      || `Buy ${name} from VIPSTAR Satellite & Electronics, Riffa, Bahrain.`;
    const imgs = Array.isArray(p.images) ? (p.images as string[]) : [];
    const img = imgs[0] ?? "";
    const url = `${BASE}/product/${params.slug}`;
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
      scripts: [
        {
          type: "application/ld+json",
          children: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Product",
            name,
            description: desc,
            image: imgs.length ? imgs : undefined,
            sku: p.sku || undefined,
            brand: { "@type": "Brand", name: "VIPSTAR" },
            offers: {
              "@type": "Offer",
              price: p.price,
              priceCurrency: p.currency || "BHD",
              availability: inStock ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
              url,
            },
          }),
        },
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

function ProductPage() {
  const { slug } = Route.useParams();
  const { t, lang } = useI18n();
  const { add } = useCart();
  const [qty, setQty] = useState(1);
  const [shared, setShared] = useState(false);

  const { data: p, isLoading } = useQuery({
    queryKey: ["product", slug],
    queryFn: async () => {
      const { data } = await supabase.from("products").select("*").eq("slug", slug).eq("status", "active").maybeSingle();
      if (!data) throw notFound();
      return data;
    },
  });

  const { data: category } = useQuery({
    queryKey: ["product-category", p?.category_id],
    enabled: !!p?.category_id,
    queryFn: async () =>
      (await supabase.from("categories").select("id, slug, name_ar, name_en, name_ur, name_bn").eq("id", p!.category_id!).maybeSingle()).data,
  });

  const { data: digitalMap } = useDigitalStock();

  useEffect(() => { if (p?.id) trackRecentlyViewed(p.id); }, [p?.id]);
  useEffect(() => {
    if (!p?.id) return;
    analytics.viewItem({ id: p.id, name: localizedName(p, "name", lang), price: Number(p.price) }, p.currency ?? "BHD");
  }, [p?.id, lang]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto grid gap-8 px-4 py-8 md:grid-cols-2">
          <div className="aspect-square animate-pulse rounded-2xl border border-primary/10 bg-card" />
          <div className="space-y-4">
            <div className="h-8 w-2/3 animate-pulse rounded bg-card" />
            <div className="h-6 w-1/3 animate-pulse rounded bg-card" />
            <div className="h-24 animate-pulse rounded bg-card" />
          </div>
        </div>
      </div>
    );
  }
  if (!p) return null;

  const name = localizedName(p, "name", lang);
  const description = localizedName(p, "description", lang);
  const images = Array.isArray(p.images) ? (p.images as string[]) : ([firstImage(p.images)].filter(Boolean) as string[]);
  const img = images[0] ?? null;
  const digital = isDigital(p.type);
  const digitalAvail = digital ? digitalMap?.[p.id] : undefined;
  const oos = digital ? digitalAvail !== undefined && digitalAvail <= 0 : !!p.track_stock && (p.stock ?? 0) <= 0;
  const remaining = digital ? digitalAvail : p.track_stock ? p.stock : undefined;
  const low = !oos && typeof remaining === "number" && remaining > 0 && remaining <= 5;

  const share = async () => {
    const url = `${BASE}/product/${p.slug}`;
    try {
      if (typeof navigator !== "undefined" && navigator.share) {
        await navigator.share({ title: name, url });
        return;
      }
      await navigator.clipboard.writeText(url);
      setShared(true);
      toast.success(t("product.link_copied"));
      setTimeout(() => setShared(false), 2000);
    } catch { /* cancelled */ }
  };

  const addToCart = () => {
    add({ product_id: p.id, slug: p.slug, name, image: img, price: Number(p.price), type: p.type }, qty);
    analytics.addToCart({ id: p.id, name, price: Number(p.price), quantity: qty });
    toast.success(t("shop.addToCart"));
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 py-8">
        <Breadcrumbs
          items={[
            { label: t("bc.home"), to: "/" },
            { label: t("bc.shop"), to: "/shop" },
            ...(category
              ? [{ label: localizedName(category as unknown as Record<string, unknown>, "name", lang), to: "/category/$slug", params: { slug: category.slug } }]
              : []),
            { label: name },
          ]}
        />

        <div className="grid gap-8 md:grid-cols-2">
          <ProductGallery images={images} alt={name} />

          <div>
            <div className="flex items-start justify-between gap-3">
              <h1 className="font-display text-3xl font-bold">{name}</h1>
              <div className="flex shrink-0 gap-2">
                <WishlistButton productId={p.id} className="h-11 w-11" size={18} />
                <button
                  type="button"
                  onClick={share}
                  aria-label={t("product.share")}
                  className="grid h-11 w-11 place-items-center rounded-full border border-primary/20 text-muted-foreground transition hover:border-primary hover:text-primary"
                >
                  {shared ? <Check className="h-4 w-4" aria-hidden /> : <Share2 className="h-4 w-4" aria-hidden />}
                </button>
              </div>
            </div>

            <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
              {p.sku && (
                <span className="inline-flex items-center gap-1">
                  <Hash className="h-3 w-3" aria-hidden />
                  {t("product.sku")}: <span className="font-mono text-foreground">{p.sku}</span>
                </span>
              )}
              <span className="inline-flex items-center gap-1">
                {t("product.brand")}: <span className="text-foreground">VIPSTAR</span>
              </span>
            </div>

            <div className="mt-4 flex items-baseline gap-3">
              <span className="font-mono text-3xl font-bold text-primary">{formatPrice(Number(p.price), p.currency)}</span>
              {p.compare_price && Number(p.compare_price) > Number(p.price) && (
                <span className="text-lg text-muted-foreground line-through">{formatPrice(Number(p.compare_price), p.currency)}</span>
              )}
            </div>

            <div className="mt-3 flex flex-wrap items-center gap-2 text-xs">
              <span
                className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 font-semibold ${
                  oos ? "bg-muted text-muted-foreground" : low ? "bg-amber-500/15 text-amber-500" : "bg-emerald-500/15 text-emerald-500"
                }`}
              >
                <span className="h-1.5 w-1.5 rounded-full bg-current" aria-hidden />
                {oos ? t("product.unavailable") : low ? t("product.only_left").replace("{n}", String(remaining)) : t("product.in_stock")}
              </span>
              {digital && !oos && (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-2.5 py-1 font-semibold text-primary">
                  <Zap className="h-3 w-3" aria-hidden />
                  {t("product.instant_delivery")}
                </span>
              )}
            </div>

            {description && <p className="mt-6 whitespace-pre-line leading-relaxed text-foreground/80">{description}</p>}

            {(() => {
              const feats = (p.features as Record<string, unknown> | null) ?? {};
              const w = warrantyLabel(feats.warranty, lang, feats.warranty_custom);
              if (!w) return null;
              return (
                <div className="mt-6 flex items-center gap-3 rounded-xl border border-primary/20 bg-primary/5 px-4 py-3">
                  <ShieldCheck className="h-5 w-5 text-primary" aria-hidden />
                  <span className="text-sm text-muted-foreground">{WARRANTY_LABEL_I18N[lang]}:</span>
                  <span className="font-semibold text-primary">{w}</span>
                </div>
              );
            })()}

            {p.type === "subscription" && p.features && typeof p.features === "object" && (
              <div className="mt-6 space-y-3 rounded-xl border border-primary/20 bg-card/50 p-5">
                <div className="grid grid-cols-2 gap-3 text-sm">
                  {(p.features as any).channels && (
                    <div className="flex items-center gap-2"><Tv className="h-4 w-4 text-primary" aria-hidden /><span className="text-muted-foreground">{t("product.channels")}:</span><span className="font-mono">{(p.features as any).channels}</span></div>
                  )}
                  {(p.features as any).quality && (
                    <div className="flex items-center gap-2"><Sparkles className="h-4 w-4 text-primary" aria-hidden /><span className="text-muted-foreground">{t("product.quality")}:</span><span className="font-mono">{(p.features as any).quality}</span></div>
                  )}
                  {(p.features as any).duration_months && (
                    <div className="col-span-2 flex items-center gap-2"><Calendar className="h-4 w-4 text-primary" aria-hidden /><span className="text-muted-foreground">{t("product.duration")}:</span><span className="font-mono">{(p.features as any).duration_months} {t("product.months")}</span></div>
                  )}
                </div>

                {(p.features as any).downloader_code && (
                  <div className="rounded-lg border border-primary/30 bg-background/60 p-3">
                    <div className="mb-1 text-xs uppercase tracking-wider text-primary/80">{t("product.downloader_code")}</div>
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-mono text-2xl font-bold tracking-widest text-primary">{(p.features as any).downloader_code}</span>
                      <Button size="sm" variant="ghost" aria-label={t("product.copied")} onClick={() => { navigator.clipboard.writeText((p.features as any).downloader_code); toast.success(t("product.copied")); }}><Copy className="h-4 w-4" aria-hidden /></Button>
                    </div>
                  </div>
                )}

                {(p.features as any).app_download_url && (
                  <a href={(p.features as any).app_download_url} target="_blank" rel="noopener noreferrer" className="flex w-full items-center justify-center gap-2 rounded-lg border border-primary/30 bg-primary/10 px-4 py-2.5 text-sm font-medium text-primary transition hover:bg-primary/20">
                    <Download className="h-4 w-4" aria-hidden />
                    {t("product.download_app")}
                  </a>
                )}
              </div>
            )}

            <div className="mt-6 flex items-center gap-4">
              <div className="flex items-center rounded-md border border-primary/20">
                <button onClick={() => setQty(Math.max(1, qty - 1))} aria-label="-" className="min-h-11 px-4 py-2 hover:bg-primary/10">−</button>
                <span className="w-12 text-center font-mono" aria-live="polite">{qty}</span>
                <button onClick={() => setQty(qty + 1)} aria-label="+" className="min-h-11 px-4 py-2 hover:bg-primary/10">+</button>
              </div>
              <Button size="lg" disabled={oos} onClick={addToCart} className="min-h-11 flex-1 bg-primary text-background hover:bg-primary">
                <ShoppingCart className="me-2 h-4 w-4" aria-hidden />
                {oos ? t("product.unavailable") : t("shop.addToCart")}
              </Button>
            </div>

            {/* Fulfilment + trust */}
            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              <div className="rounded-xl border border-primary/15 bg-card/50 p-4">
                <div className="flex items-center gap-2 text-sm font-semibold">
                  {digital ? <Zap className="h-4 w-4 text-primary" aria-hidden /> : <Truck className="h-4 w-4 text-primary" aria-hidden />}
                  {digital ? t("product.instant_delivery") : t("product.shipping_info")}
                </div>
                <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground">
                  {digital ? t("product.digital_desc") : t("product.shipping_desc")}
                </p>
                {!digital && (
                  <div className="mt-2 flex items-center gap-1.5 text-xs text-muted-foreground">
                    <Store className="h-3.5 w-3.5 text-primary" aria-hidden /> Riffa Alhajiyat, Bahrain
                  </div>
                )}
                <Link to="/shipping-policy" className="mt-2 inline-block text-xs text-primary hover:underline">{t("product.view_policy")}</Link>
              </div>

              <div className="rounded-xl border border-primary/15 bg-card/50 p-4">
                <div className="flex items-center gap-2 text-sm font-semibold">
                  <RotateCcw className="h-4 w-4 text-primary" aria-hidden />
                  {t("product.returns")}
                </div>
                <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground">{t("product.returns_desc")}</p>
                <div className="mt-2 flex gap-3">
                  <Link to="/refund-policy" className="text-xs text-primary hover:underline">{t("product.view_policy")}</Link>
                  <Link to="/exchange-policy" className="text-xs text-primary hover:underline">{t("product.returns")}</Link>
                </div>
              </div>
            </div>

            <ul className="mt-4 grid gap-2 text-xs text-muted-foreground sm:grid-cols-2">
              <li className="flex items-center gap-2"><Lock className="h-3.5 w-3.5 text-primary" aria-hidden />{t("product.secure_payment")}</li>
              <li className="flex items-center gap-2"><MessageCircle className="h-3.5 w-3.5 text-primary" aria-hidden />{t("product.support")}</li>
            </ul>
          </div>
        </div>

        <ReviewSection productId={p.id} />

        <RelatedProducts productId={p.id} categoryId={p.category_id} />
        <RecentlyViewed excludeId={p.id} />
      </main>

      {/* Sticky mobile purchase bar */}
      <div className="fixed inset-x-0 bottom-16 z-40 border-t border-primary/20 bg-background/95 p-3 backdrop-blur-xl md:hidden">
        <div className="flex items-center gap-3">
          <div className="min-w-0">
            <div className="truncate text-[11px] text-muted-foreground">{name}</div>
            <div className="font-mono text-sm font-bold text-primary">{formatPrice(Number(p.price), p.currency)}</div>
          </div>
          <Button disabled={oos} onClick={addToCart} className="min-h-11 flex-1 bg-primary text-background hover:bg-primary">
            <ShoppingCart className="me-2 h-4 w-4" aria-hidden />
            {oos ? t("product.unavailable") : t("shop.addToCart")}
          </Button>
        </div>
      </div>
      <div className="h-20 md:hidden" aria-hidden />

      <Footer />
    </div>
  );
}
