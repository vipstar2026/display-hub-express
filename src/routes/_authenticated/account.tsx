import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { useAuth } from "@/lib/auth";
import { useI18n } from "@/lib/i18n";
import { toast } from "sonner";
import { User as UserIcon, Heart, ShoppingBag, Store, LogOut, Shield } from "lucide-react";

export const Route = createFileRoute("/_authenticated/account")({
  component: AccountPage,
  head: () => ({ meta: [{ title: "My Account | VIP STAR" }] }),
});

type Profile = { display_name: string | null; phone: string | null; avatar_url: string | null };

function AccountPage() {
  const { t } = useI18n();
  const { user, signOut } = useAuth();
  const nav = useNavigate();
  const [profile, setProfile] = useState<Profile>({ display_name: "", phone: "", avatar_url: "" });
  const [roles, setRoles] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const [{ data: p }, { data: r }] = await Promise.all([
        supabase.from("profiles").select("display_name, phone, avatar_url").eq("id", user.id).maybeSingle(),
        supabase.from("user_roles").select("role").eq("user_id", user.id),
      ]);
      if (p) setProfile(p);
      if (r) setRoles(r.map((x) => x.role));
    })();
  }, [user]);

  async function save() {
    if (!user) return;
    setSaving(true);
    const { error } = await supabase.from("profiles").update(profile).eq("id", user.id);
    setSaving(false);
    if (error) return toast.error(error.message);
    toast.success(t("auth.profileSaved"));
  }

  async function onSignOut() {
    await signOut();
    nav({ to: "/" });
  }

  const isAdmin = roles.includes("admin");
  const isVendor = roles.includes("vendor");

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <SiteHeader />
      <main className="flex-1 mx-auto max-w-6xl w-full px-4 py-8 grid md:grid-cols-[260px_1fr] gap-6">
        <aside className="bg-card border border-border rounded-xl p-4 h-fit">
          <div className="flex items-center gap-3 pb-4 border-b border-border">
            <div className="w-12 h-12 rounded-full bg-brand text-brand-foreground grid place-items-center font-bold text-lg">
              {(profile.display_name || user?.email || "U")[0].toUpperCase()}
            </div>
            <div className="min-w-0">
              <div className="font-semibold text-foreground truncate">{profile.display_name || t("auth.account")}</div>
              <div className="text-xs text-muted-foreground truncate">{user?.email}</div>
            </div>
          </div>
          <nav className="mt-4 space-y-1 text-sm">
            <a className="flex items-center gap-2 px-3 py-2 rounded-md bg-accent text-brand font-medium"><UserIcon className="w-4 h-4" /> {t("auth.profile")}</a>
            <Link to="/wishlist" className="flex items-center gap-2 px-3 py-2 rounded-md hover:bg-accent text-foreground"><Heart className="w-4 h-4" /> {t("header.wishlist")}</Link>
            <Link to="/cart" className="flex items-center gap-2 px-3 py-2 rounded-md hover:bg-accent text-foreground"><ShoppingBag className="w-4 h-4" /> {t("header.cart")}</Link>
            {isVendor
              ? <Link to="/sell/dashboard" className="flex items-center gap-2 px-3 py-2 rounded-md hover:bg-accent text-foreground"><Store className="w-4 h-4" /> {t("auth.vendorDash")}</Link>
              : <Link to="/sell/register" className="flex items-center gap-2 px-3 py-2 rounded-md hover:bg-accent text-foreground"><Store className="w-4 h-4" /> Become a Seller</Link>}
            {isAdmin && <a className="flex items-center gap-2 px-3 py-2 rounded-md hover:bg-accent text-foreground"><Shield className="w-4 h-4" /> {t("auth.admin")}</a>}
            <button onClick={onSignOut} className="w-full text-start flex items-center gap-2 px-3 py-2 rounded-md hover:bg-sale/10 text-sale font-medium">
              <LogOut className="w-4 h-4" /> {t("auth.signOut")}
            </button>
          </nav>
        </aside>

        <section className="bg-card border border-border rounded-xl p-6">
          <h1 className="text-xl font-bold text-foreground">{t("auth.profile")}</h1>
          <p className="text-sm text-muted-foreground mt-1">{t("auth.profileSub")}</p>

          <div className="mt-6 grid sm:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium">{t("auth.name")}</label>
              <input value={profile.display_name ?? ""} onChange={(e) => setProfile({ ...profile, display_name: e.target.value })} className="mt-1 w-full h-11 rounded-md border border-border px-3 text-sm bg-background outline-none focus:border-brand" />
            </div>
            <div>
              <label className="text-sm font-medium">{t("auth.email")}</label>
              <input disabled value={user?.email ?? ""} className="mt-1 w-full h-11 rounded-md border border-border px-3 text-sm bg-muted text-muted-foreground" />
            </div>
            <div>
              <label className="text-sm font-medium">{t("auth.phone")}</label>
              <input value={profile.phone ?? ""} onChange={(e) => setProfile({ ...profile, phone: e.target.value })} className="mt-1 w-full h-11 rounded-md border border-border px-3 text-sm bg-background outline-none focus:border-brand" />
            </div>
            <div>
              <label className="text-sm font-medium">{t("auth.avatar")}</label>
              <input value={profile.avatar_url ?? ""} onChange={(e) => setProfile({ ...profile, avatar_url: e.target.value })} placeholder="https://..." className="mt-1 w-full h-11 rounded-md border border-border px-3 text-sm bg-background outline-none focus:border-brand" />
            </div>
          </div>

          <button onClick={save} disabled={saving} className="mt-6 h-11 px-6 rounded-md bg-brand text-brand-foreground font-semibold hover:bg-brand-dark transition-smooth disabled:opacity-50">
            {saving ? "..." : t("auth.saveChanges")}
          </button>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}
