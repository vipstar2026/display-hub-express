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
  const name = localizedName(p, "name", lang);
  const img = firstImage(p.images);
  const oos = p.track_stock && p.stock <= 0;

  return (
    <div className="group relative overflow-hidden rounded-xl border border-cyan-500/10 bg-card transition hover:border-cyan-500/40 hover:shadow-[0_0_30px_rgba(0,217,255,0.15)]">
      <Link to="/product/$slug" params={{ slug: p.slug }} className="block">
        <div className="aspect-square w-full overflow-hidden bg-background/50">
          {img ? (
            <img src={img} alt={name} className="h-full w-full object-cover transition group-hover:scale-105" loading="lazy" />
          ) : (
            <div className="flex h-full items-center justify-center text-cyan-500/30"><Package className="h-16 w-16" /></div>
          )}
        </div>
        <div className="p-3">
          <h3 className="line-clamp-2 min-h-[2.5rem] text-sm font-medium text-foreground">{name}</h3>
          <div className="mt-2 flex items-center gap-2">
            <span className="font-mono text-base font-bold text-cyan-400">{formatPrice(p.price, p.currency)}</span>
            {p.compare_price && p.compare_price > p.price && (
              <span className="text-xs text-muted-foreground line-through">{formatPrice(p.compare_price, p.currency)}</span>
            )}
          </div>
        </div>
      </Link>
      <div className="px-3 pb-3">
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
