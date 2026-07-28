import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Mail, KeyRound, Send } from "lucide-react";
import { useServerFn } from "@tanstack/react-start";
import { sendTestEmail } from "@/lib/email.functions";


type Row = Record<string, any>;

export function EmailSettingsPanel() {
  const [form, setForm] = useState<Row | null>(null);
  const [saving, setSaving] = useState(false);

  const { data, error } = useQuery({
    queryKey: ["email-settings-admin"],
    queryFn: async () => {
      const { data, error } = await (supabase as any).rpc("get_email_settings_admin");
      if (error) throw error;
      return Array.isArray(data) ? data[0] : data;
    },
  });

  useEffect(() => { if (data && !form) setForm({ ...data }); }, [data, form]);

  const set = (k: string, v: any) => setForm((f) => ({ ...(f as Row), [k]: v }));

  async function save() {
    if (!form) return;
    setSaving(true);
    const { id, created_at, updated_at, ...payload } = form;
    payload.smtp_port = payload.smtp_port === "" || payload.smtp_port == null ? 587 : Number(payload.smtp_port);
    const { data: saved, error } = await (supabase as any).rpc("update_email_settings_admin", { payload });
    setSaving(false);
    if (error) return toast.error(error.message);
    if (saved) setForm({ ...saved });
    toast.success("تم حفظ إعدادات البريد");
  }

  if (error) return <div className="text-destructive text-sm">{(error as any).message}</div>;
  if (!form) return <div className="text-sm text-muted-foreground">جاري التحميل…</div>;

  const Field = ({ k, label, type = "text", placeholder }: { k: string; label: string; type?: string; placeholder?: string }) => (
    <div className="space-y-1.5">
      <Label className="text-xs">{label}</Label>
      <Input
        type={type}
        placeholder={placeholder}
        value={form[k] ?? ""}
        onChange={(e) => set(k, e.target.value)}
      />
    </div>
  );

  return (
    <div className="space-y-4 rounded-xl border border-primary/15 bg-background/40 p-4">
      <div className="flex items-center gap-2">
        <Mail className="h-4 w-4 text-primary" />
        <h3 className="text-sm font-semibold text-primary">إعدادات إرسال البريد (يدوي / SMTP)</h3>
      </div>
      <p className="text-xs text-muted-foreground">
        أدخل بيانات خادم SMTP الخاص بك لاحقاً لتفعيل إرسال ردود رسائل الزوار تلقائياً. تُحفظ البيانات بشكل آمن ولا يمكن لأحد غير المدراء الاطلاع عليها.
      </p>

      <div className="flex items-start justify-between gap-4 rounded-lg border border-primary/10 bg-card/40 p-3">
        <div>
          <div className="text-sm font-medium">تفعيل الإرسال عبر SMTP</div>
          <div className="text-xs text-muted-foreground">عند الإيقاف يتم استخدام البريد اليدوي (mailto) أو واتساب</div>
        </div>
        <Switch checked={!!form.smtp_enabled} onCheckedChange={(v) => set("smtp_enabled", v)} />
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <Field k="smtp_host" label="خادم SMTP" placeholder="smtp.example.com" />
        <Field k="smtp_port" label="المنفذ" type="number" placeholder="587" />
        <Field k="smtp_username" label="اسم المستخدم" placeholder="user@vipstar.cc" />
        <div className="space-y-1.5">
          <Label className="flex items-center gap-1 text-xs"><KeyRound className="h-3 w-3" /> كلمة المرور</Label>
          <Input
            type="password"
            autoComplete="new-password"
            placeholder="••••••••"
            value={form.smtp_password ?? ""}
            onChange={(e) => set("smtp_password", e.target.value)}
          />
        </div>
        <Field k="from_email" label="بريد المُرسل" placeholder="no-reply@vipstar.cc" />
        <Field k="from_name" label="اسم المُرسل" placeholder="VIPSTAR" />
        <Field k="reply_to" label="بريد الرد (Reply-To)" placeholder="info@vipstar.cc" />
      </div>

      <div className="flex items-start justify-between gap-4 rounded-lg border border-primary/10 bg-card/40 p-3">
        <div>
          <div className="text-sm font-medium">اتصال آمن (TLS/SSL)</div>
          <div className="text-xs text-muted-foreground">يُنصح بتفعيله مع المنفذ 465 أو 587</div>
        </div>
        <Switch checked={!!form.smtp_secure} onCheckedChange={(v) => set("smtp_secure", v)} />
      </div>

      {/* Automatic sending via HTTP email API */}
      <div className="space-y-3 rounded-lg border border-primary/20 bg-card/40 p-3">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-sm font-medium">
              <Send className="h-3.5 w-3.5 text-primary" /> الإرسال التلقائي (API)
            </div>
            <div className="text-xs text-muted-foreground">
              لإرسال رسائل الطلبات والأكواد تلقائياً من البريد الصادر. اختر المزوّد وأدخل مفتاح الـ API.
            </div>
          </div>
          <Switch checked={!!form.api_enabled} onCheckedChange={(v) => set("api_enabled", v)} />
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label className="text-xs">المزوّد</Label>
            <select
              className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
              value={form.api_provider ?? "resend"}
              onChange={(e) => set("api_provider", e.target.value)}
            >
              <option value="resend">Resend</option>
              <option value="brevo">Brevo (Sendinblue)</option>
              <option value="sendgrid">SendGrid</option>
              <option value="postmark">Postmark</option>
              <option value="mailersend">MailerSend</option>
            </select>
          </div>
          <div className="space-y-1.5">
            <Label className="flex items-center gap-1 text-xs"><KeyRound className="h-3 w-3" /> مفتاح الـ API</Label>
            <Input
              type="password"
              autoComplete="new-password"
              placeholder="••••••••"
              value={form.api_key ?? ""}
              onChange={(e) => set("api_key", e.target.value)}
            />
          </div>
          <div className="sm:col-span-2">
            <Field k="api_endpoint" label="رابط مخصص (اختياري)" placeholder="https://api.resend.com/emails" />
          </div>
        </div>

        <div className="flex flex-wrap items-end gap-2">
          <div className="flex-1 space-y-1.5">
            <Label className="text-xs">إرسال رسالة تجريبية إلى</Label>
            <Input
              placeholder="test@vipstar.cc"
              value={testTo}
              onChange={(e) => setTestTo(e.target.value)}
            />
          </div>
          <Button
            variant="outline"
            disabled={testing || !testTo}
            onClick={async () => {
              setTesting(true);
              try {
                await testFn({ data: { to: testTo } });
                toast.success("تم إرسال الرسالة التجريبية");
              } catch (e) {
                toast.error((e as Error).message);
              }
              setTesting(false);
            }}
          >
            {testing ? "جاري الإرسال…" : "اختبار"}
          </Button>
        </div>
      </div>


      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label className="text-xs">توقيع الرسائل (عربي)</Label>
          <Textarea rows={3} value={form.signature_ar ?? ""} onChange={(e) => set("signature_ar", e.target.value)} />
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs">توقيع الرسائل (إنجليزي)</Label>
          <Textarea rows={3} value={form.signature_en ?? ""} onChange={(e) => set("signature_en", e.target.value)} />
        </div>
      </div>

      <div className="flex justify-end">
        <Button onClick={save} disabled={saving} className="bg-primary text-background hover:bg-primary/90">
          {saving ? "جاري الحفظ…" : "حفظ إعدادات البريد"}
        </Button>
      </div>
    </div>
  );
}
