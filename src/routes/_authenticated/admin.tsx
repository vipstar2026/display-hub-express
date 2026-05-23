import { createFileRoute, Link, Outlet, useNavigate, useRouterState } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import {
  Shield, LayoutDashboard, Store, Package, ListTree, ShoppingBag,
  Users, Loader2, Settings, LogOut, ExternalLink, Bell, Search,
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

  if (checking) {
    return (
      <div className="min-h-screen grid place-items-center bg-slate-950">
        <Loader2 className="w-6 h-6 animate-spin text-amber-400" />
      </div>
    );
  }
  if (!isAdmin) return null;

  type NavTo = "/admin" | "/admin/vendors" | "/admin/products" | "/admin/categories" | "/admin/orders" | "/admin/users" | "/admin/settings";
  const groups: { label: string; items: { to: NavTo; icon: typeof LayoutDashboard; label: string; exact?: boolean }[] }[] = [
    {
      label: "Workspace",
      items: [{ to: "/admin", icon: LayoutDashboard, label: "Overview", exact: true }],
    },
    {
      label: "Catalog",
      items: [
        { to: "/admin/products", icon: Package, label: "Products" },
        { to: "/admin/categories", icon: ListTree, label: "Categories" },
        { to: "/admin/vendors", icon: Store, label: "Vendors" },
      ],
    },
    {
      label: "Commerce",
      items: [{ to: "/admin/orders", icon: ShoppingBag, label: "Orders" }],
    },
    {
      label: "System",
      items: [
        { to: "/admin/users", icon: Users, label: "Users & Roles" },
        { to: "/admin/settings", icon: Settings, label: "Site Settings" },
      ],
    },
  ];

  const isActive = (to: string, exact?: boolean) =>
    exact ? pathname === to : pathname === to || pathname.startsWith(to + "/");

  const crumb = pathname.replace("/admin", "").replace(/^\//, "") || "overview";

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex">
      {/* Sidebar */}
      <aside className="hidden md:flex w-64 shrink-0 flex-col bg-slate-900 text-slate-200 border-r border-slate-800 sticky top-0 h-screen">
        <div className="px-5 py-5 border-b border-slate-800 flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-amber-400 to-amber-600 grid place-items-center shadow-lg shadow-amber-500/20">
            <Shield className="w-5 h-5 text-slate-900" />
          </div>
          <div>
            <div className="text-sm font-bold tracking-wide text-white">VIP STAR</div>
            <div className="text-[10px] uppercase tracking-[0.2em] text-amber-400/80">Admin Console</div>
          </div>
        </div>

        <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-5">
          {groups.map((g) => (
            <div key={g.label}>
              <div className="px-3 text-[10px] uppercase tracking-[0.18em] text-slate-500 font-semibold mb-2">{g.label}</div>
              <div className="space-y-0.5">
                {g.items.map((it) => {
                  const active = isActive(it.to, it.exact);
                  return (
                    <Link
                      key={it.to}
                      to={it.to}
                      className={`group flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-all relative ${
                        active
                          ? "bg-gradient-to-r from-amber-500/15 to-transparent text-amber-300"
                          : "text-slate-400 hover:text-white hover:bg-slate-800/60"
                      }`}
                    >
                      {active && <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 rounded-r-full bg-amber-400" />}
                      <it.icon className={`w-4 h-4 ${active ? "text-amber-400" : ""}`} />
                      <span className="font-medium">{it.label}</span>
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        <div className="p-3 border-t border-slate-800 space-y-1">
          <Link to="/" className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs text-slate-400 hover:text-white hover:bg-slate-800/60">
            <ExternalLink className="w-3.5 h-3.5" /> View live site
          </Link>
          <Link to="/account" className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs text-slate-400 hover:text-white hover:bg-slate-800/60">
            <LogOut className="w-3.5 h-3.5" /> Back to account
          </Link>
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1 min-w-0 flex flex-col">
        {/* Topbar */}
        <header className="sticky top-0 z-30 bg-white/80 dark:bg-slate-900/80 backdrop-blur border-b border-slate-200 dark:border-slate-800">
          <div className="h-16 px-4 md:px-8 flex items-center justify-between gap-4">
            <div className="min-w-0">
              <div className="text-[11px] uppercase tracking-widest text-slate-400 font-semibold">Admin</div>
              <div className="text-sm font-semibold text-slate-900 dark:text-slate-100 capitalize truncate">{crumb.replace("/", " · ")}</div>
            </div>
            <div className="flex items-center gap-2">
              <div className="hidden lg:flex items-center gap-2 h-9 px-3 rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-500 w-64">
                <Search className="w-3.5 h-3.5" />
                <span>Quick search…</span>
                <kbd className="ml-auto text-[10px] px-1.5 py-0.5 rounded bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700">⌘K</kbd>
              </div>
              <button className="w-9 h-9 grid place-items-center rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 relative">
                <Bell className="w-4 h-4" />
                <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-amber-500" />
              </button>
              <div className="h-9 px-2.5 flex items-center gap-2 rounded-lg bg-slate-900 text-white text-xs font-semibold">
                <div className="w-6 h-6 rounded-full bg-gradient-to-br from-amber-400 to-amber-600 grid place-items-center text-slate-900 text-[10px] font-bold">
                  {(user?.email || "A").charAt(0).toUpperCase()}
                </div>
                <span className="hidden sm:inline truncate max-w-[140px]">{user?.email}</span>
              </div>
            </div>
          </div>
        </header>

        {/* Mobile nav strip */}
        <div className="md:hidden border-b border-slate-200 dark:border-slate-800 overflow-x-auto bg-white dark:bg-slate-900">
          <div className="flex gap-1 p-2 min-w-max">
            {groups.flatMap((g) => g.items).map((it) => {
              const active = isActive(it.to, it.exact);
              return (
                <Link key={it.to} to={it.to} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs whitespace-nowrap ${active ? "bg-amber-500 text-slate-900 font-semibold" : "text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"}`}>
                  <it.icon className="w-3.5 h-3.5" /> {it.label}
                </Link>
              );
            })}
          </div>
        </div>

        <main className="flex-1 p-4 md:p-8 min-w-0">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
