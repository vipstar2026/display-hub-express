import { createFileRoute, Link, Outlet, useNavigate, useRouterState } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { useTheme } from "@/lib/theme";
import { CurrencySwitcher } from "@/components/CurrencySwitcher";
import { CommandPalette } from "@/components/admin/CommandPalette";
import { LANGS, useI18n, type Lang } from "@/lib/i18n";
import {
  Shield, LayoutDashboard, Store, Package, ListTree, ShoppingBag,
  Users, Loader2, Settings, LogOut, ExternalLink, Search,
  Menu, X, CreditCard, LifeBuoy, Globe, ChevronDown, Sun, Moon,
  ChevronsLeft, ChevronsRight, Command,
} from "lucide-react";

export const Route = createFileRoute("/_authenticated/admin")({
  component: AdminLayout,
  head: () => ({ meta: [{ title: "Command Center · VIP STAR" }] }),
});

function AdminLayout() {
  const { user } = useAuth();
  const nav = useNavigate();
  const { lang, setLang, dir } = useI18n();
  const { theme, toggle } = useTheme();
  const [checking, setChecking] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [langOpen, setLangOpen] = useState(false);
  const [paletteOpen, setPaletteOpen] = useState(false);
  const langRef = useRef<HTMLDivElement>(null);
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  // ⌘K / Ctrl+K
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setPaletteOpen((v) => !v);
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (langRef.current && !langRef.current.contains(e.target as Node)) setLangOpen(false);
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data } = await supabase
        .from("user_roles").select("role")
        .eq("user_id", user.id).eq("role", "admin").maybeSingle();
      setIsAdmin(!!data);
      setChecking(false);
      if (!data) nav({ to: "/account" });
    })();
  }, [user, nav]);

  useEffect(() => { setMobileOpen(false); }, [pathname]);

  // Persist collapsed
  useEffect(() => {
    try { const v = localStorage.getItem("vipstar.admin.collapsed"); if (v) setCollapsed(v === "1"); } catch { /* noop */ }
  }, []);
  useEffect(() => { try { localStorage.setItem("vipstar.admin.collapsed", collapsed ? "1" : "0"); } catch { /* noop */ } }, [collapsed]);

  const L = useMemo(() => {
    const ar = {
      dashboard: "نظرة عامة", vendors: "البائعون", products: "المنتجات",
      categories: "الأقسام", orders: "الطلبات", users: "المستخدمون",
      settings: "الإعدادات", payments: "بوابات الدفع", support: "الدعم",
      gOverview: "OVERVIEW", gCatalog: "CATALOG", gCommerce: "COMMERCE",
      gSystem: "SYSTEM", viewSite: "عرض الموقع المباشر",
      backAccount: "العودة للحساب", search: "بحث، إجراء، أو انتقال…",
    };
    const en = {
      dashboard: "Overview", vendors: "Vendors", products: "Products",
      categories: "Categories", orders: "Orders", users: "Users",
      settings: "Settings", payments: "Payments", support: "Support",
      gOverview: "OVERVIEW", gCatalog: "CATALOG", gCommerce: "COMMERCE",
      gSystem: "SYSTEM", viewSite: "Open live site",
      backAccount: "Back to account", search: "Search, run, or navigate…",
    };
    const ur = {
      dashboard: "جائزہ", vendors: "وینڈرز", products: "پروڈکٹس",
      categories: "زمرے", orders: "آرڈرز", users: "صارفین",
      settings: "ترتیبات", payments: "ادائیگی", support: "سپورٹ",
      gOverview: "OVERVIEW", gCatalog: "CATALOG", gCommerce: "COMMERCE",
      gSystem: "SYSTEM", viewSite: "لائیو سائٹ کھولیں",
      backAccount: "اکاؤنٹ پر واپس", search: "تلاش، عمل، یا تشریف…",
    };
    return lang === "en" ? en : lang === "ur" ? ur : ar;
  }, [lang]);

  if (checking) {
    return (
      <div className="min-h-screen grid place-items-center bg-background">
        <Loader2 className="w-6 h-6 animate-spin text-brand" />
      </div>
    );
  }
  if (!isAdmin) return null;

  type NavTo = "/admin" | "/admin/vendors" | "/admin/products" | "/admin/categories" | "/admin/orders" | "/admin/users" | "/admin/settings" | "/admin/payments" | "/admin/support";
  type NavItem = { to: NavTo; icon: typeof LayoutDashboard; label: string; exact?: boolean; kbd?: string };
  const groups: { label: string; items: NavItem[] }[] = [
    { label: L.gOverview, items: [
      { to: "/admin", icon: LayoutDashboard, label: L.dashboard, exact: true, kbd: "G D" },
    ]},
    { label: L.gCatalog, items: [
      { to: "/admin/products", icon: Package, label: L.products, kbd: "G P" },
      { to: "/admin/categories", icon: ListTree, label: L.categories },
      { to: "/admin/vendors", icon: Store, label: L.vendors },
    ]},
    { label: L.gCommerce, items: [
      { to: "/admin/orders", icon: ShoppingBag, label: L.orders, kbd: "G O" },
      { to: "/admin/payments", icon: CreditCard, label: L.payments },
      { to: "/admin/support", icon: LifeBuoy, label: L.support },
    ]},
    { label: L.gSystem, items: [
      { to: "/admin/users", icon: Users, label: L.users },
      { to: "/admin/settings", icon: Settings, label: L.settings },
    ]},
  ];

  const crumb = useMemo(() => {
    const map: Record<string, string> = {
      "": L.dashboard, vendors: L.vendors, products: L.products,
      categories: L.categories, orders: L.orders, users: L.users,
      settings: L.settings, payments: L.payments, support: L.support,
    };
    const seg = pathname.replace("/admin", "").replace(/^\//, "").split("/")[0] || "";
    return map[seg] ?? seg;
  }, [pathname, L]);

  const isActive = (to: string, exact?: boolean) =>
    exact ? pathname === to : pathname === to || pathname.startsWith(to + "/");

  const SidebarBody = (
    <>
      <div className={`px-4 py-5 border-b border-border flex items-center gap-3 ${collapsed ? "justify-center" : ""}`}>
        <div className="relative w-10 h-10 rounded-xl bg-gradient-brand grid place-items-center shadow-glow shrink-0">
          <Shield className="w-5 h-5 text-brand-foreground" />
          <span className="absolute -bottom-0.5 -end-0.5 w-2.5 h-2.5 rounded-full bg-emerald-400 border-2 border-card" />
        </div>
        {!collapsed && (
          <div className="min-w-0">
            <div className="text-sm font-bold tracking-wide text-foreground truncate">VIP STAR</div>
            <div className="text-[10px] uppercase tracking-[0.22em] text-brand font-mono">Command Center</div>
          </div>
        )}
      </div>

      <nav className="flex-1 overflow-y-auto px-2 py-4 space-y-5">
        {groups.map((g) => (
          <div key={g.label}>
            {!collapsed && (
              <div className="px-3 text-[10px] tracking-[0.22em] text-muted-foreground/70 font-bold mb-2 font-mono">{g.label}</div>
            )}
            <div className="space-y-0.5">
              {g.items.map((it) => {
                const active = isActive(it.to, it.exact);
                return (
                  <Link
                    key={it.to}
                    to={it.to}
                    title={collapsed ? it.label : undefined}
                    className={`group relative flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-smooth ${
                      active
                        ? "bg-brand/10 text-foreground"
                        : "text-muted-foreground hover:text-foreground hover:bg-accent/40"
                    } ${collapsed ? "justify-center" : ""}`}
                  >
                    {active && <span className="absolute start-0 top-1.5 bottom-1.5 w-[3px] rounded-e-full bg-brand shadow-glow" />}
                    <it.icon className={`w-4 h-4 shrink-0 ${active ? "text-brand" : ""}`} />
                    {!collapsed && (
                      <>
                        <span className="font-medium flex-1 truncate">{it.label}</span>
                        {it.kbd && <kbd className="text-[9px] font-mono text-muted-foreground/60 opacity-0 group-hover:opacity-100 transition-smooth">{it.kbd}</kbd>}
                      </>
                    )}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      <div className="p-2 border-t border-border space-y-0.5">
        <Link to="/" className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs text-muted-foreground hover:text-brand hover:bg-accent/40 transition-smooth ${collapsed ? "justify-center" : ""}`} title={collapsed ? L.viewSite : undefined}>
          <ExternalLink className="w-3.5 h-3.5 shrink-0" /> {!collapsed && L.viewSite}
        </Link>
        <Link to="/account" className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs text-muted-foreground hover:text-foreground hover:bg-accent/40 transition-smooth ${collapsed ? "justify-center" : ""}`} title={collapsed ? L.backAccount : undefined}>
          <LogOut className="w-3.5 h-3.5 shrink-0" /> {!collapsed && L.backAccount}
        </Link>
        <button
          onClick={() => setCollapsed((v) => !v)}
          className={`hidden md:flex w-full items-center gap-2 px-3 py-2 rounded-lg text-xs text-muted-foreground hover:text-foreground hover:bg-accent/40 transition-smooth ${collapsed ? "justify-center" : ""}`}
        >
          {collapsed ? <ChevronsRight className="w-3.5 h-3.5" /> : <><ChevronsLeft className="w-3.5 h-3.5" /> طي القائمة</>}
        </button>
      </div>
    </>
  );

  return (
    <div className="min-h-screen bg-background flex relative" dir={dir}>
      {/* Ambient grid background */}
      <div
        aria-hidden
        className="pointer-events-none fixed inset-0 opacity-[0.04]"
        style={{
          backgroundImage: "linear-gradient(var(--color-foreground) 1px, transparent 1px), linear-gradient(90deg, var(--color-foreground) 1px, transparent 1px)",
          backgroundSize: "32px 32px",
        }}
      />

      {/* Desktop sidebar */}
      <aside className={`hidden md:flex shrink-0 flex-col bg-card/60 backdrop-blur-xl border-s border-border sticky top-0 h-screen transition-all duration-300 z-20 ${collapsed ? "w-[68px]" : "w-64"}`}>
        {SidebarBody}
      </aside>

      {/* Mobile drawer */}
      {mobileOpen && (
        <>
          <div className="md:hidden fixed inset-0 bg-background/80 backdrop-blur-sm z-40" onClick={() => setMobileOpen(false)} />
          <aside className="md:hidden fixed top-0 end-0 z-50 w-72 h-screen bg-card border-s border-border flex flex-col animate-in slide-in-from-right">
            <button onClick={() => setMobileOpen(false)} className="absolute top-3 start-3 w-8 h-8 grid place-items-center rounded-lg bg-accent/60 text-foreground">
              <X className="w-4 h-4" />
            </button>
            {SidebarBody}
          </aside>
        </>
      )}

      <div className="flex-1 min-w-0 flex flex-col relative z-10">
        {/* Topbar */}
        <header className="sticky top-0 z-30 bg-background/70 backdrop-blur-xl border-b border-border">
          <div className="h-14 px-3 md:px-6 flex items-center gap-3">
            <button onClick={() => setMobileOpen(true)} className="md:hidden w-9 h-9 grid place-items-center rounded-lg bg-accent/60 text-foreground">
              <Menu className="w-4 h-4" />
            </button>

            <div className="hidden sm:flex items-center gap-1.5 text-[11px] font-mono text-muted-foreground">
              <span className="uppercase tracking-widest">/admin</span>
              <span className="text-foreground/30">›</span>
              <span className="text-brand font-bold uppercase tracking-widest">{crumb}</span>
            </div>

            {/* ⌘K trigger */}
            <button
              onClick={() => setPaletteOpen(true)}
              className="ms-auto flex items-center gap-2 h-9 px-3 rounded-lg bg-accent/30 hover:bg-accent/50 border border-border text-xs text-muted-foreground transition-smooth min-w-0 max-w-md flex-1 sm:flex-none sm:w-72"
            >
              <Search className="w-3.5 h-3.5 shrink-0" />
              <span className="truncate flex-1 text-start">{L.search}</span>
              <kbd className="text-[10px] px-1.5 py-0.5 rounded bg-card border border-border font-mono shrink-0">⌘K</kbd>
            </button>

            {/* Theme toggle */}
            <button
              onClick={toggle}
              className="w-9 h-9 grid place-items-center rounded-lg bg-accent/30 hover:bg-accent/50 border border-border text-foreground transition-smooth shrink-0"
              title={theme === "dark" ? "Light mode" : "Dark mode"}
            >
              {theme === "dark" ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>

            {/* Language */}
            <div className="relative shrink-0" ref={langRef}>
              <button
                onClick={() => setLangOpen((v) => !v)}
                className="h-9 px-2.5 flex items-center gap-1.5 rounded-lg bg-accent/30 hover:bg-accent/50 border border-border text-foreground text-xs font-semibold transition-smooth"
              >
                <Globe className="w-3.5 h-3.5" />
                <span className="uppercase font-mono">{lang}</span>
                <ChevronDown className="w-3 h-3" />
              </button>
              {langOpen && (
                <div className="absolute end-0 mt-1 w-36 rounded-lg bg-card shadow-card border border-border overflow-hidden z-50">
                  {LANGS.map((l) => (
                    <button
                      key={l.code}
                      onClick={() => { setLang(l.code as Lang); setLangOpen(false); }}
                      className={`w-full text-start px-3 py-2 text-xs hover:bg-accent transition-smooth ${l.code === lang ? "bg-accent text-brand font-semibold" : "text-foreground"}`}
                    >
                      {l.native}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="hidden md:block shrink-0"><CurrencySwitcher compact /></div>

            {/* User chip */}
            <div className="h-9 px-2.5 flex items-center gap-2 rounded-lg bg-gradient-brand text-brand-foreground text-xs font-semibold shadow-glow shrink-0">
              <div className="w-6 h-6 rounded-full bg-background/30 grid place-items-center text-[10px] font-bold">
                {(user?.email || "A").charAt(0).toUpperCase()}
              </div>
              <span className="hidden lg:inline truncate max-w-[140px]">{user?.email}</span>
            </div>
          </div>

          {/* Status strip */}
          <div className="h-6 px-3 md:px-6 flex items-center justify-between text-[10px] font-mono text-muted-foreground/70 border-t border-border/60 bg-card/30">
            <div className="flex items-center gap-3">
              <span className="inline-flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" /> LIVE</span>
              <span className="hidden sm:inline">UPTIME · 99.98%</span>
              <span className="hidden md:inline">REGION · AP-NORTH-1</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="hidden sm:inline">{new Date().toISOString().slice(0,10)}</span>
              <span className="inline-flex items-center gap-1"><Command className="w-2.5 h-2.5" />K</span>
            </div>
          </div>
        </header>

        <main className="flex-1 p-4 md:p-6 min-w-0">
          <Outlet />
        </main>
      </div>

      <CommandPalette open={paletteOpen} onClose={() => setPaletteOpen(false)} />
    </div>
  );
}
