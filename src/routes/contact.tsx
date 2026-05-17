import { createFileRoute } from "@tanstack/react-router";
import { PageShell, PageHero } from "@/components/PageShell";
import { Phone, Mail, MapPin, Clock, MessageCircle } from "lucide-react";

export const Route = createFileRoute("/contact")({
  head: () => ({
    meta: [
      { title: "যোগাযোগ — VIP STAR" },
      { name: "description", content: "VIP STAR Satellite & Electronics — WhatsApp, ফোন ও শোরুমের ঠিকানা।" },
      { property: "og:title", content: "যোগাযোগ — VIP STAR" },
    ],
  }),
  component: ContactPage,
});

const info = [
  { icon: MessageCircle, label: "WhatsApp", value: "3316 1049" },
  { icon: Phone, label: "ফোন", value: "7708 2893" },
  { icon: Mail, label: "ইমেইল", value: "pppahmed71@gmail.com" },
  { icon: MapPin, label: "Instagram", value: "@vipstar449" },
  { icon: Clock, label: "খোলা থাকে", value: "প্রতিদিন সকাল ৯টা — রাত ১০টা" },
];

function ContactPage() {
  return (
    <PageShell>
      <PageHero
        eyebrow="যোগাযোগ"
        title="আমরা শুনছি — আপনার প্রয়োজন বলুন"
        subtitle="ফোন, WhatsApp বা সরাসরি শোরুমে এসে যেকোনো পণ্য বা সেবা সম্পর্কে জানুন।"
      />
      <section className="mx-auto max-w-7xl px-6 py-16 grid gap-8 md:grid-cols-2">
        <div className="space-y-4">
          {info.map((i) => (
            <div key={i.label} className="flex items-center gap-4 p-5 rounded-xl bg-gradient-card border border-border shadow-card">
              <div className="w-11 h-11 rounded-lg bg-gradient-primary grid place-items-center shadow-glow shrink-0">
                <i.icon className="w-5 h-5 text-primary-foreground" />
              </div>
              <div>
                <div className="text-xs uppercase tracking-wider text-muted-foreground">{i.label}</div>
                <div className="text-lg font-display font-semibold">{i.value}</div>
              </div>
            </div>
          ))}
        </div>
        <form
          className="rounded-2xl p-7 bg-gradient-card border border-border shadow-card space-y-4"
          onSubmit={(e) => {
            e.preventDefault();
            alert("ধন্যবাদ! আমরা শীঘ্রই যোগাযোগ করব।");
          }}
        >
          <h3 className="text-xl font-display font-semibold">দ্রুত মেসেজ পাঠান</h3>
          <div>
            <label className="text-sm text-muted-foreground">নাম</label>
            <input required className="mt-1 w-full px-4 py-3 rounded-lg bg-input border border-border focus:border-primary outline-none transition-smooth" />
          </div>
          <div>
            <label className="text-sm text-muted-foreground">ফোন নম্বর</label>
            <input required type="tel" className="mt-1 w-full px-4 py-3 rounded-lg bg-input border border-border focus:border-primary outline-none transition-smooth" />
          </div>
          <div>
            <label className="text-sm text-muted-foreground">কী প্রয়োজন?</label>
            <textarea required rows={4} className="mt-1 w-full px-4 py-3 rounded-lg bg-input border border-border focus:border-primary outline-none transition-smooth" />
          </div>
          <button type="submit" className="w-full py-3 rounded-lg bg-gradient-primary text-primary-foreground font-medium shadow-glow hover:opacity-90 transition-smooth">
            পাঠিয়ে দিন
          </button>
        </form>
      </section>
    </PageShell>
  );
}
