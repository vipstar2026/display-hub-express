import { createFileRoute, Outlet, Link, redirect, useRouterState } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { LayoutDashboard, Package, FolderTree, ShoppingBag, Key, Users, Settings, Satellite, ArrowLeft } from "lucide-react";
import { useI18n } from "@/lib/i18n";

export const Route = createFileRoute("/_authenticated/admin")({
  ssr: false,
  beforeLoad: async () => {
    const { data: u } = await supabase.auth.getUser();
    if (!u.user) throw redirect({ to: "/auth" });
    const { data: role } = await supabase.from("user_roles").select("role").eq("user_id", u.user.id).eq("role", "admin").maybeSingle();
    if (!role) throw redirect({ to: "/" });
  },
  component: AdminLayout,
});

function AdminLayout() {
  const { t } = useI18n();
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  const nav = [
    { to: "/admin", icon: LayoutDashboard, label: t("admin.dashboard"), exact: true },
    { to: "/admin/products", icon: Package, label: t("admin.products") },
    { to: "/admin/categories", icon: FolderTree, label: t("admin.categories") },
    { to: "/admin/orders", icon: ShoppingBag, label: t("admin.orders") },
    { to: "/admin/codes", icon: Key, label: t("admin.codes") },
    { to: "/admin/users", icon: Users, label: t("admin.users") },
    { to: "/admin/settings", icon: Settings, label: t("admin.settings") },
  ];

  return (
    <div className="flex min-h-screen bg-background">
      <aside className="hidden w-60 shrink-0 border-e border-cyan-500/20 bg-card/50 p-3 md:block">
        <Link to="/" className="mb-6 flex items-center gap-2 px-2 font-display text-lg font-bold text-cyan-400">
          <Satellite className="h-5 w-5" /> VIPSTAR
        </Link>
        <nav className="space-y-1">
          {nav.map((n) => {
            const active = n.exact ? pathname === n.to : pathname.startsWith(n.to);
            return (
              <Link key={n.to} to={n.to} className={`flex items-center gap-2 rounded-md px-3 py-2 text-sm transition ${active ? "bg-cyan-500/10 text-cyan-400" : "hover:bg-cyan-500/5"}`}>
                <n.icon className="h-4 w-4" />
                {n.label}
              </Link>
            );
          })}
          <div className="my-3 border-t border-cyan-500/10" />
          <Link to="/" className="flex items-center gap-2 rounded-md px-3 py-2 text-sm text-muted-foreground hover:bg-cyan-500/5">
            <ArrowLeft className="h-4 w-4 rtl:rotate-180" /> {t("nav.home")}
          </Link>
        </nav>
      </aside>
      <main className="flex-1 overflow-auto">
        <div className="border-b border-cyan-500/20 bg-card/30 px-6 py-3 md:hidden">
          <nav className="flex gap-2 overflow-x-auto">
            {nav.map((n) => (
              <Link key={n.to} to={n.to} className="whitespace-nowrap rounded-md px-3 py-1 text-xs hover:bg-cyan-500/10">{n.label}</Link>
            ))}
          </nav>
        </div>
        <div className="p-6"><Outlet /></div>
      </main>
    </div>
  );
}
