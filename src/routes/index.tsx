import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { ProductCard } from "@/components/ProductCard";
import { useI18n, localizedName } from "@/lib/i18n";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { ArrowRight, ShieldCheck, Truck, Headphones, Satellite, Phone, Mail, MapPin, Instagram, MessageCircle, BadgeCheck } from "lucide-react";
import { HeroBanners } from "@/components/HeroBanners";
import { FlashSalesSection } from "@/components/FlashSalesSection";
import { cleanPhoneNumber, pickLocalized, socialHandle, useSiteSettings } from "@/lib/site-settings";
import { waAnchorProps } from "@/lib/whatsapp";

export const Route = createFileRoute("/")({
  component: HomePage,
  head: () => ({
    meta: [
      { title: "VIPSTAR Bahrain | Satellite Receivers, Dishes & IPTV" },
      { name: "description", content: "Shop satellite receivers, dishes, LNBs, IPTV subscriptions and accessories in Bahrain. Discover VIPSTAR products with reliable delivery and customer support." },
      { property: "og:title", content: "VIPSTAR — Satellite & IPTV Store" },
      { property: "og:description", content: "Premium satellite receivers, dishes, LNB, IPTV subscriptions and accessories in Bahrain." },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "https://vipstar.cc/" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [{ rel: "canonical", href: "https://vipstar.cc/" }],
    scripts: [{
      type: "application/ld+json",
      children: JSON.stringify({
        "@context": "https://schema.org",
        "@type": "Organization",
        name: "VIPSTAR",
        url: "https://vipstar.cc",
        address: { "@type": "PostalAddress", addressCountry: "BH" },
      }),
    }],
  }),
});

function HomePage() {
  const { t, lang } = useI18n();

  const { data: categories } = useQuery({
    queryKey: ["home-categories"],
    queryFn: async () => {
      const { data } = await supabase.from("categories").select("*").eq("is_active", true).order("sort_order");
      return data ?? [];
    },
  });

  const { data: featured } = useQuery({
    queryKey: ["home-featured"],
    queryFn: async () => {
      const { data } = await supabase.from("products").select("*").eq("status", "active").eq("is_featured", true).limit(8);
      return data ?? [];
    },
  });

  const { data: latest } = useQuery({
    queryKey: ["home-latest"],
    queryFn: async () => {
      const { data } = await supabase.from("products").select("*").eq("status", "active").order("created_at", { ascending: false }).limit(8);
      return data ?? [];
    },
  });

  const { data: settings } = useSiteSettings();

  const tagline = pickLocalized(lang, { ar: settings?.tagline_ar, en: settings?.tagline_en, ur: settings?.tagline_ur, bn: settings?.tagline_bn });
  const heroBadge = settings?.hero_badge_text || "VIPSTAR.CC";
  const heroTitle = pickLocalized(lang, { ar: settings?.hero_title_ar, en: settings?.hero_title_en, ur: settings?.hero_title_ur, bn: settings?.hero_title_bn }) || t("home.hero.title");
  const heroSub = pickLocalized(lang, { ar: settings?.hero_subtitle_ar, en: settings?.hero_subtitle_en, ur: settings?.hero_subtitle_ur, bn: settings?.hero_subtitle_bn }) || t("home.hero.sub");
  const heroCta = pickLocalized(lang, { ar: settings?.hero_cta_ar, en: settings?.hero_cta_en, ur: settings?.hero_cta_ur, bn: settings?.hero_cta_bn }) || t("home.hero.cta");
  const whatsappNumber = cleanPhoneNumber(settings?.whatsapp);
  const instagramLabel = socialHandle(settings?.instagram_url, "Instagram");



  return (
    <div className="min-h-screen bg-background">
      <Header />

      <HeroBanners />



      {/* Hero */}
      <section className="relative overflow-hidden border-b border-primary/20">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-purple-500/10" />
        <div className="absolute inset-0 opacity-30" style={{ backgroundImage: "radial-gradient(circle at 20% 50%, rgba(0,217,255,0.2) 0%, transparent 50%), radial-gradient(circle at 80% 80%, rgba(168,85,247,0.15) 0%, transparent 50%)" }} />
        <div className="container relative mx-auto grid gap-8 px-4 py-16 md:grid-cols-2 md:py-24">
          <div className="flex flex-col justify-center">
            <div className="mb-4 inline-flex w-fit items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs font-mono text-primary">
              <span className="h-2 w-2 animate-pulse rounded-full bg-primary" />
              {heroBadge}
            </div>
            <h1 className="font-display text-4xl font-bold leading-tight md:text-6xl">
              <span className="bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">{heroTitle}</span>
            </h1>
            <p className="mt-4 text-base text-muted-foreground md:text-lg">{heroSub}</p>
            <div className="mt-6 flex gap-3">
              <Link to="/shop">
                <Button size="lg" className="bg-primary text-background hover:bg-primary">
                  {heroCta} <ArrowRight className="ms-2 h-4 w-4 rtl:rotate-180" />
                </Button>
              </Link>
            </div>
          </div>
          <div className="hidden items-center justify-center md:flex">
            <div className="relative">
              <Satellite className="h-64 w-64 text-primary/60" strokeWidth={1} />
              <div className="absolute inset-0 animate-pulse rounded-full bg-primary/20 blur-3xl" />
            </div>
          </div>
        </div>
      </section>

      <FlashSalesSection />

      {/* Categories */}
      <section className="container mx-auto px-4 py-12">
        <h2 className="mb-6 font-display text-2xl font-bold">{t("home.cats")}</h2>
        <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-6">
          {(categories ?? []).map((c) => (
            <Link key={c.id} to="/shop" search={{ category: c.slug }} className="group rounded-xl border border-primary/10 bg-card p-4 text-center transition hover:border-primary/40 hover:bg-primary/5">
              <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 text-primary group-hover:bg-primary/20">
                <Satellite className="h-5 w-5" />
              </div>
              <div className="text-sm font-medium">{localizedName(c, "name", lang)}</div>
            </Link>
          ))}
        </div>
      </section>

      {/* Featured */}
      {featured && featured.length > 0 && (
        <section className="container mx-auto px-4 py-8">
          <h2 className="mb-6 font-display text-2xl font-bold">{t("home.featured")}</h2>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
            {featured.map((p) => <ProductCard key={p.id} p={p} />)}
          </div>
        </section>
      )}

      {/* Latest */}
      {latest && latest.length > 0 && (
        <section className="container mx-auto px-4 py-8">
          <h2 className="mb-6 font-display text-2xl font-bold">{t("shop.all")}</h2>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
            {latest.map((p) => <ProductCard key={p.id} p={p} />)}
          </div>
        </section>
      )}

      {/* Why */}
      <section className="border-t border-primary/20 bg-card/30 py-12">
        <div className="container mx-auto grid gap-6 px-4 md:grid-cols-3">
          {[
            { icon: ShieldCheck, k: "1" },
            { icon: Truck, k: "2" },
            { icon: Headphones, k: "3" },
          ].map(({ icon: Icon, k }) => (
            <div key={k} className="rounded-xl border border-primary/10 bg-card p-6 text-center">
              <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <Icon className="h-6 w-6" />
              </div>
              <h3 className="mb-1 font-semibold">{t(`home.why.${k}.t`)}</h3>
              <p className="text-sm text-muted-foreground">{t(`home.why.${k}.d`)}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Business Info / Contact */}
      <section className="border-t border-primary/20 bg-gradient-to-b from-background to-primary/5 py-16">
        <div className="container mx-auto px-4">
          <div className="mx-auto max-w-5xl overflow-hidden rounded-2xl border border-primary/20 bg-card/60 shadow-[0_0_60px_-15px_rgba(0,217,255,0.3)] backdrop-blur">
            <div className="grid gap-0 md:grid-cols-[1.1fr_1fr]">
              {/* Left brand panel */}
              <div className="relative flex flex-col justify-center gap-4 bg-gradient-to-br from-primary/15 via-transparent to-purple-500/10 p-8 md:p-10">
                <div className="inline-flex w-fit items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs font-mono text-primary">
                  <BadgeCheck className="h-3 w-3" /> {settings?.company_cr ?? "CR-158814-1"}
                </div>
                <h2 className="font-display text-3xl font-bold leading-tight md:text-4xl">
                  <span className="bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
                    {settings?.site_name ?? "VIPSTAR"}
                  </span>
                </h2>
                {tagline && <p className="text-sm text-muted-foreground md:text-base">{tagline}</p>}
                <div className="mt-2 flex flex-wrap gap-2 text-xs">
                  {["CCTV", "Dish Repair", "IPTV", "beIN Sports", "Satellite"].map((tag) => (
                    <span key={tag} className="rounded-full border border-primary/20 bg-primary/5 px-3 py-1 text-primary">{tag}</span>
                  ))}
                </div>
              </div>

              {/* Right contact panel */}
              <div className="grid gap-3 p-8 md:p-10">
                {settings?.whatsapp && whatsappNumber && (
                  <a {...waAnchorProps(settings.whatsapp)} className="group flex items-center gap-3 rounded-lg border border-primary/10 bg-background/40 p-3 transition hover:border-primary/40 hover:bg-primary/5">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/15 text-primary"><MessageCircle className="h-5 w-5" /></div>
                    <div className="flex-1"><div className="text-xs text-muted-foreground">WhatsApp</div><div className="font-mono text-sm font-semibold" dir="ltr">{settings.whatsapp}</div></div>
                  </a>
                )}
                {settings?.contact_phone && (
                  <a href={`tel:${settings.contact_phone}`} className="group flex items-center gap-3 rounded-lg border border-primary/10 bg-background/40 p-3 transition hover:border-primary/40 hover:bg-primary/5">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/15 text-primary"><Phone className="h-5 w-5" /></div>
                    <div className="flex-1"><div className="text-xs text-muted-foreground">Phone</div><div className="font-mono text-sm font-semibold" dir="ltr">{settings.contact_phone}</div></div>
                  </a>
                )}
                {settings?.contact_email && (
                  <a href={`mailto:${settings.contact_email}`} className="group flex items-center gap-3 rounded-lg border border-primary/10 bg-background/40 p-3 transition hover:border-primary/40 hover:bg-primary/5">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/15 text-primary"><Mail className="h-5 w-5" /></div>
                    <div className="flex-1"><div className="text-xs text-muted-foreground">Email</div><div className="font-mono text-sm font-semibold" dir="ltr">{settings.contact_email}</div></div>
                  </a>
                )}
                {settings?.instagram_url && (
                  <a href={settings.instagram_url} target="_blank" rel="noreferrer" className="group flex items-center gap-3 rounded-lg border border-primary/10 bg-background/40 p-3 transition hover:border-primary/40 hover:bg-primary/5">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/15 text-primary"><Instagram className="h-5 w-5" /></div>
                    <div className="flex-1"><div className="text-xs text-muted-foreground">Instagram</div><div className="font-mono text-sm font-semibold" dir="ltr">{instagramLabel}</div></div>
                  </a>
                )}
                {settings?.company_address && (
                  <div className="flex items-start gap-3 rounded-lg border border-primary/10 bg-background/40 p-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/15 text-primary"><MapPin className="h-5 w-5" /></div>
                    <div className="flex-1"><div className="text-xs text-muted-foreground">Address</div><div className="text-sm font-medium leading-snug">{settings.company_address}</div></div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      <Footer />

    </div>
  );
}
