import { useQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useI18n } from "@/lib/i18n";
import { formatPrice } from "@/lib/format";
import { Zap, Clock } from "lucide-react";

type FlashRow = {
  id: string;
  product_id: string;
  name_ar: string; name_en: string; name_ur: string | null;
  sale_price: number; original_price: number | null;
  ends_at: string; stock_limit: number | null; sold_count: number;
  products: { slug: string; images: string[] | null; price: number; currency: string } | null;
};

function pad(n: number) { return n.toString().padStart(2, "0"); }

function Countdown({ endsAt }: { endsAt: string }) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);
  const diff = Math.max(0, new Date(endsAt).getTime() - now);
  const d = Math.floor(diff / 86_400_000);
  const h = Math.floor((diff % 86_400_000) / 3_600_000);
  const m = Math.floor((diff % 3_600_000) / 60_000);
  const s = Math.floor((diff % 60_000) / 1000);
  return (
    <div className="flex items-center gap-1 font-mono text-xs">
      {d > 0 && <><span className="rounded bg-background/70 px-1.5 py-0.5">{d}d</span>:</>}
      <span className="rounded bg-background/70 px-1.5 py-0.5">{pad(h)}</span>:
      <span className="rounded bg-background/70 px-1.5 py-0.5">{pad(m)}</span>:
      <span className="rounded bg-background/70 px-1.5 py-0.5">{pad(s)}</span>
    </div>
  );
}

export function FlashSalesSection() {
  const { t, lang } = useI18n();
  const { data } = useQuery({
    queryKey: ["home-flash-sales"],
    queryFn: async () => {
      const { data } = await supabase
        .from("flash_sales")
        .select("id,product_id,name_ar,name_en,name_ur,sale_price,original_price,ends_at,stock_limit,sold_count,products(slug,images,price,currency)")
        .order("sort_order")
        .limit(8);
      return (data ?? []) as unknown as FlashRow[];
    },
    refetchInterval: 60_000,
  });

  if (!data || data.length === 0) return null;

  return (
    <section className="border-y border-primary/20 bg-gradient-to-r from-red-500/10 via-orange-500/5 to-red-500/10 py-10">
      <div className="container mx-auto px-4">
        <div className="mb-6 flex items-center gap-3">
          <div className="flex h-10 w-10 animate-pulse items-center justify-center rounded-lg bg-gradient-to-br from-red-500 to-orange-500 text-white shadow-lg shadow-red-500/40">
            <Zap className="h-5 w-5" />
          </div>
          <div>
            <h2 className="font-display text-2xl font-bold">
              <span className="bg-gradient-to-r from-red-400 to-orange-400 bg-clip-text text-transparent">
                {t("flash.title")}
              </span>
            </h2>
            <p className="text-xs text-muted-foreground">{t("flash.subtitle")}</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
          {data.map((f) => {
            const name = localizedName(f as unknown as Record<string, unknown>, "name", lang) || f.name_en;
            const img = f.products?.images?.[0];
            const original = f.original_price ?? f.products?.price ?? 0;
            const discount = original > 0 ? Math.round(((original - f.sale_price) / original) * 100) : 0;
            const soldPct = f.stock_limit ? Math.min(100, (f.sold_count / f.stock_limit) * 100) : null;

            return (
              <Link
                key={f.id}
                to="/product/$slug"
                params={{ slug: f.products?.slug ?? "" }}
                className="group relative overflow-hidden rounded-xl border border-red-500/30 bg-card transition hover:border-red-500/60 hover:shadow-lg hover:shadow-red-500/20"
              >
                {discount > 0 && (
                  <div className="absolute start-2 top-2 z-10 rounded-md bg-gradient-to-r from-red-500 to-orange-500 px-2 py-0.5 text-xs font-bold text-white shadow-md">
                    -{discount}%
                  </div>
                )}
                <div className="aspect-square overflow-hidden bg-background/40">
                  {img ? (
                    <img src={img} alt={name} className="h-full w-full object-cover transition-transform group-hover:scale-105" />
                  ) : (
                    <div className="grid h-full place-items-center text-muted-foreground">—</div>
                  )}
                </div>
                <div className="p-3">
                  <h3 className="line-clamp-2 min-h-[2.5rem] text-sm font-medium">{name}</h3>
                  <div className="mt-2 flex items-baseline gap-2">
                    <span className="font-mono text-base font-bold text-red-400">
                      {formatPrice(Number(f.sale_price), f.products?.currency ?? "BHD")}
                    </span>
                    {original > f.sale_price && (
                      <span className="font-mono text-xs text-muted-foreground line-through">
                        {formatPrice(Number(original), f.products?.currency ?? "BHD")}
                      </span>
                    )}
                  </div>
                  {soldPct !== null && (
                    <div className="mt-2">
                      <div className="h-1.5 overflow-hidden rounded-full bg-background/60">
                        <div className="h-full bg-gradient-to-r from-red-500 to-orange-400" style={{ width: `${soldPct}%` }} />
                      </div>
                      <div className="mt-1 text-[10px] text-muted-foreground">
                        {t("flash.sold")}: {f.sold_count}/{f.stock_limit}
                      </div>
                    </div>
                  )}
                  <div className="mt-2 flex items-center gap-1.5 text-red-400">
                    <Clock className="h-3 w-3" />
                    <Countdown endsAt={f.ends_at} />
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}
