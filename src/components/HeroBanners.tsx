import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useI18n } from "@/lib/i18n";
import { ChevronLeft, ChevronRight } from "lucide-react";

type Banner = {
  id: string;
  title_ar: string | null; title_en: string | null; title_ur: string | null;
  subtitle_ar: string | null; subtitle_en: string | null; subtitle_ur: string | null;
  image_url: string;
  link_url: string | null;
  cta_label_ar: string | null; cta_label_en: string | null; cta_label_ur: string | null;
};

export function HeroBanners() {
  const { lang } = useI18n();
  const [idx, setIdx] = useState(0);

  const { data: banners } = useQuery({
    queryKey: ["home-banners"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("banners" as any)
        .select("*")
        .order("sort_order", { ascending: true });
      if (error) throw error;
      return (data ?? []) as unknown as Banner[];
    },
    staleTime: 60_000,
  });

  const list = banners ?? [];
  const count = list.length;

  useEffect(() => {
    if (count <= 1) return;
    const t = setInterval(() => setIdx((i) => (i + 1) % count), 6000);
    return () => clearInterval(t);
  }, [count]);

  if (count === 0) return null;

  const pick = (ar?: string | null, en?: string | null, ur?: string | null) =>
    (lang === "ar" ? ar : lang === "ur" ? ur : en) || en || ar || ur || "";

  return (
    <section className="relative border-b border-primary/20 bg-black">
      <div className="relative mx-auto aspect-[21/9] max-h-[520px] w-full overflow-hidden md:aspect-[21/8]">
        {list.map((b, i) => {
          const title = pick(b.title_ar, b.title_en, b.title_ur);
          const sub = pick(b.subtitle_ar, b.subtitle_en, b.subtitle_ur);
          const cta = pick(b.cta_label_ar, b.cta_label_en, b.cta_label_ur);
          const active = i === idx;
          const inner = (
            <>
              <img
                src={b.image_url}
                alt={title || "banner"}
                loading={i === 0 ? "eager" : "lazy"}
                className="absolute inset-0 h-full w-full object-cover"
              />
              {(title || sub) && (
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
              )}
              {(title || sub || cta) && (
                <div className="absolute inset-0 flex items-end md:items-center">
                  <div className="container mx-auto px-6 pb-8 md:pb-0">
                    <div className="max-w-xl space-y-3 text-white">
                      {title && <h2 className="font-display text-2xl font-bold md:text-5xl drop-shadow">{title}</h2>}
                      {sub && <p className="text-sm md:text-lg text-white/85">{sub}</p>}
                      {cta && (
                        <span className="inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2 text-sm font-semibold text-background shadow-lg shadow-primary/40">
                          {cta}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </>
          );
          return (
            <div
              key={b.id}
              className={`absolute inset-0 transition-opacity duration-700 ${active ? "opacity-100" : "pointer-events-none opacity-0"}`}
            >
              {b.link_url ? (
                <a href={b.link_url} className="block h-full w-full">{inner}</a>
              ) : (
                <div className="h-full w-full">{inner}</div>
              )}
            </div>
          );
        })}

        {count > 1 && (
          <>
            <button
              aria-label="prev"
              onClick={() => setIdx((i) => (i - 1 + count) % count)}
              className="absolute start-3 top-1/2 z-10 grid h-9 w-9 -translate-y-1/2 place-items-center rounded-full bg-black/40 text-white backdrop-blur hover:bg-black/60"
            >
              <ChevronLeft className="h-5 w-5 rtl:hidden" />
              <ChevronRight className="hidden h-5 w-5 rtl:block" />
            </button>
            <button
              aria-label="next"
              onClick={() => setIdx((i) => (i + 1) % count)}
              className="absolute end-3 top-1/2 z-10 grid h-9 w-9 -translate-y-1/2 place-items-center rounded-full bg-black/40 text-white backdrop-blur hover:bg-black/60"
            >
              <ChevronRight className="h-5 w-5 rtl:hidden" />
              <ChevronLeft className="hidden h-5 w-5 rtl:block" />
            </button>
            <div className="absolute bottom-3 left-1/2 z-10 flex -translate-x-1/2 gap-1.5">
              {list.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setIdx(i)}
                  aria-label={`slide ${i + 1}`}
                  className={`h-1.5 rounded-full transition-all ${i === idx ? "w-6 bg-primary" : "w-1.5 bg-white/50"}`}
                />
              ))}
            </div>
          </>
        )}
      </div>
    </section>
  );
}
