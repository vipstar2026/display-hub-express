import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Loader2, Save, Megaphone, Phone, Share2, Sparkles } from "lucide-react";

export const Route = createFileRoute("/_authenticated/admin/settings")({
  component: AdminSettings,
});

type Row = { key: string; value: Record<string, unknown> };

function AdminSettings() {
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
        if (r.key === "hero") setHero({ ...hero, ...(r.value as typeof hero) });
        if (r.key === "contact") setContact({ ...contact, ...(r.value as typeof contact) });
        if (r.key === "social") setSocial({ ...social, ...(r.value as typeof social) });
        if (r.key === "announcement") setAnnouncement({ ...announcement, ...(r.value as typeof announcement) });
      });
      setLoading(false);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
    toast.success("Site settings saved");
  }

  if (loading) return <div className="grid place-items-center py-16"><Loader2 className="w-6 h-6 animate-spin text-amber-500" /></div>;

  const inp = "mt-1 w-full h-10 rounded-md border border-slate-200 dark:border-slate-700 px-3 text-sm bg-white dark:bg-slate-900 outline-none focus:border-amber-500";
  const lbl = "text-xs font-semibold text-slate-600 dark:text-slate-300";

  return (
    <div className="space-y-6 max-w-5xl">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Site Settings</h1>
          <p className="text-sm text-slate-500 mt-1">Control global content shown across the website.</p>
        </div>
        <button onClick={saveAll} disabled={saving} className="inline-flex items-center gap-2 h-10 px-5 rounded-lg bg-slate-900 text-white text-sm font-bold hover:bg-slate-800 disabled:opacity-50">
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} Save changes
        </button>
      </div>

      <Section icon={Sparkles} title="Hero banner" subtitle="The headline visitors see first on the home page.">
        <div className="grid md:grid-cols-2 gap-4">
          <div><label className={lbl}>Title</label><input className={inp} value={hero.title} onChange={(e) => setHero({ ...hero, title: e.target.value })} /></div>
          <div><label className={lbl}>Subtitle</label><input className={inp} value={hero.subtitle} onChange={(e) => setHero({ ...hero, subtitle: e.target.value })} /></div>
          <div><label className={lbl}>CTA label</label><input className={inp} value={hero.cta_label} onChange={(e) => setHero({ ...hero, cta_label: e.target.value })} /></div>
          <div><label className={lbl}>CTA link</label><input className={inp} value={hero.cta_link} onChange={(e) => setHero({ ...hero, cta_link: e.target.value })} placeholder="/iptv" /></div>
        </div>
      </Section>

      <Section icon={Megaphone} title="Announcement bar" subtitle="A small banner shown at the top of every page.">
        <label className="inline-flex items-center gap-2 text-sm font-medium text-slate-700 dark:text-slate-200 mb-3">
          <input type="checkbox" checked={announcement.enabled} onChange={(e) => setAnnouncement({ ...announcement, enabled: e.target.checked })} className="w-4 h-4 accent-amber-500" />
          Enable announcement
        </label>
        <div className="grid md:grid-cols-2 gap-4">
          <div><label className={lbl}>Message</label><input className={inp} value={announcement.message} onChange={(e) => setAnnouncement({ ...announcement, message: e.target.value })} placeholder="Free shipping on orders over QAR 200" /></div>
          <div><label className={lbl}>Link (optional)</label><input className={inp} value={announcement.link} onChange={(e) => setAnnouncement({ ...announcement, link: e.target.value })} placeholder="/services" /></div>
        </div>
      </Section>

      <Section icon={Phone} title="Contact information" subtitle="Used in the footer and contact pages.">
        <div className="grid md:grid-cols-2 gap-4">
          <div><label className={lbl}>Phone</label><input className={inp} value={contact.phone} onChange={(e) => setContact({ ...contact, phone: e.target.value })} /></div>
          <div><label className={lbl}>Email</label><input className={inp} value={contact.email} onChange={(e) => setContact({ ...contact, email: e.target.value })} /></div>
          <div><label className={lbl}>WhatsApp</label><input className={inp} value={contact.whatsapp} onChange={(e) => setContact({ ...contact, whatsapp: e.target.value })} /></div>
          <div><label className={lbl}>Address</label><input className={inp} value={contact.address} onChange={(e) => setContact({ ...contact, address: e.target.value })} /></div>
        </div>
      </Section>

      <Section icon={Share2} title="Social links" subtitle="Links shown in the footer.">
        <div className="grid md:grid-cols-2 gap-4">
          <div><label className={lbl}>Facebook</label><input className={inp} value={social.facebook} onChange={(e) => setSocial({ ...social, facebook: e.target.value })} /></div>
          <div><label className={lbl}>Instagram</label><input className={inp} value={social.instagram} onChange={(e) => setSocial({ ...social, instagram: e.target.value })} /></div>
          <div><label className={lbl}>Twitter / X</label><input className={inp} value={social.twitter} onChange={(e) => setSocial({ ...social, twitter: e.target.value })} /></div>
          <div><label className={lbl}>YouTube</label><input className={inp} value={social.youtube} onChange={(e) => setSocial({ ...social, youtube: e.target.value })} /></div>
        </div>
      </Section>

      <div className="flex justify-end">
        <button onClick={saveAll} disabled={saving} className="inline-flex items-center gap-2 h-11 px-6 rounded-lg bg-amber-500 text-slate-900 text-sm font-bold hover:bg-amber-400 disabled:opacity-50">
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} Save all settings
        </button>
      </div>
    </div>
  );
}

function Section({ icon: Icon, title, subtitle, children }: { icon: typeof Save; title: string; subtitle: string; children: React.ReactNode }) {
  return (
    <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 md:p-6">
      <div className="flex items-start gap-3 mb-5">
        <div className="w-10 h-10 rounded-lg bg-amber-50 text-amber-600 grid place-items-center"><Icon className="w-5 h-5" /></div>
        <div>
          <h2 className="text-base font-bold text-slate-900 dark:text-white">{title}</h2>
          <p className="text-xs text-slate-500 mt-0.5">{subtitle}</p>
        </div>
      </div>
      {children}
    </section>
  );
}
