import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { useI18n } from "@/lib/i18n";
import { cleanPhoneNumber, useSiteSettings } from "@/lib/site-settings";
import { toast } from "sonner";
import { Mail, Phone, MapPin, Clock, MessageCircle, Send, CheckCircle2 } from "lucide-react";

export const Route = createFileRoute("/contact")({
  component: ContactPage,
  head: () => ({
    meta: [
      { title: "Contact VIPSTAR — Satellite & IPTV Support in Bahrain" },
      { name: "description", content: "Get in touch with VIPSTAR — phone, WhatsApp, email and store address in Bahrain. We reply fast in Arabic and English." },
      { property: "og:title", content: "Contact VIPSTAR" },
      { property: "og:description", content: "Reach the VIPSTAR team — Satellite & IPTV support, sales and installation help across Bahrain." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
});

function ContactPage() {
  const { t } = useI18n();
  const { data: settings } = useSiteSettings();
  const [form, setForm] = useState({ name: "", email: "", phone: "", subject: "", message: "" });
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name.trim() || !form.email.trim() || !form.message.trim()) return;
    setSending(true);
    const { error } = await supabase.from("contact_messages").insert({
      name: form.name.trim(),
      email: form.email.trim(),
      phone: form.phone.trim() || null,
      subject: form.subject.trim() || null,
      message: form.message.trim(),
    });
    setSending(false);
    if (error) { toast.error(t("contact.error")); return; }
    setSent(true);
    setForm({ name: "", email: "", phone: "", subject: "", message: "" });
    toast.success(t("contact.success"));
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 py-12">
        <div className="mx-auto max-w-5xl">
          <div className="mb-10 text-center">
            <h1 className="mb-3 bg-gradient-to-r from-primary to-primary/60 bg-clip-text font-display text-4xl font-bold text-transparent md:text-5xl">
              {t("contact.title")}
            </h1>
            <p className="text-muted-foreground">{t("contact.subtitle")}</p>
          </div>

          <div className="grid gap-8 md:grid-cols-5">
            <div className="space-y-4 md:col-span-2">
              {settings?.contact_email && (
                <InfoCard icon={<Mail className="h-5 w-5" />} label="Email" value={settings.contact_email} href={`mailto:${settings.contact_email}`} />
              )}
              {settings?.contact_phone && (
                <InfoCard icon={<Phone className="h-5 w-5" />} label="Phone" value={settings.contact_phone} href={`tel:${settings.contact_phone}`} />
              )}
              {settings?.whatsapp && (
                <InfoCard icon={<MessageCircle className="h-5 w-5" />} label={t("contact.whatsapp")} value={settings.whatsapp} href={`https://wa.me/${cleanPhoneNumber(settings.whatsapp)}`} />
              )}
              {settings?.company_address && (
                <InfoCard icon={<MapPin className="h-5 w-5" />} label={t("contact.address")} value={settings.company_address} />
              )}
              {settings?.business_hours && (
                <InfoCard icon={<Clock className="h-5 w-5" />} label={t("contact.hours")} value={settings.business_hours} />
              )}
            </div>

            <form onSubmit={submit} className="rounded-2xl border border-primary/20 bg-card/50 p-6 md:col-span-3">
              {sent ? (
                <div className="flex flex-col items-center gap-3 py-10 text-center">
                  <CheckCircle2 className="h-14 w-14 text-primary" />
                  <p className="text-lg font-medium">{t("contact.success")}</p>
                  <Button variant="outline" onClick={() => setSent(false)}>{t("contact.send")}</Button>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <Field label={t("contact.name")}>
                      <Input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
                    </Field>
                    <Field label={t("contact.email")}>
                      <Input required type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
                    </Field>
                    <Field label={t("contact.phone")}>
                      <Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
                    </Field>
                    <Field label={t("contact.subject")}>
                      <Input value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })} />
                    </Field>
                  </div>
                  <Field label={t("contact.message")}>
                    <Textarea required rows={6} value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} />
                  </Field>
                  <Button type="submit" disabled={sending} className="w-full gap-2">
                    <Send className="h-4 w-4" /> {sending ? t("contact.sending") : t("contact.send")}
                  </Button>
                </div>
              )}
            </form>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-medium text-muted-foreground">{label}</span>
      {children}
    </label>
  );
}

function InfoCard({ icon, label, value, href }: { icon: React.ReactNode; label: string; value: string; href?: string }) {
  const inner = (
    <div className="flex items-start gap-3 rounded-xl border border-primary/15 bg-card/40 p-4 transition hover:border-primary/40 hover:bg-card/70">
      <div className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-primary/10 text-primary">{icon}</div>
      <div className="min-w-0">
        <div className="text-[11px] uppercase tracking-wider text-muted-foreground">{label}</div>
        <div className="truncate text-sm font-medium">{value}</div>
      </div>
    </div>
  );
  return href ? <a href={href} target="_blank" rel="noopener noreferrer">{inner}</a> : inner;
}
