import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useI18n, localizedName } from "@/lib/i18n";
import { AlertTriangle, PackageX, Package, Save, TrendingDown, Boxes } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/_authenticated/admin/inventory")({
  ssr: false,
  component: InventoryPage,
});

type Product = {
  id: string;
  name_ar: string | null;
  name_en: string | null;
  name_ur: string | null;
  sku: string | null;
  stock: number;
  status: string;
  images: string[] | null;
};

function InventoryPage() {
  const { t, lang } = useI18n();
  const qc = useQueryClient();
  const [threshold, setThreshold] = useState(5);
  const [edits, setEdits] = useState<Record<string, number>>({});

  const { data: settings } = useQuery({
    queryKey: ["inv-settings"],
    queryFn: async () => {
      const { data } = await supabase.rpc("get_site_settings_admin");
      return Array.isArray(data) ? data[0] : data;
    },
  });

  const effectiveThreshold = settings?.low_stock_threshold ?? threshold;

  const { data: products = [] } = useQuery({
    queryKey: ["inv-products", effectiveThreshold],
    queryFn: async () => {
      const { data } = await supabase
        .from("products")
        .select("id, name_ar, name_en, name_ur, sku, stock, status, images")
        .eq("status", "active")
        .lte("stock", effectiveThreshold)
        .order("stock", { ascending: true });
      return (data ?? []) as Product[];
    },
  });

  const outOfStock = products.filter((p) => p.stock <= 0);
  const lowStock = products.filter((p) => p.stock > 0);

  const updateStock = useMutation({
    mutationFn: async ({ id, stock }: { id: string; stock: number }) => {
      const { error } = await supabase.from("products").update({ stock }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success(t("inv.saved"));
      qc.invalidateQueries({ queryKey: ["inv-products"] });
      setEdits({});
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const StockRow = ({ p }: { p: Product }) => {
    const pending = edits[p.id];
    const value = pending ?? p.stock;
    const critical = p.stock <= 0;
    return (
      <div className="flex items-center gap-3 rounded-xl border border-primary/10 bg-card p-3 transition hover:border-primary/30">
        <div className="h-14 w-14 shrink-0 overflow-hidden rounded-lg bg-muted/40">
          {p.images?.[0] ? (
            <img src={p.images[0]} alt="" className="h-full w-full object-cover" />
          ) : (
            <div className="grid h-full w-full place-items-center text-muted-foreground">
              <Package className="h-5 w-5" />
            </div>
          )}
        </div>
        <div className="min-w-0 flex-1">
          <div className="truncate font-medium">{localizedName(p, "name", lang)}</div>
          <div className="mt-0.5 flex items-center gap-2 text-xs text-muted-foreground">
            {p.sku && <span className="font-mono">SKU: {p.sku}</span>}
            <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 ${critical ? "bg-red-500/15 text-red-400" : "bg-amber-500/15 text-amber-400"}`}>
              {critical ? <PackageX className="h-3 w-3" /> : <AlertTriangle className="h-3 w-3" />}
              {critical ? t("inv.out") : `${p.stock} ${t("inv.left")}`}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Input
            type="number"
            min={0}
            value={value}
            onChange={(e) => setEdits((s) => ({ ...s, [p.id]: Number(e.target.value) }))}
            className="h-9 w-24 text-center font-mono"
          />
          {pending !== undefined && pending !== p.stock && (
            <Button
              size="sm"
              onClick={() => updateStock.mutate({ id: p.id, stock: pending })}
              disabled={updateStock.isPending}
            >
              <Save className="h-4 w-4" />
            </Button>
          )}
          <Link
            to="/admin/products"
            className="rounded-lg border border-primary/20 px-2 py-1.5 text-xs hover:bg-primary/10"
          >
            {t("inv.edit")}
          </Link>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 rounded-2xl border border-primary/20 bg-gradient-to-br from-amber-500/10 via-card to-card p-6 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="flex items-center gap-3 font-display text-2xl font-bold md:text-3xl">
            <Boxes className="h-7 w-7 text-amber-400" />
            {t("inv.title")}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">{t("inv.subtitle")}</p>
        </div>
        <div className="flex items-center gap-2 rounded-lg border border-primary/20 bg-card px-3 py-2">
          <span className="text-xs text-muted-foreground">{t("inv.threshold")}</span>
          <Input
            type="number"
            min={1}
            value={threshold}
            onChange={(e) => setThreshold(Number(e.target.value))}
            disabled={!!settings?.low_stock_threshold}
            className="h-8 w-20 text-center font-mono"
          />
          {settings?.low_stock_threshold && (
            <span className="text-xs text-muted-foreground">
              ({t("inv.fromSettings")}: {settings.low_stock_threshold})
            </span>
          )}
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-2xl border border-red-500/20 bg-gradient-to-br from-red-500/10 to-card p-5">
          <div className="flex items-center justify-between">
            <PackageX className="h-6 w-6 text-red-400" />
            <span className="text-xs uppercase tracking-wider text-muted-foreground">{t("inv.out")}</span>
          </div>
          <div className="mt-3 font-mono text-3xl font-bold text-red-400">{outOfStock.length}</div>
        </div>
        <div className="rounded-2xl border border-amber-500/20 bg-gradient-to-br from-amber-500/10 to-card p-5">
          <div className="flex items-center justify-between">
            <AlertTriangle className="h-6 w-6 text-amber-400" />
            <span className="text-xs uppercase tracking-wider text-muted-foreground">{t("inv.low")}</span>
          </div>
          <div className="mt-3 font-mono text-3xl font-bold text-amber-400">{lowStock.length}</div>
        </div>
        <div className="rounded-2xl border border-primary/20 bg-gradient-to-br from-primary/10 to-card p-5">
          <div className="flex items-center justify-between">
            <TrendingDown className="h-6 w-6 text-primary" />
            <span className="text-xs uppercase tracking-wider text-muted-foreground">{t("inv.total")}</span>
          </div>
          <div className="mt-3 font-mono text-3xl font-bold">{products.length}</div>
        </div>
      </div>

      {outOfStock.length > 0 && (
        <section>
          <h2 className="mb-3 flex items-center gap-2 font-display text-lg font-bold text-red-400">
            <PackageX className="h-5 w-5" /> {t("inv.outSection")}
          </h2>
          <div className="space-y-2">
            {outOfStock.map((p) => <StockRow key={p.id} p={p} />)}
          </div>
        </section>
      )}

      {lowStock.length > 0 && (
        <section>
          <h2 className="mb-3 flex items-center gap-2 font-display text-lg font-bold text-amber-400">
            <AlertTriangle className="h-5 w-5" /> {t("inv.lowSection")}
          </h2>
          <div className="space-y-2">
            {lowStock.map((p) => <StockRow key={p.id} p={p} />)}
          </div>
        </section>
      )}

      {products.length === 0 && (
        <div className="grid place-items-center rounded-2xl border border-primary/10 bg-card p-12 text-center">
          <div className="mb-3 grid h-14 w-14 place-items-center rounded-2xl bg-emerald-500/15">
            <Package className="h-7 w-7 text-emerald-400" />
          </div>
          <h3 className="font-display text-lg font-bold">{t("inv.allGood")}</h3>
          <p className="mt-1 text-sm text-muted-foreground">{t("inv.allGoodSub")}</p>
        </div>
      )}
    </div>
  );
}
