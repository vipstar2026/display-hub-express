import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { ProductCard } from "@/components/ProductCard";
import { useI18n, localizedName } from "@/lib/i18n";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { ArrowRight, ShieldCheck, Truck, Headphones, Satellite } from "lucide-react";

export const Route = createFileRoute("/")({
  component: HomePage,
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

  return (
    <div className="min-h-screen bg-background">
      <Header />

      {/* Hero */}
      <section className="relative overflow-hidden border-b border-cyan-500/20">
        <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/10 via-transparent to-purple-500/10" />
        <div className="absolute inset-0 opacity-30" style={{ backgroundImage: "radial-gradient(circle at 20% 50%, rgba(0,217,255,0.2) 0%, transparent 50%), radial-gradient(circle at 80% 80%, rgba(168,85,247,0.15) 0%, transparent 50%)" }} />
        <div className="container relative mx-auto grid gap-8 px-4 py-16 md:grid-cols-2 md:py-24">
          <div className="flex flex-col justify-center">
            <div className="mb-4 inline-flex w-fit items-center gap-2 rounded-full border border-cyan-500/30 bg-cyan-500/10 px-3 py-1 text-xs font-mono text-cyan-300">
              <span className="h-2 w-2 animate-pulse rounded-full bg-cyan-400" />
              VIPSTAR.CC
            </div>
            <h1 className="font-display text-4xl font-bold leading-tight md:text-6xl">
              <span className="bg-gradient-to-r from-cyan-400 to-cyan-200 bg-clip-text text-transparent">{t("home.hero.title")}</span>
            </h1>
            <p className="mt-4 text-base text-muted-foreground md:text-lg">{t("home.hero.sub")}</p>
            <div className="mt-6 flex gap-3">
              <Link to="/shop">
                <Button size="lg" className="bg-cyan-500 text-background hover:bg-cyan-400">
                  {t("home.hero.cta")} <ArrowRight className="ms-2 h-4 w-4 rtl:rotate-180" />
                </Button>
              </Link>
            </div>
          </div>
          <div className="hidden items-center justify-center md:flex">
            <div className="relative">
              <Satellite className="h-64 w-64 text-cyan-400/60" strokeWidth={1} />
              <div className="absolute inset-0 animate-pulse rounded-full bg-cyan-500/20 blur-3xl" />
            </div>
          </div>
        </div>
      </section>

      {/* Categories */}
      <section className="container mx-auto px-4 py-12">
        <h2 className="mb-6 font-display text-2xl font-bold">{t("home.cats")}</h2>
        <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-6">
          {(categories ?? []).map((c) => (
            <Link key={c.id} to="/shop" search={{ category: c.slug }} className="group rounded-xl border border-cyan-500/10 bg-card p-4 text-center transition hover:border-cyan-500/40 hover:bg-cyan-500/5">
              <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-lg bg-cyan-500/10 text-cyan-400 group-hover:bg-cyan-500/20">
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
          <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
            {latest.map((p) => <ProductCard key={p.id} p={p} />)}
          </div>
        </section>
      )}

      {/* Why */}
      <section className="border-t border-cyan-500/20 bg-card/30 py-12">
        <div className="container mx-auto grid gap-6 px-4 md:grid-cols-3">
          {[
            { icon: ShieldCheck, k: "1" },
            { icon: Truck, k: "2" },
            { icon: Headphones, k: "3" },
          ].map(({ icon: Icon, k }) => (
            <div key={k} className="rounded-xl border border-cyan-500/10 bg-card p-6 text-center">
              <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-lg bg-cyan-500/10 text-cyan-400">
                <Icon className="h-6 w-6" />
              </div>
              <h3 className="mb-1 font-semibold">{t(`home.why.${k}.t`)}</h3>
              <p className="text-sm text-muted-foreground">{t(`home.why.${k}.d`)}</p>
            </div>
          ))}
        </div>
      </section>

      <Footer />
    </div>
  );
}
