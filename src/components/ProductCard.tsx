import { Link } from "@tanstack/react-router";
import { useI18n, localizedName } from "@/lib/i18n";
import { useCart } from "@/lib/cart";
import { formatPrice, firstImage } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { ShoppingCart, Package } from "lucide-react";
import { toast } from "sonner";

interface Product {
  id: string;
  slug: string;
  name_ar: string;
  name_en: string;
  name_ur: string | null;
  price: number;
  currency: string;
  stock: number;
  track_stock: boolean;
  images: unknown;
  type: "physical" | "digital" | "subscription";
  compare_price: number | null;
}

export function ProductCard({ p }: { p: Product }) {
  const { t, lang } = useI18n();
  const { add } = useCart();
  const name = localizedName(p as unknown as Record<string, unknown>, "name", lang);
  const img = firstImage(p.images);
  const oos = p.track_stock && p.stock <= 0;

  const discount = p.compare_price && p.compare_price > p.price
    ? Math.round(((p.compare_price - p.price) / p.compare_price) * 100)
    : 0;

  return (
    <div className="group relative flex flex-col overflow-hidden rounded-2xl border border-cyan-500/10 bg-gradient-to-b from-card to-card/60 transition duration-300 hover:-translate-y-1 hover:border-cyan-500/40 hover:shadow-[0_10px_40px_-10px_rgba(0,217,255,0.35)]">
        <Link to="/product/$slug" params={{ slug: p.slug }} className="block">
          <div className="relative aspect-[4/5] w-full overflow-hidden bg-gradient-to-br from-background via-background/80 to-cyan-500/5">
            {img ? (
              <img
                src={img}
                alt={name}
                className="absolute inset-0 h-full w-full object-contain p-3 transition duration-500 group-hover:scale-110"
                loading="lazy"
              />
            ) : (
              <div className="flex h-full items-center justify-center text-cyan-500/30"><Package className="h-16 w-16" /></div>
            )}
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-background/40 via-transparent to-transparent opacity-0 transition group-hover:opacity-100" />
            {discount > 0 && (
              <span className="absolute start-2 top-2 rounded-full bg-red-500/90 px-2 py-0.5 text-[10px] font-bold text-white shadow-md backdrop-blur">
                -{discount}%
              </span>
            )}
            {oos && (
              <span className="absolute end-2 top-2 rounded-full bg-background/80 px-2 py-0.5 text-[10px] font-bold text-muted-foreground backdrop-blur">
                {t("shop.outOfStock")}
              </span>
            )}
          </div>
          <div className="p-3">
            <h3 className="line-clamp-2 min-h-[2.5rem] text-sm font-medium text-foreground transition group-hover:text-cyan-300">{name}</h3>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="font-mono text-base font-bold text-cyan-400">{formatPrice(p.price, p.currency)}</span>
              {p.compare_price && p.compare_price > p.price && (
                <span className="text-xs text-muted-foreground line-through">{formatPrice(p.compare_price, p.currency)}</span>
              )}
            </div>
          </div>
        </Link>
        <div className="mt-auto px-3 pb-3">
        <Button
          size="sm"
          disabled={oos}
          className="w-full bg-cyan-500 text-background hover:bg-cyan-400"
          onClick={() => {
            add({ product_id: p.id, slug: p.slug, name, image: img, price: Number(p.price), type: p.type });
            toast.success(t("shop.addToCart"));
          }}
        >
          <ShoppingCart className="me-1 h-3 w-3" />
          {oos ? t("shop.outOfStock") : t("shop.addToCart")}
        </Button>
      </div>
    </div>
  );
}
