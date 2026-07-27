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
  Shield, Wrench, Building2, Megaphone, Check,
} from "lucide-react";
import { THEME_LIST, applyTheme, DEFAULT_THEME } from "@/lib/themes";
import { ThemePreview } from "@/components/ThemePreview";
import { useI18n } from "@/lib/i18n";
import { SITE_SETTINGS_QUERY_KEY } from "@/lib/site-settings";

export const Route = createFileRoute("/_authenticated/admin/settings")({
  component: AdminSettings,
});

type Row = Record<string, any>;

function AdminSettings() {
  const qc = useQueryClient();
  const { t } = useI18n();
  const [form, setForm] = useState<Row | null>(null);
  const [saving, setSaving] = useState(false);

  const { data, error: loadError } = useQuery({
    queryKey: ["site-settings-admin"],
    queryFn: async () => {
      const { data, error } = await (supabase as any).rpc("get_site_settings_admin");
      if (error) throw error;
      return Array.isArray(data) ? data[0] : data;
    },
  });

  useEffect(() => { if (data && !form) setForm({ ...data }); }, [data, form]);

  const set = (k: string, v: any) => setForm((f) => ({ ...(f as Row), [k]: v }));

  const handleSave = async () => {
    if (!form) return;
    setSaving(true);
    const { id, updated_at, created_at, ...payload } = form;
    ["shipping_flat", "free_shipping_threshold", "vat_percent", "low_stock_threshold"].forEach((k) => {
      if (payload[k] === "" || payload[k] === null) payload[k] = k === "free_shipping_threshold" ? null : 0;
      else payload[k] = Number(payload[k]);
    });
    const { data: saved, error } = await (supabase as any).rpc("update_site_settings_admin", { payload });
    setSaving(false);
    if (error) toast.error(error.message);
    else {
      if (saved) setForm({ ...saved });
      toast.success(t("toast.saved"));
      qc.setQueryData(["site-settings-admin"], saved);
      qc.setQueryData(SITE_SETTINGS_QUERY_KEY, saved);
      qc.invalidateQueries({ queryKey: ["site-settings-admin"] });
      qc.invalidateQueries({ queryKey: SITE_SETTINGS_QUERY_KEY });
    }
  };

  if (loadError) return <div className="text-destructive">{t("settings.load_error")}: {(loadError as any).message}</div>;
  if (!form) return <div className="text-muted-foreground">{t("settings.loading")}</div>;

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
    <div className="flex items-start justify-between gap-4 rounded-lg border border-primary/10 bg-background/40 p-3">
      <div>
        <div className="text-sm font-medium">{label}</div>
        {desc && <div className="text-xs text-muted-foreground">{desc}</div>}
      </div>
      <Switch checked={!!form[k]} onCheckedChange={(v) => set(k, v)} />
    </div>
  );
  const Section = ({ title, children, cols = 2 }: { title?: string; children: React.ReactNode; cols?: 1 | 2 | 3 }) => (
    <div className="space-y-3">
      {title && <h3 className="text-sm font-semibold text-primary">{title}</h3>}
      <div className={`grid gap-3 ${cols === 1 ? "grid-cols-1" : cols === 3 ? "sm:grid-cols-3" : "sm:grid-cols-2"}`}>{children}</div>
    </div>
  );

  return (
    <div className="mx-auto max-w-5xl space-y-4 pb-24">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold">{t("settings.title")}</h1>
          <p className="text-xs text-muted-foreground">{t("settings.subtitle")}</p>
        </div>
        <Button onClick={handleSave} disabled={saving} className="bg-primary text-background hover:bg-primary">
          {saving ? t("settings.saving") : t("settings.save")}
        </Button>
      </div>

      <Tabs defaultValue="general" className="w-full">
        <TabsList className="flex h-auto w-full flex-wrap justify-start gap-1 bg-card/60 p-1">
          <TabsTrigger value="general" className="gap-1.5"><Store className="h-3.5 w-3.5" />{t("settings.tab.general")}</TabsTrigger>
          <TabsTrigger value="brand" className="gap-1.5"><Palette className="h-3.5 w-3.5" />{t("settings.tab.brand")}</TabsTrigger>
          <TabsTrigger value="contact" className="gap-1.5"><Building2 className="h-3.5 w-3.5" />{t("settings.tab.contact")}</TabsTrigger>
          <TabsTrigger value="social" className="gap-1.5"><Share2 className="h-3.5 w-3.5" />{t("settings.tab.social")}</TabsTrigger>
          <TabsTrigger value="commerce" className="gap-1.5"><CreditCard className="h-3.5 w-3.5" />{t("settings.tab.commerce")}</TabsTrigger>
          <TabsTrigger value="seo" className="gap-1.5"><Search className="h-3.5 w-3.5" />{t("settings.tab.seo")}</TabsTrigger>
          <TabsTrigger value="notifications" className="gap-1.5"><Bell className="h-3.5 w-3.5" />{t("settings.tab.notifications")}</TabsTrigger>
          <TabsTrigger value="security" className="gap-1.5"><Shield className="h-3.5 w-3.5" />{t("settings.tab.security")}</TabsTrigger>
          <TabsTrigger value="advanced" className="gap-1.5"><Wrench className="h-3.5 w-3.5" />{t("settings.tab.advanced")}</TabsTrigger>
        </TabsList>

        <div className="mt-4 space-y-4 rounded-xl border border-primary/10 bg-card/60 p-4">
          <TabsContent value="general" className="mt-0 space-y-4">
            <Section title={t("settings.sec.name_logo")} cols={2}>
              <Field k="site_name" label={t("settings.f.site_name")} />
              <Field k="default_language" label={t("settings.f.default_lang")} />
            </Section>
            <Section title={t("settings.sec.tagline")} cols={1}>
              <Field k="tagline_ar" label={t("settings.f.tagline_ar")} />
              <Field k="tagline_en" label={t("settings.f.tagline_en")} />
              <Field k="tagline_ur" label={t("settings.f.tagline_ur")} />
            </Section>
            <Section title={t("settings.sec.hero")} cols={1}>
              <Field k="hero_badge_text" label={t("settings.f.hero_badge")} placeholder="VIPSTAR.CC" />
              <div className="grid gap-3 sm:grid-cols-3">
                <Field k="hero_title_ar" label={t("settings.f.hero_title_ar")} />
                <Field k="hero_title_en" label={t("settings.f.hero_title_en")} />
                <Field k="hero_title_ur" label={t("settings.f.hero_title_ur")} />
              </div>
              <div className="grid gap-3 sm:grid-cols-3">
                <Area k="hero_subtitle_ar" label={t("settings.f.hero_sub_ar")} rows={2} />
                <Area k="hero_subtitle_en" label={t("settings.f.hero_sub_en")} rows={2} />
                <Area k="hero_subtitle_ur" label={t("settings.f.hero_sub_ur")} rows={2} />
              </div>
              <div className="grid gap-3 sm:grid-cols-3">
                <Field k="hero_cta_ar" label={t("settings.f.hero_cta_ar")} />
                <Field k="hero_cta_en" label={t("settings.f.hero_cta_en")} />
                <Field k="hero_cta_ur" label={t("settings.f.hero_cta_ur")} />
              </div>
            </Section>
            <Section title={t("settings.sec.banner")} cols={1}>
              <Toggle k="announcement_bar_enabled" label={t("settings.f.banner_enabled")} desc={t("settings.f.banner_enabled_desc")} />
              <Area k="announcement_bar_text" label={t("settings.f.banner_text")} rows={2} />
            </Section>

          </TabsContent>

          <TabsContent value="brand" className="mt-0 space-y-4">
            <Section title={t("settings.sec.theme")} cols={1}>
              <div className="text-xs text-muted-foreground">{t("settings.theme.desc")}</div>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                {THEME_LIST.map((th) => {
                  const active = (form.theme_preset ?? DEFAULT_THEME) === th.id;
                  return (
                    <button
                      key={th.id}
                      type="button"
                      onClick={() => { set("theme_preset", th.id); applyTheme(th.id); }}
                      className={`group relative overflow-hidden rounded-xl border p-3 text-start transition ${
                        active ? "border-primary ring-2 ring-primary/40" : "border-primary/15 hover:border-primary/40"
                      }`}
                      style={{ background: th.vars["--card"] }}
                    >
                      <div className="flex h-14 gap-1.5 overflow-hidden rounded-lg">
                        {th.swatches.map((c, i) => (
                          <div key={i} className="flex-1" style={{ background: c }} />
                        ))}
                      </div>
                      <div className="mt-2 flex items-center justify-between">
                        <span className="text-sm font-semibold" style={{ color: th.vars["--foreground"] }}>{th.name}</span>
                        {active && (
                          <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary text-background">
                            <Check className="h-3 w-3" />
                          </span>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            </Section>
            <ThemePreview themeId={form.theme_preset ?? DEFAULT_THEME} savedId={data?.theme_preset ?? DEFAULT_THEME} onReset={() => { set("theme_preset", data?.theme_preset ?? DEFAULT_THEME); applyTheme(data?.theme_preset ?? DEFAULT_THEME); }} />
            <Section title={t("settings.sec.images")} cols={1}>
              <Field k="logo_url" label={t("settings.f.logo_url")} />
              <Field k="favicon_url" label={t("settings.f.favicon_url")} />
              <Field k="og_image_url" label={t("settings.f.og_url")} />
            </Section>
            <Section title={t("settings.sec.colors")} cols={2}>
              <div className="space-y-1.5">
                <Label className="text-xs">{t("settings.f.primary_color")}</Label>
                <div className="flex gap-2">
                  <input type="color" value={form.primary_color ?? "#22d3ee"} onChange={(e) => set("primary_color", e.target.value)} className="h-10 w-14 cursor-pointer rounded border border-primary/20 bg-background" />
                  <Input value={form.primary_color ?? ""} onChange={(e) => set("primary_color", e.target.value)} />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">{t("settings.f.accent_color")}</Label>
                <div className="flex gap-2">
                  <input type="color" value={form.accent_color ?? "#0ea5e9"} onChange={(e) => set("accent_color", e.target.value)} className="h-10 w-14 cursor-pointer rounded border border-primary/20 bg-background" />
                  <Input value={form.accent_color ?? ""} onChange={(e) => set("accent_color", e.target.value)} />
                </div>
              </div>
            </Section>
          </TabsContent>

          <TabsContent value="contact" className="mt-0 space-y-4">
            <Section title={t("settings.sec.contact_info")} cols={2}>
              <Field k="contact_email" label={t("settings.f.email")} type="email" />
              <Field k="contact_phone" label={t("settings.f.phone")} />
              <Field k="whatsapp" label={t("settings.f.whatsapp")} />
              <Field k="business_hours" label={t("settings.f.hours")} placeholder={t("settings.f.hours_placeholder")} />
            </Section>
            <Section title={t("settings.sec.company")} cols={1}>
              <Area k="company_address" label={t("settings.f.address")} rows={2} />
              <div className="grid gap-3 sm:grid-cols-2">
                <Field k="company_cr" label={t("settings.f.cr")} />
                <Field k="company_vat_no" label={t("settings.f.vat_no")} />
              </div>
            </Section>
          </TabsContent>

          <TabsContent value="social" className="mt-0 space-y-4">
            <Section title={t("settings.sec.social_links")} cols={2}>
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
            <Section title={t("settings.sec.currency_shipping")} cols={3}>
              <Field k="default_currency" label={t("settings.f.currency")} placeholder="BHD" />
              <Field k="shipping_flat" label={t("settings.f.shipping_flat")} type="number" />
              <Field k="free_shipping_threshold" label={t("settings.f.free_shipping")} type="number" />
            </Section>
            <Section title={t("settings.sec.tax")} cols={2}>
              <Field k="vat_percent" label={t("settings.f.vat_pct")} type="number" />
              <Toggle k="prices_include_vat" label={t("settings.f.prices_incl_vat")} />
            </Section>
            <Section title={t("settings.sec.inventory")} cols={2}>
              <Field k="low_stock_threshold" label={t("settings.f.low_stock")} type="number" />
              <Toggle k="allow_guest_checkout" label={t("settings.f.guest_checkout")} desc={t("settings.f.guest_checkout_desc")} />
            </Section>
          </TabsContent>

          <TabsContent value="seo" className="mt-0 space-y-4">
            <Section title={t("settings.sec.meta_desc")} cols={1}>
              <Area k="meta_description_ar" label={t("settings.f.tagline_ar")} />
              <Area k="meta_description_en" label={t("settings.f.tagline_en")} />
              <Area k="meta_description_ur" label={t("settings.f.tagline_ur")} />
            </Section>
            <Section title={t("settings.sec.keywords")} cols={1}>
              <Area k="meta_keywords" label={t("settings.f.keywords_hint")} rows={2} />
            </Section>
            <Section title={t("settings.sec.tracking")} cols={1}>
              <Field k="google_analytics_id" label="Google Analytics (G-XXXX)" />
              <Field k="meta_pixel_id" label="Meta / Facebook Pixel ID" />
              <Field k="tiktok_pixel_id" label="TikTok Pixel ID" />
            </Section>
          </TabsContent>

          <TabsContent value="notifications" className="mt-0 space-y-3">
            <Toggle k="notify_email_new_order" label={t("settings.notify.new_order")} />
            <Toggle k="notify_email_low_stock" label={t("settings.notify.low_stock")} />
            <EmailSettingsPanel />
          </TabsContent>


          <TabsContent value="security" className="mt-0 space-y-3">
            <Toggle k="allow_signups" label={t("settings.sec.signups")} desc={t("settings.sec.signups_desc")} />
            <Toggle k="require_email_verification" label={t("settings.sec.email_verify")} />
            <Toggle k="maintenance_mode" label={t("settings.sec.maintenance")} desc={t("settings.sec.maintenance_desc")} />
            <Area k="maintenance_message" label={t("settings.f.maintenance_msg")} rows={3} />
          </TabsContent>

          <TabsContent value="advanced" className="mt-0 space-y-4">
            <Section title={t("settings.adv.custom")} cols={1}>
              <div className="rounded-lg border border-yellow-500/20 bg-yellow-500/5 p-3 text-xs text-yellow-300/90">
                <Megaphone className="mb-1 inline h-3.5 w-3.5" /> {t("settings.adv.warning")}
              </div>
              <Area k="custom_head_html" label={t("settings.adv.head_html")} rows={8} />
            </Section>
          </TabsContent>
        </div>
      </Tabs>

      <div className="sticky bottom-4 flex justify-end">
        <Button onClick={handleSave} disabled={saving} size="lg" className="bg-primary text-background shadow-lg shadow-primary/30 hover:bg-primary">
          {saving ? t("settings.saving") : t("settings.save_all")}
        </Button>
      </div>
    </div>
  );
}
