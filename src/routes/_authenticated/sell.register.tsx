import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";
import { slugify, uploadAsset } from "@/lib/uploads";
import { toast } from "sonner";
import { Store } from "lucide-react";

export const Route = createFileRoute("/_authenticated/sell/register")({
  component: RegisterVendor,
  head: () => ({ meta: [{ title: "Become a Seller | VIP STAR" }] }),
});

function RegisterVendor() {
  const { user } = useAuth();
  const nav = useNavigate();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [logo, setLogo] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!user) return;
    supabase.from("vendors").select("id").eq("owner_id", user.id).maybeSingle().then(({ data }) => {
      if (data) nav({ to: "/sell/dashboard" });
    });
  }, [user, nav]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!user) return;
    setBusy(true);
    try {
      let logo_url: string | null = null;
      if (logo) logo_url = await uploadAsset(user.id, logo, "logos");
      const slug = `${slugify(name)}-${Math.random().toString(36).slice(2, 6)}`;
      const { error } = await supabase.from("vendors").insert({
        owner_id: user.id, name: name.trim(), slug, description: description.trim() || null, logo_url,
      });
      if (error) throw error;
      toast.success("Store created! Pending approval.");
      nav({ to: "/sell/dashboard" });
    } catch (err: any) {
      toast.error(err.message ?? "Failed to create store");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <SiteHeader />
      <main className="flex-1 mx-auto max-w-2xl w-full px-4 py-10">
        <div className="bg-card border border-border rounded-xl p-8 shadow-card">
          <div className="flex items-center gap-3 pb-4 border-b border-border">
            <div className="w-12 h-12 rounded-full bg-brand/10 text-brand grid place-items-center">
              <Store className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-foreground">Become a Seller</h1>
              <p className="text-sm text-muted-foreground">Open your store on VIP STAR Marketplace</p>
            </div>
          </div>

          <form onSubmit={onSubmit} className="mt-6 space-y-4">
            <div>
              <label className="text-sm font-medium">Store Name *</label>
              <input required maxLength={80} value={name} onChange={(e) => setName(e.target.value)}
                className="mt-1 w-full h-11 rounded-md border border-border px-3 text-sm bg-background outline-none focus:border-brand" />
            </div>
            <div>
              <label className="text-sm font-medium">Description</label>
              <textarea rows={4} maxLength={500} value={description} onChange={(e) => setDescription(e.target.value)}
                className="mt-1 w-full rounded-md border border-border px-3 py-2 text-sm bg-background outline-none focus:border-brand" />
            </div>
            <div>
              <label className="text-sm font-medium">Store Logo</label>
              <input type="file" accept="image/*" onChange={(e) => setLogo(e.target.files?.[0] ?? null)}
                className="mt-1 w-full text-sm file:mr-3 file:h-10 file:px-4 file:rounded-md file:border-0 file:bg-brand file:text-brand-foreground file:font-medium hover:file:bg-brand-dark" />
            </div>
            <div className="flex gap-3 pt-2">
              <button disabled={busy} type="submit" className="flex-1 h-11 rounded-md bg-brand text-brand-foreground font-semibold hover:bg-brand-dark transition-smooth disabled:opacity-50">
                {busy ? "Creating..." : "Create Store"}
              </button>
              <Link to="/" className="h-11 px-6 grid place-items-center rounded-md border border-border hover:bg-accent text-sm">Cancel</Link>
            </div>
          </form>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
