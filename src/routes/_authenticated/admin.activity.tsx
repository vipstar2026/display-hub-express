import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useI18n } from "@/lib/i18n";
import { Activity, Search, RefreshCw, User, Globe } from "lucide-react";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/_authenticated/admin/activity")({
  component: AdminActivity,
});

type Row = {
  id: string;
  user_id: string | null;
  actor_email: string | null;
  action: string;
  entity_type: string | null;
  entity_id: string | null;
  details: any;
  ip_address: string | null;
  created_at: string;
};

function AdminActivity() {
  const { t } = useI18n();
  const [q, setQ] = useState("");
  const [entity, setEntity] = useState<string>("all");
  const [range, setRange] = useState<"24h" | "7d" | "30d" | "all">("7d");

  const { data, isFetching, refetch } = useQuery({
    queryKey: ["admin-activity", range],
    queryFn: async () => {
      let query = supabase.from("activity_log").select("*").order("created_at", { ascending: false }).limit(500);
      if (range !== "all") {
        const hours = range === "24h" ? 24 : range === "7d" ? 24 * 7 : 24 * 30;
        const since = new Date(Date.now() - hours * 3600 * 1000).toISOString();
        query = query.gte("created_at", since);
      }
      const { data, error } = await query;
      if (error) throw error;
      return (data ?? []) as Row[];
    },
  });

  const entities = useMemo(() => {
    const s = new Set<string>();
    (data ?? []).forEach((r) => r.entity_type && s.add(r.entity_type));
    return Array.from(s).sort();
  }, [data]);

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    return (data ?? []).filter((r) => {
      if (entity !== "all" && r.entity_type !== entity) return false;
      if (!term) return true;
      return (
        r.action?.toLowerCase().includes(term) ||
        r.actor_email?.toLowerCase().includes(term) ||
        r.entity_type?.toLowerCase().includes(term) ||
        r.entity_id?.toLowerCase().includes(term) ||
        r.ip_address?.toLowerCase().includes(term)
      );
    });
  }, [data, q, entity]);

  const stats = useMemo(() => {
    const total = filtered.length;
    const users = new Set(filtered.map((r) => r.user_id).filter(Boolean)).size;
    const actions = new Set(filtered.map((r) => r.action)).size;
    return { total, users, actions };
  }, [filtered]);

  const actionColor = (a: string) => {
    if (/create|insert|add/i.test(a)) return "bg-emerald-500/15 text-emerald-400 border-emerald-500/30";
    if (/update|edit|change/i.test(a)) return "bg-amber-500/15 text-amber-400 border-amber-500/30";
    if (/delete|remove/i.test(a)) return "bg-red-500/15 text-red-400 border-red-500/30";
    if (/login|signin|auth/i.test(a)) return "bg-sky-500/15 text-sky-400 border-sky-500/30";
    return "bg-primary/15 text-primary border-primary/30";
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-bold flex items-center gap-2">
            <Activity className="h-6 w-6 text-primary" /> {t("activity.title")}
          </h1>
          <p className="text-sm text-muted-foreground">{t("activity.subtitle")}</p>
        </div>
        <Button variant="outline" size="sm" onClick={() => refetch()} disabled={isFetching} className="gap-2">
          <RefreshCw className={`h-4 w-4 ${isFetching ? "animate-spin" : ""}`} /> {t("activity.refresh")}
        </Button>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <StatCard label={t("activity.statTotal")} value={stats.total} />
        <StatCard label={t("activity.statUsers")} value={stats.users} />
        <StatCard label={t("activity.statActions")} value={stats.actions} />
      </div>

      <div className="rounded-xl border border-primary/20 bg-card/60 p-4 backdrop-blur">
        <div className="grid gap-3 md:grid-cols-[1fr_180px_180px]">
          <div className="relative">
            <Search className="pointer-events-none absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder={t("activity.search")} className="ps-9" />
          </div>
          <Select value={entity} onValueChange={setEntity}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t("activity.allEntities")}</SelectItem>
              {entities.map((e) => <SelectItem key={e} value={e}>{e}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={range} onValueChange={(v) => setRange(v as typeof range)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="24h">{t("activity.range24h")}</SelectItem>
              <SelectItem value="7d">{t("activity.range7d")}</SelectItem>
              <SelectItem value="30d">{t("activity.range30d")}</SelectItem>
              <SelectItem value="all">{t("activity.rangeAll")}</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="rounded-xl border border-primary/20 bg-card/60 backdrop-blur">
        {filtered.length === 0 ? (
          <div className="p-12 text-center text-sm text-muted-foreground">{t("activity.empty")}</div>
        ) : (
          <div className="divide-y divide-primary/10">
            {filtered.map((r) => (
              <div key={r.id} className="flex flex-wrap items-start gap-3 p-4 hover:bg-primary/5 transition">
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className={`rounded-md border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${actionColor(r.action)}`}>
                      {r.action}
                    </span>
                    {r.entity_type && (
                      <span className="rounded-md bg-background/60 border border-primary/10 px-2 py-0.5 text-[10px] uppercase text-muted-foreground">
                        {r.entity_type}
                      </span>
                    )}
                    {r.entity_id && (
                      <code className="text-[10px] text-muted-foreground font-mono truncate max-w-[180px]">{r.entity_id.slice(0, 8)}…</code>
                    )}
                  </div>
                  <div className="mt-1.5 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1"><User className="h-3 w-3" /> {r.actor_email ?? "system"}</span>
                    {r.ip_address && <span className="flex items-center gap-1"><Globe className="h-3 w-3" /> {r.ip_address}</span>}
                    <span>{new Date(r.created_at).toLocaleString()}</span>
                  </div>
                  {r.details && Object.keys(r.details).length > 0 && (
                    <pre className="mt-2 max-h-32 overflow-auto rounded-md bg-background/50 border border-primary/10 p-2 text-[10px] font-mono text-muted-foreground">
                      {JSON.stringify(r.details, null, 2)}
                    </pre>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-xl border border-primary/20 bg-card/60 p-4 backdrop-blur">
      <div className="text-xs uppercase tracking-wider text-muted-foreground">{label}</div>
      <div className="mt-1 font-display text-2xl font-bold text-primary">{value.toLocaleString()}</div>
    </div>
  );
}
