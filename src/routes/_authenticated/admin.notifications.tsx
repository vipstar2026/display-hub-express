import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { useI18n } from "@/lib/i18n";
import { Send, Trash2 } from "lucide-react";

export const Route = createFileRoute("/_authenticated/admin/notifications")({
  component: AdminNotifications,
});

function AdminNotifications() {
  const { t } = useI18n();
  const qc = useQueryClient();
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [link, setLink] = useState("");
  const [severity, setSeverity] = useState<"info" | "success" | "warning" | "error">("info");
  const [target, setTarget] = useState<"all" | "customers" | "admins">("all");
  const [sending, setSending] = useState(false);

  const { data: recent } = useQuery({
    queryKey: ["admin-notifs-recent"],
    queryFn: async () => (await supabase.from("notifications").select("*").order("created_at", { ascending: false }).limit(50)).data ?? [],
  });

  const send = async () => {
    if (!title.trim()) { toast.error(t("notif.titleRequired")); return; }
    setSending(true);
    const { data, error } = await supabase.rpc("admin_broadcast_notification", {
      _title: title, _message: message || null, _severity: severity, _link: link || null, _target: target,
    });
    setSending(false);
    if (error) { toast.error(error.message); return; }
    toast.success(t("notif.sent", { n: String(data ?? 0) }));
    setTitle(""); setMessage(""); setLink("");
    qc.invalidateQueries({ queryKey: ["admin-notifs-recent"] });
  };

  const remove = async (id: string) => {
    const { error } = await supabase.from("notifications").delete().eq("id", id);
    if (error) { toast.error(error.message); return; }
    qc.invalidateQueries({ queryKey: ["admin-notifs-recent"] });
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold">{t("notif.adminTitle")}</h1>
        <p className="text-sm text-muted-foreground">{t("notif.adminSubtitle")}</p>
      </div>

      <div className="rounded-xl border border-primary/20 bg-card/60 p-5 backdrop-blur">
        <div className="grid gap-3 md:grid-cols-2">
          <div className="md:col-span-2">
            <label className="mb-1 block text-xs font-semibold uppercase text-muted-foreground">{t("notif.fTitle")}</label>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="..." />
          </div>
          <div className="md:col-span-2">
            <label className="mb-1 block text-xs font-semibold uppercase text-muted-foreground">{t("notif.fMessage")}</label>
            <Textarea value={message} onChange={(e) => setMessage(e.target.value)} rows={3} />
          </div>
          <div>
            <label className="mb-1 block text-xs font-semibold uppercase text-muted-foreground">{t("notif.fLink")}</label>
            <Input value={link} onChange={(e) => setLink(e.target.value)} placeholder="/shop" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-xs font-semibold uppercase text-muted-foreground">{t("notif.fSeverity")}</label>
              <Select value={severity} onValueChange={(v) => setSeverity(v as typeof severity)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="info">{t("notif.sevInfo")}</SelectItem>
                  <SelectItem value="success">{t("notif.sevSuccess")}</SelectItem>
                  <SelectItem value="warning">{t("notif.sevWarning")}</SelectItem>
                  <SelectItem value="error">{t("notif.sevError")}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold uppercase text-muted-foreground">{t("notif.fTarget")}</label>
              <Select value={target} onValueChange={(v) => setTarget(v as typeof target)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t("notif.tgtAll")}</SelectItem>
                  <SelectItem value="customers">{t("notif.tgtCustomers")}</SelectItem>
                  <SelectItem value="admins">{t("notif.tgtAdmins")}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
        <div className="mt-4 flex justify-end">
          <Button onClick={send} disabled={sending} className="gap-2">
            <Send className="h-4 w-4" /> {sending ? "..." : t("notif.send")}
          </Button>
        </div>
      </div>

      <div className="rounded-xl border border-primary/20 bg-card/60 p-5 backdrop-blur">
        <h3 className="mb-3 font-display text-lg font-semibold">{t("notif.recent")}</h3>
        <div className="space-y-2">
          {(recent ?? []).length === 0 && <div className="text-sm text-muted-foreground">{t("notif.empty")}</div>}
          {(recent ?? []).map((n: any) => (
            <div key={n.id} className="flex items-start gap-3 rounded-lg border border-primary/10 bg-background/40 p-3">
              <span className={`mt-1.5 h-2 w-2 rounded-full ${n.severity === "success" ? "bg-emerald-500" : n.severity === "warning" ? "bg-amber-500" : n.severity === "error" ? "bg-red-500" : "bg-primary"}`} />
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <div className="text-sm font-medium">{n.title}</div>
                  <span className="rounded bg-primary/10 px-1.5 py-0.5 text-[10px] uppercase text-primary">{n.type}</span>
                  {!n.user_id && <span className="rounded bg-amber-500/10 px-1.5 py-0.5 text-[10px] uppercase text-amber-400">{t("notif.tgtAll")}</span>}
                </div>
                {n.message && <div className="mt-0.5 text-xs text-muted-foreground">{n.message}</div>}
                <div className="mt-1 text-[10px] text-muted-foreground">{new Date(n.created_at).toLocaleString()}</div>
              </div>
              <Button size="sm" variant="ghost" onClick={() => remove(n.id)} className="text-red-400 hover:text-red-300">
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
