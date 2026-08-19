import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

/**
 * Availability map for digital / subscription products.
 * Returns how many unassigned codes are still deliverable per product id.
 * Backed by the public `digital_stock_map()` RPC (counts only, never code values).
 */
export function useDigitalStock() {
  return useQuery({
    queryKey: ["digital-stock-map"],
    staleTime: 60_000,
    queryFn: async () => {
      const { data, error } = await supabase.rpc("digital_stock_map");
      if (error) return {} as Record<string, number>;
      const map: Record<string, number> = {};
      (data ?? []).forEach((r: { product_id: string; available: number }) => {
        map[r.product_id] = r.available ?? 0;
      });
      return map;
    },
  });
}

export function isDigital(type?: string | null) {
  return type === "digital" || type === "subscription";
}

/** true when the product cannot currently be fulfilled */
export function soldOut(
  p: { id: string; type?: string | null; stock?: number | null; track_stock?: boolean | null },
  digitalMap?: Record<string, number>,
) {
  if (isDigital(p.type)) {
    if (!digitalMap) return false;
    const n = digitalMap[p.id];
    return n !== undefined && n <= 0;
  }
  return !!p.track_stock && (p.stock ?? 0) <= 0;
}
