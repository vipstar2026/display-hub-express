import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { useI18n } from "@/lib/i18n";
import { toast } from "sonner";

export const Route = createFileRoute("/signup")({
  component: SignupPage,
  head: () => ({ meta: [{ title: "Sign Up | VIP STAR" }] }),
});

function SignupPage() {
  const { t } = useI18n();
  const nav = useNavigate();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/account`,
        data: { display_name: name },
      },
    });
    setBusy(false);
    if (error) return toast.error(error.message);
    toast.success(t("auth.checkEmail"));
    nav({ to: "/login" });
  }

  async function onGoogle() {
    setBusy(true);
    const result = await lovable.auth.signInWithOAuth("google", { redirect_uri: window.location.origin });
    if (result.error) { setBusy(false); toast.error(result.error.message); return; }
    if (result.redirected) return;
    nav({ to: "/account" });
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <SiteHeader />
      <main className="flex-1 grid place-items-center px-4 py-12">
        <div className="w-full max-w-md bg-card rounded-xl shadow-card border border-border p-8">
          <h1 className="text-2xl font-bold text-foreground">{t("auth.signupTitle")}</h1>
          <p className="mt-1 text-sm text-muted-foreground">{t("auth.signupSub")}</p>

          <button
            onClick={onGoogle}
            disabled={busy}
            className="mt-6 w-full h-11 rounded-md border border-border bg-white hover:bg-accent transition-smooth flex items-center justify-center gap-2 text-sm font-medium"
          >
            <svg width="18" height="18" viewBox="0 0 48 48"><path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.6 29.3 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3 0 5.7 1.1 7.8 3l5.7-5.7C33.9 6.1 29.2 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.4-.4-3.5z"/><path fill="#FF3D00" d="m6.3 14.7 6.6 4.8C14.7 16 19 13 24 13c3 0 5.7 1.1 7.8 3l5.7-5.7C33.9 6.1 29.2 4 24 4 16.3 4 9.7 8.4 6.3 14.7z"/><path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35 26.7 36 24 36c-5.3 0-9.7-3.4-11.3-8.1l-6.5 5C9.5 39.5 16.2 44 24 44z"/><path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.1-4.1 5.5l6.2 5.2C40.9 36.4 44 30.7 44 24c0-1.3-.1-2.4-.4-3.5z"/></svg>
            {t("auth.continueGoogle")}
          </button>

          <div className="my-6 flex items-center gap-3 text-xs text-muted-foreground">
            <div className="flex-1 h-px bg-border" /> {t("auth.or")} <div className="flex-1 h-px bg-border" />
          </div>

          <form onSubmit={onSubmit} className="space-y-3">
            <div>
              <label className="text-sm font-medium text-foreground">{t("auth.name")}</label>
              <input required value={name} onChange={(e) => setName(e.target.value)} className="mt-1 w-full h-11 rounded-md border border-border px-3 text-sm outline-none focus:border-brand bg-background" />
            </div>
            <div>
              <label className="text-sm font-medium text-foreground">{t("auth.email")}</label>
              <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="mt-1 w-full h-11 rounded-md border border-border px-3 text-sm outline-none focus:border-brand bg-background" />
            </div>
            <div>
              <label className="text-sm font-medium text-foreground">{t("auth.password")}</label>
              <input type="password" required minLength={6} value={password} onChange={(e) => setPassword(e.target.value)} className="mt-1 w-full h-11 rounded-md border border-border px-3 text-sm outline-none focus:border-brand bg-background" />
            </div>
            <button disabled={busy} type="submit" className="w-full h-11 rounded-md bg-brand text-brand-foreground font-semibold hover:bg-brand-dark transition-smooth disabled:opacity-50">
              {busy ? "..." : t("auth.createAccount")}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-muted-foreground">
            {t("auth.hasAccount")} <Link to="/login" className="text-brand font-semibold hover:underline">{t("auth.loginNow")}</Link>
          </p>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
