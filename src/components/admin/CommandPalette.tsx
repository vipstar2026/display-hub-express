import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import {
  Search, LayoutDashboard, Store, Package, ListTree, ShoppingBag,
  Users, Settings, CreditCard, LifeBuoy, ExternalLink, Sun, Moon,
  CornerDownLeft, ArrowUp, ArrowDown,
} from "lucide-react";
import { useTheme } from "@/lib/theme";

type Item = {
  id: string;
  label: string;
  sub?: string;
  icon: typeof Search;
  group: string;
  run: () => void;
};

export function CommandPalette({ open, onClose }: { open: boolean; onClose: () => void }) {
  const nav = useNavigate();
  const { theme, toggle } = useTheme();
  const [q, setQ] = useState("");
  const [active, setActive] = useState(0);
  const [dynamic, setDynamic] = useState<Item[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  const staticItems: Item[] = useMemo(() => [
    { id: "n-dash", group: "تنقل", label: "لوحة القيادة", icon: LayoutDashboard, run: () => nav({ to: "/admin" }) },
    { id: "n-prod", group: "تنقل", label: "المنتجات", icon: Package, run: () => nav({ to: "/admin/products" }) },
    { id: "n-cat",  group: "تنقل", label: "الأقسام", icon: ListTree, run: () => nav({ to: "/admin/categories" }) },
    { id: "n-ven",  group: "تنقل", label: "البائعون", icon: Store, run: () => nav({ to: "/admin/vendors" }) },
    { id: "n-ord",  group: "تنقل", label: "الطلبات", icon: ShoppingBag, run: () => nav({ to: "/admin/orders" }) },
    { id: "n-pay",  group: "تنقل", label: "بوابات الدفع", icon: CreditCard, run: () => nav({ to: "/admin/payments" }) },
    { id: "n-sup",  group: "تنقل", label: "الدعم الفني", icon: LifeBuoy, run: () => nav({ to: "/admin/support" }) },
    { id: "n-usr",  group: "تنقل", label: "المستخدمون والصلاحيات", icon: Users, run: () => nav({ to: "/admin/users" }) },
    { id: "n-set",  group: "تنقل", label: "إعدادات الموقع", icon: Settings, run: () => nav({ to: "/admin/settings" }) },
    { id: "a-site", group: "إجراءات", label: "فتح الموقع المباشر", icon: ExternalLink, run: () => window.open("/", "_blank") },
    { id: "a-theme", group: "إجراءات", label: theme === "dark" ? "تبديل إلى الوضع الفاتح" : "تبديل إلى الوضع الداكن", icon: theme === "dark" ? Sun : Moon, run: () => toggle() },
  ], [nav, theme, toggle]);

  // Dynamic search across products / orders / vendors
  useEffect(() => {
    if (!open) return;
    const term = q.trim();
    if (term.length < 2) { setDynamic([]); return; }
    let cancelled = false;
    const t = setTimeout(async () => {
      const [p, o, v] = await Promise.all([
        supabase.from("products").select("id,title,slug").ilike("title", `%${term}%`).limit(5),
        supabase.from("orders").select("id,ship_full_name,total,currency").or(`ship_full_name.ilike.%${term}%,id.ilike.%${term}%`).limit(5),
        supabase.from("vendors").select("id,name,slug").ilike("name", `%${term}%`).limit(5),
      ]);
      if (cancelled) return;
      const items: Item[] = [];
      (p.data || []).forEach((r) => items.push({
        id: `p-${r.id}`, group: "منتجات", icon: Package, label: r.title, sub: r.slug,
        run: () => nav({ to: "/sell/products/$id", params: { id: r.id } }),
      }));
      (o.data || []).forEach((r) => items.push({
        id: `o-${r.id}`, group: "طلبات", icon: ShoppingBag, label: r.ship_full_name || `#${r.id.slice(0,8)}`,
        sub: `${r.currency} ${Number(r.total).toFixed(2)} · ${r.id.slice(0,8)}`,
        run: () => nav({ to: "/orders/$id", params: { id: r.id } }),
      }));
      (v.data || []).forEach((r) => items.push({
        id: `v-${r.id}`, group: "بائعون", icon: Store, label: r.name, sub: r.slug,
        run: () => nav({ to: "/admin/vendors" }),
      }));
      setDynamic(items);
    }, 180);
    return () => { cancelled = true; clearTimeout(t); };
  }, [q, open, nav]);

  const all = useMemo(() => {
    const term = q.trim().toLowerCase();
    const base = term ? staticItems.filter((i) => i.label.toLowerCase().includes(term)) : staticItems;
    return [...base, ...dynamic];
  }, [q, staticItems, dynamic]);

  useEffect(() => { setActive(0); }, [q, open]);
  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 30);
    else setQ("");
  }, [open]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (!open) return;
      if (e.key === "Escape") { e.preventDefault(); onClose(); }
      else if (e.key === "ArrowDown") { e.preventDefault(); setActive((a) => Math.min(a + 1, all.length - 1)); }
      else if (e.key === "ArrowUp") { e.preventDefault(); setActive((a) => Math.max(a - 1, 0)); }
      else if (e.key === "Enter") {
        e.preventDefault();
        const it = all[active];
        if (it) { it.run(); onClose(); }
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, all, active, onClose]);

  if (!open) return null;

  let lastGroup = "";
  return (
    <div className="fixed inset-0 z-[100] grid place-items-start pt-[12vh] px-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/70 backdrop-blur-md" />
      <div
        className="relative w-full max-w-xl bg-card border border-border rounded-2xl shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-2 px-4 h-14 border-b border-border">
          <Search className="w-4 h-4 text-muted-foreground" />
          <input
            ref={inputRef}
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="ابحث، أو نفّذ إجراء…"
            className="flex-1 bg-transparent outline-none text-sm text-foreground placeholder:text-muted-foreground"
          />
          <kbd className="text-[10px] px-1.5 py-0.5 rounded bg-accent border border-border font-mono text-muted-foreground">ESC</kbd>
        </div>
        <div className="max-h-[55vh] overflow-y-auto py-2">
          {all.length === 0 ? (
            <div className="text-center text-sm text-muted-foreground py-10">لا توجد نتائج</div>
          ) : all.map((it, i) => {
            const showGroup = it.group !== lastGroup;
            lastGroup = it.group;
            const isActive = i === active;
            return (
              <div key={it.id}>
                {showGroup && (
                  <div className="px-4 pt-3 pb-1 text-[10px] uppercase tracking-widest text-muted-foreground font-mono font-semibold">{it.group}</div>
                )}
                <button
                  onMouseEnter={() => setActive(i)}
                  onClick={() => { it.run(); onClose(); }}
                  className={`w-full flex items-center gap-3 px-4 py-2.5 text-start transition-smooth ${isActive ? "bg-brand/10 text-foreground" : "text-foreground/90 hover:bg-accent/40"}`}
                >
                  <it.icon className={`w-4 h-4 shrink-0 ${isActive ? "text-brand" : "text-muted-foreground"}`} />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium truncate">{it.label}</div>
                    {it.sub && <div className="text-[11px] text-muted-foreground font-mono truncate">{it.sub}</div>}
                  </div>
                  {isActive && <CornerDownLeft className="w-3.5 h-3.5 text-brand" />}
                </button>
              </div>
            );
          })}
        </div>
        <div className="h-9 px-4 flex items-center justify-between text-[10px] text-muted-foreground border-t border-border font-mono bg-accent/20">
          <div className="flex items-center gap-3">
            <span className="inline-flex items-center gap-1"><ArrowUp className="w-3 h-3" /><ArrowDown className="w-3 h-3" /> تنقل</span>
            <span className="inline-flex items-center gap-1"><CornerDownLeft className="w-3 h-3" /> فتح</span>
          </div>
          <span>VIP STAR · Command Palette</span>
        </div>
      </div>
    </div>
  );
}
