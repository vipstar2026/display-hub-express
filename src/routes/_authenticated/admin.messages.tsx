import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useI18n } from "@/lib/i18n";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Mail, Phone, Trash2, CheckCircle2, Eye, Inbox, Reply, Send, Search } from "lucide-react";
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
  reply_text: string | null;
  replied_at: string | null;
};

function MessagesPage() {
  const { t } = useI18n();
  const [rows, setRows] = useState<Msg[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "new" | "read" | "resolved">("all");
  const [search, setSearch] = useState("");
  const [replyTo, setReplyTo] = useState<Msg | null>(null);
  const [replyText, setReplyText] = useState("");
  const [sending, setSending] = useState(false);

  async function load() {
    setLoading(true);
    const { data } = await supabase.from("contact_messages").select("*").order("created_at", { ascending: false });
    setRows((data ?? []) as Msg[]);
    setLoading(false);
  }
  useEffect(() => {
    load();
    const channel = supabase
      .channel("admin-contact-messages")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "contact_messages" }, (payload) => {
        setRows((rs) => [payload.new as Msg, ...rs.filter((r) => r.id !== (payload.new as Msg).id)]);
        toast.info(`رسالة جديدة من ${(payload.new as Msg).name}`);
      })
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "contact_messages" }, (payload) => {
        setRows((rs) => rs.map((r) => (r.id === (payload.new as Msg).id ? (payload.new as Msg) : r)));
      })
      .on("postgres_changes", { event: "DELETE", schema: "public", table: "contact_messages" }, (payload) => {
        setRows((rs) => rs.filter((r) => r.id !== (payload.old as { id: string }).id));
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, []);

  function waLink(phone: string, text: string) {
    return `https://wa.me/${phone.replace(/[^0-9]/g, "")}?text=${encodeURIComponent(text)}`;
  }

  function exportCsv() {
    const head = ["Date", "Name", "Email", "Phone", "Subject", "Message", "Status", "Reply", "Replied at"];
    const esc = (v: unknown) => `"${String(v ?? "").replace(/"/g, '""')}"`;
    const csv = [
      head.join(","),
      ...filtered.map((r) => [r.created_at, r.name, r.email, r.phone, r.subject, r.message, r.status, r.reply_text, r.replied_at].map(esc).join(",")),
    ].join("\n");
    const url = URL.createObjectURL(new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = `contact-messages-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

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

  function openReply(m: Msg) {
    setReplyTo(m);
    setReplyText(m.reply_text ?? "");
  }

  async function sendReply(viaMail: boolean) {
    if (!replyTo) return;
    if (!replyText.trim()) return toast.error("Empty reply");
    setSending(true);
    const { data: u } = await supabase.auth.getUser();
    const { error } = await supabase.from("contact_messages").update({
      reply_text: replyText,
      replied_at: new Date().toISOString(),
      replied_by: u.user?.id ?? null,
      status: "resolved",
    }).eq("id", replyTo.id);
    setSending(false);
    if (error) return toast.error(error.message);
    setRows((rs) => rs.map((r) => r.id === replyTo.id ? { ...r, reply_text: replyText, replied_at: new Date().toISOString(), status: "resolved" } : r));
    if (viaMail) {
      const subj = encodeURIComponent(`Re: ${replyTo.subject ?? "Your message"}`);
      const body = encodeURIComponent(replyText);
      window.location.href = `mailto:${replyTo.email}?subject=${subj}&body=${body}`;
    }
    toast.success("Reply saved");
    setReplyTo(null);
    setReplyText("");
  }

  const filtered = rows.filter((r) => {
    if (filter !== "all" && r.status !== filter) return false;
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return [r.name, r.email, r.subject ?? "", r.message].some((s) => s.toLowerCase().includes(q));
  });
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

      <div className="flex flex-wrap items-center gap-3">
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
        <div className="relative ms-auto w-full md:w-72">
          <Search className="pointer-events-none absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder="Search name, email, subject..." value={search} onChange={(e) => setSearch(e.target.value)} className="ps-9" />
        </div>
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
                    {m.replied_at && <Badge variant="outline" className="border-emerald-500/30 bg-emerald-500/10 text-[10px] text-emerald-400">Replied</Badge>}
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
                  <Button size="sm" onClick={() => openReply(m)} className="bg-primary text-background hover:bg-primary/90">
                    <Reply className="me-1 h-3 w-3" /> Reply
                  </Button>
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
              {m.reply_text && (
                <div className="mt-3 rounded-lg border border-emerald-500/20 bg-emerald-500/5 p-3">
                  <div className="mb-1 text-[10px] font-semibold uppercase tracking-wider text-emerald-400">
                    Your reply · {m.replied_at ? new Date(m.replied_at).toLocaleString() : ""}
                  </div>
                  <p className="whitespace-pre-wrap text-sm text-foreground/90">{m.reply_text}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      <Dialog open={!!replyTo} onOpenChange={(o) => !o && setReplyTo(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Reply to {replyTo?.name}</DialogTitle>
          </DialogHeader>
          {replyTo && (
            <div className="space-y-3">
              <div className="rounded-lg border border-primary/10 bg-muted/30 p-3 text-xs">
                <div className="text-muted-foreground">To: <span className="text-foreground">{replyTo.email}</span></div>
                {replyTo.subject && <div className="text-muted-foreground">Subject: <span className="text-foreground">Re: {replyTo.subject}</span></div>}
                <div className="mt-2 whitespace-pre-wrap text-muted-foreground/80">{replyTo.message}</div>
              </div>
              <Textarea rows={6} placeholder="Write your reply..." value={replyText} onChange={(e) => setReplyText(e.target.value)} />
            </div>
          )}
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setReplyTo(null)}>Cancel</Button>
            <Button variant="outline" disabled={sending} onClick={() => sendReply(false)}>
              Save only
            </Button>
            <Button disabled={sending} onClick={() => sendReply(true)} className="bg-primary text-background hover:bg-primary/90">
              <Send className="me-1 h-3 w-3" /> Save & Open email
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
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
