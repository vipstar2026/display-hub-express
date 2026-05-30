import { createFileRoute, Link, Outlet, useNavigate, useRouterState } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { CurrencySwitcher } from "@/components/CurrencySwitcher";
import {
  Shield, LayoutDashboard, Store, Package, ListTree, ShoppingBag,
  Users, Loader2, Settings, LogOut, ExternalLink, Bell, Search,
  Sparkles, ChevronRight, Menu, X, CreditCard, LifeBuoy,
} from "lucide-react";

export const Route = createFileRoute("/_authenticated/admin")({
  component: AdminLayout,
  head: () => ({ meta: [{ title: "Admin Console | VIP STAR" }] }),
});

function AdminLayout() {
  const { user } = useAuth();
  const nav = useNavigate();
  const [checking, setChecking] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [cats, setCats] = useState<{ slug: string; name: string }[]>([]);
  const [mobileOpen, setMobileOpen] = useState(false);
  const pathname = useRouterState({ select: (s) => s.location.pathname });

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

  useEffect(() => {
    (async () => {
      const { data } = await supabase.from("categories").select("slug,name").order("sort_order");
      setCats((data ?? []) as { slug: string; name: string }[]);
    })();
  }, []);

  useEffect(() => { setMobileOpen(false); }, [pathname]);

  const crumb = useMemo(() => {
    const map: Record<string, string> = {
      "": "لوحة القيادة", vendors: "البائعون", products: "المنتجات",
      categories: "الأقسام", orders: "الطلبات", users: "المستخدمون",
      settings: "الإعدادات", catalog: "إدارة القسم", payments: "بوابات الدفع", support: "الدعم الفني",
    };
    const seg = pathname.replace("/admin", "").replace(/^\//, "").split("/")[0] || "";
    return map[seg] ?? seg;
  }, [pathname]);

  if (checking) {
    return (
      <div className="min-h-screen grid place-items-center bg-background">
        <Loader2 className="w-6 h-6 animate-spin text-brand" />
      </div>
    );
  }
  if (!isAdmin) return null;

  type NavTo = "/admin" | "/admin/vendors" | "/admin/products" | "/admin/categories" | "/admin/orders" | "/admin/users" | "/admin/settings" | "/admin/payments";
  const groups: { label: string; items: { to: NavTo; icon: typeof LayoutDashboard; label: string; exact?: boolean }[] }[] = [
    { label: "نظرة عامة", items: [{ to: "/admin", icon: LayoutDashboard, label: "لوحة القيادة", exact: true }] },
    { label: "الكتالوج", items: [
      { to: "/admin/products", icon: Package, label: "كل المنتجات" },
      { to: "/admin/categories", icon: ListTree, label: "الأقسام" },
      { to: "/admin/vendors", icon: Store, label: "البائعون" },
    ]},
    { label: "التجارة", items: [
      { to: "/admin/orders", icon: ShoppingBag, label: "الطلبات" },
      { to: "/admin/payments", icon: CreditCard, label: "بوابات الدفع" },
    ]},
    { label: "النظام", items: [
      { to: "/admin/users", icon: Users, label: "المستخدمون والصلاحيات" },
      { to: "/admin/settings", icon: Settings, label: "إعدادات الموقع" },
    ]},
  ];

  const isActive = (to: string, exact?: boolean) =>
    exact ? pathname === to : pathname === to || pathname.startsWith(to + "/");
  const isCatActive = (slug: string) => pathname === `/admin/catalog/${slug}`;

  const SidebarBody = (
    <>
      <div className="px-5 py-5 border-b border-border flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-gradient-brand grid place-items-center shadow-glow">
          <Shield className="w-5 h-5 text-brand-foreground" />
        </div>
        <div>
          <div className="text-sm font-bold tracking-wide text-foreground">VIP STAR</div>
          <div className="text-[10px] uppercase tracking-[0.22em] text-brand font-mono">Admin Console</div>
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-5">
        {groups.map((g) => (
          <div key={g.label}>
            <div className="px-3 text-[10px] uppercase tracking-[0.18em] text-muted-foreground font-semibold mb-2 font-mono">{g.label}</div>
            <div className="space-y-1">
              {g.items.map((it) => {
                const active = isActive(it.to, it.exact);
                return (
                  <Link
                    key={it.to}
                    to={it.to}
                    className={`group flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-smooth relative ${
                      active
                        ? "bg-gradient-to-r from-brand/15 to-transparent text-brand"
                        : "text-muted-foreground hover:text-foreground hover:bg-accent/60"
                    }`}
                  >
                    {active && <span className="absolute start-0 top-1/2 -translate-y-1/2 w-1 h-6 rounded-e-full bg-brand shadow-glow" />}
                    <it.icon className={`w-4 h-4 ${active ? "text-brand" : ""}`} />
                    <span className="font-medium">{it.label}</span>
                  </Link>
                );
              })}
            </div>
          </div>
        ))}

        {cats.length > 0 && (
          <div>
            <div className="px-3 text-[10px] uppercase tracking-[0.18em] text-muted-foreground font-semibold mb-2 font-mono">صفحات الموقع</div>
            <div className="space-y-1">
              {cats.map((c) => {
                const active = isCatActive(c.slug);
                return (
                  <Link
                    key={c.slug}
                    to="/admin/catalog/$slug"
                    params={{ slug: c.slug }}
                    className={`group flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-smooth relative ${
                      active
                        ? "bg-gradient-to-r from-accent2/15 to-transparent text-accent2"
                        : "text-muted-foreground hover:text-foreground hover:bg-accent/60"
                    }`}
                  >
                    {active && <span className="absolute start-0 top-1/2 -translate-y-1/2 w-1 h-6 rounded-e-full bg-accent2" />}
                    <Package className={`w-4 h-4 ${active ? "text-accent2" : ""}`} />
                    <span className="font-medium">{c.name}</span>
                  </Link>
                );
              })}
            </div>
          </div>
        )}
      </nav>

      <div className="p-3 border-t border-border space-y-1">
        <Link to="/" className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs text-muted-foreground hover:text-brand hover:bg-accent/60 transition-smooth">
          <ExternalLink className="w-3.5 h-3.5" /> عرض الموقع المباشر
        </Link>
        <Link to="/account" className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs text-muted-foreground hover:text-foreground hover:bg-accent/60 transition-smooth">
          <LogOut className="w-3.5 h-3.5" /> العودة للحساب
        </Link>
      </div>
    </>
  );

  return (
    <div className="min-h-screen bg-background flex" dir="rtl">
      {/* Desktop sidebar */}
      <aside className="hidden md:flex w-64 shrink-0 flex-col bg-card border-s border-border sticky top-0 h-screen">
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

      {/* Main */}
      <div className="flex-1 min-w-0 flex flex-col">
        {/* Topbar */}
        <header className="sticky top-0 z-30 bg-card/80 backdrop-blur-xl border-b border-border">
          <div className="h-16 px-4 md:px-8 flex items-center justify-between gap-4">
            <div className="min-w-0 flex items-center gap-3">
              <button onClick={() => setMobileOpen(true)} className="md:hidden w-9 h-9 grid place-items-center rounded-lg bg-accent/60 text-foreground">
                <Menu className="w-4 h-4" />
              </button>
              <div className="min-w-0">
                <div className="flex items-center gap-1.5 text-[11px] uppercase tracking-widest text-muted-foreground font-mono">
                  <span>Admin</span>
                  <ChevronRight className="w-3 h-3" />
                  <span className="text-brand">{crumb}</span>
                </div>
                <div className="text-sm font-semibold text-foreground truncate mt-0.5">{crumb}</div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <div className="hidden lg:flex items-center gap-2 h-9 px-3 rounded-lg bg-accent/40 border border-border text-xs text-muted-foreground w-64">
                <Search className="w-3.5 h-3.5" />
                <span>بحث سريع…</span>
                <kbd className="ms-auto text-[10px] px-1.5 py-0.5 rounded bg-card border border-border font-mono">⌘K</kbd>
              </div>
              <div className="hidden sm:block"><CurrencySwitcher compact /></div>
              <button className="w-9 h-9 grid place-items-center rounded-lg bg-accent/60 hover:bg-accent text-foreground relative transition-smooth">
                <Bell className="w-4 h-4" />
                <span className="absolute top-1.5 end-1.5 w-1.5 h-1.5 rounded-full bg-brand shadow-glow" />
              </button>
              <div className="h-9 px-2.5 flex items-center gap-2 rounded-lg bg-gradient-brand text-brand-foreground text-xs font-semibold shadow-glow">
                <div className="w-6 h-6 rounded-full bg-background/30 grid place-items-center text-[10px] font-bold">
                  {(user?.email || "A").charAt(0).toUpperCase()}
                </div>
                <span className="hidden sm:inline truncate max-w-[140px]">{user?.email}</span>
              </div>
            </div>
          </div>
        </header>

        <main className="flex-1 p-4 md:p-8 min-w-0 bg-gradient-hero/0">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
