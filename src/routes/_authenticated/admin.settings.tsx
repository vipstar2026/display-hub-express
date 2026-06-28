import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Loader2, Save, Megaphone, Phone, Share2, Sparkles } from "lucide-react";
import { useAdminI18n } from "@/lib/i18n-admin";

export const Route = createFileRoute("/_authenticated/admin/settings")({
  component: AdminSettings,
});

type Row = { key: string; value: Record<string, unknown> };

function AdminSettings() {
  const { L } = useAdminI18n();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [hero, setHero] = useState({ title: "", subtitle: "", cta_label: "", cta_link: "" });
  const [contact, setContact] = useState({ phone: "", email: "", whatsapp: "", address: "" });
  const [social, setSocial] = useState({ facebook: "", instagram: "", twitter: "", youtube: "" });
  const [announcement, setAnnouncement] = useState({ enabled: false, message: "", link: "" });

  useEffect(() => {
    (async () => {
      const { data } = await supabase.from("site_settings").select("*");
      (data as Row[] | null || []).forEach((r) => {
        if (r.key === "hero") setHero((p) => ({ ...p, ...(r.value as typeof hero) }));
        if (r.key === "contact") setContact((p) => ({ ...p, ...(r.value as typeof contact) }));
        if (r.key === "social") setSocial((p) => ({ ...p, ...(r.value as typeof social) }));
        if (r.key === "announcement") setAnnouncement((p) => ({ ...p, ...(r.value as typeof announcement) }));
      });
      setLoading(false);
    })();
  }, []);

  async function saveAll() {
    setSaving(true);
    const rows = [
      { key: "hero", value: hero },
      { key: "contact", value: contact },
      { key: "social", value: social },
      { key: "announcement", value: announcement },
    ];
    const { error } = await supabase.from("site_settings").upsert(rows, { onConflict: "key" });
    setSaving(false);
    if (error) return toast.error(error.message);
    toast.success(L.seSavedToast);
  }

  if (loading) {
    return (
      <div className="grid place-items-center py-16">
        <Loader2 className="w-6 h-6 animate-spin text-brand" />
      </div>
    );
  }

  const inp = "mt-1.5 w-full h-10 rounded-lg border border-border bg-card/60 px-3 text-sm text-foreground placeholder:text-muted-foreground/60 outline-none focus:border-brand focus:ring-2 focus:ring-brand/20 transition-smooth";
  const lbl = "text-xs font-semibold text-muted-foreground";

  return (
    <div className="space-y-6 max-w-5xl">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-foreground">{L.seTitle}</h1>
          <p className="text-sm text-muted-foreground mt-1">{L.seSub}</p>
        </div>
        <button onClick={saveAll} disabled={saving} className="inline-flex items-center gap-2 h-10 px-5 rounded-lg bg-gradient-brand text-brand-foreground text-sm font-bold shadow-glow hover:opacity-90 disabled:opacity-50 transition-smooth">
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} {L.saveChanges}
        </button>
      </div>

      <Section icon={Sparkles} title={L.seHero} subtitle={L.seHeroSub}>
        <div className="grid md:grid-cols-2 gap-4">
          <div><label className={lbl}>{L.seHeroTitle}</label><input className={inp} value={hero.title} onChange={(e) => setHero({ ...hero, title: e.target.value })} placeholder="VIP STAR" /></div>
          <div><label className={lbl}>{L.seHeroSubtitle}</label><input className={inp} value={hero.subtitle} onChange={(e) => setHero({ ...hero, subtitle: e.target.value })} /></div>
          <div><label className={lbl}>{L.seCtaLabel}</label><input className={inp} value={hero.cta_label} onChange={(e) => setHero({ ...hero, cta_label: e.target.value })} /></div>
          <div><label className={lbl}>{L.seCtaLink}</label><input className={inp} value={hero.cta_link} onChange={(e) => setHero({ ...hero, cta_link: e.target.value })} placeholder="/iptv" dir="ltr" /></div>
        </div>
      </Section>

      <Section icon={Megaphone} title={L.seAnnouncement} subtitle={L.seAnnouncementSub}>
        <label className="inline-flex items-center gap-2 text-sm font-medium text-foreground mb-4 cursor-pointer">
          <input type="checkbox" checked={announcement.enabled} onChange={(e) => setAnnouncement({ ...announcement, enabled: e.target.checked })} className="w-4 h-4 accent-brand" />
          {L.seAnnEnable}
        </label>
        <div className="grid md:grid-cols-2 gap-4">
          <div><label className={lbl}>{L.seAnnMessage}</label><input className={inp} value={announcement.message} onChange={(e) => setAnnouncement({ ...announcement, message: e.target.value })} /></div>
          <div><label className={lbl}>{L.seAnnLink}</label><input className={inp} value={announcement.link} onChange={(e) => setAnnouncement({ ...announcement, link: e.target.value })} placeholder="/services" dir="ltr" /></div>
        </div>
      </Section>

      <Section icon={Phone} title={L.seContact} subtitle={L.seContactSub}>
        <div className="grid md:grid-cols-2 gap-4">
          <div><label className={lbl}>{L.seCtPhone}</label><input className={inp} value={contact.phone} onChange={(e) => setContact({ ...contact, phone: e.target.value })} dir="ltr" /></div>
          <div><label className={lbl}>{L.seCtEmail}</label><input className={inp} value={contact.email} onChange={(e) => setContact({ ...contact, email: e.target.value })} dir="ltr" /></div>
          <div><label className={lbl}>{L.seCtWhats}</label><input className={inp} value={contact.whatsapp} onChange={(e) => setContact({ ...contact, whatsapp: e.target.value })} dir="ltr" /></div>
          <div><label className={lbl}>{L.seCtAddress}</label><input className={inp} value={contact.address} onChange={(e) => setContact({ ...contact, address: e.target.value })} /></div>
        </div>
      </Section>

      <Section icon={Share2} title={L.seSocial} subtitle={L.seSocialSub}>
        <div className="grid md:grid-cols-2 gap-4">
          <div><label className={lbl}>{L.seFacebook}</label><input className={inp} value={social.facebook} onChange={(e) => setSocial({ ...social, facebook: e.target.value })} dir="ltr" /></div>
          <div><label className={lbl}>{L.seInstagram}</label><input className={inp} value={social.instagram} onChange={(e) => setSocial({ ...social, instagram: e.target.value })} dir="ltr" /></div>
          <div><label className={lbl}>{L.seTwitter}</label><input className={inp} value={social.twitter} onChange={(e) => setSocial({ ...social, twitter: e.target.value })} dir="ltr" /></div>
          <div><label className={lbl}>{L.seYoutube}</label><input className={inp} value={social.youtube} onChange={(e) => setSocial({ ...social, youtube: e.target.value })} dir="ltr" /></div>
        </div>
      </Section>

      <div className="flex justify-end">
        <button onClick={saveAll} disabled={saving} className="inline-flex items-center gap-2 h-11 px-6 rounded-lg bg-gradient-brand text-brand-foreground text-sm font-bold shadow-glow hover:opacity-90 disabled:opacity-50 transition-smooth">
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} {L.seSaveAll}
        </button>
      </div>
    </div>
  );
}

function Section({ icon: Icon, title, subtitle, children }: { icon: typeof Save; title: string; subtitle: string; children: React.ReactNode }) {
  return (
    <section className="bg-card border border-border rounded-2xl p-5 md:p-6 shadow-card">
      <div className="flex items-start gap-3 mb-5">
        <div className="w-10 h-10 rounded-xl bg-gradient-brand text-brand-foreground grid place-items-center shadow-glow shrink-0">
          <Icon className="w-5 h-5" />
        </div>
        <div>
          <h2 className="text-base font-bold text-foreground">{title}</h2>
          <p className="text-xs text-muted-foreground mt-0.5">{subtitle}</p>
        </div>
      </div>
      {children}
    </section>
  );
}
