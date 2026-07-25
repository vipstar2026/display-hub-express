import { Link, useRouterState } from "@tanstack/react-router";
import { Home, Store, Heart, ShoppingCart, User } from "lucide-react";
import { useCart } from "@/lib/cart";
import { useWishlist } from "@/lib/wishlist";
import { useI18n } from "@/lib/i18n";

export function MobileBottomNav() {
  const { t } = useI18n();
  const { count } = useCart();
  const { count: wishCount } = useWishlist();
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  // Hide on admin routes
  if (pathname.startsWith("/admin")) return null;

  const items: { to: string; icon: typeof Home; label: string; exact?: boolean; badge?: number }[] = [
    { to: "/", icon: Home, label: t("nav.home"), exact: true },
    { to: "/shop", icon: Store, label: t("nav.shop") },
    { to: "/wishlist", icon: Heart, label: t("wishlist.title") ?? "Wishlist", badge: wishCount },
    { to: "/cart", icon: ShoppingCart, label: t("nav.cart") ?? "Cart", badge: count },
    { to: "/account", icon: User, label: t("nav.account") },
  ];

  return (
    <>
      <nav
        aria-label="Mobile navigation"
        className="fixed inset-x-0 bottom-0 z-40 border-t border-primary/20 bg-background/95 backdrop-blur-xl md:hidden"
        style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
      >
        <ul className="grid grid-cols-5">
          {items.map((it) => {
            const active = it.exact ? pathname === it.to : pathname.startsWith(it.to);
            return (
              <li key={it.to}>
                <Link
                  to={it.to}
                  className={`relative flex flex-col items-center gap-0.5 px-1 py-2 text-[10px] font-medium transition ${
                    active ? "text-primary" : "text-muted-foreground"
                  }`}
                >
                  <span className="relative">
                    <it.icon className="h-5 w-5" />
                    {(it.badge ?? 0) > 0 && (
                      <span className="absolute -end-2 -top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[9px] font-bold text-background">
                        {(it.badge as number) > 9 ? "9+" : it.badge}
                      </span>
                    )}
                  </span>
                  <span className="truncate">{it.label}</span>
                  {active && <span className="absolute inset-x-6 top-0 h-0.5 rounded-b bg-primary" />}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
      {/* Spacer to prevent bottom content clipping on mobile */}
      <div className="h-16 md:hidden" aria-hidden />
    </>
  );
}
