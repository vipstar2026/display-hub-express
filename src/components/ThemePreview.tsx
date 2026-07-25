import { THEME_PRESETS, DEFAULT_THEME } from "@/lib/themes";
import { Star, ShoppingCart, Check, Search } from "lucide-react";

type Props = {
  themeId: string;
  savedId: string;
  onReset: () => void;
};

export function ThemePreview({ themeId, savedId, onReset }: Props) {
  const preset = THEME_PRESETS[themeId] ?? THEME_PRESETS[DEFAULT_THEME];
  const v = preset.vars;
  const dirty = themeId !== savedId;

  const panelStyle = v as unknown as React.CSSProperties;

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
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

      <div
        dir="rtl"
        style={panelStyle}
        className="overflow-hidden rounded-2xl border"
      >
        <div style={{ background: v["--card"], borderColor: v["--border"], color: v["--foreground"] }} className="border-b p-4">
          {/* Fake topbar */}
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

        {/* Hero */}
        <div style={{ background: v["--gradient-hero"], color: v["--foreground"] }} className="p-5">
          <div className="mb-1 inline-block rounded-full px-2 py-0.5 text-[10px] font-semibold" style={{ background: v["--sale"], color: "#000" }}>عرض حصري</div>
          <h3 className="font-display text-lg font-bold">أفضل استقبال بجودة 4K</h3>
          <p className="text-xs" style={{ color: v["--muted-foreground"] }}>رسيفرات واشتراكات IPTV بضمان معتمد.</p>
          <div className="mt-3 flex gap-2">
            <button className="rounded-lg px-3 py-1.5 text-xs font-semibold" style={{ background: v["--brand"], color: v["--brand-foreground"], boxShadow: v["--shadow-glow"] }}>تسوق الآن</button>
            <button className="rounded-lg border px-3 py-1.5 text-xs" style={{ borderColor: v["--border"], color: v["--foreground"] }}>اعرف المزيد</button>
          </div>
        </div>

        {/* Product cards */}
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

        {/* Badges */}
        <div style={{ background: v["--card"], borderColor: v["--border"] }} className="flex flex-wrap items-center gap-2 border-t p-3">
          <span className="rounded-full px-2 py-0.5 text-[10px] font-semibold" style={{ background: v["--brand"], color: v["--brand-foreground"] }}>أساسي</span>
          <span className="rounded-full px-2 py-0.5 text-[10px] font-semibold" style={{ background: v["--accent2"], color: "#fff" }}>ثانوي</span>
          <span className="rounded-full px-2 py-0.5 text-[10px] font-semibold" style={{ background: v["--sale"], color: "#000" }}>تخفيض</span>
          <span className="inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px]" style={{ borderColor: v["--border"], color: v["--muted-foreground"] }}>
            <Check className="h-3 w-3" style={{ color: v["--brand"] }} /> متوفر
          </span>
        </div>
      </div>
    </div>
  );
}
