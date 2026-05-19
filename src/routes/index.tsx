import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { PageShell } from "@/components/PageShell";
import { ProductCard } from "@/components/ProductCard";
import { ChevronRight, Zap, Tag, Gift, Truck, ShieldCheck, CreditCard, Headphones } from "lucide-react";
import iptvImg from "@/assets/iptv.jpg";
import dishImg from "@/assets/dish.jpg";
import cctvImg from "@/assets/cctv.jpg";
import heroImg from "@/assets/hero.jpg";

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

const sideCategories = [
  "IPTV & Streaming",
  "Satellite Dish",
  "CCTV & Security",
  "Smart TV Boxes",
  "Receivers & Decoders",
  "Cables & Connectors",
  "Mounts & Brackets",
  "Remote Controls",
  "Network Equipment",
  "Installation Tools",
];

const flashDeals = [
  { name: "MAG 524 4K IPTV Box with Wi-Fi 6", price: "QAR 199", oldPrice: "QAR 320", discount: "38%", image: iptvImg, rating: 5, sold: 1240, freeShipping: true },
  { name: "Hikvision 2MP Dome CCTV Camera", price: "QAR 99", oldPrice: "QAR 150", discount: "34%", image: cctvImg, rating: 5, sold: 850, badge: "Hot" },
  { name: "Solid 6ft Satellite Dish + LNB Kit", price: "QAR 159", oldPrice: "QAR 240", discount: "34%", image: dishImg, rating: 4, sold: 420 },
  { name: "Formuler Z11 Pro Android IPTV", price: "QAR 349", oldPrice: "QAR 499", discount: "30%", image: iptvImg, rating: 5, sold: 2100, badge: "Best Seller", freeShipping: true },
  { name: "WiFi Smart Security Camera 1080p", price: "QAR 79", oldPrice: "QAR 119", discount: "33%", image: cctvImg, rating: 4, sold: 1530, freeShipping: true },
  { name: "Ku-Band Universal LNB", price: "QAR 29", oldPrice: "QAR 45", discount: "35%", image: dishImg, rating: 4, sold: 660 },
];

const categoryTiles = [
  { title: "IPTV", img: iptvImg, to: "/iptv" },
  { title: "Dish Antenna", img: dishImg, to: "/dish" },
  { title: "CCTV Cameras", img: cctvImg, to: "/cctv" },
  { title: "Installation", img: heroImg, to: "/services" },
];

