import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

export interface CartItem {
  product_id: string;
  slug: string;
  name: string;
  image: string | null;
  price: number;
  quantity: number;
  type: "physical" | "digital" | "subscription";
}

interface CartCtx {
  items: CartItem[];
  add: (item: Omit<CartItem, "quantity">, qty?: number) => void;
  remove: (product_id: string) => void;
  setQty: (product_id: string, qty: number) => void;
  clear: () => void;
  count: number;
  subtotal: number;
}

const Ctx = createContext<CartCtx | null>(null);
const KEY = "vipstar-cart";

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) setItems(JSON.parse(raw));
    } catch {}
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    localStorage.setItem(KEY, JSON.stringify(items));
  }, [items]);

  const add: CartCtx["add"] = (item, qty = 1) => {
    setItems((cur) => {
      const existing = cur.find((i) => i.product_id === item.product_id);
      if (existing) {
        return cur.map((i) => (i.product_id === item.product_id ? { ...i, quantity: i.quantity + qty } : i));
      }
      return [...cur, { ...item, quantity: qty }];
    });
  };
  const remove = (id: string) => setItems((c) => c.filter((i) => i.product_id !== id));
  const setQty = (id: string, qty: number) =>
    setItems((c) => (qty <= 0 ? c.filter((i) => i.product_id !== id) : c.map((i) => (i.product_id === id ? { ...i, quantity: qty } : i))));
  const clear = () => setItems([]);
  const count = items.reduce((s, i) => s + i.quantity, 0);
  const subtotal = items.reduce((s, i) => s + i.price * i.quantity, 0);

  return <Ctx.Provider value={{ items, add, remove, setQty, clear, count, subtotal }}>{children}</Ctx.Provider>;
}

export function useCart() {
  const c = useContext(Ctx);
  if (!c) throw new Error("useCart must be inside CartProvider");
  return c;
}
