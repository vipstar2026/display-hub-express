import { useEffect, useState } from "react";
import { Cookie, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/lib/i18n";

const KEY = "vipstar_cookie_consent_v1";

export function CookieConsent() {
  const { t } = useI18n();
  const [show, setShow] = useState(false);

  useEffect(() => {
    try {
      if (!localStorage.getItem(KEY)) {
        const id = setTimeout(() => setShow(true), 1200);
        return () => clearTimeout(id);
      }
    } catch { /* ignore */ }
  }, []);

  const decide = (choice: "all" | "essential") => {
    try { localStorage.setItem(KEY, JSON.stringify({ choice, at: Date.now() })); } catch { /* ignore */ }
    try { window.dispatchEvent(new CustomEvent("vipstar:consent", { detail: { choice } })); } catch { /* ignore */ }
    setShow(false);
  };


  if (!show) return null;
  return (
    <div className="fixed inset-x-3 bottom-3 z-50 mx-auto max-w-3xl animate-in fade-in slide-in-from-bottom-4 rounded-2xl border border-primary/25 bg-card/95 p-4 shadow-2xl shadow-primary/10 backdrop-blur md:inset-x-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-center">
        <div className="flex items-start gap-3">
          <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary">
            <Cookie className="h-5 w-5" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-sm font-semibold">{t("cookie.title")}</div>
            <p className="mt-0.5 text-xs text-muted-foreground">{t("cookie.body")}</p>
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-2 md:ms-auto">
          <Button size="sm" variant="ghost" onClick={() => decide("essential")}>{t("cookie.essential")}</Button>
          <Button size="sm" onClick={() => decide("all")}>{t("cookie.acceptAll")}</Button>
          <button onClick={() => decide("essential")} aria-label="close" className="text-muted-foreground hover:text-foreground">
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
