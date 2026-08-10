import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";

export const Route = createFileRoute("/unsubscribe")({
  component: UnsubscribePage,
  head: () => ({
    meta: [
      { title: "إلغاء الاشتراك من رسائل VIPSTAR" },
      { name: "description", content: "إدارة اشتراكك في رسائل البريد الإلكتروني من متجر VIPSTAR للأقمار الصناعية والإلكترونيات." },
      { property: "og:title", content: "إلغاء الاشتراك من رسائل VIPSTAR" },
      { property: "og:description", content: "إدارة اشتراكك في رسائل البريد الإلكتروني من VIPSTAR." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex" },
    ],
  }),
});

type State = "loading" | "valid" | "invalid" | "used" | "done" | "error";

function UnsubscribePage() {
  const [state, setState] = useState<State>("loading");
  const [email, setEmail] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [token, setToken] = useState<string | null>(null);

  useEffect(() => {
    const t = new URLSearchParams(window.location.search).get("token");
    setToken(t);
    if (!t) return setState("invalid");
    fetch(`/email/unsubscribe?token=${encodeURIComponent(t)}`)
      .then(async (r) => {
        const j = await r.json().catch(() => ({}));
        if (!r.ok || j.valid === false) return setState(j.used ? "used" : "invalid");
        setEmail(j.email ?? null);
        setState(j.used ? "used" : "valid");
      })
      .catch(() => setState("error"));
  }, []);

  async function confirm() {
    if (!token) return;
    setBusy(true);
    try {
      const r = await fetch("/email/unsubscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token }),
      });
      setState(r.ok ? "done" : "error");
    } catch {
      setState("error");
    }
    setBusy(false);
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-4 py-16">
      <div className="w-full max-w-md rounded-2xl border border-primary/20 bg-card/60 p-8 text-center">
        <h1 className="text-xl font-semibold text-primary">VIPSTAR</h1>

        {state === "loading" && <p className="mt-4 text-sm text-muted-foreground">جاري التحقق…</p>}

        {state === "valid" && (
          <>
            <p className="mt-4 text-sm text-muted-foreground">
              هل تريد إيقاف رسائل البريد الإلكتروني{email ? ` إلى ${email}` : ""}؟
            </p>
            <button
              onClick={confirm}
              disabled={busy}
              className="mt-6 w-full rounded-md bg-primary px-4 py-2 text-sm font-medium text-background disabled:opacity-60"
            >
              {busy ? "جاري التنفيذ…" : "تأكيد إلغاء الاشتراك"}
            </button>
          </>
        )}

        {state === "used" && <p className="mt-4 text-sm text-muted-foreground">تم إلغاء الاشتراك مسبقاً.</p>}
        {state === "done" && <p className="mt-4 text-sm text-muted-foreground">تم إلغاء الاشتراك بنجاح. لن تصلك رسائل بعد الآن.</p>}
        {state === "invalid" && <p className="mt-4 text-sm text-destructive">الرابط غير صالح أو منتهي الصلاحية.</p>}
        {state === "error" && <p className="mt-4 text-sm text-destructive">حدث خطأ، حاول لاحقاً.</p>}

        <a href="/" className="mt-6 inline-block text-xs text-muted-foreground underline">
          العودة إلى المتجر
        </a>
      </div>
    </main>
  );
}
