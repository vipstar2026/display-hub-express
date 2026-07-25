import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { MessageCircle, X } from "lucide-react";
import { useI18n } from "@/lib/i18n";

export function FloatingWhatsApp() {
  const { t } = useI18n();
  const [wa, setWa] = useState<string | null>(null);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    supabase.from("site_settings").select("whatsapp,site_name").eq("id", 1).maybeSingle()
      .then(({ data }) => setWa((data as any)?.whatsapp ?? null));
  }, []);

  if (!wa) return null;
  const clean = wa.replace(/[^0-9]/g, "");
  const msg = encodeURIComponent(t("wa.defaultMsg"));
  const href = `https://wa.me/${clean}?text=${msg}`;

  return (
    <>
      {open && (
        <div className="fixed bottom-24 end-4 z-50 w-72 animate-in fade-in slide-in-from-bottom-4 rounded-2xl border border-primary/20 bg-card/95 p-4 shadow-2xl shadow-emerald-500/20 backdrop-blur">
          <div className="mb-2 flex items-start justify-between">
            <div className="flex items-center gap-2">
              <div className="grid h-9 w-9 place-items-center rounded-full bg-emerald-500 text-white">
                <MessageCircle className="h-5 w-5" />
              </div>
              <div>
                <div className="text-sm font-semibold">{t("wa.title")}</div>
                <div className="text-[10px] text-emerald-400">{t("wa.online")}</div>
              </div>
            </div>
            <button onClick={() => setOpen(false)} aria-label="close" className="text-muted-foreground hover:text-foreground">
              <X className="h-4 w-4" />
            </button>
          </div>
          <p className="mb-3 text-xs text-muted-foreground">{t("wa.prompt")}</p>
          <a href={href} target="_blank" rel="noopener noreferrer"
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-emerald-500 py-2 text-sm font-medium text-white transition hover:bg-emerald-600">
            <MessageCircle className="h-4 w-4" /> {t("wa.startChat")}
          </a>
        </div>
      )}
      <button
        onClick={() => setOpen((v) => !v)}
        aria-label="WhatsApp"
        className="fixed bottom-20 end-4 z-40 grid h-14 w-14 place-items-center rounded-full bg-emerald-500 text-white shadow-lg shadow-emerald-500/40 transition hover:scale-110 hover:bg-emerald-600 md:bottom-6"
      >
        <MessageCircle className="h-6 w-6" />
        <span className="absolute inset-0 -z-10 animate-ping rounded-full bg-emerald-500/60" />
      </button>
    </>
  );
}
