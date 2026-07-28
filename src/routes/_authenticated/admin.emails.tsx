import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useI18n } from "@/lib/i18n";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Mail, Send, Check, Copy, Loader2, Trash2 } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/admin/emails")({
  component: AdminEmailsPage,
});

type Row = {
  id: string;
  to_email: string;
  to_name: string | null;
  subject: string;
  body: string;
  template: string;
  status: string;
  order_id: string | null;
  sent_at: string | null;
  created_at: string;
};

function AdminEmailsPage() {
  const { lang } = useI18n();
  const qc = useQueryClient();
  const [busy, setBusy] = useState<string | null>(null);
  const txt = (ar: string, en: string, ur: string) => (lang === "ar" ? ar : lang === "ur" ? ur : en);

  const { data, isLoading } = useQuery({
    queryKey: ["email-outbox"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("email_outbox")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(200);
      if (error) throw error;
      return (data ?? []) as Row[];
    },
  });

  const setStatus = async (id: string, status: string) => {
    setBusy(id);
    const { error } = await supabase
      .from("email_outbox")
      .update({ status, sent_at: status === "sent" ? new Date().toISOString() : null })
      .eq("id", id);
    setBusy(null);
    if (error) return toast.error(error.message);
    qc.invalidateQueries({ queryKey: ["email-outbox"] });
  };

  const remove = async (id: string) => {
    const { error } = await supabase.from("email_outbox").delete().eq("id", id);
    if (error) return toast.error(error.message);
    qc.invalidateQueries({ queryKey: ["email-outbox"] });
  };

  const queued = (data ?? []).filter((r) => r.status === "queued").length;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold">
            <Mail className="h-6 w-6 text-primary" />
            {txt("البريد الصادر", "Outbox", "آؤٹ باکس")}
          </h1>
          <p className="text-sm text-muted-foreground">
            {txt(
              "رسائل تأكيد الطلبات والأكواد الرقمية الجاهزة للإرسال",
              "Order confirmations and digital codes ready to send",
              "آرڈر کی تصدیق اور ڈیجیٹل کوڈز",
            )}
          </p>
        </div>
        <Badge variant="secondary">
          {queued} {txt("بالانتظار", "queued", "قطار میں")}
        </Badge>
      </div>

      {isLoading ? (
        <div className="flex items-center gap-2 text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" /> {txt("جارٍ التحميل…", "Loading…", "لوڈ…")}
        </div>
      ) : (data ?? []).length === 0 ? (
        <Card className="p-10 text-center text-muted-foreground">
          {txt("لا توجد رسائل", "No emails yet", "کوئی ای میل نہیں")}
        </Card>
      ) : (
        <div className="space-y-3">
          {(data ?? []).map((r) => (
            <Card key={r.id} className="p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0 space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold">{r.subject}</span>
                    <Badge variant={r.status === "sent" ? "default" : "secondary"}>{r.status}</Badge>
                    <Badge variant="outline">{r.template}</Badge>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {r.to_name ? `${r.to_name} · ` : ""}
                    {r.to_email} · {new Date(r.created_at).toLocaleString()}
                  </div>
                  <pre className="mt-2 max-h-40 overflow-auto whitespace-pre-wrap rounded-md bg-muted/50 p-3 text-xs">
                    {r.body}
                  </pre>
                </div>
                <div className="flex shrink-0 flex-wrap gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      navigator.clipboard.writeText(r.body);
                      toast.success(txt("تم النسخ", "Copied", "کاپی ہوگیا"));
                    }}
                  >
                    <Copy className="mr-1 h-4 w-4" /> {txt("نسخ", "Copy", "کاپی")}
                  </Button>
                  <Button size="sm" asChild>
                    <a
                      href={`mailto:${r.to_email}?subject=${encodeURIComponent(r.subject)}&body=${encodeURIComponent(r.body)}`}
                    >
                      <Send className="mr-1 h-4 w-4" /> {txt("إرسال", "Send", "بھیجیں")}
                    </a>
                  </Button>
                  {r.status !== "sent" && (
                    <Button
                      size="sm"
                      variant="secondary"
                      disabled={busy === r.id}
                      onClick={() => setStatus(r.id, "sent")}
                    >
                      <Check className="mr-1 h-4 w-4" /> {txt("تم الإرسال", "Mark sent", "بھیج دیا")}
                    </Button>
                  )}
                  <Button size="sm" variant="ghost" onClick={() => remove(r.id)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
