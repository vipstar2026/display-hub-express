import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { PageShell } from "@/components/PageShell";
import { ProductCard } from "@/components/ProductCard";
import { ChevronRight, Zap, Tag, Gift, Truck, ShieldCheck, CreditCard, Headphones } from "lucide-react";
import iptvImg from "@/assets/iptv.jpg";
import dishImg from "@/assets/dish.jpg";
import cctvImg from "@/assets/cctv.jpg";
import heroImg from "@/assets/hero.jpg";
import { useI18n } from "@/lib/i18n";
import { PRODUCTS } from "@/lib/products";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "VIP STAR — Online Marketplace for IPTV, Dish & CCTV" },
      { name: "description", content: "Shop IPTV boxes, satellite dishes, CCTV cameras and accessories. Best prices, fast delivery, genuine products." },
      { property: "og:title", content: "VIP STAR Marketplace" },
      { property: "og:description", content: "Your one-stop online shop for satellite, IPTV and security electronics." },
      { property: "og:image", content: heroImg },
    ],
  }),
  component: HomePage,
});

const flashDeals = PRODUCTS.slice(0, 6);
const justForYou = PRODUCTS.slice(0, 12);

function useCountdown(targetMs: number) {
  const [now, setNow] = useState<number | null>(null);
  useEffect(() => {
    setNow(Date.now());
    const i = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(i);
  }, []);
  if (now === null) return { h: "--", m: "--", s: "--" };
  const diff = Math.max(0, targetMs - now);
  const h = Math.floor(diff / 3600000);
  const m = Math.floor((diff % 3600000) / 60000);
  const s = Math.floor((diff % 60000) / 1000);
  return { h: String(h).padStart(2, "0"), m: String(m).padStart(2, "0"), s: String(s).padStart(2, "0") };
}