const justForYou = [
  { name: "4K UHD Satellite Receiver with Wi-Fi & YouTube", price: "QAR 220", oldPrice: "QAR 320", discount: "31%", image: dishImg, rating: 5, sold: 380, freeShipping: true },
  { name: "Dahua 4MP Bullet Outdoor Color Night Vision", price: "QAR 145", oldPrice: "QAR 210", discount: "30%", image: cctvImg, rating: 5, sold: 290 },
  { name: "Xtream Mini IPTV Box Full HD Streaming", price: "QAR 119", oldPrice: "QAR 180", discount: "33%", image: iptvImg, rating: 4, sold: 510, freeShipping: true },
  { name: "16-Channel NVR with Cloud Backup", price: "QAR 399", oldPrice: "QAR 560", discount: "28%", image: cctvImg, rating: 5, sold: 95 },
  { name: "Premium Coaxial Cable 100ft Copper Core", price: "QAR 49", oldPrice: "QAR 75", discount: "34%", image: dishImg, rating: 4, sold: 720 },
  { name: "4 Camera CCTV Combo Package + Installation", price: "QAR 599", oldPrice: "QAR 850", discount: "29%", image: cctvImg, rating: 5, sold: 180, badge: "Combo" },
  { name: "Universal Dish Mount Kit Heavy Duty", price: "QAR 25", oldPrice: "QAR 40", discount: "37%", image: dishImg, rating: 4, sold: 1100, freeShipping: true },
  { name: "HD Satellite Receiver Pro with USB Record", price: "QAR 89", oldPrice: "QAR 130", discount: "31%", image: dishImg, rating: 4, sold: 640 },
  { name: "IPTV Premium Subscription 12 Months 500+ Ch", price: "QAR 299", oldPrice: "QAR 450", discount: "33%", image: iptvImg, rating: 5, sold: 3200, badge: "Top", freeShipping: true },
  { name: "8-Channel DVR with 1TB HDD Slot", price: "QAR 229", oldPrice: "QAR 330", discount: "30%", image: cctvImg, rating: 4, sold: 410 },
  { name: "Wireless Indoor Pan Tilt Smart Camera", price: "QAR 109", oldPrice: "QAR 160", discount: "31%", image: cctvImg, rating: 5, sold: 870, freeShipping: true },
  { name: "Backlit Universal Remote for IPTV Boxes", price: "QAR 35", oldPrice: "QAR 55", discount: "36%", image: iptvImg, rating: 4, sold: 530 },
];

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
  // Flash sale ends in 8 hours from page load (stable target)
  const [target] = useState(() => Date.now() + 8 * 3600 * 1000);
  const { h, m, s } = useCountdown(target);

  return (
    <PageShell>
      {/* Hero block: side categories + main banner + promo cards */}
      <section className="mx-auto max-w-7xl px-4 py-4">
        <div className="grid gap-3 lg:grid-cols-[220px_1fr_260px]">
          {/* Side categories */}
          <aside className="hidden lg:block bg-card rounded-md border border-border shadow-card overflow-hidden">
            <ul className="py-1">
              {sideCategories.map((c) => (
                <li key={c}>
                  <Link to="/iptv" className="flex items-center justify-between px-4 py-2 text-sm text-foreground hover:bg-accent hover:text-brand transition-smooth">
                    <span>{c}</span>
                    <ChevronRight className="w-4 h-4 opacity-50" />
                  </Link>
                </li>
              ))}
            </ul>
          </aside>

          {/* Hero banner */}
          <div className="relative rounded-md overflow-hidden bg-gradient-brand h-[280px] md:h-[360px] shadow-card">
            <img src={heroImg} alt="" className="absolute inset-0 w-full h-full object-cover opacity-50" />
            <div className="relative h-full p-6 md:p-10 flex flex-col justify-center text-white">
              <span className="text-xs font-semibold uppercase tracking-widest bg-white/20 backdrop-blur w-fit px-2 py-1 rounded">Mega Sale</span>
              <h1 className="mt-3 text-3xl md:text-5xl font-extrabold leading-tight">Up to <span className="text-yellow-300">60% OFF</span></h1>
              <p className="mt-2 text-sm md:text-base text-white/90 max-w-md">On all IPTV boxes, Dish antennas and CCTV cameras. Limited time only.</p>
              <div className="mt-5 flex gap-3">
                <Link to="/iptv" className="bg-white text-brand-dark font-semibold px-5 py-2.5 rounded-md text-sm hover:bg-yellow-300 transition-smooth">Shop Now</Link>
                <Link to="/cctv" className="border border-white/60 text-white px-5 py-2.5 rounded-md text-sm hover:bg-white/10 transition-smooth">Explore</Link>
              </div>
            </div>
          </div>

          {/* Promo stack */}
          <div className="hidden lg:flex flex-col gap-3">
            <div className="flex-1 rounded-md bg-card border border-border p-4 shadow-card flex items-center gap-3">
              <div className="w-12 h-12 grid place-items-center rounded-full bg-accent text-brand"><Gift className="w-6 h-6" /></div>
              <div>
                <div className="text-sm font-semibold">New User Voucher</div>
                <div className="text-xs text-muted-foreground">QAR 50 off your first order</div>
              </div>
            </div>
            <div className="flex-1 rounded-md bg-card border border-border p-4 shadow-card flex items-center gap-3">
              <div className="w-12 h-12 grid place-items-center rounded-full bg-accent text-brand"><Tag className="w-6 h-6" /></div>
              <div>
                <div className="text-sm font-semibold">Daily Deals</div>
                <div className="text-xs text-muted-foreground">Fresh discounts every day</div>
              </div>
            </div>
            <div className="flex-1 rounded-md bg-card border border-border p-4 shadow-card flex items-center gap-3">
              <div className="w-12 h-12 grid place-items-center rounded-full bg-accent text-brand"><Truck className="w-6 h-6" /></div>
              <div>
                <div className="text-sm font-semibold">Free Shipping</div>
                <div className="text-xs text-muted-foreground">On orders above QAR 200</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Quick services strip */}
      <section className="mx-auto max-w-7xl px-4">
        <div className="bg-card rounded-md border border-border shadow-card grid grid-cols-4 md:grid-cols-8 gap-2 p-4">
          {[
            { label: "Free Delivery", icon: Truck },
            { label: "Warranty", icon: ShieldCheck },
            { label: "Easy Pay", icon: CreditCard },
            { label: "24/7 Help", icon: Headphones },
            { label: "Vouchers", icon: Tag },
            { label: "New Arrivals", icon: Zap },
            { label: "Top Brands", icon: Gift },
            { label: "Bulk Orders", icon: ChevronRight },
          ].map((s) => (
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
              <span className="text-xl font-extrabold tracking-tight">FLASH SALE</span>
              <span className="hidden sm:inline text-sm opacity-90">On Sale Now</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <span className="opacity-90">Ends in</span>
              <span className="bg-black/80 text-white font-mono font-bold px-2 py-1 rounded text-sm tabular-nums">{h}</span>
              <span>:</span>
              <span className="bg-black/80 text-white font-mono font-bold px-2 py-1 rounded text-sm tabular-nums">{m}</span>
              <span>:</span>
              <span className="bg-black/80 text-white font-mono font-bold px-2 py-1 rounded text-sm tabular-nums">{s}</span>
              <Link to="/iptv" className="ml-3 text-white/90 hover:text-white flex items-center text-sm">SHOP ALL <ChevronRight className="w-4 h-4" /></Link>
            </div>
          </div>
          <div className="p-3 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            {flashDeals.map((p) => (
              <ProductCard key={p.name} {...p} />
            ))}
          </div>
        </div>
      </section>

      {/* Category tiles */}
      <section className="mx-auto max-w-7xl px-4 mt-6">
        <div className="bg-card rounded-md border border-border shadow-card p-4">
          <h2 className="text-lg font-bold text-foreground mb-4">Categories</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {categoryTiles.map((c) => (
              <Link key={c.title} to={c.to} className="group rounded-md overflow-hidden border border-border bg-card product-card-hover">
                <div className="aspect-[4/3] overflow-hidden bg-secondary">
                  <img src={c.img} alt={c.title} loading="lazy" className="w-full h-full object-cover group-hover:scale-105 transition-smooth" />
                </div>
                <div className="p-3 flex items-center justify-between">
                  <span className="text-sm font-semibold text-foreground group-hover:text-brand">{c.title}</span>
                  <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-brand" />
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Just For You */}
      <section className="mx-auto max-w-7xl px-4 mt-6 mb-10">
        <div className="bg-gradient-brand text-white px-4 py-3 rounded-t-md flex items-center justify-between">
          <h2 className="text-lg font-extrabold tracking-tight">JUST FOR YOU</h2>
          <span className="text-xs opacity-90">Recommended picks</span>
        </div>
        <div className="bg-card border border-border border-t-0 rounded-b-md p-3 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
          {justForYou.map((p) => (
            <ProductCard key={p.name} {...p} />
          ))}
        </div>
        <div className="mt-4 text-center">
          <button className="px-6 py-2.5 border-2 border-brand text-brand font-semibold rounded-md hover:bg-brand hover:text-white transition-smooth text-sm">
            Load More
          </button>
        </div>
      </section>
    </PageShell>
  );
}
