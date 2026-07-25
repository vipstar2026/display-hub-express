import { useEffect, useState } from "react";
import { Bell, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { supabase } from "@/integrations/supabase/client";
import { useI18n } from "@/lib/i18n";
import { Link } from "@tanstack/react-router";

type Notif = {
  id: string;
  title: string;
  message: string | null;
  link: string | null;
  severity: string;
  is_read: boolean;
  user_id: string | null;
  created_at: string;
};

export function NotificationBell({ userId }: { userId: string }) {
  const { t } = useI18n();
  const [items, setItems] = useState<Notif[]>([]);
  const [readIds, setReadIds] = useState<Set<string>>(new Set());

  const load = async () => {
    const { data } = await supabase
      .from("notifications")
      .select("*")
      .or(`user_id.eq.${userId},user_id.is.null`)
      .order("created_at", { ascending: false })
      .limit(30);
    setItems((data ?? []) as Notif[]);
    try {
      const raw = localStorage.getItem(`nb_read_${userId}`);
      setReadIds(new Set(raw ? JSON.parse(raw) : []));
    } catch { /* ignore */ }
  };

  useEffect(() => {
    load();
    const ch = supabase
      .channel(`notif-${userId}`)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "notifications" }, () => load())
      .subscribe();
    return () => { supabase.removeChannel(ch); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  const isUnread = (n: Notif) => n.user_id ? !n.is_read : !readIds.has(n.id);
  const unread = items.filter(isUnread).length;

  const markAll = async () => {
    const owned = items.filter((n) => n.user_id === userId && !n.is_read).map((n) => n.id);
    if (owned.length) {
      await supabase.from("notifications").update({ is_read: true }).in("id", owned);
    }
    const broadcasts = items.filter((n) => !n.user_id).map((n) => n.id);
    const next = new Set([...readIds, ...broadcasts]);
    setReadIds(next);
    try { localStorage.setItem(`nb_read_${userId}`, JSON.stringify([...next])); } catch { /* ignore */ }
    load();
  };

  const sev = (s: string) =>
    s === "success" ? "bg-emerald-500" : s === "warning" ? "bg-amber-500" : s === "error" ? "bg-red-500" : "bg-primary";

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" aria-label="Notifications" className="relative">
          <Bell className="h-4 w-4" />
          {unread > 0 && (
            <span className="absolute -top-1 -end-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-bold text-background">
              {unread > 9 ? "9+" : unread}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80 p-0">
        <div className="flex items-center justify-between border-b border-primary/10 p-3">
          <div className="text-sm font-semibold">{t("notif.title")}</div>
          {unread > 0 && (
            <Button size="sm" variant="ghost" className="h-7 gap-1 text-xs" onClick={markAll}>
              <Check className="h-3 w-3" /> {t("notif.markAll")}
            </Button>
          )}
        </div>
        <div className="max-h-96 overflow-y-auto">
          {items.length === 0 && <div className="p-6 text-center text-xs text-muted-foreground">{t("notif.empty")}</div>}
          {items.map((n) => {
            const body = (
              <div className={`flex gap-3 border-b border-primary/5 p-3 text-sm transition hover:bg-primary/5 ${isUnread(n) ? "bg-primary/5" : ""}`}>
                <span className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${sev(n.severity)}`} />
                <div className="min-w-0 flex-1">
                  <div className="font-medium">{n.title}</div>
                  {n.message && <div className="mt-0.5 truncate text-xs text-muted-foreground">{n.message}</div>}
                  <div className="mt-1 text-[10px] text-muted-foreground">{new Date(n.created_at).toLocaleString()}</div>
                </div>
              </div>
            );
            return n.link ? (
              <Link key={n.id} to={n.link} className="block">{body}</Link>
            ) : (
              <div key={n.id}>{body}</div>
            );
          })}
        </div>
      </PopoverContent>
    </Popover>
  );
}