function HomePage() {
  const { t } = useI18n();
  const [target] = useState(() => Date.now() + 8 * 3600 * 1000);
  const { h, m, s } = useCountdown(target);

  const sideCategories = [
    t("side.iptv"), t("side.dish"), t("side.cctv"), t("side.smartBox"),
    t("side.receivers"), t("side.cables"), t("side.mounts"), t("side.remotes"),
    t("side.network"), t("side.tools"),
  ];

  const categoryTiles = [
    { title: t("cat.iptv"), img: iptvImg, to: "/iptv" as const },
    { title: t("cat.dish"), img: dishImg, to: "/dish" as const },
    { title: t("cat.cctv"), img: cctvImg, to: "/cctv" as const },
    { title: t("cat.install"), img: heroImg, to: "/services" as const },
  ];

  const services = [
    { label: t("svc.delivery"), icon: Truck },
    { label: t("svc.warranty"), icon: ShieldCheck },
    { label: t("svc.easyPay"), icon: CreditCard },
    { label: t("svc.help"), icon: Headphones },
    { label: t("svc.vouchers"), icon: Tag },
    { label: t("svc.newArrivals"), icon: Zap },
    { label: t("svc.topBrands"), icon: Gift },
    { label: t("svc.bulk"), icon: ChevronRight },
  ];

  return (
    <PageShell>
      {/* Hero */}
      <section className="mx-auto max-w-7xl px-4 py-4">
        <div className="grid gap-3 lg:grid-cols-[220px_1fr_260px]">
          <aside className="hidden lg:block bg-card rounded-md border border-border shadow-card overflow-hidden">
            <ul className="py-1">
              {sideCategories.map((c) => (
                <li key={c}>
                  <Link to="/iptv" className="flex items-center justify-between px-4 py-2 text-sm text-foreground hover:bg-accent hover:text-brand transition-smooth">
                    <span>{c}</span>
                    <ChevronRight className="w-4 h-4 opacity-50 rtl:rotate-180" />
                  </Link>
                </li>
              ))}
            </ul>
          </aside>

          <div className="relative rounded-md overflow-hidden bg-gradient-brand h-[280px] md:h-[360px] shadow-card">
            <img src={heroImg} alt="" className="absolute inset-0 w-full h-full object-cover opacity-50" />
            <div className="relative h-full p-6 md:p-10 flex flex-col justify-center text-white">
              <span className="text-xs font-semibold uppercase tracking-widest bg-white/20 backdrop-blur w-fit px-2 py-1 rounded">{t("hero.megaSale")}</span>
              <h1 className="mt-3 text-3xl md:text-5xl font-extrabold leading-tight">{t("hero.upTo")} <span className="text-yellow-300">60% {t("hero.off")}</span></h1>
              <p className="mt-2 text-sm md:text-base text-white/90 max-w-md">{t("hero.desc")}</p>
              <div className="mt-5 flex gap-3">
                <Link to="/iptv" className="bg-white text-brand-dark font-semibold px-5 py-2.5 rounded-md text-sm hover:bg-yellow-300 transition-smooth">{t("hero.shop")}</Link>
                <Link to="/cctv" className="border border-white/60 text-white px-5 py-2.5 rounded-md text-sm hover:bg-white/10 transition-smooth">{t("hero.explore")}</Link>
              </div>
            </div>
          </div>

          <div className="hidden lg:flex flex-col gap-3">
            <div className="flex-1 rounded-md bg-card border border-border p-4 shadow-card flex items-center gap-3">
              <div className="w-12 h-12 grid place-items-center rounded-full bg-accent text-brand"><Gift className="w-6 h-6" /></div>
              <div>
                <div className="text-sm font-semibold">{t("promo.newUser")}</div>
                <div className="text-xs text-muted-foreground">{t("promo.newUserSub")}</div>
              </div>
            </div>
            <div className="flex-1 rounded-md bg-card border border-border p-4 shadow-card flex items-center gap-3">
              <div className="w-12 h-12 grid place-items-center rounded-full bg-accent text-brand"><Tag className="w-6 h-6" /></div>
              <div>
                <div className="text-sm font-semibold">{t("promo.dailyDeals")}</div>
                <div className="text-xs text-muted-foreground">{t("promo.dailyDealsSub")}</div>
              </div>
            </div>
            <div className="flex-1 rounded-md bg-card border border-border p-4 shadow-card flex items-center gap-3">
              <div className="w-12 h-12 grid place-items-center rounded-full bg-accent text-brand"><Truck className="w-6 h-6" /></div>
              <div>
                <div className="text-sm font-semibold">{t("promo.freeShip")}</div>
                <div className="text-xs text-muted-foreground">{t("promo.freeShipSub")}</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Service strip */}
      <section className="mx-auto max-w-7xl px-4">
        <div className="bg-card rounded-md border border-border shadow-card grid grid-cols-4 md:grid-cols-8 gap-2 p-4">
          {services.map((s) => (
            <button key={s.label} className="flex flex-col items-center gap-2 p-2 rounded hover:bg-accent transition-smooth">
              <div className="w-12 h-12 rounded-full bg-gradient-brand grid place-items-center text-white">
                <s.icon className="w-5 h-5" />
              </div>
              <span className="text-[11px] text-center text-foreground">{s.label}</span>
            </button>
          ))}
        </div>
      </section>

      {/* Flash Sale */}
      <section className="mx-auto max-w-7xl px-4 mt-6">
        <div className="bg-card rounded-md border border-border shadow-card overflow-hidden">
          <div className="bg-gradient-flash text-white px-4 py-3 flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-3">
              <Zap className="w-6 h-6 fill-yellow-300 text-yellow-300" />
              <span className="text-xl font-extrabold tracking-tight">{t("flash.title")}</span>
              <span className="hidden sm:inline text-sm opacity-90">{t("flash.onSale")}</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <span className="opacity-90">{t("flash.endsIn")}</span>
              <span className="bg-black/80 text-white font-mono font-bold px-2 py-1 rounded text-sm tabular-nums">{h}</span>
              <span>:</span>
              <span className="bg-black/80 text-white font-mono font-bold px-2 py-1 rounded text-sm tabular-nums">{m}</span>
              <span>:</span>
              <span className="bg-black/80 text-white font-mono font-bold px-2 py-1 rounded text-sm tabular-nums">{s}</span>
              <Link to="/iptv" className="ms-3 text-white/90 hover:text-white flex items-center text-sm">{t("flash.shopAll")} <ChevronRight className="w-4 h-4 rtl:rotate-180" /></Link>
            </div>
          </div>
          <div className="p-3 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            {flashDeals.map((p) => (
              <ProductCard key={p.id} {...p} />
            ))}
          </div>
        </div>
      </section>

      {/* Categories */}
      <section className="mx-auto max-w-7xl px-4 mt-6">
        <div className="bg-card rounded-md border border-border shadow-card p-4">
          <h2 className="text-lg font-bold text-foreground mb-4">{t("cat.title")}</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {categoryTiles.map((c) => (
              <Link key={c.title} to={c.to} className="group rounded-md overflow-hidden border border-border bg-card product-card-hover">
                <div className="aspect-[4/3] overflow-hidden bg-secondary">
                  <img src={c.img} alt={c.title} loading="lazy" className="w-full h-full object-cover group-hover:scale-105 transition-smooth" />
                </div>
                <div className="p-3 flex items-center justify-between">
                  <span className="text-sm font-semibold text-foreground group-hover:text-brand">{c.title}</span>
                  <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-brand rtl:rotate-180" />
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Just For You */}
      <section className="mx-auto max-w-7xl px-4 mt-6 mb-10">
        <div className="bg-gradient-brand text-white px-4 py-3 rounded-t-md flex items-center justify-between">
          <h2 className="text-lg font-extrabold tracking-tight">{t("jfu.title")}</h2>
          <span className="text-xs opacity-90">{t("jfu.sub")}</span>
        </div>
        <div className="bg-card border border-border border-t-0 rounded-b-md p-3 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
          {justForYou.map((p) => (
            <ProductCard key={p.id} {...p} />
          ))}
        </div>
        <div className="mt-4 text-center">
          <button className="px-6 py-2.5 border-2 border-brand text-brand font-semibold rounded-md hover:bg-brand hover:text-white transition-smooth text-sm">
            {t("jfu.loadMore")}
          </button>
        </div>
      </section>
    </PageShell>
  );
}
