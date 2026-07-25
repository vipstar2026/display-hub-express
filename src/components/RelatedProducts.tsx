import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { ProductCard } from "@/components/ProductCard";
import { useI18n } from "@/lib/i18n";

const KEY = "vipstar-recently-viewed";
const MAX = 12;

export function trackRecentlyViewed(productId: string) {
  if (typeof window === "undefined") return;
  try {
    const arr: string[] = JSON.parse(localStorage.getItem(KEY) || "[]");
    const next = [productId, ...arr.filter((x) => x !== productId)].slice(0, MAX);
    localStorage.setItem(KEY, JSON.stringify(next));
  } catch { /* ignore */ }
}

export function getRecentlyViewed(): string[] {
  if (typeof window === "undefined") return [];
  try { return JSON.parse(localStorage.getItem(KEY) || "[]"); } catch { return []; }
}

export function RelatedProducts({ productId, categoryId }: { productId: string; categoryId: string | null }) {
  const { t } = useI18n();
  const { data } = useQuery({
    queryKey: ["related-products", productId, categoryId],
    queryFn: async () => {
      if (!categoryId) return [];
      const { data } = await supabase
        .from("products")
        .select("id, slug, name_ar, name_en, name_ur, price, compare_price, currency, stock, track_stock, images, type, features")
        .eq("category_id", categoryId)
        .eq("status", "active")
        .neq("id", productId)
        .limit(8);
      return data ?? [];
    },
    enabled: !!categoryId,
  });

  if (!data || data.length === 0) return null;
  return (
    <section className="mt-12">
      <h2 className="mb-6 font-display text-2xl font-bold">{t("product.related")}</h2>
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        {data.map((p) => <ProductCard key={p.id} p={p as never} />)}
      </div>
    </section>
  );
}

export function RecentlyViewed({ excludeId }: { excludeId?: string }) {
  const { t } = useI18n();
  const [ids, setIds] = useState<string[]>([]);
  useEffect(() => { setIds(getRecentlyViewed().filter((id) => id !== excludeId).slice(0, 6)); }, [excludeId]);

  const { data } = useQuery({
    queryKey: ["recently-viewed", ids.join(",")],
    queryFn: async () => {
      if (ids.length === 0) return [];
      const { data } = await supabase
        .from("products")
        .select("id, slug, name_ar, name_en, name_ur, price, compare_price, currency, stock, track_stock, images, type, features")
        .in("id", ids)
        .eq("status", "active");
      // preserve recency order
      const map = new Map((data ?? []).map((p) => [p.id, p]));
      return ids.map((id) => map.get(id)).filter(Boolean);
    },
    enabled: ids.length > 0,
  });

  if (!data || data.length === 0) return null;
  return (
    <section className="mt-12">
      <h2 className="mb-6 font-display text-2xl font-bold">{t("product.recently_viewed")}</h2>
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4 lg:grid-cols-6">
        {data.map((p: any) => <ProductCard key={p.id} p={p as never} />)}
      </div>
    </section>
  );
}
