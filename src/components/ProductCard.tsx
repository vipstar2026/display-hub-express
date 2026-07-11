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
    <div className="group relative flex flex-col overflow-hidden rounded-xl border border-cyan-500/10 bg-gradient-to-b from-card to-card/40 transition duration-300 hover:-translate-y-1 hover:border-cyan-400/50 hover:shadow-[0_12px_36px_-14px_rgba(0,217,255,0.45)]">
      <Link to="/product/$slug" params={{ slug: p.slug }} className="block">
        <div className="relative aspect-square w-full overflow-hidden">
          {/* layered backdrop */}
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_35%,rgba(0,217,255,0.10),transparent_65%)]" />
          <div className="absolute inset-0 bg-gradient-to-br from-background/60 via-background/20 to-background/60" />
          {/* framed image */}
          <div className="absolute inset-3 overflow-hidden rounded-lg ring-1 ring-cyan-500/10 bg-background/40 backdrop-blur-[2px]">
            {img ? (
              <img
                src={img}
                alt={name}
                className="h-full w-full object-contain p-2 transition duration-500 group-hover:scale-[1.08]"
                loading="lazy"
              />
            ) : (
              <div className="flex h-full items-center justify-center text-cyan-500/30"><Package className="h-12 w-12" /></div>
            )}
          </div>
          {/* shine */}
          <div className="pointer-events-none absolute -inset-x-4 -top-1/2 h-40 rotate-12 bg-gradient-to-r from-transparent via-cyan-300/10 to-transparent opacity-0 transition duration-700 group-hover:translate-y-[220%] group-hover:opacity-100" />
          {discount > 0 && (
            <span className="absolute start-2 top-2 rounded-full bg-gradient-to-r from-red-500 to-rose-500 px-2 py-0.5 text-[10px] font-bold text-white shadow-md">
              -{discount}%
            </span>
          )}
          {oos && (
            <span className="absolute end-2 top-2 rounded-full bg-background/80 px-2 py-0.5 text-[10px] font-bold text-muted-foreground backdrop-blur">
              {t("shop.outOfStock")}
            </span>
          )}
        </div>
        <div className="px-3 pt-2.5">
          <h3 className="line-clamp-2 min-h-[2.25rem] text-[13px] font-medium leading-tight text-foreground transition group-hover:text-cyan-300">{name}</h3>
          <div className="mt-1.5 flex items-baseline gap-1.5">
            <span className="font-mono text-sm font-bold text-cyan-400">{formatPrice(p.price, p.currency)}</span>
            {p.compare_price && p.compare_price > p.price && (
              <span className="text-[11px] text-muted-foreground line-through">{formatPrice(p.compare_price, p.currency)}</span>
            )}
          </div>
        </div>
      </Link>
      <div className="mt-auto p-2.5 pt-2">
        <Button
          size="sm"
          disabled={oos}
          className="h-8 w-full bg-cyan-500 text-xs text-background hover:bg-cyan-400"
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
