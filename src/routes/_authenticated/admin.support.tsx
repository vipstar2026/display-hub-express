import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  LifeBuoy, Loader2, Search, Filter, RefreshCw, Mail, User,
  MessageSquare, Clock, CheckCircle2, XCircle, AlertCircle, Trash2,
  Send, Save, X, ExternalLink,
} from "lucide-react";
import { useAdminI18n, statusLabel } from "@/lib/i18n-admin";

export const Route = createFileRoute("/_authenticated/admin/support")({
  component: AdminSupportPage,
  head: () => ({ meta: [{ title: "Support | VIP STAR" }] }),
});

type TicketStatus = "open" | "in_progress" | "resolved" | "closed";
type Ticket = {
  id: string;
  user_id: string | null;
  name: string;
  email: string;
  problem_type: string;
  message: string;
  status: TicketStatus;
  admin_notes: string | null;
  created_at: string;
  updated_at: string;
};

const STATUS_CLS: Record<TicketStatus, string> = {
  open: "bg-blue-500/15 text-blue-600 dark:text-blue-400 border-blue-500/30",
  in_progress: "bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30",
  resolved: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30",
  closed: "bg-muted text-muted-foreground border-border",
};
const STATUS_ICON: Record<TicketStatus, any> = {
  open: AlertCircle,
  in_progress: Clock,
  resolved: CheckCircle2,
  closed: XCircle,
};

