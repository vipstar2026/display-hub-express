import { Heart } from "lucide-react";
import { useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import { useWishlist } from "@/lib/wishlist";
import { useI18n } from "@/lib/i18n";

export function WishlistButton({ productId, className = "", size = 16 }: { productId: string; className?: string; size?: number }) {
  const { has, toggle } = useWishlist();
  const { t } = useI18n();
  const nav = useNavigate();
  const active = has(productId);

  const onClick = async (e: React.MouseEvent) => {
    e.preventDefault(); e.stopPropagation();
    try {
      const added = await toggle(productId);
      toast.success(added ? t("wishlist.added") : t("wishlist.removed"));
    } catch (err) {
      if ((err as Error).message === "signin_required") nav({ to: "/auth" });
      else toast.error((err as Error).message);
    }
  };

  return (
    <button
      onClick={onClick}
      aria-label={active ? t("wishlist.remove") : t("wishlist.add")}
      className={`grid place-items-center rounded-full border border-primary/20 bg-background/80 backdrop-blur transition hover:border-primary/60 hover:bg-primary/10 ${className}`}
    >
      <Heart className={`transition ${active ? "fill-primary text-primary" : "text-foreground/60"}`} style={{ width: size, height: size }} />
    </button>
  );
}
