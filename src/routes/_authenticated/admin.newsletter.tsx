import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Mail, Trash2, Download, Search, Inbox, Power } from "lucide-react";
import { toast } from "sonner";
import { useMemo, useState } from "react";
import { useI18n } from "@/lib/i18n";

export const Route = createFileRoute("/_authenticated/admin/newsletter")({
  component: NewsletterPage,
});

type Sub = {
  id: string;
  email: string;
  lang: string | null;
  source: string | null;
  is_active: boolean;
  created_at: string;
};

function NewsletterPage() {
  const { t } = useI18n();
  const qc = useQueryClient();
  const [q, setQ] = useState("");

  const { data: rows = [], isLoading } = useQuery({
    queryKey: ["newsletter-subs"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("newsletter_subscribers")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as Sub[];
    },
  });

  const filtered = useMemo(
    () => rows.filter((r) => !q || r.email.toLowerCase().includes(q.toLowerCase())),
    [rows, q]
  );

  const active = rows.filter((r) => r.is_active).length;

  async function toggle(r: Sub) {
    const { error } = await supabase
      .from("newsletter_subscribers")
      .update({ is_active: !r.is_active, unsubscribed_at: r.is_active ? new Date().toISOString() : null })
      .eq("id", r.id);
    if (error) return toast.error(error.message);
    qc.invalidateQueries({ queryKey: ["newsletter-subs"] });
  }

  async function remove(id: string) {
    if (!confirm(t("newsletter.confirmDelete"))) return;
    const { error } = await supabase.from("newsletter_subscribers").delete().eq("id", id);
    if (error) return toast.error(error.message);
    qc.invalidateQueries({ queryKey: ["newsletter-subs"] });
    toast.success(t("newsletter.deleted"));
  }

  function exportCsv() {
    const header = "email,lang,source,is_active,created_at\n";
    const body = filtered
      .map((r) => `${r.email},${r.lang ?? ""},${r.source ?? ""},${r.is_active},${r.created_at}`)
      .join("\n");
    const blob = new Blob([header + body], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `newsletter-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-bold">{t("newsletter.adminTitle")}</h1>
          <p className="text-sm text-muted-foreground">{t("newsletter.adminSubtitle")}</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={exportCsv} disabled={!filtered.length}>
            <Download className="me-2 h-4 w-4" /> {t("newsletter.exportCsv")}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
        <Stat label={t("newsletter.total")} value={rows.length} />
        <Stat label={t("newsletter.activeSubs")} value={active} />
        <Stat label={t("newsletter.unsubscribed")} value={rows.length - active} />
      </div>

      <div className="relative max-w-sm">
        <Search className="pointer-events-none absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder={t("newsletter.searchPlaceholder")}
          className="ps-9"
        />
      </div>

      {isLoading ? (
        <div className="py-20 text-center text-muted-foreground">Loading...</div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center gap-2 rounded-2xl border border-dashed border-primary/20 py-16 text-muted-foreground">
          <Inbox className="h-10 w-10" />
          <p>{t("newsletter.empty")}</p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-primary/15 bg-card/40">
          <table className="w-full text-sm">
            <thead className="border-b border-primary/15 bg-background/40 text-xs uppercase text-muted-foreground">
              <tr>
                <th className="px-4 py-3 text-start">{t("newsletter.colEmail")}</th>
                <th className="px-4 py-3 text-start">{t("newsletter.colLang")}</th>
                <th className="px-4 py-3 text-start">{t("newsletter.colSource")}</th>
                <th className="px-4 py-3 text-start">{t("newsletter.colStatus")}</th>
                <th className="px-4 py-3 text-start">{t("newsletter.colDate")}</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {filtered.map((r) => (
                <tr key={r.id} className="border-b border-primary/10 last:border-0 hover:bg-primary/5">
                  <td className="px-4 py-3">
                    <a href={`mailto:${r.email}`} className="inline-flex items-center gap-2 hover:text-primary">
                      <Mail className="h-3.5 w-3.5" /> {r.email}
                    </a>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{r.lang ?? "—"}</td>
                  <td className="px-4 py-3 text-muted-foreground">{r.source ?? "—"}</td>
                  <td className="px-4 py-3">
                    {r.is_active ? (
                      <Badge variant="outline" className="border-emerald-500/30 bg-emerald-500/10 text-emerald-400">
                        {t("newsletter.active")}
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="border-muted-foreground/30 text-muted-foreground">
                        {t("newsletter.inactive")}
                      </Badge>
                    )}
                  </td>
                  <td className="px-4 py-3 text-xs text-muted-foreground">
                    {new Date(r.created_at).toLocaleString()}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-1">
                      <Button variant="ghost" size="sm" onClick={() => toggle(r)} title={t("newsletter.toggle")}>
                        <Power className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => remove(r.id)}
                        className="text-red-400 hover:bg-red-500/10"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-xl border border-primary/15 bg-card/40 p-4">
      <div className="text-xs uppercase text-muted-foreground">{label}</div>
      <div className="mt-1 font-display text-2xl font-bold text-primary">{value}</div>
    </div>
  );
}
