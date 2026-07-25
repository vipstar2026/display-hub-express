import { useCompare } from "@/lib/compare";
import { useI18n } from "@/lib/i18n";
import { Link } from "@tanstack/react-router";
import { GitCompareArrows, X } from "lucide-react";
import { Button } from "@/components/ui/button";

export function CompareBar() {
  const { ids, remove, clear, max } = useCompare();
  const { t } = useI18n();
  if (ids.length === 0) return null;

  return (
    <div className="fixed inset-x-3 bottom-20 z-40 mx-auto max-w-4xl rounded-2xl border border-primary/30 bg-card/95 p-3 shadow-2xl shadow-primary/20 backdrop-blur animate-in fade-in slide-in-from-bottom-4 md:inset-x-6 md:bottom-6">
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2 text-primary">
          <GitCompareArrows className="h-5 w-5" />
          <span className="text-sm font-semibold">{t("compare.selected")}: {ids.length}/{max}</span>
        </div>
        <div className="flex flex-1 flex-wrap items-center gap-1.5">
          {ids.map((id) => (
            <span key={id} className="inline-flex items-center gap-1 rounded-full border border-primary/20 bg-primary/5 px-2 py-0.5 text-[11px] font-mono">
              {id.slice(0, 6)}
              <button onClick={() => remove(id)} aria-label="remove" className="text-muted-foreground hover:text-red-400">
                <X className="h-3 w-3" />
              </button>
            </span>
          ))}
        </div>
        <div className="ms-auto flex items-center gap-2">
          <Button size="sm" variant="ghost" onClick={clear}>{t("compare.clear")}</Button>
          <Link to="/compare">
            <Button size="sm" disabled={ids.length < 2} className="gap-1">
              <GitCompareArrows className="h-4 w-4" /> {t("compare.open")}
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
