import { createFileRoute, Link } from "@tanstack/react-router";
import { PageShell } from "@/components/PageShell";
import { useI18n } from "@/lib/i18n";
import { Wrench, Settings, RefreshCw, ShieldCheck } from "lucide-react";
import heroImg from "@/assets/hero.jpg";

export const Route = createFileRoute("/services")({
  head: () => ({
    meta: [
      { title: "Installation & Service — VIP STAR" },
      { name: "description", content: "Professional installation, configuration, repair and maintenance." },
      { property: "og:image", content: heroImg },
    ],
  }),
  component: ServicesPage,
});

function ServicesPage() {
  const { t } = useI18n();
  const services = [
    { icon: Wrench, key: "s1" },
    { icon: Settings, key: "s2" },
    { icon: RefreshCw, key: "s3" },
    { icon: ShieldCheck, key: "s4" },
  ] as const;

  return (
    <PageShell>
      <section className="mx-auto max-w-7xl px-4 py-4">
        <div className="relative rounded-md overflow-hidden bg-gradient-brand h-[200px] md:h-[260px] shadow-card">
          <img src={heroImg} alt="" className="absolute inset-0 w-full h-full object-cover opacity-40" />
          <div className="relative h-full p-6 md:p-10 flex flex-col justify-center text-white">
            <h1 className="text-2xl md:text-4xl font-extrabold">{t("svc.pageTitle")}</h1>
            <p className="mt-2 text-sm md:text-base text-white/90 max-w-2xl">{t("svc.pageSub")}</p>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 mt-6 mb-10">
        <div className="grid gap-4 md:grid-cols-2">
          {services.map((s) => (
            <div key={s.key} className="bg-card rounded-md border border-border shadow-card p-5 hover:border-brand transition-smooth">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-full bg-gradient-brand grid place-items-center text-white shrink-0">
                  <s.icon className="w-6 h-6" />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-bold text-foreground">{t(`svc.${s.key}.t`)}</h3>
                  <p className="mt-1 text-sm text-muted-foreground">{t(`svc.${s.key}.d`)}</p>
                  <div className="mt-4 flex items-center justify-between">
                    <span className="text-sm font-bold text-sale">{t(`svc.${s.key}.p`)}</span>
                    <Link to="/contact" className="px-4 py-2 rounded-md bg-brand hover:bg-brand-dark text-white text-sm font-semibold transition-smooth">
                      {t("svc.bookNow")}
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>
    </PageShell>
  );
}
