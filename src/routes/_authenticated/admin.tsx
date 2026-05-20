import { createFileRoute, Link, Outlet, useNavigate, useRouterState } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { Shield, LayoutDashboard, Store, Package, ListTree, ShoppingBag, Users, Loader2 } from "lucide-react";

export const Route = createFileRoute("/_authenticated/admin")({
  component: AdminLayout,
  head: () => ({ meta: [{ title: "Admin | VIP STAR" }] }),
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
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id)
        .eq("role", "admin")
        .maybeSingle();
      setIsAdmin(!!data);
      setChecking(false);
      if (!data) nav({ to: "/account" });
    })();
  }, [user, nav]);

  if (checking) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <SiteHeader />
        <main className="flex-1 grid place-items-center">
          <Loader2 className="w-6 h-6 animate-spin text-brand" />
        </main>
        <SiteFooter />
      </div>
    );
  }

  if (!isAdmin) return null;

  const items = [
    { to: "/admin", icon: LayoutDashboard, label: "Overview", exact: true },
    { to: "/admin/vendors", icon: Store, label: "Vendors" },
    { to: "/admin/products", icon: Package, label: "Products" },
    { to: "/admin/categories", icon: ListTree, label: "Categories" },
    { to: "/admin/orders", icon: ShoppingBag, label: "Orders" },
    { to: "/admin/users", icon: Users, label: "Users & Roles" },
  ] as const;

  const isActive = (to: string, exact?: boolean) =>
    exact ? pathname === to : pathname === to || pathname.startsWith(to + "/");

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <SiteHeader />
      <main className="flex-1 mx-auto max-w-7xl w-full px-4 py-6 grid md:grid-cols-[240px_1fr] gap-6">
        <aside className="bg-card border border-border rounded-xl p-4 h-fit md:sticky md:top-44">
          <div className="flex items-center gap-2 pb-3 border-b border-border">
            <div className="w-8 h-8 rounded-md bg-brand/10 text-brand grid place-items-center">
              <Shield className="w-4 h-4" />
            </div>
            <div className="text-sm font-bold text-foreground">Admin Console</div>
          </div>
          <nav className="mt-3 space-y-1 text-sm">
            {items.map((it) => (
              <Link
                key={it.to}
                to={it.to}
                className={`flex items-center gap-2 px-3 py-2 rounded-md transition-smooth ${
                  isActive(it.to, it.exact)
                    ? "bg-accent text-brand font-semibold"
                    : "hover:bg-accent text-foreground"
                }`}
              >
                <it.icon className="w-4 h-4" />
                {it.label}
              </Link>
            ))}
          </nav>
          <div className="mt-4 pt-3 border-t border-border">
            <Link to="/account" className="text-xs text-muted-foreground hover:text-brand">
              ← Back to account
            </Link>
          </div>
        </aside>

        <section className="min-w-0">
          <Outlet />
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}
