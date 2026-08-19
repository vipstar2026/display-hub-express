import { useEffect, useMemo, useState } from "react";
import { useNavigate, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Search, X, Package, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useI18n, localizedName } from "@/lib/i18n";
import { formatPrice, firstImage } from "@/lib/format";

function useDebounced(value: string, ms = 250) {
  const [v, setV] = useState(value);
  useEffect(() => {
    const id = setTimeout(() => setV(value), ms);
    return () => clearTimeout(id);
  }, [value, ms]);
  return v;
}

export function GlobalSearch({ className = "" }: { className?: string }) {
  const { t, lang } = useI18n();
  const nav = useNavigate();
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const term = useDebounced(q.trim());

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.key === "k" && (e.metaKey || e.ctrlKey))) { e.preventDefault(); setOpen(true); }
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const enabled = open && term.length >= 2;

  const { data, isFetching } = useQuery({
    queryKey: ["global-search", term],
    enabled,
    queryFn: async () => {
      const like = `%${term}%`;
      const [prods, cats] = await Promise.all([
        supabase
          .from("products")
          .select("id, slug, name_ar, name_en, name_ur, name_bn, price, currency, images, sku")
          .eq("status", "active")
          .or(`name_ar.ilike.${like},name_en.ilike.${like},name_ur.ilike.${like},name_bn.ilike.${like},sku.ilike.${like}`)
          .limit(8),
        supabase
          .from("categories")
          .select("id, slug, name_ar, name_en, name_ur, name_bn")
          .eq("is_active", true)
          .or(`name_ar.ilike.${like},name_en.ilike.${like},name_ur.ilike.${like},name_bn.ilike.${like}`)
          .limit(5),
      ]);
      return { products: prods.data ?? [], categories: cats.data ?? [] };
    },
  });

  const empty = useMemo(
    () => enabled && !isFetching && (data?.products.length ?? 0) === 0 && (data?.categories.length ?? 0) === 0,
    [enabled, isFetching, data],
  );

  const close = () => { setOpen(false); setQ(""); };

  const submit = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!term) return;
    close();
    nav({ to: "/shop", search: { q: term } as never });
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label={t("search.open")}
        className={`flex min-h-9 items-center gap-2 rounded-full border border-primary/20 bg-card/60 px-3 py-1.5 text-xs text-muted-foreground transition hover:border-primary/50 hover:text-primary ${className}`}
      >
        <Search className="h-4 w-4" aria-hidden />
        <span className="hidden lg:inline">{t("search.placeholder")}</span>
      </button>

      {open && (
        <div
          className="fixed inset-0 z-[80] bg-background/80 p-4 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-label={t("search.open")}
          onClick={close}
        >
          <div
            className="mx-auto mt-16 w-full max-w-2xl overflow-hidden rounded-2xl border border-primary/20 bg-card shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <form onSubmit={submit} className="flex items-center gap-2 border-b border-primary/10 px-4">
              <Search className="h-4 w-4 shrink-0 text-primary" aria-hidden />
              {/* eslint-disable-next-line jsx-a11y/no-autofocus */}
              <input
                autoFocus
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder={t("search.placeholder")}
                aria-label={t("search.placeholder")}
                className="h-14 w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground"
              />
              {isFetching && <Loader2 className="h-4 w-4 animate-spin text-primary" aria-hidden />}
              <button type="button" onClick={close} aria-label="close" className="p-2 text-muted-foreground hover:text-primary">
                <X className="h-4 w-4" aria-hidden />
              </button>
            </form>

            <div className="max-h-[60vh] overflow-y-auto p-2">
              {!enabled && <p className="p-6 text-center text-xs text-muted-foreground">{t("search.hint")}</p>}
              {empty && <p className="p-6 text-center text-sm text-muted-foreground">{t("search.no_results")}</p>}

              {(data?.categories ?? []).map((c) => (
                <Link
                  key={c.id}
                  to="/category/$slug"
                  params={{ slug: c.slug }}
                  onClick={close}
                  className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm hover:bg-primary/10"
                >
                  <span className="rounded-full border border-primary/30 px-2 py-0.5 text-[10px] text-primary">{t("cat.title")}</span>
                  {localizedName(c as unknown as Record<string, unknown>, "name", lang)}
                </Link>
              ))}

              {(data?.products ?? []).map((p) => {
                const img = firstImage(p.images);
                return (
                  <Link
                    key={p.id}
                    to="/product/$slug"
                    params={{ slug: p.slug }}
                    onClick={close}
                    className="flex items-center gap-3 rounded-lg px-3 py-2 hover:bg-primary/10"
                  >
                    <span className="grid h-10 w-10 shrink-0 place-items-center overflow-hidden rounded-md border border-primary/15 bg-background">
                      {img ? <img src={img} alt="" loading="lazy" className="h-full w-full object-cover" /> : <Package className="h-4 w-4 text-primary/40" aria-hidden />}
                    </span>
                    <span className="min-w-0 flex-1 truncate text-sm">
                      {localizedName(p as unknown as Record<string, unknown>, "name", lang)}
                    </span>
                    <span className="font-mono text-xs text-primary">{formatPrice(Number(p.price), p.currency)}</span>
                  </Link>
                );
              })}

              {enabled && (data?.products.length ?? 0) > 0 && (
                <button
                  type="button"
                  onClick={() => submit()}
                  className="mt-1 w-full rounded-lg px-3 py-2 text-center text-xs text-primary hover:bg-primary/10"
                >
                  {t("search.view_all")}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
