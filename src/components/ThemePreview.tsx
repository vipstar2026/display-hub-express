import { useState } from "react";
import { THEME_PRESETS, DEFAULT_THEME } from "@/lib/themes";
import { Star, ShoppingCart, Check, Search, ShieldCheck, Truck, Trash2, Plus, Minus, Filter } from "lucide-react";
import { useI18n } from "@/lib/i18n";

type Props = {
  themeId: string;
  savedId: string;
  onReset: () => void;
};

type View = "home" | "product" | "category" | "cart";

export function ThemePreview({ themeId, savedId, onReset }: Props) {
  const { t, dir } = useI18n();
  const preset = THEME_PRESETS[themeId] ?? THEME_PRESETS[DEFAULT_THEME];
  const v = preset.vars;
  const dirty = themeId !== savedId;
  const [view, setView] = useState<View>("home");

  const panelStyle = v as unknown as React.CSSProperties;

  const tabs: { id: View; label: string }[] = [
    { id: "home", label: t("preview.tab.home") },
    { id: "product", label: t("preview.tab.product") },
    { id: "category", label: t("preview.tab.category") },
    { id: "cart", label: t("preview.tab.cart") },
  ];

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-primary">{t("preview.title")}</span>
          {dirty && (
            <span className="rounded-full bg-yellow-500/15 px-2 py-0.5 text-[10px] font-medium text-yellow-300">
              {t("preview.unsaved")}
            </span>
          )}
        </div>
        {dirty && (
          <button type="button" onClick={onReset} className="text-xs text-muted-foreground underline-offset-2 hover:underline">
            {t("preview.reset")}
          </button>
        )}
      </div>

      {/* View tabs */}
      <div className="flex flex-wrap gap-1 rounded-lg border bg-muted/30 p-1">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setView(tab.id)}
            className={`flex-1 rounded-md px-3 py-1.5 text-xs font-medium transition ${
              view === tab.id ? "bg-primary text-primary-foreground shadow" : "text-muted-foreground hover:bg-background/50"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div dir={dir} style={panelStyle} className="overflow-hidden rounded-2xl border">
        {/* Shared topbar */}
        <div style={{ background: v["--card"], borderColor: v["--border"], color: v["--foreground"] }} className="border-b p-4">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg" style={{ background: v["--brand"], color: v["--brand-foreground"] }}>
                <Star className="h-4 w-4" />
              </div>
              <div className="font-display text-sm font-bold">VIP STAR</div>
            </div>
            <div className="hidden gap-4 text-xs sm:flex" style={{ color: v["--muted-foreground"] }}>
              <span>{t("nav.home")}</span><span>{t("nav.shop")}</span><span>IPTV</span><span>{t("settings.tab.contact")}</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1 rounded-lg px-2 py-1 text-xs" style={{ background: v["--input"], color: v["--muted-foreground"] }}>
                <Search className="h-3 w-3" /> {t("preview.search")}
              </div>
              <div className="relative flex h-8 w-8 items-center justify-center rounded-lg" style={{ background: v["--secondary"] }}>
                <ShoppingCart className="h-4 w-4" />
                <span className="absolute -end-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full px-1 text-[10px] font-bold" style={{ background: v["--brand"], color: v["--brand-foreground"] }}>3</span>
              </div>
            </div>
          </div>
        </div>

        {view === "home" && <HomeView v={v} t={t} />}
        {view === "product" && <ProductView v={v} t={t} />}
        {view === "category" && <CategoryView v={v} t={t} />}
        {view === "cart" && <CartView v={v} t={t} />}
      </div>
    </div>
  );
}

type V = Record<string, string>;
type T = (k: string) => string;

function HomeView({ v, t }: { v: V; t: T }) {
  return (
    <>
      <div style={{ background: v["--gradient-hero"], color: v["--foreground"] }} className="p-5">
        <div className="mb-1 inline-block rounded-full px-2 py-0.5 text-[10px] font-semibold" style={{ background: v["--sale"], color: "#000" }}>{t("preview.hero_badge")}</div>
        <h3 className="font-display text-lg font-bold">{t("preview.hero_title")}</h3>
        <p className="text-xs" style={{ color: v["--muted-foreground"] }}>{t("preview.hero_sub")}</p>
        <div className="mt-3 flex gap-2">
          <button className="rounded-lg px-3 py-1.5 text-xs font-semibold" style={{ background: v["--brand"], color: v["--brand-foreground"], boxShadow: v["--shadow-glow"] }}>{t("preview.shop_now")}</button>
          <button className="rounded-lg border px-3 py-1.5 text-xs" style={{ borderColor: v["--border"], color: v["--foreground"] }}>{t("preview.learn_more")}</button>
        </div>
      </div>
      <div style={{ background: v["--background"] }} className="grid grid-cols-3 gap-2 p-3">
        {[0, 1, 2].map((i) => (
          <div key={i} className="overflow-hidden rounded-xl border" style={{ background: v["--card"], borderColor: v["--border"], boxShadow: v["--shadow-card"] }}>
            <div className="aspect-square" style={{ background: `linear-gradient(135deg, ${v["--secondary"]}, ${v["--muted"]})` }} />
            <div className="space-y-1 p-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-medium" style={{ color: v["--muted-foreground"] }}>{t("preview.receiver")}</span>
                {i === 1 && <span className="rounded px-1 text-[9px] font-bold" style={{ background: v["--sale"], color: "#000" }}>-20%</span>}
              </div>
              <div className="truncate text-xs font-semibold" style={{ color: v["--foreground"] }}>Max 4K Pro</div>
              <div className="text-xs font-bold" style={{ color: v["--brand"] }}>BHD 24.900</div>
            </div>
          </div>
        ))}
      </div>
      <div style={{ background: v["--card"], borderColor: v["--border"] }} className="flex flex-wrap items-center gap-2 border-t p-3">
        <span className="rounded-full px-2 py-0.5 text-[10px] font-semibold" style={{ background: v["--brand"], color: v["--brand-foreground"] }}>{t("preview.primary")}</span>
        <span className="rounded-full px-2 py-0.5 text-[10px] font-semibold" style={{ background: v["--accent2"], color: "#fff" }}>{t("preview.secondary")}</span>
        <span className="rounded-full px-2 py-0.5 text-[10px] font-semibold" style={{ background: v["--sale"], color: "#000" }}>{t("preview.sale")}</span>
        <span className="inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px]" style={{ borderColor: v["--border"], color: v["--muted-foreground"] }}>
          <Check className="h-3 w-3" style={{ color: v["--brand"] }} /> {t("preview.available")}
        </span>
      </div>
    </>
  );
}

function ProductView({ v, t }: { v: V; t: T }) {
  return (
    <div style={{ background: v["--background"], color: v["--foreground"] }} className="p-4">
      <div className="mb-3 text-[10px]" style={{ color: v["--muted-foreground"] }}>
        {t("preview.crumb_home")} / {t("preview.crumb_receivers")} / <span style={{ color: v["--foreground"] }}>Max 4K Pro</span>
      </div>
      <div className="grid grid-cols-5 gap-3">
        <div className="col-span-2 space-y-2">
          <div className="aspect-square rounded-xl border" style={{ background: `linear-gradient(135deg, ${v["--secondary"]}, ${v["--muted"]})`, borderColor: v["--border"] }} />
          <div className="grid grid-cols-4 gap-1">
            {[0, 1, 2, 3].map((i) => (
              <div key={i} className="aspect-square rounded-md border" style={{ background: v["--secondary"], borderColor: i === 0 ? v["--brand"] : v["--border"] }} />
            ))}
          </div>
        </div>
        <div className="col-span-3 space-y-2">
          <span className="inline-block rounded-full px-2 py-0.5 text-[10px] font-semibold" style={{ background: v["--brand"], color: v["--brand-foreground"] }}>{t("preview.crumb_receivers")}</span>
          <h3 className="font-display text-base font-bold">Max 4K Pro</h3>
          <div className="flex items-center gap-1 text-[10px]" style={{ color: v["--muted-foreground"] }}>
            {[0, 1, 2, 3, 4].map((i) => <Star key={i} className="h-3 w-3" style={{ color: v["--brand"], fill: v["--brand"] }} />)}
            <span>(128 {t("preview.reviews")})</span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-lg font-bold" style={{ color: v["--brand"] }}>BHD 24.900</span>
            <span className="text-xs line-through" style={{ color: v["--muted-foreground"] }}>BHD 31.000</span>
            <span className="rounded px-1 text-[9px] font-bold" style={{ background: v["--sale"], color: "#000" }}>-20%</span>
          </div>
          <div className="flex flex-wrap gap-2 text-[10px]">
            <span className="inline-flex items-center gap-1 rounded-full border px-2 py-1" style={{ borderColor: v["--border"] }}>
              <ShieldCheck className="h-3 w-3" style={{ color: v["--brand"] }} /> {t("preview.warranty_year")}
            </span>
            <span className="inline-flex items-center gap-1 rounded-full border px-2 py-1" style={{ borderColor: v["--border"] }}>
              <Truck className="h-3 w-3" style={{ color: v["--brand"] }} /> {t("preview.free_ship")}
            </span>
          </div>
          <div className="flex items-center gap-2 pt-1">
            <div className="flex items-center rounded-lg border" style={{ borderColor: v["--border"] }}>
              <button className="px-2 py-1"><Minus className="h-3 w-3" /></button>
              <span className="px-3 text-xs font-semibold">1</span>
              <button className="px-2 py-1"><Plus className="h-3 w-3" /></button>
            </div>
            <button className="flex-1 rounded-lg px-3 py-2 text-xs font-semibold" style={{ background: v["--brand"], color: v["--brand-foreground"], boxShadow: v["--shadow-glow"] }}>
              {t("preview.add_to_cart")}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function CategoryView({ v, t }: { v: V; t: T }) {
  const cats = [t("preview.cat.all"), t("preview.cat.receivers"), t("preview.cat.iptv"), t("preview.cat.accessories"), t("preview.cat.dishes"), t("preview.cat.screens")];
  return (
    <div style={{ background: v["--background"], color: v["--foreground"] }} className="p-4">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="font-display text-sm font-bold">{t("preview.browse_cats")}</h3>
        <button className="inline-flex items-center gap-1 rounded-lg border px-2 py-1 text-[10px]" style={{ borderColor: v["--border"] }}>
          <Filter className="h-3 w-3" /> {t("preview.filter")}
        </button>
      </div>
      <div className="mb-3 flex flex-wrap gap-1.5">
        {cats.map((c, i) => (
          <span
            key={c}
            className="rounded-full px-2.5 py-1 text-[10px] font-semibold"
            style={
              i === 1
                ? { background: v["--brand"], color: v["--brand-foreground"] }
                : { background: v["--secondary"], color: v["--foreground"] }
            }
          >
            {c}
          </span>
        ))}
      </div>
      <div className="grid grid-cols-4 gap-2">
        {[0, 1, 2, 3, 4, 5, 6, 7].map((i) => (
          <div key={i} className="overflow-hidden rounded-xl border" style={{ background: v["--card"], borderColor: v["--border"], boxShadow: v["--shadow-card"] }}>
            <div className="aspect-square" style={{ background: `linear-gradient(135deg, ${v["--secondary"]}, ${v["--muted"]})` }} />
            <div className="space-y-1 p-2">
              <div className="truncate text-[10px] font-semibold">{t("preview.product_n")} {i + 1}</div>
              <div className="text-[10px] font-bold" style={{ color: v["--brand"] }}>BHD {(10 + i * 3).toFixed(3)}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function CartView({ v, t }: { v: V; t: T }) {
  const items = [
    { name: "Max 4K Pro", cat: t("preview.receiver"), qty: 1, price: 24.9 },
    { name: t("preview.iptv_yearly"), cat: "IPTV", qty: 2, price: 15.0 },
  ];
  const subtotal = items.reduce((s, i) => s + i.qty * i.price, 0);
  return (
    <div style={{ background: v["--background"], color: v["--foreground"] }} className="grid grid-cols-3 gap-3 p-4">
      <div className="col-span-2 space-y-2">
        {items.map((it, i) => (
          <div key={i} className="flex items-center gap-3 rounded-xl border p-2" style={{ background: v["--card"], borderColor: v["--border"] }}>
            <div className="h-14 w-14 shrink-0 rounded-lg" style={{ background: `linear-gradient(135deg, ${v["--secondary"]}, ${v["--muted"]})` }} />
            <div className="flex-1 space-y-0.5">
              <div className="text-[10px]" style={{ color: v["--muted-foreground"] }}>{it.cat}</div>
              <div className="text-xs font-semibold">{it.name}</div>
              <div className="text-[10px] font-bold" style={{ color: v["--brand"] }}>BHD {it.price.toFixed(3)}</div>
            </div>
            <div className="flex items-center rounded-lg border" style={{ borderColor: v["--border"] }}>
              <button className="px-1.5 py-0.5"><Minus className="h-3 w-3" /></button>
              <span className="px-2 text-xs font-semibold">{it.qty}</span>
              <button className="px-1.5 py-0.5"><Plus className="h-3 w-3" /></button>
            </div>
            <button className="rounded-md p-1" style={{ background: v["--secondary"] }}>
              <Trash2 className="h-3 w-3" style={{ color: v["--brand"] }} />
            </button>
          </div>
        ))}
      </div>
      <div className="rounded-xl border p-3 text-xs" style={{ background: v["--card"], borderColor: v["--border"] }}>
        <div className="mb-2 font-display font-bold">{t("preview.order_summary")}</div>
        <div className="space-y-1 text-[11px]" style={{ color: v["--muted-foreground"] }}>
          <div className="flex justify-between"><span>{t("shop.subtotal")}</span><span style={{ color: v["--foreground"] }}>BHD {subtotal.toFixed(3)}</span></div>
          <div className="flex justify-between"><span>{t("shop.shipping")}</span><span style={{ color: v["--foreground"] }}>{t("preview.free")}</span></div>
          <div className="flex justify-between"><span>{t("preview.tax")}</span><span style={{ color: v["--foreground"] }}>BHD 0.000</span></div>
        </div>
        <div className="my-2 border-t" style={{ borderColor: v["--border"] }} />
        <div className="flex items-center justify-between">
          <span className="font-semibold">{t("shop.total")}</span>
          <span className="text-base font-bold" style={{ color: v["--brand"] }}>BHD {subtotal.toFixed(3)}</span>
        </div>
        <button className="mt-3 w-full rounded-lg px-3 py-2 text-xs font-semibold" style={{ background: v["--brand"], color: v["--brand-foreground"], boxShadow: v["--shadow-glow"] }}>
          {t("preview.checkout")}
        </button>
        <div className="mt-2 flex items-center justify-center gap-1 text-[10px]" style={{ color: v["--muted-foreground"] }}>
          <ShieldCheck className="h-3 w-3" /> {t("preview.secure")}
        </div>
      </div>
    </div>
  );
}
