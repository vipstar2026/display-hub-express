import { useState } from "react";
import { THEME_PRESETS, DEFAULT_THEME } from "@/lib/themes";
import { Star, ShoppingCart, Check, Search, ShieldCheck, Truck, Trash2, Plus, Minus, Filter } from "lucide-react";

type Props = {
  themeId: string;
  savedId: string;
  onReset: () => void;
};

type View = "home" | "product" | "category" | "cart";

export function ThemePreview({ themeId, savedId, onReset }: Props) {
  const preset = THEME_PRESETS[themeId] ?? THEME_PRESETS[DEFAULT_THEME];
  const v = preset.vars;
  const dirty = themeId !== savedId;
  const [view, setView] = useState<View>("home");

  const panelStyle = v as unknown as React.CSSProperties;

  const tabs: { id: View; label: string }[] = [
    { id: "home", label: "الرئيسية" },
    { id: "product", label: "صفحة منتج" },
    { id: "category", label: "قائمة الأقسام" },
    { id: "cart", label: "سلة التسوق" },
  ];

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-primary">معاينة مباشرة</span>
          {dirty && (
            <span className="rounded-full bg-yellow-500/15 px-2 py-0.5 text-[10px] font-medium text-yellow-300">
              غير محفوظ — اضغط "حفظ" لتثبيته
            </span>
          )}
        </div>
        {dirty && (
          <button type="button" onClick={onReset} className="text-xs text-muted-foreground underline-offset-2 hover:underline">
            استعادة الثيم المحفوظ
          </button>
        )}
      </div>

      {/* View tabs */}
      <div className="flex flex-wrap gap-1 rounded-lg border bg-muted/30 p-1">
        {tabs.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setView(t.id)}
            className={`flex-1 rounded-md px-3 py-1.5 text-xs font-medium transition ${
              view === t.id ? "bg-primary text-primary-foreground shadow" : "text-muted-foreground hover:bg-background/50"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div dir="rtl" style={panelStyle} className="overflow-hidden rounded-2xl border">
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
              <span>الرئيسية</span><span>المتجر</span><span>IPTV</span><span>تواصل</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1 rounded-lg px-2 py-1 text-xs" style={{ background: v["--input"], color: v["--muted-foreground"] }}>
                <Search className="h-3 w-3" /> ابحث
              </div>
              <div className="relative flex h-8 w-8 items-center justify-center rounded-lg" style={{ background: v["--secondary"] }}>
                <ShoppingCart className="h-4 w-4" />
                <span className="absolute -end-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full px-1 text-[10px] font-bold" style={{ background: v["--brand"], color: v["--brand-foreground"] }}>3</span>
              </div>
            </div>
          </div>
        </div>

        {view === "home" && <HomeView v={v} />}
        {view === "product" && <ProductView v={v} />}
        {view === "category" && <CategoryView v={v} />}
        {view === "cart" && <CartView v={v} />}
      </div>
    </div>
  );
}

type V = Record<string, string>;

function HomeView({ v }: { v: V }) {
  return (
    <>
      <div style={{ background: v["--gradient-hero"], color: v["--foreground"] }} className="p-5">
        <div className="mb-1 inline-block rounded-full px-2 py-0.5 text-[10px] font-semibold" style={{ background: v["--sale"], color: "#000" }}>عرض حصري</div>
        <h3 className="font-display text-lg font-bold">أفضل استقبال بجودة 4K</h3>
        <p className="text-xs" style={{ color: v["--muted-foreground"] }}>رسيفرات واشتراكات IPTV بضمان معتمد.</p>
        <div className="mt-3 flex gap-2">
          <button className="rounded-lg px-3 py-1.5 text-xs font-semibold" style={{ background: v["--brand"], color: v["--brand-foreground"], boxShadow: v["--shadow-glow"] }}>تسوق الآن</button>
          <button className="rounded-lg border px-3 py-1.5 text-xs" style={{ borderColor: v["--border"], color: v["--foreground"] }}>اعرف المزيد</button>
        </div>
      </div>
      <div style={{ background: v["--background"] }} className="grid grid-cols-3 gap-2 p-3">
        {[0, 1, 2].map((i) => (
          <div key={i} className="overflow-hidden rounded-xl border" style={{ background: v["--card"], borderColor: v["--border"], boxShadow: v["--shadow-card"] }}>
            <div className="aspect-square" style={{ background: `linear-gradient(135deg, ${v["--secondary"]}, ${v["--muted"]})` }} />
            <div className="space-y-1 p-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-medium" style={{ color: v["--muted-foreground"] }}>رسيفر</span>
                {i === 1 && <span className="rounded px-1 text-[9px] font-bold" style={{ background: v["--sale"], color: "#000" }}>-20%</span>}
              </div>
              <div className="truncate text-xs font-semibold" style={{ color: v["--foreground"] }}>Max 4K Pro</div>
              <div className="text-xs font-bold" style={{ color: v["--brand"] }}>د.ب 24.900</div>
            </div>
          </div>
        ))}
      </div>
      <div style={{ background: v["--card"], borderColor: v["--border"] }} className="flex flex-wrap items-center gap-2 border-t p-3">
        <span className="rounded-full px-2 py-0.5 text-[10px] font-semibold" style={{ background: v["--brand"], color: v["--brand-foreground"] }}>أساسي</span>
        <span className="rounded-full px-2 py-0.5 text-[10px] font-semibold" style={{ background: v["--accent2"], color: "#fff" }}>ثانوي</span>
        <span className="rounded-full px-2 py-0.5 text-[10px] font-semibold" style={{ background: v["--sale"], color: "#000" }}>تخفيض</span>
        <span className="inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px]" style={{ borderColor: v["--border"], color: v["--muted-foreground"] }}>
          <Check className="h-3 w-3" style={{ color: v["--brand"] }} /> متوفر
        </span>
      </div>
    </>
  );
}

function ProductView({ v }: { v: V }) {
  return (
    <div style={{ background: v["--background"], color: v["--foreground"] }} className="p-4">
      <div className="mb-3 text-[10px]" style={{ color: v["--muted-foreground"] }}>
        الرئيسية / رسيفرات / <span style={{ color: v["--foreground"] }}>Max 4K Pro</span>
      </div>
      <div className="grid grid-cols-5 gap-3">
        {/* Gallery */}
        <div className="col-span-2 space-y-2">
          <div className="aspect-square rounded-xl border" style={{ background: `linear-gradient(135deg, ${v["--secondary"]}, ${v["--muted"]})`, borderColor: v["--border"] }} />
          <div className="grid grid-cols-4 gap-1">
            {[0, 1, 2, 3].map((i) => (
              <div key={i} className="aspect-square rounded-md border" style={{ background: v["--secondary"], borderColor: i === 0 ? v["--brand"] : v["--border"] }} />
            ))}
          </div>
        </div>
        {/* Details */}
        <div className="col-span-3 space-y-2">
          <span className="inline-block rounded-full px-2 py-0.5 text-[10px] font-semibold" style={{ background: v["--brand"], color: v["--brand-foreground"] }}>رسيفرات</span>
          <h3 className="font-display text-base font-bold">Max 4K Pro — استقبال فضائي</h3>
          <div className="flex items-center gap-1 text-[10px]" style={{ color: v["--muted-foreground"] }}>
            {[0, 1, 2, 3, 4].map((i) => <Star key={i} className="h-3 w-3" style={{ color: v["--brand"], fill: v["--brand"] }} />)}
            <span>(128 تقييم)</span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-lg font-bold" style={{ color: v["--brand"] }}>د.ب 24.900</span>
            <span className="text-xs line-through" style={{ color: v["--muted-foreground"] }}>د.ب 31.000</span>
            <span className="rounded px-1 text-[9px] font-bold" style={{ background: v["--sale"], color: "#000" }}>-20%</span>
          </div>
          <p className="text-[11px]" style={{ color: v["--muted-foreground"] }}>
            جهاز استقبال بجودة 4K UHD، يدعم أحدث تقنيات فك التشفير مع منفذ HDMI و USB.
          </p>
          <div className="flex flex-wrap gap-2 text-[10px]">
            <span className="inline-flex items-center gap-1 rounded-full border px-2 py-1" style={{ borderColor: v["--border"] }}>
              <ShieldCheck className="h-3 w-3" style={{ color: v["--brand"] }} /> ضمان سنة
            </span>
            <span className="inline-flex items-center gap-1 rounded-full border px-2 py-1" style={{ borderColor: v["--border"] }}>
              <Truck className="h-3 w-3" style={{ color: v["--brand"] }} /> توصيل مجاني
            </span>
          </div>
          <div className="flex items-center gap-2 pt-1">
            <div className="flex items-center rounded-lg border" style={{ borderColor: v["--border"] }}>
              <button className="px-2 py-1"><Minus className="h-3 w-3" /></button>
              <span className="px-3 text-xs font-semibold">1</span>
              <button className="px-2 py-1"><Plus className="h-3 w-3" /></button>
            </div>
            <button className="flex-1 rounded-lg px-3 py-2 text-xs font-semibold" style={{ background: v["--brand"], color: v["--brand-foreground"], boxShadow: v["--shadow-glow"] }}>
              أضف إلى السلة
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function CategoryView({ v }: { v: V }) {
  const cats = ["الكل", "رسيفرات", "IPTV", "إكسسوارات", "أطباق", "شاشات"];
  return (
    <div style={{ background: v["--background"], color: v["--foreground"] }} className="p-4">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="font-display text-sm font-bold">تصفح الأقسام</h3>
        <button className="inline-flex items-center gap-1 rounded-lg border px-2 py-1 text-[10px]" style={{ borderColor: v["--border"] }}>
          <Filter className="h-3 w-3" /> تصفية
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
              <div className="truncate text-[10px] font-semibold">منتج رقم {i + 1}</div>
              <div className="text-[10px] font-bold" style={{ color: v["--brand"] }}>د.ب {(10 + i * 3).toFixed(3)}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function CartView({ v }: { v: V }) {
  const items = [
    { name: "Max 4K Pro", cat: "رسيفر", qty: 1, price: 24.9 },
    { name: "اشتراك IPTV سنوي", cat: "IPTV", qty: 2, price: 15.0 },
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
              <div className="text-[10px] font-bold" style={{ color: v["--brand"] }}>د.ب {it.price.toFixed(3)}</div>
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
        <div className="mb-2 font-display font-bold">ملخص الطلب</div>
        <div className="space-y-1 text-[11px]" style={{ color: v["--muted-foreground"] }}>
          <div className="flex justify-between"><span>المجموع الفرعي</span><span style={{ color: v["--foreground"] }}>د.ب {subtotal.toFixed(3)}</span></div>
          <div className="flex justify-between"><span>الشحن</span><span style={{ color: v["--foreground"] }}>مجاناً</span></div>
          <div className="flex justify-between"><span>الضريبة</span><span style={{ color: v["--foreground"] }}>د.ب 0.000</span></div>
        </div>
        <div className="my-2 border-t" style={{ borderColor: v["--border"] }} />
        <div className="flex items-center justify-between">
          <span className="font-semibold">الإجمالي</span>
          <span className="text-base font-bold" style={{ color: v["--brand"] }}>د.ب {subtotal.toFixed(3)}</span>
        </div>
        <button className="mt-3 w-full rounded-lg px-3 py-2 text-xs font-semibold" style={{ background: v["--brand"], color: v["--brand-foreground"], boxShadow: v["--shadow-glow"] }}>
          إتمام الشراء
        </button>
        <div className="mt-2 flex items-center justify-center gap-1 text-[10px]" style={{ color: v["--muted-foreground"] }}>
          <ShieldCheck className="h-3 w-3" /> دفع آمن ومشفّر
        </div>
      </div>
    </div>
  );
}
