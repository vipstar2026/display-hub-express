import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";

interface WishlistCtx {
  ids: Set<string>;
  toggle: (product_id: string) => Promise<boolean>; // returns new state (true=added)
  has: (product_id: string) => boolean;
  refresh: () => Promise<void>;
  count: number;
}

const Ctx = createContext<WishlistCtx | null>(null);

export function WishlistProvider({ children }: { children: ReactNode }) {
  const [ids, setIds] = useState<Set<string>>(new Set());
  const [userId, setUserId] = useState<string | null>(null);

  const refresh = async () => {
    const { data: u } = await supabase.auth.getUser();
    const uid = u.user?.id ?? null;
    setUserId(uid);
    if (!uid) { setIds(new Set()); return; }
    const { data } = await supabase.from("wishlist").select("product_id").eq("user_id", uid);
    setIds(new Set((data ?? []).map((r) => r.product_id)));
  };

  useEffect(() => {
    refresh();
    const { data: sub } = supabase.auth.onAuthStateChange((e) => {
      if (e === "SIGNED_IN" || e === "SIGNED_OUT") refresh();
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  const toggle = async (product_id: string): Promise<boolean> => {
    if (!userId) throw new Error("signin_required");
    if (ids.has(product_id)) {
      await supabase.from("wishlist").delete().eq("user_id", userId).eq("product_id", product_id);
      setIds((s) => { const n = new Set(s); n.delete(product_id); return n; });
      return false;
    }
    await supabase.from("wishlist").insert({ user_id: userId, product_id });
    setIds((s) => new Set(s).add(product_id));
    return true;
  };

  return <Ctx.Provider value={{ ids, toggle, has: (id) => ids.has(id), refresh, count: ids.size }}>{children}</Ctx.Provider>;
}

export function useWishlist() {
  const c = useContext(Ctx);
  if (!c) throw new Error("useWishlist must be inside WishlistProvider");
  return c;
}
