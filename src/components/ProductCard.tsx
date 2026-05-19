import { Link } from "@tanstack/react-router";
import { Star, Heart } from "lucide-react";
import { useCart } from "@/lib/cart";

type Props = {
  id?: string;
  name: string;
  price: string | number;
  oldPrice?: string | number;
  discount?: string;
  description?: string;
  image?: string;
  rating?: number;
  sold?: number;
  badge?: string;
  freeShipping?: boolean;
};

const fmt = (v: string | number) => (typeof v === "number" ? `QAR ${v}` : v);

export function ProductCard({ id, name, price, oldPrice, discount, image, rating = 4.5, sold, badge, freeShipping }: Props) {
  const { toggleWishlist, isWished } = useCart();
  const wished = id ? isWished(id) : false;

  const inner = (
    <>
      {badge && (
        <span className="absolute top-2 start-2 z-10 text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded bg-sale text-white">
          {badge}
        </span>
      )}
      {id && (
        <button
          type="button"
          onClick={(e) => { e.preventDefault(); e.stopPropagation(); toggleWishlist(id); }}
          aria-label="Wishlist"
          className="absolute top-2 end-2 z-10 w-8 h-8 grid place-items-center rounded-full bg-white/95 shadow-card hover:bg-white transition-smooth"
        >
          <Heart className={`w-4 h-4 ${wished ? "fill-sale text-sale" : "text-muted-foreground"}`} />
        </button>
      )}
      <div className="aspect-square bg-secondary overflow-hidden">
        {image ? (
          <img src={image} alt={name} loading="lazy" className="w-full h-full object-cover group-hover:scale-105 transition-smooth" />
        ) : (
          <div className="w-full h-full grid place-items-center text-muted-foreground text-xs">No image</div>
        )}
      </div>
      <div className="p-3">
        <h3 className="text-sm text-foreground line-clamp-2 min-h-[2.5rem] group-hover:text-brand transition-smooth">{name}</h3>
        <div className="mt-2 flex items-baseline gap-2 flex-wrap">
          <span className="text-base font-bold text-sale">{fmt(price)}</span>
          {oldPrice && <span className="text-xs text-muted-foreground line-through">{fmt(oldPrice)}</span>}
          {discount && <span className="text-xs text-sale font-semibold">-{discount}</span>}
        </div>
        {freeShipping && (
          <div className="mt-1.5 inline-block text-[10px] px-1.5 py-0.5 bg-accent text-brand font-semibold rounded">FREE SHIPPING</div>
        )}
        <div className="mt-2 flex items-center gap-1 text-xs text-muted-foreground">
          <div className="flex">
            {[1, 2, 3, 4, 5].map((i) => (
              <Star key={i} className={`w-3 h-3 ${i <= Math.round(rating) ? "fill-yellow-400 text-yellow-400" : "text-border"}`} />
            ))}
          </div>
          {sold !== undefined && <span>| {sold} sold</span>}
        </div>
      </div>
    </>
  );

  const cls = "group relative bg-card rounded-md overflow-hidden border border-border product-card-hover cursor-pointer block";
  if (id) {
    return (
      <Link to="/product/$id" params={{ id }} className={cls}>
        {inner}
      </Link>
    );
  }
  return <div className={cls}>{inner}</div>;
}
