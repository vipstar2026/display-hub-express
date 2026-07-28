import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ShieldCheck, Lock, Loader2, Satellite, ArrowLeft, KeyRound, Fingerprint } from "lucide-react";
import { useI18n } from "@/lib/i18n";
import { toast } from "sonner";

export const Route = createFileRoute("/admin-login")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Staff Access — VIPSTAR Control Center" },
      { name: "description", content: "Secure staff sign-in for the VIPSTAR control center." },
      { name: "robots", content: "noindex, nofollow" },
      { property: "og:title", content: "Staff Access — VIPSTAR Control Center" },
      { property: "og:description", content: "Secure staff sign-in for the VIPSTAR control center." },
    ],
  }),
  component: AdminLoginPage,
});

function AdminLoginPage() {
  const { lang } = useI18n();
  const nav = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(true);

  const T = {
    badge: lang === "ar" ? "منطقة موظفين" : lang === "ur" ? "اسٹاف زون" : "Staff area",
    title: lang === "ar" ? "مركز التحكم" : lang === "ur" ? "کنٹرول سینٹر" : "Control Center",
    sub:
      lang === "ar"
        ? "الدخول مخصص لفريق العمل المصرّح له فقط"
        : lang === "ur"
          ? "صرف مجاز عملے کے لیے"
          : "Authorized staff only",
    email: lang === "ar" ? "البريد الوظيفي" : lang === "ur" ? "ای میل" : "Work email",
    password: lang === "ar" ? "كلمة المرور" : lang === "ur" ? "پاس ورڈ" : "Password",
    signin: lang === "ar" ? "دخول آمن" : lang === "ur" ? "محفوظ لاگ ان" : "Secure sign in",
    back: lang === "ar" ? "العودة للمتجر" : lang === "ur" ? "اسٹور پر واپس" : "Back to store",
    customer: lang === "ar" ? "زبون؟ سجّل الدخول من هنا" : lang === "ur" ? "کسٹمر؟ یہاں لاگ ان کریں" : "Customer? Sign in here",
    denied:
      lang === "ar"
        ? "هذا الحساب لا يملك صلاحية الدخول للوحة التحكم."
        : lang === "ur"
          ? "اس اکاؤنٹ کو ڈیش بورڈ تک رسائی نہیں۔"
          : "This account has no dashboard access.",
    notice:
      lang === "ar"
        ? "جميع محاولات الدخول تُسجَّل مع عنوان الجهاز والوقت."
        : lang === "ur"
          ? "تمام لاگ ان کوششیں ریکارڈ کی جاتی ہیں۔"
          : "All sign-in attempts are logged.",
    enc: lang === "ar" ? "اتصال مشفّر" : lang === "ur" ? "خفیہ کنکشن" : "Encrypted session",
  };

  const routeByRole = async (userId: string) => {
    const { data } = await supabase.from("user_roles").select("role").eq("user_id", userId);
    const roles = (data ?? []).map((r) => r.role as string);
    if (roles.includes("admin") || roles.includes("moderator")) {
      nav({ to: "/admin" });
      return true;
    }
    return false;
  };

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data }) => {
      if (data.user) {
        const ok = await routeByRole(data.user.id);
        if (ok) return;
      }
      setChecking(false);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      const ok = data.user ? await routeByRole(data.user.id) : false;
      if (!ok) {
        await supabase.auth.signOut();
        toast.error(T.denied);
      }
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  if (checking) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-5 w-5 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-background p-4">
      {/* ambient grid + glow */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.18]"
        style={{
          backgroundImage:
            "linear-gradient(to right, color-mix(in oklab, var(--primary) 25%, transparent) 1px, transparent 1px), linear-gradient(to bottom, color-mix(in oklab, var(--primary) 25%, transparent) 1px, transparent 1px)",
          backgroundSize: "56px 56px",
          maskImage: "radial-gradient(ellipse at center, black 20%, transparent 72%)",
        }}
      />
      <div className="pointer-events-none absolute -top-40 left-1/2 h-96 w-96 -translate-x-1/2 rounded-full bg-primary/20 blur-[120px]" />

      <div className="relative w-full max-w-[26rem]">
        <div className="mb-6 flex flex-col items-center gap-3 text-center">
          <div className="relative flex h-14 w-14 items-center justify-center rounded-2xl border border-primary/30 bg-primary/10">
            <ShieldCheck className="h-7 w-7 text-primary" />
            <span className="absolute -bottom-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full border border-primary/40 bg-background">
              <Satellite className="h-3 w-3 text-primary" />
            </span>
          </div>
          <div>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-primary">
              <Lock className="h-3 w-3" /> {T.badge}
            </span>
            <h1 className="mt-3 font-display text-2xl font-bold">VIPSTAR · {T.title}</h1>
            <p className="mt-1 text-sm text-muted-foreground">{T.sub}</p>
          </div>
        </div>

        <div className="rounded-2xl border border-primary/20 bg-card/80 p-6 shadow-[0_20px_60px_-25px_color-mix(in_oklab,var(--primary)_45%,transparent)] backdrop-blur">
          <form onSubmit={submit} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="admin-email" className="text-xs uppercase tracking-wider text-muted-foreground">
                {T.email}
              </Label>
              <Input
                id="admin-email"
                type="email"
                autoComplete="username"
                dir="ltr"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="h-11 border-primary/20 bg-background/60"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="admin-password" className="text-xs uppercase tracking-wider text-muted-foreground">
                {T.password}
              </Label>
              <Input
                id="admin-password"
                type="password"
                autoComplete="current-password"
                dir="ltr"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
                className="h-11 border-primary/20 bg-background/60"
              />
            </div>
            <Button type="submit" disabled={loading} className="h-11 w-full gap-2 text-background">
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <KeyRound className="h-4 w-4" />}
              {T.signin}
            </Button>
          </form>

          <div className="mt-5 flex items-center justify-between gap-2 border-t border-primary/10 pt-4 text-[11px] text-muted-foreground">
            <span className="inline-flex items-center gap-1.5">
              <Fingerprint className="h-3.5 w-3.5 text-primary" /> {T.notice}
            </span>
            <span className="inline-flex items-center gap-1 text-emerald-500">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" /> {T.enc}
            </span>
          </div>
        </div>

        <div className="mt-5 flex items-center justify-between text-sm">
          <Link to="/" className="inline-flex items-center gap-1.5 text-muted-foreground hover:text-primary">
            <ArrowLeft className="h-4 w-4" /> {T.back}
          </Link>
          <Link to="/auth" className="text-primary hover:underline">
            {T.customer}
          </Link>
        </div>
      </div>
    </div>
  );
}
