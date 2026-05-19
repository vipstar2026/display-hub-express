import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

export type CartItem = { id: string; qty: number };

type Ctx = {
  items: CartItem[];
  count: number;
  add: (id: string, qty?: number) => void;
  remove: (id: string) => void;
  setQty: (id: string, qty: number) => void;
  clear: () => void;
  wishlist: string[];
  toggleWishlist: (id: string) => void;
  isWished: (id: string) => boolean;
};

const CartCtx = createContext<Ctx>({
  items: [], count: 0, add: () => {}, remove: () => {}, setQty: () => {}, clear: () => {},
  wishlist: [], toggleWishlist: () => {}, isWished: () => false,
});

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [wishlist, setWishlist] = useState<string[]>([]);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      const c = localStorage.getItem("vs_cart");
      const w = localStorage.getItem("vs_wish");
      if (c) setItems(JSON.parse(c));
      if (w) setWishlist(JSON.parse(w));
    } catch {}
    setHydrated(true);
  }, []);

  useEffect(() => { if (hydrated) localStorage.setItem("vs_cart", JSON.stringify(items)); }, [items, hydrated]);
  useEffect(() => { if (hydrated) localStorage.setItem("vs_wish", JSON.stringify(wishlist)); }, [wishlist, hydrated]);

  const add = (id: string, qty = 1) =>
    setItems((prev) => {
      const ex = prev.find((i) => i.id === id);
      if (ex) return prev.map((i) => (i.id === id ? { ...i, qty: i.qty + qty } : i));
      return [...prev, { id, qty }];
    });
  const remove = (id: string) => setItems((prev) => prev.filter((i) => i.id !== id));
  const setQty = (id: string, qty: number) =>
    setItems((prev) => (qty <= 0 ? prev.filter((i) => i.id !== id) : prev.map((i) => (i.id === id ? { ...i, qty } : i))));
  const clear = () => setItems([]);
  const toggleWishlist = (id: string) =>
    setWishlist((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  const isWished = (id: string) => wishlist.includes(id);

  const count = items.reduce((n, i) => n + i.qty, 0);

  return (
    <CartCtx.Provider value={{ items, count, add, remove, setQty, clear, wishlist, toggleWishlist, isWished }}>
      {children}
    </CartCtx.Provider>
  );
}

export const useCart = () => useContext(CartCtx);
