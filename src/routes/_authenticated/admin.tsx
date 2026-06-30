import { createFileRoute, Outlet, Link, redirect, useRouterState } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import {
  LayoutDashboard, Package, FolderTree, ShoppingBag, Key, Users, Settings,
  Satellite, ArrowLeft, Search, Bell, Menu, ChevronRight, Store, LogOut, Globe,
} from "lucide-react";
import { useI18n, type Lang } from "@/lib/i18n";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/_authenticated/admin")({
  ssr: false,
  beforeLoad: async () => {
    const { data: u } = await supabase.auth.getUser();
    if (!u.user) throw redirect({ to: "/auth" });
    const { data: role } = await supabase.from("user_roles").select("role").eq("user_id", u.user.id).eq("role", "admin").maybeSingle();
    if (!role) throw redirect({ to: "/" });
    return { user: u.user };
  },
  component: AdminLayout,
});

function AdminLayout() {
  const { t, lang, setLang } = useI18n();
  const { user } = Route.useRouteContext();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const [open, setOpen] = useState(false);

  const groups: { label: string; items: { to: string; icon: typeof LayoutDashboard; label: string; exact?: boolean }[] }[] = [
    {
      label: t("admin.overview"),
      items: [{ to: "/admin", icon: LayoutDashboard, label: t("admin.dashboard"), exact: true }],
    },
    {
      label: t("admin.catalog"),
      items: [
        { to: "/admin/categories", icon: FolderTree, label: t("admin.categories") },
        { to: "/admin/codes", icon: Key, label: t("admin.codes") },
      ],
    },

    {
      label: t("admin.sales"),
      items: [{ to: "/admin/orders", icon: ShoppingBag, label: t("admin.orders") }],
    },
    {
      label: t("admin.customers"),
      items: [{ to: "/admin/users", icon: Users, label: t("admin.users") }],
    },
    {
      label: t("admin.system"),
      items: [{ to: "/admin/settings", icon: Settings, label: t("admin.settings") }],
    },
  ];

  const allItems = groups.flatMap((g) => g.items);
  const current = allItems.find((i) => (i.exact ? pathname === i.to : pathname.startsWith(i.to) && i.to !== "/admin")) ?? allItems[0];

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-background via-background to-cyan-950/10">
      {/* Sidebar */}
      <aside className={`fixed inset-y-0 z-40 w-64 border-e border-cyan-500/20 bg-card/80 backdrop-blur-xl transition-transform md:static md:!translate-x-0 ${open ? "translate-x-0" : "rtl:translate-x-full ltr:-translate-x-full"}`}>
        <div className="flex h-16 items-center gap-2 border-b border-cyan-500/20 px-5">
          <div className="grid h-9 w-9 place-items-center rounded-lg bg-gradient-to-br from-cyan-400 to-cyan-600 shadow-lg shadow-cyan-500/30">
            <Satellite className="h-5 w-5 text-background" />
          </div>
          <div>
            <div className="font-display text-base font-bold text-cyan-400 leading-tight">VIPSTAR</div>
            <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Admin</div>
          </div>
        </div>

        <nav className="flex h-[calc(100vh-4rem)] flex-col gap-1 overflow-y-auto p-3">
          {groups.map((g) => (
            <div key={g.label} className="mb-2">
              <div className="px-3 py-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/60">
                {g.label}
              </div>
              {g.items.map((n) => {
                const active = n.exact ? pathname === n.to : pathname.startsWith(n.to);
                return (
                  <Link
                    key={n.to}
                    to={n.to}
                    onClick={() => setOpen(false)}
                    className={`group relative flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-all ${
                      active
                        ? "bg-gradient-to-r from-cyan-500/15 to-transparent text-cyan-300 shadow-inner"
                        : "text-muted-foreground hover:bg-cyan-500/5 hover:text-foreground"
                    }`}
                  >
                    {active && <span className="absolute start-0 top-1/2 h-6 w-0.5 -translate-y-1/2 rounded-e bg-cyan-400" />}
                    <n.icon className={`h-4 w-4 ${active ? "text-cyan-400" : ""}`} />
                    <span className="flex-1">{n.label}</span>
                  </Link>
                );
              })}
            </div>
          ))}

          <div className="mt-auto space-y-1 border-t border-cyan-500/10 pt-3">
            <Link to="/" className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-muted-foreground hover:bg-cyan-500/5 hover:text-foreground">
              <Store className="h-4 w-4" /> {t("admin.viewStore")}
            </Link>
            <button
              onClick={async () => { await supabase.auth.signOut(); window.location.href = "/"; }}
              className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm text-muted-foreground hover:bg-red-500/10 hover:text-red-400"
            >
              <LogOut className="h-4 w-4 rtl:rotate-180" /> {t("nav.signout")}
            </button>
          </div>
        </nav>
      </aside>

      {open && <div onClick={() => setOpen(false)} className="fixed inset-0 z-30 bg-black/50 md:hidden" />}

      {/* Main */}
      <div className="flex min-h-screen flex-1 flex-col">
        {/* Header */}
        <header className="sticky top-0 z-20 border-b border-cyan-500/20 bg-card/60 backdrop-blur-xl">
          <div className="flex h-16 items-center gap-3 px-4 md:px-6">
            <Button variant="ghost" size="icon" className="md:hidden" onClick={() => setOpen(true)}>
              <Menu className="h-5 w-5" />
            </Button>

            <div className="hidden items-center gap-1.5 text-sm text-muted-foreground md:flex">
              <Link to="/admin" className="hover:text-cyan-400">{t("admin.dashboard")}</Link>
              {current && current.to !== "/admin" && (
                <>
                  <ChevronRight className="h-4 w-4 rtl:rotate-180" />
                  <span className="font-medium text-foreground">{current.label}</span>
                </>
              )}
            </div>

            <div className="relative ms-auto hidden md:block md:w-72">
              <Search className="pointer-events-none absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input placeholder={t("admin.search")} className="h-9 border-cyan-500/20 bg-background/50 ps-9" />
            </div>

            <div className="ms-auto flex items-center gap-2 md:ms-0">
              <div className="relative">
                <Globe className="pointer-events-none absolute start-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
                <select
                  value={lang}
                  onChange={(e) => setLang(e.target.value as Lang)}
                  className="h-9 appearance-none rounded-md border border-cyan-500/20 bg-background/50 ps-7 pe-3 text-xs font-medium outline-none focus:border-cyan-500"
                >
                  <option value="ar">AR</option>
                  <option value="en">EN</option>
                  <option value="ur">UR</option>
                </select>
              </div>
              <Button variant="ghost" size="icon" className="relative">
                <Bell className="h-4 w-4" />
                <span className="absolute right-2 top-2 h-1.5 w-1.5 rounded-full bg-cyan-400" />
              </Button>
              <div className="hidden items-center gap-2 rounded-full border border-cyan-500/20 bg-background/50 py-1 ps-1 pe-3 sm:flex">
                <div className="grid h-7 w-7 place-items-center rounded-full bg-gradient-to-br from-cyan-400 to-cyan-600 text-xs font-bold text-background">
                  {(user.email?.[0] ?? "A").toUpperCase()}
                </div>
                <span className="max-w-[140px] truncate text-xs text-muted-foreground">{user.email}</span>
              </div>
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-auto p-4 md:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

// Keep backward-compat export for old links
export { ArrowLeft };
