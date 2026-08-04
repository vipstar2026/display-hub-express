import { createFileRoute } from "@tanstack/react-router";
import { dirForLang } from "@/lib/dir";
import { useI18n } from "@/lib/i18n";
import { makeAdminT } from "@/lib/admin-i18n";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import {
  Megaphone, Plus, Users, Download, Copy, Send, Trash2, Search, Mail,
} from "lucide-react";

export const Route = createFileRoute("/_authenticated/admin/campaigns")({
  component: CampaignsPage,
});

type Campaign = {
  id: string; name: string;
  subject_ar: string | null; subject_en: string | null; subject_ur: string | null; subject_bn: string | null;
  body_ar: string | null; body_en: string | null; body_ur: string | null; body_bn: string | null;
  target_lang: string | null; status: string;
  audience_count: number; sent_count: number;
  scheduled_for: string | null; sent_at: string | null;
  notes: string | null; created_at: string;
};

const emptyDraft = {
  id: "", name: "",
  subject_ar: "", subject_en: "", subject_ur: "", subject_bn: "",
  body_ar: "", body_en: "", body_ur: "", body_bn: "",
  target_lang: "all", notes: "",
};

function CampaignsPage() {
  const { lang } = useI18n();
  const t = useMemo(() => makeAdminT(lang), [lang]);
  const qc = useQueryClient();
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState<typeof emptyDraft>(emptyDraft);
  const [audienceOpen, setAudienceOpen] = useState<Campaign | null>(null);

  const campaigns = useQuery({
    queryKey: ["campaigns"],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("admin_list_campaigns" as never);
      if (error) throw error;
      return (data ?? []) as Campaign[];
    },
  });

  const filtered = useMemo(
    () => (campaigns.data ?? []).filter((c) =>
      !q || c.name.toLowerCase().includes(q.toLowerCase())
    ), [campaigns.data, q]
  );

  const stats = useMemo(() => {
    const list = campaigns.data ?? [];
    return {
      total: list.length,
      drafts: list.filter((c) => c.status === "draft").length,
      sent: list.filter((c) => c.status === "sent").length,
      recipients: list.reduce((s, c) => s + (c.sent_count || 0), 0),
    };
  }, [campaigns.data]);

  const save = useMutation({
    mutationFn: async (d: typeof emptyDraft) => {
      const payload = {
        name: d.name,
        subject_ar: d.subject_ar || null,
        subject_en: d.subject_en || null,
        subject_ur: d.subject_ur || null,
        subject_bn: d.subject_bn || null,
        body_ar: d.body_ar || null,
        body_en: d.body_en || null,
        body_ur: d.body_ur || null,
        body_bn: d.body_bn || null,
        target_lang: d.target_lang === "all" ? null : d.target_lang,
        notes: d.notes || null,
      };
      if (d.id) {
        const { error } = await supabase
          .from("newsletter_campaigns")
          .update(payload as never).eq("id", d.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("newsletter_campaigns")
          .insert(payload as never);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      toast.success(t("تم الحفظ","Saved"));
      setOpen(false); setDraft(emptyDraft);
      qc.invalidateQueries({ queryKey: ["campaigns"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const del = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("newsletter_campaigns").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success(t("تم الحذف","Deleted"));
      qc.invalidateQueries({ queryKey: ["campaigns"] });
    },
  });

  function openEdit(c: Campaign) {
    setDraft({
      id: c.id, name: c.name,
      subject_ar: c.subject_ar ?? "", subject_en: c.subject_en ?? "", subject_ur: c.subject_ur ?? "", subject_bn: (c as any).subject_bn ?? "",
      body_ar: c.body_ar ?? "", body_en: c.body_en ?? "", body_ur: c.body_ur ?? "", body_bn: (c as any).body_bn ?? "",
      target_lang: c.target_lang ?? "all", notes: c.notes ?? "",
    });
    setOpen(true);
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display flex items-center gap-2 text-3xl font-bold">
            <Megaphone className="h-7 w-7" /> {t("حملات النشرة البريدية","Newsletter Campaigns")}
          </h1>
          <p className="text-sm text-muted-foreground">
            {t("أنشئ حملات، صدّر الجمهور المستهدف، وأرسل عبر خدمتك التسويقية (Brevo/Mailchimp).","Create campaigns, export target audiences, and send via your marketing service (Brevo/Mailchimp).")}
          </p>
        </div>
        <Button onClick={() => { setDraft(emptyDraft); setOpen(true); }}>
          <Plus className="me-2 h-4 w-4" /> {t("حملة جديدة","New campaign")}
        </Button>
      </div>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <Stat label={t("إجمالي الحملات","Total campaigns")} value={stats.total} />
        <Stat label={t("مسودّات","Drafts")} value={stats.drafts} />
        <Stat label={t("مُرسلة","Sent")} value={stats.sent} />
        <Stat label={t("إجمالي المستقبلين","Total recipients")} value={stats.recipients} />
      </div>

      <div className="rounded-lg border border-amber-500/30 bg-amber-500/5 p-4 text-sm text-amber-700 dark:text-amber-300">
        <strong>{t("ملاحظة:","Note:")}</strong> {t("الإرسال الجماعي المباشر معطّل حفاظًا على سمعة الإرسال.","Direct bulk sending is disabled to protect sender reputation.")}
        {t(' استخدم زر "تصدير الجمهور" وارفع الملف إلى خدمة تسويقية متخصصة (Brevo Campaigns، Mailchimp، …).', ' Use the "Export Audience" button and upload the file to a dedicated marketing service (Brevo Campaigns, Mailchimp, …).')}
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input value={q} onChange={(e) => setQ(e.target.value)}
          placeholder={t("بحث في الحملات...","Search campaigns...")} className="ps-9" />
      </div>

      <div className="rounded-lg border">
        <table className="w-full text-sm">
          <thead className="border-b bg-muted/40 text-start">
            <tr>
              <th className="px-3 py-2 text-start">{t("الاسم","Name")}</th>
              <th className="px-3 py-2 text-start">{t("الجمهور","Audience")}</th>
              <th className="px-3 py-2 text-start">{t("الحالة","Status")}</th>
              <th className="px-3 py-2 text-start">{t("أُرسل إلى","Sent to")}</th>
              <th className="px-3 py-2 text-start">{t("التاريخ","Date")}</th>
              <th className="px-3 py-2 text-end">{t("إجراءات","Actions")}</th>
            </tr>
          </thead>
          <tbody>
            {campaigns.isLoading && (
              <tr><td colSpan={6} className="p-6 text-center text-muted-foreground">{t("جارٍ التحميل…","Loading…")}</td></tr>
            )}
            {!campaigns.isLoading && filtered.length === 0 && (
              <tr><td colSpan={6} className="p-6 text-center text-muted-foreground">{t("لا توجد حملات","No campaigns")}</td></tr>
            )}
            {filtered.map((c) => (
              <tr key={c.id} className="border-b hover:bg-muted/30">
                <td className="px-3 py-2 font-medium">{c.name}</td>
                <td className="px-3 py-2">
                  <Badge variant="outline">{c.target_lang ?? t("الكل","All")}</Badge>
                </td>
                <td className="px-3 py-2">
                  <Badge variant={c.status === "sent" ? "default" : "secondary"}>
                    {c.status === "sent" ? t("مُرسلة","Sent") : c.status === "scheduled" ? t("مجدولة","Scheduled") : t("مسودة","Draft")}
                  </Badge>
                </td>
                <td className="px-3 py-2">{c.sent_count || "—"}</td>
                <td className="px-3 py-2 text-muted-foreground">
                  {new Date(c.created_at).toLocaleDateString()}
                </td>
                <td className="px-3 py-2">
                  <div className="flex justify-end gap-1">
                    <Button size="sm" variant="ghost" onClick={() => setAudienceOpen(c)}>
                      <Users className="h-4 w-4" />
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => openEdit(c)}>
                      <Mail className="h-4 w-4" />
                    </Button>
                    <Button size="sm" variant="ghost"
                      onClick={() => { if (confirm(t("حذف الحملة؟","Delete this campaign?"))) del.mutate(c.id); }}>
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Editor Dialog */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>{draft.id ? t("تعديل الحملة","Edit campaign") : t("حملة جديدة","New campaign")}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-2">
            <div className="grid gap-2 md:grid-cols-2">
              <div>
                <Label>{t("اسم الحملة (داخلي)","Campaign name (internal)")}</Label>
                <Input value={draft.name}
                  onChange={(e) => setDraft({ ...draft, name: e.target.value })} />
              </div>
              <div>
                <Label>{t("اللغة المستهدفة","Target language")}</Label>
                <Select value={draft.target_lang}
                  onValueChange={(v) => setDraft({ ...draft, target_lang: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{t("كل المشتركين","All subscribers")}</SelectItem>
                    <SelectItem value="ar">{t("العربية فقط","Arabic only")}</SelectItem>
                    <SelectItem value="en">{t("الإنجليزية فقط","English only")}</SelectItem>
                    <SelectItem value="ur">{t("الأردية فقط","Urdu only")}</SelectItem>
                    <SelectItem value="bn">{t("البنغالية فقط","Bengali only")}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {(["ar", "en", "ur", "bn"] as const).map((lang) => (
              <div key={lang} className="grid gap-2 rounded-md border p-3">
                <div className="text-xs font-semibold uppercase text-muted-foreground">
                  {t("محتوى","Content")} {lang === "ar" ? t("عربي","Arabic") : lang === "en" ? t("إنجليزي","English") : lang === "ur" ? t("أردي","Urdu") : t("بنغالي","Bengali")}
                </div>
                <Input placeholder={t("العنوان","Subject")} dir={dirForLang(lang)}
                  value={draft[`subject_${lang}`]}
                  onChange={(e) => setDraft({ ...draft, [`subject_${lang}`]: e.target.value })} />
                <Textarea placeholder={t("نص الرسالة (HTML مسموح)","Message body (HTML allowed)")} rows={4} dir={dirForLang(lang)}
                  value={draft[`body_${lang}`]}
                  onChange={(e) => setDraft({ ...draft, [`body_${lang}`]: e.target.value })} />
              </div>
            ))}

            <div>
              <Label>{t("ملاحظات داخلية","Internal notes")}</Label>
              <Textarea rows={2} value={draft.notes}
                onChange={(e) => setDraft({ ...draft, notes: e.target.value })} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setOpen(false)}>{t("إلغاء","Cancel")}</Button>
            <Button onClick={() => save.mutate(draft)} disabled={!draft.name || save.isPending}>
              {save.isPending ? t("جارٍ الحفظ…","Saving…") : t("حفظ","Save")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {audienceOpen && (
        <AudienceDialog
          campaign={audienceOpen}
          onClose={() => setAudienceOpen(null)}
          onMarked={() => qc.invalidateQueries({ queryKey: ["campaigns"] })}
        />
      )}
    </div>
  );
}

function AudienceDialog({
  campaign, onClose, onMarked,
}: { campaign: Campaign; onClose: () => void; onMarked: () => void }) {
  const { lang } = useI18n();
  const t = useMemo(() => makeAdminT(lang), [lang]);
  const audience = useQuery({
    queryKey: ["campaign-audience", campaign.target_lang ?? "all"],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("admin_campaign_audience" as never, {
        _lang: campaign.target_lang ?? null,
      } as never);
      if (error) throw error;
      return (data ?? []) as { email: string; lang: string | null }[];
    },
  });

  const emails = (audience.data ?? []).map((r) => r.email);

  function download() {
    const csv = "email,lang\n" +
      (audience.data ?? []).map((r) => `${r.email},${r.lang ?? ""}`).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `campaign-${campaign.name}-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  function copyEmails() {
    navigator.clipboard.writeText(emails.join(", "));
    toast.success(t(`نُسخ ${emails.length} بريدًا إلى الحافظة`, `Copied ${emails.length} email(s) to clipboard`));
  }

  async function markSent() {
    const { error } = await supabase.rpc("admin_mark_campaign_sent" as never, {
      _id: campaign.id, _sent_count: emails.length,
    } as never);
    if (error) return toast.error(error.message);
    toast.success(t("تم تسجيل الحملة كمُرسلة","Campaign marked as sent"));
    onMarked(); onClose();
  }

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{t("جمهور:","Audience:")} {campaign.name}</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div className="rounded-md bg-muted/40 p-3 text-sm">
            <strong>{emails.length}</strong> {t("مشترك نشِط","active subscriber(s)")}
            {campaign.target_lang && <> · {t("لغة:","Language:")} {campaign.target_lang}</>}
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" onClick={download} disabled={!emails.length}>
              <Download className="me-2 h-4 w-4" /> {t("تصدير CSV","Export CSV")}
            </Button>
            <Button variant="outline" onClick={copyEmails} disabled={!emails.length}>
              <Copy className="me-2 h-4 w-4" /> {t("نسخ العناوين","Copy addresses")}
            </Button>
            <Button onClick={markSent} disabled={!emails.length || campaign.status === "sent"}>
              <Send className="me-2 h-4 w-4" /> {t("تسجيل كمُرسلة","Mark as sent")}
            </Button>
          </div>
          <div className="max-h-64 overflow-auto rounded border p-2 text-xs">
            {emails.slice(0, 200).map((e) => <div key={e}>{e}</div>)}
            {emails.length > 200 && (
              <div className="pt-2 text-muted-foreground">{t(`… و${emails.length - 200} آخر`, `… and ${emails.length - 200} more`)}</div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-lg border bg-card p-4">
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="mt-1 text-2xl font-bold">{value}</div>
    </div>
  );
}
