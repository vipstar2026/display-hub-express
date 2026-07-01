import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import {
  Store, Palette, Globe, CreditCard, Share2, Search, Bell,
  Shield, Wrench, Building2, Megaphone,
} from "lucide-react";

export const Route = createFileRoute("/_authenticated/admin/settings")({
  component: AdminSettings,
});

type Row = Record<string, any>;

function AdminSettings() {
  const qc = useQueryClient();
  const [form, setForm] = useState<Row | null>(null);
  const [saving, setSaving] = useState(false);

  const { data } = useQuery({
    queryKey: ["site-settings"],
    queryFn: async () => (await supabase.from("site_settings").select("*").eq("id", 1).single()).data,
  });

  useEffect(() => { if (data && !form) setForm({ ...data }); }, [data, form]);

  const set = (k: string, v: any) => setForm((f) => ({ ...(f as Row), [k]: v }));

  const handleSave = async () => {
    if (!form) return;
    setSaving(true);
    const { id, updated_at, ...payload } = form;
    // Normalize numeric fields
    ["shipping_flat", "free_shipping_threshold", "vat_percent", "low_stock_threshold"].forEach((k) => {
      if (payload[k] === "" || payload[k] === null) payload[k] = k === "free_shipping_threshold" ? null : 0;
      else payload[k] = Number(payload[k]);
    });
    const { error } = await supabase.from("site_settings").update(payload).eq("id", 1);
    setSaving(false);
    if (error) toast.error(error.message);
    else { toast.success("تم الحفظ"); qc.invalidateQueries({ queryKey: ["site-settings"] }); }
  };

  if (!form) return <div className="text-muted-foreground">Loading...</div>;

  const Field = ({ k, label, type = "text", placeholder }: { k: string; label: string; type?: string; placeholder?: string }) => (
    <div className="space-y-1.5">
      <Label className="text-xs">{label}</Label>
      <Input type={type} value={form[k] ?? ""} placeholder={placeholder} onChange={(e) => set(k, e.target.value)} />
    </div>
  );
  const Area = ({ k, label, rows = 3 }: { k: string; label: string; rows?: number }) => (
    <div className="space-y-1.5">
      <Label className="text-xs">{label}</Label>
      <Textarea rows={rows} value={form[k] ?? ""} onChange={(e) => set(k, e.target.value)} />
    </div>
  );
  const Toggle = ({ k, label, desc }: { k: string; label: string; desc?: string }) => (
    <div className="flex items-start justify-between gap-4 rounded-lg border border-cyan-500/10 bg-background/40 p-3">
      <div>
        <div className="text-sm font-medium">{label}</div>
        {desc && <div className="text-xs text-muted-foreground">{desc}</div>}
      </div>
      <Switch checked={!!form[k]} onCheckedChange={(v) => set(k, v)} />
    </div>
  );
  const Section = ({ title, children, cols = 2 }: { title?: string; children: React.ReactNode; cols?: 1 | 2 | 3 }) => (
    <div className="space-y-3">
      {title && <h3 className="text-sm font-semibold text-cyan-300">{title}</h3>}
      <div className={`grid gap-3 ${cols === 1 ? "grid-cols-1" : cols === 3 ? "sm:grid-cols-3" : "sm:grid-cols-2"}`}>{children}</div>
    </div>
  );

  return (
    <div className="mx-auto max-w-5xl space-y-4 pb-24">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold">إعدادات الموقع</h1>
          <p className="text-xs text-muted-foreground">تحكم كامل بكل ما يخص الموقع من مكان واحد</p>
        </div>
        <Button onClick={handleSave} disabled={saving} className="bg-cyan-500 text-background hover:bg-cyan-400">
          {saving ? "جاري الحفظ..." : "حفظ التغييرات"}
        </Button>
      </div>

      <Tabs defaultValue="general" className="w-full">
        <TabsList className="flex h-auto w-full flex-wrap justify-start gap-1 bg-card/60 p-1">
          <TabsTrigger value="general" className="gap-1.5"><Store className="h-3.5 w-3.5" />عام</TabsTrigger>
          <TabsTrigger value="brand" className="gap-1.5"><Palette className="h-3.5 w-3.5" />الهوية</TabsTrigger>
          <TabsTrigger value="contact" className="gap-1.5"><Building2 className="h-3.5 w-3.5" />التواصل</TabsTrigger>
          <TabsTrigger value="social" className="gap-1.5"><Share2 className="h-3.5 w-3.5" />التواصل الاجتماعي</TabsTrigger>
          <TabsTrigger value="commerce" className="gap-1.5"><CreditCard className="h-3.5 w-3.5" />المتجر</TabsTrigger>
          <TabsTrigger value="seo" className="gap-1.5"><Search className="h-3.5 w-3.5" />SEO</TabsTrigger>
          <TabsTrigger value="notifications" className="gap-1.5"><Bell className="h-3.5 w-3.5" />الإشعارات</TabsTrigger>
          <TabsTrigger value="security" className="gap-1.5"><Shield className="h-3.5 w-3.5" />الأمان</TabsTrigger>
          <TabsTrigger value="advanced" className="gap-1.5"><Wrench className="h-3.5 w-3.5" />متقدم</TabsTrigger>
        </TabsList>

        <div className="mt-4 space-y-4 rounded-xl border border-cyan-500/10 bg-card/60 p-4">
          <TabsContent value="general" className="mt-0 space-y-4">
            <Section title="الاسم والشعار" cols={2}>
              <Field k="site_name" label="اسم الموقع" />
              <Field k="default_language" label="اللغة الافتراضية (ar / en / ur)" />
            </Section>
            <Section title="الشعار (Slogan) ثلاثي اللغة" cols={1}>
              <Field k="tagline_ar" label="عربي" />
              <Field k="tagline_en" label="English" />
              <Field k="tagline_ur" label="اردو" />
            </Section>
            <Section title="بانر إعلاني علوي" cols={1}>
              <Toggle k="announcement_bar_enabled" label="تفعيل البانر" desc="يظهر أعلى كل صفحة" />
              <Area k="announcement_bar_text" label="نص البانر" rows={2} />
            </Section>
          </TabsContent>

          <TabsContent value="brand" className="mt-0 space-y-4">
            <Section title="الصور" cols={1}>
              <Field k="logo_url" label="رابط الشعار (Logo URL)" />
              <Field k="favicon_url" label="رابط الأيقونة (Favicon URL)" />
              <Field k="og_image_url" label="صورة المشاركة الاجتماعية (Open Graph)" />
            </Section>
            <Section title="الألوان" cols={2}>
              <div className="space-y-1.5">
                <Label className="text-xs">اللون الأساسي</Label>
                <div className="flex gap-2">
                  <input type="color" value={form.primary_color ?? "#22d3ee"} onChange={(e) => set("primary_color", e.target.value)} className="h-10 w-14 cursor-pointer rounded border border-cyan-500/20 bg-background" />
                  <Input value={form.primary_color ?? ""} onChange={(e) => set("primary_color", e.target.value)} />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">اللون الثانوي</Label>
                <div className="flex gap-2">
                  <input type="color" value={form.accent_color ?? "#0ea5e9"} onChange={(e) => set("accent_color", e.target.value)} className="h-10 w-14 cursor-pointer rounded border border-cyan-500/20 bg-background" />
                  <Input value={form.accent_color ?? ""} onChange={(e) => set("accent_color", e.target.value)} />
                </div>
              </div>
            </Section>
          </TabsContent>

          <TabsContent value="contact" className="mt-0 space-y-4">
            <Section title="بيانات التواصل" cols={2}>
              <Field k="contact_email" label="البريد الإلكتروني" type="email" />
              <Field k="contact_phone" label="رقم الهاتف" />
              <Field k="whatsapp" label="واتساب" />
              <Field k="business_hours" label="ساعات العمل" placeholder="السبت - الخميس 9ص - 10م" />
            </Section>
            <Section title="بيانات الشركة" cols={1}>
              <Area k="company_address" label="العنوان" rows={2} />
              <div className="grid gap-3 sm:grid-cols-2">
                <Field k="company_cr" label="السجل التجاري (CR)" />
                <Field k="company_vat_no" label="الرقم الضريبي (VAT)" />
              </div>
            </Section>
          </TabsContent>

          <TabsContent value="social" className="mt-0 space-y-4">
            <Section title="روابط منصات التواصل" cols={2}>
              <Field k="instagram_url" label="Instagram" placeholder="https://instagram.com/..." />
              <Field k="twitter_url" label="X / Twitter" />
              <Field k="facebook_url" label="Facebook" />
              <Field k="tiktok_url" label="TikTok" />
              <Field k="youtube_url" label="YouTube" />
              <Field k="snapchat_url" label="Snapchat" />
              <Field k="telegram_url" label="Telegram" />
            </Section>
          </TabsContent>

          <TabsContent value="commerce" className="mt-0 space-y-4">
            <Section title="العملة والشحن" cols={3}>
              <Field k="default_currency" label="العملة الافتراضية" placeholder="BHD" />
              <Field k="shipping_flat" label="سعر الشحن الثابت" type="number" />
              <Field k="free_shipping_threshold" label="الشحن مجاناً فوق" type="number" />
            </Section>
            <Section title="الضريبة" cols={2}>
              <Field k="vat_percent" label="نسبة ضريبة القيمة المضافة %" type="number" />
              <Toggle k="prices_include_vat" label="الأسعار شاملة الضريبة" />
            </Section>
            <Section title="المخزون والطلبات" cols={2}>
              <Field k="low_stock_threshold" label="حد التنبيه للمخزون المنخفض" type="number" />
              <Toggle k="allow_guest_checkout" label="السماح بالشراء كضيف" desc="بدون تسجيل حساب" />
            </Section>
          </TabsContent>

          <TabsContent value="seo" className="mt-0 space-y-4">
            <Section title="الوصف (Meta Description)" cols={1}>
              <Area k="meta_description_ar" label="عربي" />
              <Area k="meta_description_en" label="English" />
              <Area k="meta_description_ur" label="اردو" />
            </Section>
            <Section title="الكلمات المفتاحية" cols={1}>
              <Area k="meta_keywords" label="افصل بينها بفواصل" rows={2} />
            </Section>
            <Section title="أكواد التتبع" cols={1}>
              <Field k="google_analytics_id" label="Google Analytics (G-XXXX)" />
              <Field k="meta_pixel_id" label="Meta / Facebook Pixel ID" />
              <Field k="tiktok_pixel_id" label="TikTok Pixel ID" />
            </Section>
          </TabsContent>

          <TabsContent value="notifications" className="mt-0 space-y-3">
            <Toggle k="notify_email_new_order" label="إشعار بريدي عند وصول طلب جديد" />
            <Toggle k="notify_email_low_stock" label="إشعار بريدي عند انخفاض المخزون" />
          </TabsContent>

          <TabsContent value="security" className="mt-0 space-y-3">
            <Toggle k="allow_signups" label="السماح بإنشاء حسابات جديدة" desc="أوقفها لإغلاق التسجيل مؤقتاً" />
            <Toggle k="require_email_verification" label="اشتراط تفعيل البريد الإلكتروني" />
            <Toggle k="maintenance_mode" label="وضع الصيانة" desc="إخفاء الموقع عن الزوار مؤقتاً" />
            <Area k="maintenance_message" label="رسالة الصيانة" rows={3} />
          </TabsContent>

          <TabsContent value="advanced" className="mt-0 space-y-4">
            <Section title="حقن كود مخصص" cols={1}>
              <div className="rounded-lg border border-yellow-500/20 bg-yellow-500/5 p-3 text-xs text-yellow-300/90">
                <Megaphone className="mb-1 inline h-3.5 w-3.5" /> يُضاف هذا الكود داخل &lt;head&gt; في كل الصفحات. استخدمه بحذر.
              </div>
              <Area k="custom_head_html" label="كود HTML/JS مخصص (Head)" rows={8} />
            </Section>
          </TabsContent>
        </div>
      </Tabs>

      <div className="sticky bottom-4 flex justify-end">
        <Button onClick={handleSave} disabled={saving} size="lg" className="bg-cyan-500 text-background shadow-lg shadow-cyan-500/30 hover:bg-cyan-400">
          {saving ? "جاري الحفظ..." : "حفظ كل التغييرات"}
        </Button>
      </div>
    </div>
  );
}
