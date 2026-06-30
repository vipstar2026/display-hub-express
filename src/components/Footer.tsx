import { Satellite } from "lucide-react";
import { useI18n } from "@/lib/i18n";

export function Footer() {
  const { t } = useI18n();
  return (
    <footer className="mt-20 border-t border-cyan-500/20 bg-card/30 py-10">
      <div className="container mx-auto px-4 text-center">
        <div className="mb-3 flex items-center justify-center gap-2 font-display text-lg font-bold text-cyan-400">
          <Satellite className="h-5 w-5" /> VIPSTAR
        </div>
        <p className="text-sm text-muted-foreground">{t("site.tagline")}</p>
        <p className="mt-4 text-xs text-muted-foreground">© {new Date().getFullYear()} VIPSTAR. All rights reserved.</p>
      </div>
    </footer>
  );
}
