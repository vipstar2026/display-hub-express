import { createFileRoute } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { useI18n } from "@/lib/i18n";
import { Button } from "@/components/ui/button";
import { Database, Download, ShoppingBag, Package, UsersRound, FileText, Mail, Ticket, Loader2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/admin/backups")({
  component: AdminBackupsPage,
});

function toCSV(rows: Record<string, unknown>[]): string {
  if (rows.length === 0) return "";
  const headers = Array.from(
    rows.reduce((set, r) => { Object.keys(r).forEach((k) => set.add(k)); return set; }, new Set<string>())
  );
  const escape = (v: unknown) => {
    if (v === null || v === undefined) return "";
    const s = typeof v === "object" ? JSON.stringify(v) : String(v);
    return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const head = headers.join(",");
  const body = rows.map((r) => headers.map((h) => escape(r[h])).join(",")).join("\n");
  return `${head}\n${body}`;
}

function download(filename: string, content: string, mime = "text/csv;charset=utf-8;") {
  const blob = new Blob(["\uFEFF" + content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = filename;
  document.body.appendChild(a); a.click(); a.remove();
  URL.revokeObjectURL(url);
}

function AdminBackupsPage() {
  const { t } = useI18n();
  const [busy, setBusy] = useState<string | null>(null);

  const exportTable = async (
    key: string,
    table: string,
    filename: string,
    select = "*",
  ) => {
    setBusy(key);
    try {
      const { data, error } = await supabase.from(table as never).select(select).limit(10000);
      if (error) throw error;
      const rows = (data ?? []) as Record<string, unknown>[];
      if (rows.length === 0) { toast.info(t("backups.no_data")); return; }
      const stamp = new Date().toISOString().slice(0, 10);
      download(`${filename}-${stamp}.csv`, toCSV(rows));
      toast.success(`${rows.length} ${t("backups.rows_exported")}`);
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Error");
    } finally {
      setBusy(null);
    }
  };

  const exportAll = async () => {
    setBusy("all");
    try {
      const tables = ["orders", "order_items", "products", "categories", "profiles", "invoices", "newsletter_subscribers", "coupons"];
      const PROFILE_COLS = "id,display_name,avatar_url,phone,created_at,updated_at";
      const bundle: Record<string, unknown> = { exported_at: new Date().toISOString() };
      for (const tbl of tables) {
        const cols = tbl === "profiles" ? PROFILE_COLS : "*";
        const { data } = await supabase.from(tbl as never).select(cols).limit(10000);
        bundle[tbl] = data ?? [];
      }
      const stamp = new Date().toISOString().slice(0, 10);
      download(`vipstar-backup-${stamp}.json`, JSON.stringify(bundle, null, 2), "application/json");
      toast.success(t("backups.backup_ready"));
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Error");
    } finally {
      setBusy(null);
    }
  };

  const cards: { key: string; table: string; file: string; icon: typeof ShoppingBag; label: string; desc: string }[] = [
    { key: "orders", table: "orders", file: "orders", icon: ShoppingBag, label: t("backups.orders"), desc: t("backups.orders_desc") },
    { key: "order_items", table: "order_items", file: "order-items", icon: FileText, label: t("backups.order_items"), desc: t("backups.order_items_desc") },
    { key: "products", table: "products", file: "products", icon: Package, label: t("backups.products"), desc: t("backups.products_desc") },
    { key: "customers", table: "profiles", file: "customers", select: "id,display_name,avatar_url,phone,created_at,updated_at", icon: UsersRound, label: t("backups.customers"), desc: t("backups.customers_desc") },
    { key: "invoices", table: "invoices", file: "invoices", icon: FileText, label: t("backups.invoices"), desc: t("backups.invoices_desc") },
    { key: "newsletter", table: "newsletter_subscribers", file: "newsletter", icon: Mail, label: t("backups.newsletter"), desc: t("backups.newsletter_desc") },
    { key: "coupons", table: "coupons", file: "coupons", icon: Ticket, label: t("backups.coupons"), desc: t("backups.coupons_desc") },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="flex items-center gap-2 font-display text-2xl font-bold">
            <Database className="h-6 w-6 text-primary" />
            {t("backups.title")}
          </h1>
          <p className="text-sm text-muted-foreground">{t("backups.subtitle")}</p>
        </div>
        <Button onClick={exportAll} disabled={busy === "all"} className="bg-primary text-background hover:bg-primary">
          {busy === "all" ? <Loader2 className="me-2 h-4 w-4 animate-spin" /> : <Download className="me-2 h-4 w-4" />}
          {t("backups.full_backup")}
        </Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {cards.map((c) => {
          const Icon = c.icon;
          const loading = busy === c.key;
          return (
            <div key={c.key} className="group rounded-xl border border-primary/20 bg-card p-5 transition-colors hover:border-primary/40">
              <div className="mb-3 flex items-center gap-3">
                <div className="rounded-lg bg-primary/10 p-2.5 text-primary">
                  <Icon className="h-5 w-5" />
                </div>
                <div className="flex-1">
                  <div className="font-semibold">{c.label}</div>
                  <div className="text-xs text-muted-foreground">{c.desc}</div>
                </div>
              </div>
              <Button
                size="sm"
                variant="outline"
                className="w-full"
                disabled={loading}
                onClick={() => exportTable(c.key, c.table, c.file)}
              >
                {loading ? <Loader2 className="me-2 h-3.5 w-3.5 animate-spin" /> : <Download className="me-2 h-3.5 w-3.5" />}
                {t("backups.export_csv")}
              </Button>
            </div>
          );
        })}
      </div>

      <div className="rounded-xl border border-primary/10 bg-card/50 p-4 text-xs text-muted-foreground">
        {t("backups.note")}
      </div>
    </div>
  );
}
