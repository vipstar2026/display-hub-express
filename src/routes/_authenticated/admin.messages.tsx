import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useI18n } from "@/lib/i18n";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Mail, Phone, Trash2, CheckCircle2, Eye, Inbox } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/admin/messages")({
  component: MessagesPage,
});

type Msg = {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  subject: string | null;
  message: string;
  status: string;
  created_at: string;
};

function MessagesPage() {
  const { t } = useI18n();
  const [rows, setRows] = useState<Msg[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "new" | "read" | "resolved">("all");

  async function load() {
    setLoading(true);
    const { data } = await supabase.from("contact_messages").select("*").order("created_at", { ascending: false });
    setRows((data ?? []) as Msg[]);
    setLoading(false);
  }
  useEffect(() => { load(); }, []);

  async function setStatus(id: string, status: string) {
    const { error } = await supabase.from("contact_messages").update({ status }).eq("id", id);
    if (error) return toast.error(error.message);
    setRows((rs) => rs.map((r) => (r.id === id ? { ...r, status } : r)));
  }
  async function remove(id: string) {
    if (!confirm("Delete?")) return;
    const { error } = await supabase.from("contact_messages").delete().eq("id", id);
    if (error) return toast.error(error.message);
    setRows((rs) => rs.filter((r) => r.id !== id));
    toast.success("Deleted");
  }

  const filtered = rows.filter((r) => filter === "all" || r.status === filter);
  const counts = {
    all: rows.length,
    new: rows.filter((r) => r.status === "new").length,
    read: rows.filter((r) => r.status === "read").length,
    resolved: rows.filter((r) => r.status === "resolved").length,
  };

  const tabs = [
    { k: "all", label: "All" },
    { k: "new", label: t("messages.new") },
    { k: "read", label: t("messages.read") },
    { k: "resolved", label: t("messages.resolved") },
  ] as const;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl font-bold">{t("messages.title")}</h1>
      </div>

      <div className="flex flex-wrap gap-2">
        {tabs.map((tab) => (
          <button
            key={tab.k}
            onClick={() => setFilter(tab.k)}
            className={`rounded-full border px-4 py-1.5 text-xs font-medium transition ${
              filter === tab.k ? "border-primary bg-primary text-background" : "border-primary/20 bg-card/40 text-muted-foreground hover:border-primary/50"
            }`}
          >
            {tab.label} <span className="ms-1 opacity-70">({counts[tab.k]})</span>
          </button>
        ))}
      </div>

      {loading ? (
        <div className="py-20 text-center text-muted-foreground">Loading...</div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center gap-2 rounded-2xl border border-dashed border-primary/20 py-16 text-muted-foreground">
          <Inbox className="h-10 w-10" />
          <p>{t("messages.empty")}</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((m) => (
            <div key={m.id} className="rounded-xl border border-primary/15 bg-card/40 p-5">
              <div className="mb-2 flex flex-wrap items-start justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold">{m.name}</span>
                    <StatusBadge status={m.status} />
                  </div>
                  <div className="mt-1 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                    <a href={`mailto:${m.email}`} className="inline-flex items-center gap-1 hover:text-primary">
                      <Mail className="h-3 w-3" /> {m.email}
                    </a>
                    {m.phone && (
                      <a href={`tel:${m.phone}`} className="inline-flex items-center gap-1 hover:text-primary">
                        <Phone className="h-3 w-3" /> {m.phone}
                      </a>
                    )}
                    <span>{new Date(m.created_at).toLocaleString()}</span>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  {m.status === "new" && (
                    <Button variant="outline" size="sm" onClick={() => setStatus(m.id, "read")}>
                      <Eye className="me-1 h-3 w-3" /> {t("messages.markRead")}
                    </Button>
                  )}
                  {m.status !== "resolved" && (
                    <Button variant="outline" size="sm" onClick={() => setStatus(m.id, "resolved")}>
                      <CheckCircle2 className="me-1 h-3 w-3" /> {t("messages.markResolved")}
                    </Button>
                  )}
                  <Button variant="ghost" size="sm" onClick={() => remove(m.id)} className="text-red-400 hover:bg-red-500/10">
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              </div>
              {m.subject && <div className="mb-2 text-sm font-medium text-primary">{m.subject}</div>}
              <p className="whitespace-pre-wrap text-sm leading-relaxed text-foreground/90">{m.message}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    new: "bg-blue-500/15 text-blue-400 border-blue-500/30",
    read: "bg-amber-500/15 text-amber-400 border-amber-500/30",
    resolved: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
  };
  return <Badge variant="outline" className={`text-[10px] ${map[status] ?? ""}`}>{status}</Badge>;
}
