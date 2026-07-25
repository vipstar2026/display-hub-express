import { useEffect, useState } from "react";
import { Download, X } from "lucide-react";
import { useI18n } from "@/lib/i18n";

type BIPEvent = Event & { prompt: () => Promise<void>; userChoice: Promise<{ outcome: string }> };

export function PWAInstaller() {
  const { t } = useI18n();
  const [deferred, setDeferred] = useState<BIPEvent | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const dismissed = localStorage.getItem("pwa-install-dismissed");
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferred(e as BIPEvent);
      if (!dismissed) setTimeout(() => setVisible(true), 4000);
    };
    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  const install = async () => {
    if (!deferred) return;
    await deferred.prompt();
    await deferred.userChoice;
    setDeferred(null);
    setVisible(false);
  };
  const dismiss = () => {
    localStorage.setItem("pwa-install-dismissed", "1");
    setVisible(false);
  };

  if (!visible || !deferred) return null;
  return (
    <div className="fixed bottom-20 md:bottom-6 inset-x-4 md:inset-x-auto md:right-6 z-50 md:max-w-sm rounded-2xl border border-primary/30 bg-card/95 backdrop-blur-xl shadow-2xl p-4 animate-in slide-in-from-bottom-4">
      <button onClick={dismiss} className="absolute top-2 end-2 rounded-full p-1 hover:bg-muted"><X className="h-4 w-4" /></button>
      <div className="flex items-start gap-3">
        <div className="rounded-xl bg-primary/15 p-2.5"><Download className="h-5 w-5 text-primary" /></div>
        <div className="flex-1 min-w-0">
          <div className="font-semibold text-sm">{t("pwa.install_title")}</div>
          <div className="text-xs text-muted-foreground mt-0.5">{t("pwa.install_desc")}</div>
          <button onClick={install} className="mt-3 w-full rounded-lg bg-primary px-3 py-2 text-sm font-medium text-primary-foreground hover:opacity-90">
            {t("pwa.install_cta")}
          </button>
        </div>
      </div>
    </div>
  );
}
