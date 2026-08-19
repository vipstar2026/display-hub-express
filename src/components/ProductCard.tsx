import { Link } from "@tanstack/react-router";
import { useI18n, localizedName } from "@/lib/i18n";
import { useCart } from "@/lib/cart";
import { analytics } from "@/lib/analytics";
import { formatPrice, firstImage } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { ShoppingCart, Package, GitCompareArrows } from "lucide-react";
import { toast } from "sonner";
import { WishlistButton } from "@/components/WishlistButton";
import { useCompare } from "@/lib/compare";
import { useDigitalStock, isDigital, soldOut } from "@/lib/digital-stock";

interface Product {
  id: string;
  slug: string;
  name_ar: string;
  name_en: string;
  name_ur: string | null;
  name_bn?: string | null;
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
  const compare = useCompare();
  const inCompare = compare.has(p.id);
  const name = localizedName(p as unknown as Record<string, unknown>, "name", lang);
  const img = firstImage(p.images);
  const { data: digitalMap } = useDigitalStock();
  const oos = soldOut(p, digitalMap);
  const digital = isDigital(p.type);

  const discount = p.compare_price && p.compare_price > p.price
    ? Math.round(((p.compare_price - p.price) / p.compare_price) * 100)
    : 0;

  return (
    <div className="group relative flex flex-col overflow-hidden rounded-xl border border-primary/10 bg-gradient-to-b from-card to-card/40 transition duration-300 hover:-translate-y-1 hover:border-primary/50 hover:shadow-[0_12px_36px_-14px_rgba(230,80,40,0.45)]">
      <WishlistButton productId={p.id} className="absolute end-2 top-2 z-10 h-8 w-8" size={14} />
      <button
        type="button"
        aria-label="compare"
        onClick={(e) => {
          e.preventDefault();
          const { added, full } = compare.toggle(p.id);
          if (full) toast.error(t("compare.full"));
          else toast.success(added ? t("compare.added") : t("compare.removed"));
        }}
        className={`absolute end-2 top-11 z-10 grid h-8 w-8 place-items-center rounded-full border transition ${inCompare ? "border-primary bg-primary text-background" : "border-primary/20 bg-background/70 text-muted-foreground hover:text-primary"}`}
      >
        <GitCompareArrows className="h-3.5 w-3.5" />
      </button>
      <Link to="/product/$slug" params={{ slug: p.slug }} className="block">
        <div className="relative aspect-square w-full overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_35%,rgba(230,80,40,0.45),transparent_65%)]" />
          <div className="absolute inset-0 bg-gradient-to-br from-background/60 via-background/20 to-background/60" />
          <div className="absolute inset-3 overflow-hidden rounded-lg ring-1 ring-primary/10 bg-background/40 backdrop-blur-[2px]">
            {img ? (
              <img src={img} alt={name} width={400} height={400} loading="lazy" decoding="async" className="h-full w-full object-contain p-2 transition duration-500 group-hover:scale-[1.08]" />
            ) : (
              <div className="flex h-full items-center justify-center text-primary/30"><Package className="h-12 w-12" /></div>
            )}
          </div>
          <div className="pointer-events-none absolute -inset-x-4 -top-1/2 h-40 rotate-12 bg-gradient-to-r from-transparent via-primary/10 to-transparent opacity-0 transition duration-700 group-hover:translate-y-[220%] group-hover:opacity-100" />
          {discount > 0 && (
            <span className="absolute start-2 top-2 rounded-full bg-gradient-to-r from-red-500 to-rose-500 px-2 py-0.5 text-[10px] font-bold text-white shadow-md">-{discount}%</span>
          )}
          {digital && !oos && (
            <span className="absolute start-2 bottom-2 rounded-full bg-primary/15 px-2 py-0.5 text-[10px] font-semibold text-primary backdrop-blur">{t("product.instant_delivery")}</span>
          )}
          {oos && (
            <span className="absolute end-2 bottom-2 rounded-full bg-background/80 px-2 py-0.5 text-[10px] font-bold text-muted-foreground backdrop-blur">{t("shop.outOfStock")}</span>
          )}
        </div>
        <div className="px-3 pt-2.5">
          <h3 className="line-clamp-2 min-h-[2.25rem] text-[13px] font-medium leading-tight text-foreground transition group-hover:text-primary">{name}</h3>
          <div className="mt-1.5 flex items-baseline gap-1.5">
            <span className="font-mono text-sm font-bold text-primary">{formatPrice(p.price, p.currency)}</span>
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
          className="h-8 w-full bg-primary text-xs text-background hover:bg-primary"
          onClick={() => {
            add({ product_id: p.id, slug: p.slug, name, image: img, price: Number(p.price), type: p.type });
            analytics.addToCart({ id: p.id, name, price: Number(p.price), quantity: 1 });
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
