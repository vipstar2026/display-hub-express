import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { useI18n } from "@/lib/i18n";
import { ProductCard } from "@/components/ProductCard";
import { supabase } from "@/integrations/supabase/client";
import { useWishlist } from "@/lib/wishlist";
import { Heart } from "lucide-react";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/_authenticated/wishlist")({
  component: WishlistPage,
});

function WishlistPage() {
  const { t } = useI18n();
  const { ids } = useWishlist();
  const idArr = Array.from(ids);
  const { data: products } = useQuery({
    queryKey: ["wishlist-products", idArr.sort().join(",")],
    queryFn: async () => {
      if (idArr.length === 0) return [];
      const { data } = await supabase.from("products").select("*").in("id", idArr).eq("status", "active");
      return data ?? [];
    },
  });

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="container mx-auto px-4 py-8">
        <h1 className="mb-6 flex items-center gap-3 font-display text-3xl font-bold">
          <Heart className="h-7 w-7 text-primary" />{t("wishlist.title")}
        </h1>
        {(products ?? []).length === 0 ? (
          <div className="rounded-xl border border-primary/10 bg-card p-12 text-center">
            <Heart className="mx-auto mb-4 h-16 w-16 text-primary/30" />
            <p className="text-muted-foreground">{t("wishlist.empty")}</p>
            <Link to="/shop"><Button className="mt-4 bg-primary text-background hover:bg-primary">{t("shop.continueShopping")}</Button></Link>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
            {(products ?? []).map((p) => <ProductCard key={p.id} p={p as never} />)}
          </div>
        )}
      </div>
      <Footer />
    </div>
  );
}
