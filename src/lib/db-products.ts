import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export type DbProduct = {
  id: string;
  title: string;
  slug: string;
  description: string | null;
  price: number;
  sale_price: number | null;
  currency: string;
  stock: number;
  brand: string | null;
  status: "draft" | "active" | "inactive" | "out_of_stock";
  rating: number;
  sales_count: number;
  vendor_id: string;
  category_id: string | null;
  image?: string;
};

export type DbProductDetail = DbProduct & {
  images: string[];
  vendor_name?: string;
  category_slug?: string;
};

export function useCategoryProducts(slug: string) {
  const [items, setItems] = useState<DbProduct[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancel = false;
    (async () => {
      setLoading(true);
      const { data: cat } = await supabase.from("categories").select("id").eq("slug", slug).maybeSingle();
      if (!cat) { if (!cancel) { setItems([]); setLoading(false); } return; }
      const { data } = await supabase
        .from("products")
        .select("id, title, slug, description, price, sale_price, currency, stock, brand, status, rating, sales_count, vendor_id, category_id, product_images(url, sort_order)")
        .eq("category_id", cat.id)
        .eq("status", "active")
        .order("created_at", { ascending: false })
        .limit(60);
      if (cancel) return;
      const mapped: DbProduct[] = (data ?? []).map((p: any) => {
        const imgs = (p.product_images ?? []).slice().sort((a: any, b: any) => a.sort_order - b.sort_order);
        return { ...p, image: imgs[0]?.url };
      });
      setItems(mapped);
      setLoading(false);
    })();
    return () => { cancel = true; };
  }, [slug]);

  return { items, loading };
}

export function useDbProduct(id: string) {
  const [product, setProduct] = useState<DbProductDetail | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancel = false;
    (async () => {
      setLoading(true);
      const { data } = await supabase
        .from("products")
        .select("id, title, slug, description, price, sale_price, currency, stock, brand, status, rating, sales_count, vendor_id, category_id, vendors(name), categories(slug), product_images(url, sort_order)")
        .eq("id", id)
        .maybeSingle();
      if (cancel) return;
      if (!data) { setProduct(null); setLoading(false); return; }
      const imgs = ((data as any).product_images ?? [])
        .slice()
        .sort((a: any, b: any) => a.sort_order - b.sort_order)
        .map((i: any) => i.url);
      setProduct({
        ...(data as any),
        images: imgs,
        image: imgs[0],
        vendor_name: (data as any).vendors?.name,
        category_slug: (data as any).categories?.slug,
      });
      setLoading(false);
    })();
    return () => { cancel = true; };
  }, [id]);

  return { product, loading };
}
