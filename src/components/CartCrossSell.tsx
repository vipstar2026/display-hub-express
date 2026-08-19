import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { ProductCard } from "@/components/ProductCard";
import { useI18n } from "@/lib/i18n";
import { useCart } from "@/lib/cart";

/** "You may also like" — suggests active products that are not already in the cart. */
export function CartCrossSell() {
  const { t } = useI18n();
  const { items } = useCart();
  const ids = items.map((i) => i.product_id);

  const { data } = useQuery({
    queryKey: ["cart-cross-sell", ids.join(",")],
    queryFn: async () => {
      let q = supabase
        .from("products")
        .select("id, slug, name_ar, name_en, name_ur, name_bn, price, compare_price, currency, stock, track_stock, images, type")
        .eq("status", "active")
        .order("created_at", { ascending: false })
        .limit(12);
      if (ids.length > 0) q = q.not("id", "in", `(${ids.join(",")})`);
      const { data } = await q;
      return (data ?? []).slice(0, 6);
    },
  });

  if (!data || data.length === 0) return null;

  return (
    <section className="mt-12">
      <h2 className="mb-5 font-display text-xl font-bold">{t("cart.you_may_like")}</h2>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-6">
        {data.map((p) => <ProductCard key={p.id} p={p as never} />)}
      </div>
    </section>
  );
}
