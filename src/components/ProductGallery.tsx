import { useEffect, useState } from "react";
import { Package, X, ZoomIn } from "lucide-react";
import { useI18n } from "@/lib/i18n";

export function ProductGallery({ images, alt }: { images: string[]; alt: string }) {
  const { t } = useI18n();
  const [active, setActive] = useState(0);
  const [zoom, setZoom] = useState(false);
  const list = images.filter(Boolean);
  const current = list[active];

  useEffect(() => {
    if (!zoom) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setZoom(false);
      if (e.key === "ArrowRight") setActive((i) => (i + 1) % list.length);
      if (e.key === "ArrowLeft") setActive((i) => (i - 1 + list.length) % list.length);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [zoom, list.length]);

  if (list.length === 0) {
    return (
      <div className="flex aspect-square items-center justify-center rounded-2xl border border-primary/20 bg-card text-primary/30">
        <Package className="h-32 w-32" aria-hidden />
      </div>
    );
  }

  return (
    <div>
      <button
        type="button"
        onClick={() => setZoom(true)}
        aria-label={t("img.zoom")}
        className="group relative block aspect-square w-full overflow-hidden rounded-2xl border border-primary/20 bg-card"
      >
        <img
          src={current}
          alt={alt}
          width={1000}
          height={1000}
          fetchPriority="high"
          decoding="async"
          className="h-full w-full object-contain transition duration-500 group-hover:scale-105"
        />
        <span className="absolute end-3 bottom-3 grid h-9 w-9 place-items-center rounded-full border border-primary/30 bg-background/80 text-primary backdrop-blur">
          <ZoomIn className="h-4 w-4" aria-hidden />
        </span>
      </button>

      {list.length > 1 && (
        <div className="mt-3 grid grid-cols-5 gap-2">
          {list.map((src, i) => (
            <button
              key={src + i}
              type="button"
              onClick={() => setActive(i)}
              aria-label={`${alt} ${i + 1}`}
              aria-current={i === active}
              className={`aspect-square overflow-hidden rounded-lg border transition ${
                i === active ? "border-primary" : "border-primary/15 hover:border-primary/50"
              }`}
            >
              <img src={src} alt="" loading="lazy" decoding="async" className="h-full w-full object-cover" />
            </button>
          ))}
        </div>
      )}

      {zoom && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={alt}
          className="fixed inset-0 z-[100] flex items-center justify-center bg-background/95 p-4 backdrop-blur"
          onClick={() => setZoom(false)}
        >
          <button
            type="button"
            aria-label="close"
            onClick={() => setZoom(false)}
            className="absolute end-4 top-4 grid h-11 w-11 place-items-center rounded-full border border-primary/30 text-foreground"
          >
            <X className="h-5 w-5" aria-hidden />
          </button>
          <img src={current} alt={alt} className="max-h-[85vh] max-w-full object-contain" />
        </div>
      )}
    </div>
  );
}
