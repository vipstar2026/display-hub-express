import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

const KEY = "vipstar_compare_v1";
const MAX = 4;

type Ctx = {
  ids: string[];
  has: (id: string) => boolean;
  toggle: (id: string) => { added: boolean; full: boolean };
  remove: (id: string) => void;
  clear: () => void;
  max: number;
};

const CompareCtx = createContext<Ctx | null>(null);

export function CompareProvider({ children }: { children: ReactNode }) {
  const [ids, setIds] = useState<string[]>([]);

  useEffect(() => {
    try { const raw = localStorage.getItem(KEY); if (raw) setIds(JSON.parse(raw)); } catch { /* ignore */ }
  }, []);
  useEffect(() => {
    try { localStorage.setItem(KEY, JSON.stringify(ids)); } catch { /* ignore */ }
  }, [ids]);

  const value: Ctx = {
    ids,
    max: MAX,
    has: (id) => ids.includes(id),
    toggle: (id) => {
      let added = false; let full = false;
      setIds((prev) => {
        if (prev.includes(id)) { added = false; return prev.filter((x) => x !== id); }
        if (prev.length >= MAX) { full = true; return prev; }
        added = true; return [...prev, id];
      });
      return { added, full };
    },
    remove: (id) => setIds((prev) => prev.filter((x) => x !== id)),
    clear: () => setIds([]),
  };

  return <CompareCtx.Provider value={value}>{children}</CompareCtx.Provider>;
}

export function useCompare() {
  const ctx = useContext(CompareCtx);
  if (!ctx) throw new Error("useCompare must be used inside CompareProvider");
  return ctx;
}
