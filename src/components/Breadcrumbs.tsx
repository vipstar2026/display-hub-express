import { Link } from "@tanstack/react-router";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useI18n } from "@/lib/i18n";

export interface Crumb {
  label: string;
  to?: string;
  params?: Record<string, string>;
}

export function Breadcrumbs({ items }: { items: Crumb[] }) {
  const { dir } = useI18n();
  const Chevron = dir === "rtl" ? ChevronLeft : ChevronRight;
  return (
    <nav aria-label="Breadcrumb" className="mb-4">
      <ol className="flex flex-wrap items-center gap-1 text-xs text-muted-foreground">
        {items.map((c, i) => {
          const last = i === items.length - 1;
          return (
            <li key={`${c.label}-${i}`} className="flex items-center gap-1">
              {c.to && !last ? (
                <Link
                  to={c.to}
                  params={c.params as never}
                  className="transition hover:text-primary"
                >
                  {c.label}
                </Link>
              ) : (
                <span className={last ? "text-foreground" : undefined} aria-current={last ? "page" : undefined}>
                  {c.label}
                </span>
              )}
              {!last && <Chevron className="h-3 w-3 opacity-50" aria-hidden />}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

export function breadcrumbJsonLd(items: { name: string; url: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((it, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: it.name,
      item: it.url,
    })),
  };
}