function AdminSupportPage() {
  const { L, lang } = useAdminI18n();
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [filter, setFilter] = useState<TicketStatus | "all">("all");
  const [selected, setSelected] = useState<Ticket | null>(null);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [notes, setNotes] = useState("");

  const dateLocale = lang === "ar" ? "ar-EG" : lang === "ur" ? "ur-PK" : "en-US";

  const load = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("support_tickets")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) toast.error(error.message);
    setTickets((data ?? []) as Ticket[]);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  useEffect(() => {
    const ch = supabase
      .channel("support_tickets_admin")
      .on("postgres_changes", { event: "*", schema: "public", table: "support_tickets" }, () => load())
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, []);

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    return tickets.filter((t) => {
      if (filter !== "all" && t.status !== filter) return false;
      if (!term) return true;
      return (
        t.name.toLowerCase().includes(term) ||
        t.email.toLowerCase().includes(term) ||
        t.problem_type.toLowerCase().includes(term) ||
        t.message.toLowerCase().includes(term)
      );
    });
  }, [tickets, q, filter]);

  const stats = useMemo(() => {
    const s = { total: tickets.length, open: 0, in_progress: 0, resolved: 0, closed: 0 };
    tickets.forEach((t) => { (s as any)[t.status] += 1; });
    return s;
  }, [tickets]);

  const openDetail = (t: Ticket) => {
    setSelected(t);
    setNotes(t.admin_notes ?? "");
  };

  const updateStatus = async (id: string, status: TicketStatus) => {
    setSavingId(id);
    const { error } = await supabase.from("support_tickets").update({ status }).eq("id", id);
    setSavingId(null);
    if (error) return toast.error(error.message);
    toast.success(L.supStatusUpdated);
    if (selected?.id === id) setSelected({ ...selected, status });
  };

  const saveNotes = async () => {
    if (!selected) return;
    setSavingId(selected.id);
    const { error } = await supabase
      .from("support_tickets")
      .update({ admin_notes: notes })
      .eq("id", selected.id);
    setSavingId(null);
    if (error) return toast.error(error.message);
    toast.success(L.supNotesSaved);
    setSelected({ ...selected, admin_notes: notes });
  };

  const removeTicket = async (id: string) => {
    if (!confirm(L.supConfirmDelete)) return;
    const { error } = await supabase.from("support_tickets").delete().eq("id", id);
    if (error) return toast.error(error.message);
    toast.success(L.deleted);
    if (selected?.id === id) setSelected(null);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-gradient-brand grid place-items-center shadow-glow">
            <LifeBuoy className="w-5 h-5 text-brand-foreground" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-foreground">{L.supTitle}</h1>
            <p className="text-xs text-muted-foreground">{L.supSub}</p>
          </div>
        </div>
        <button onClick={load} className="h-9 px-3 rounded-lg bg-accent/60 hover:bg-accent text-foreground text-sm flex items-center gap-2 transition-smooth">
          <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} /> {L.refresh}
        </button>
      </div>

      <div className="grid gap-3 grid-cols-2 md:grid-cols-5">
        {[
          { label: L.supTotal, value: stats.total, color: "from-brand to-accent2" },
          { label: statusLabel(L, "open"), value: stats.open, color: "from-blue-500 to-blue-700" },
          { label: statusLabel(L, "in_progress"), value: stats.in_progress, color: "from-amber-500 to-amber-700" },
          { label: statusLabel(L, "resolved"), value: stats.resolved, color: "from-emerald-500 to-emerald-700" },
          { label: statusLabel(L, "closed"), value: stats.closed, color: "from-muted to-muted-foreground/40" },
        ].map((s) => (
          <div key={s.label} className="bg-card rounded-xl border border-border p-4 shadow-card">
            <div className="text-[10px] uppercase tracking-widest text-muted-foreground font-mono">{s.label}</div>
            <div className={`mt-1 text-2xl font-bold bg-gradient-to-br ${s.color} bg-clip-text text-transparent`}>{s.value}</div>
          </div>
        ))}
      </div>

      <div className="bg-card rounded-xl border border-border p-3 flex flex-wrap items-center gap-2">
        <div className="flex items-center gap-2 flex-1 min-w-[200px] h-10 px-3 rounded-lg bg-accent/40 border border-border">
          <Search className="w-4 h-4 text-muted-foreground" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder={L.supSearchPh}
            className="flex-1 bg-transparent outline-none text-sm text-foreground placeholder:text-muted-foreground"
          />
        </div>
        <div className="flex items-center gap-1 bg-accent/40 rounded-lg p-1 border border-border">
          <Filter className="w-3.5 h-3.5 text-muted-foreground mx-1.5" />
          {(["all", "open", "in_progress", "resolved", "closed"] as const).map((s) => (
            <button
              key={s}
              onClick={() => setFilter(s)}
              className={`px-3 h-8 rounded-md text-xs font-medium transition-smooth ${
                filter === s ? "bg-brand text-brand-foreground shadow-glow" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {s === "all" ? L.all : statusLabel(L, s)}
            </button>
          ))}
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-5">
        <div className="lg:col-span-3 bg-card rounded-xl border border-border shadow-card overflow-hidden">
          {loading ? (
            <div className="p-10 grid place-items-center"><Loader2 className="w-6 h-6 animate-spin text-brand" /></div>
          ) : filtered.length === 0 ? (
            <div className="p-10 text-center text-sm text-muted-foreground">
              <MessageSquare className="w-10 h-10 mx-auto mb-3 opacity-40" />
              {L.supNoTickets}
            </div>
          ) : (
            <div className="divide-y divide-border max-h-[640px] overflow-y-auto">
              {filtered.map((t) => {
                const Icon = STATUS_ICON[t.status];
                const active = selected?.id === t.id;
                return (
                  <button
                    key={t.id}
                    onClick={() => openDetail(t)}
                    className={`w-full text-start p-4 hover:bg-accent/40 transition-smooth ${active ? "bg-accent/60" : ""}`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-semibold text-foreground text-sm truncate">{t.name}</span>
                          <span className={`text-[10px] px-2 py-0.5 rounded-full border ${STATUS_CLS[t.status]} font-medium flex items-center gap-1`}>
                            <Icon className="w-3 h-3" /> {statusLabel(L, t.status)}
                          </span>
                        </div>
                        <div className="text-xs text-muted-foreground flex items-center gap-3 flex-wrap">
                          <span className="flex items-center gap-1"><Mail className="w-3 h-3" />{t.email}</span>
                          <span className="text-brand font-medium">{t.problem_type}</span>
                        </div>
                        <p className="mt-2 text-xs text-muted-foreground line-clamp-2">{t.message}</p>
                      </div>
                      <div className="text-[10px] text-muted-foreground font-mono whitespace-nowrap">
                        {new Date(t.created_at).toLocaleDateString(dateLocale, { day: "2-digit", month: "short" })}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        <div className="lg:col-span-2 bg-card rounded-xl border border-border shadow-card p-5 h-fit lg:sticky lg:top-20">
          {!selected ? (
            <div className="text-center text-sm text-muted-foreground py-12">
              <LifeBuoy className="w-10 h-10 mx-auto mb-3 opacity-40" />
              {L.supSelectTicket}
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <div className="text-[10px] uppercase tracking-widest text-muted-foreground font-mono">{L.supTicket} #{selected.id.slice(0, 8)}</div>
                  <h3 className="text-base font-bold text-foreground mt-1">{selected.problem_type}</h3>
                </div>
                <button onClick={() => setSelected(null)} className="w-7 h-7 grid place-items-center rounded-md bg-accent/60 hover:bg-accent text-muted-foreground">
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2 text-muted-foreground"><User className="w-4 h-4" /><span className="text-foreground">{selected.name}</span></div>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Mail className="w-4 h-4" />
                  <a href={`mailto:${selected.email}`} className="text-brand hover:underline flex items-center gap-1">
                    {selected.email} <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
                <div className="flex items-center gap-2 text-muted-foreground text-xs">
                  <Clock className="w-3.5 h-3.5" />
                  {new Date(selected.created_at).toLocaleString(dateLocale)}
                </div>
              </div>

              <div>
                <div className="text-[10px] uppercase tracking-widest text-muted-foreground font-mono mb-1.5">{L.supCustomerMsg}</div>
                <div className="rounded-lg bg-accent/40 border border-border p-3 text-sm text-foreground whitespace-pre-wrap leading-relaxed">
                  {selected.message}
                </div>
              </div>

              <div>
                <div className="text-[10px] uppercase tracking-widest text-muted-foreground font-mono mb-1.5">{L.supStatusLabel}</div>
                <div className="grid grid-cols-2 gap-1.5">
                  {(["open", "in_progress", "resolved", "closed"] as TicketStatus[]).map((s) => {
                    const Icon = STATUS_ICON[s];
                    const active = selected.status === s;
                    return (
                      <button
                        key={s}
                        onClick={() => updateStatus(selected.id, s)}
                        disabled={savingId === selected.id}
                        className={`h-9 rounded-md text-xs font-medium border flex items-center justify-center gap-1.5 transition-smooth ${
                          active ? STATUS_CLS[s] + " ring-2 ring-offset-1 ring-offset-card ring-current" : "bg-card border-border text-muted-foreground hover:text-foreground"
                        }`}
                      >
                        <Icon className="w-3.5 h-3.5" /> {statusLabel(L, s)}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <div className="text-[10px] uppercase tracking-widest text-muted-foreground font-mono mb-1.5">{L.supInternalNotes}</div>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={3}
                  placeholder={L.supNotesPh}
                  className="w-full p-2.5 rounded-md border border-border bg-background text-sm text-foreground outline-none focus:border-brand"
                />
                <button
                  onClick={saveNotes}
                  disabled={savingId === selected.id}
                  className="mt-2 w-full h-9 rounded-md bg-brand hover:bg-brand-dark text-brand-foreground text-sm font-semibold flex items-center justify-center gap-2 transition-smooth disabled:opacity-50"
                >
                  {savingId === selected.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  {L.supSaveNotes}
                </button>
              </div>

              <div className="grid grid-cols-2 gap-2 pt-2 border-t border-border">
                <a
                  href={`mailto:${selected.email}?subject=Re: ${encodeURIComponent(selected.problem_type)}`}
                  className="h-9 rounded-md bg-accent/60 hover:bg-accent text-foreground text-xs font-medium flex items-center justify-center gap-1.5 transition-smooth"
                >
                  <Send className="w-3.5 h-3.5" /> {L.supReplyEmail}
                </a>
                <button
                  onClick={() => removeTicket(selected.id)}
                  className="h-9 rounded-md bg-destructive/10 hover:bg-destructive/20 text-destructive text-xs font-medium flex items-center justify-center gap-1.5 transition-smooth"
                >
                  <Trash2 className="w-3.5 h-3.5" /> {L.supDeleteTicket}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
