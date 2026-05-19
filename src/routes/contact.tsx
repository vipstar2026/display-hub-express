import { createFileRoute } from "@tanstack/react-router";
import { PageShell } from "@/components/PageShell";
import { useI18n } from "@/lib/i18n";
import { Phone, Mail, MapPin, Clock, MessageCircle } from "lucide-react";
import heroImg from "@/assets/hero.jpg";

export const Route = createFileRoute("/contact")({
  head: () => ({
    meta: [
      { title: "Contact — VIP STAR" },
      { name: "description", content: "WhatsApp, phone, email and showroom address." },
      { property: "og:image", content: heroImg },
    ],
  }),
  component: ContactPage,
});

function ContactPage() {
  const { t } = useI18n();
  const info = [
    { icon: MessageCircle, label: t("ct.whatsapp"), value: "3316 1049" },
    { icon: Phone, label: t("ct.phone"), value: "7708 2893" },
    { icon: Mail, label: t("ct.email"), value: "pppahmed71@gmail.com" },
    { icon: MapPin, label: t("ct.instagram"), value: "@vipstar449" },
    { icon: Clock, label: t("ct.hours"), value: t("ct.hoursVal") },
  ];

  return (
    <PageShell>
      <section className="mx-auto max-w-7xl px-4 py-4">
        <div className="relative rounded-md overflow-hidden bg-gradient-brand h-[200px] md:h-[260px] shadow-card">
          <img src={heroImg} alt="" className="absolute inset-0 w-full h-full object-cover opacity-40" />
          <div className="relative h-full p-6 md:p-10 flex flex-col justify-center text-white">
            <h1 className="text-2xl md:text-4xl font-extrabold">{t("ct.title")}</h1>
            <p className="mt-2 text-sm md:text-base text-white/90 max-w-2xl">{t("ct.sub")}</p>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 mt-6 mb-10 grid gap-5 md:grid-cols-2">
        <div className="space-y-3">
          {info.map((i) => (
            <div key={i.label} className="bg-card rounded-md border border-border shadow-card p-4 flex items-center gap-4">
              <div className="w-11 h-11 rounded-full bg-accent grid place-items-center text-brand shrink-0">
                <i.icon className="w-5 h-5" />
              </div>
              <div>
                <div className="text-xs uppercase tracking-wider text-muted-foreground">{i.label}</div>
                <div className="text-base font-semibold text-foreground">{i.value}</div>
              </div>
            </div>
          ))}
        </div>

        <form
          className="bg-card rounded-md border border-border shadow-card p-5 space-y-4 h-fit"
          onSubmit={(e) => { e.preventDefault(); alert(t("ct.thanks")); }}
        >
          <h3 className="text-lg font-bold text-foreground">{t("ct.formTitle")}</h3>
          <div>
            <label className="text-sm text-muted-foreground">{t("ct.name")}</label>
            <input required className="mt-1 w-full px-4 py-2.5 rounded-md border border-border focus:border-brand outline-none transition-smooth bg-white text-foreground" />
          </div>
          <div>
            <label className="text-sm text-muted-foreground">{t("ct.phoneLabel")}</label>
            <input required type="tel" className="mt-1 w-full px-4 py-2.5 rounded-md border border-border focus:border-brand outline-none transition-smooth bg-white text-foreground" />
          </div>
          <div>
            <label className="text-sm text-muted-foreground">{t("ct.message")}</label>
            <textarea required rows={4} className="mt-1 w-full px-4 py-2.5 rounded-md border border-border focus:border-brand outline-none transition-smooth bg-white text-foreground" />
          </div>
          <button type="submit" className="w-full h-11 rounded-md bg-brand hover:bg-brand-dark text-white font-semibold transition-smooth">
            {t("ct.send")}
          </button>
        </form>
      </section>
    </PageShell>
  );
}
