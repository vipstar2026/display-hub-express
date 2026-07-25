import { createFileRoute } from "@tanstack/react-router";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { useI18n } from "@/lib/i18n";
import { Satellite, ShieldCheck, HeadphonesIcon, Tag, Award } from "lucide-react";

export const Route = createFileRoute("/about")({
  component: AboutPage,
  head: () => ({
    meta: [
      { title: "About VIPSTAR — Satellite & IPTV Experts in Bahrain" },
      { name: "description", content: "Learn about VIPSTAR — our story, mission and values as Bahrain's specialist Satellite & IPTV store." },
      { property: "og:title", content: "About VIPSTAR" },
      { property: "og:description", content: "Bahrain's specialist Satellite & IPTV store — genuine products, real Arabic support, transparent pricing." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
});

function AboutPage() {
  const { t } = useI18n();
  const values = [
    { icon: Award, label: t("about.v1") },
    { icon: HeadphonesIcon, label: t("about.v2") },
    { icon: Tag, label: t("about.v3") },
    { icon: ShieldCheck, label: t("about.v4") },
  ];

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main>
        {/* Hero */}
        <section className="relative overflow-hidden border-b border-primary/20 bg-gradient-to-br from-primary/10 via-background to-background py-20">
          <div className="container mx-auto px-4 text-center">
            <div className="mx-auto mb-5 grid h-16 w-16 place-items-center rounded-2xl bg-gradient-to-br from-primary to-primary/60 shadow-xl shadow-primary/30">
              <Satellite className="h-8 w-8 text-background" />
            </div>
            <h1 className="mb-4 bg-gradient-to-r from-primary to-primary/60 bg-clip-text font-display text-4xl font-bold text-transparent md:text-6xl">
              {t("about.title")}
            </h1>
            <p className="mx-auto max-w-2xl text-lg text-muted-foreground">{t("about.subtitle")}</p>
          </div>
        </section>

        {/* Story + Mission */}
        <section className="container mx-auto grid gap-8 px-4 py-16 md:grid-cols-2">
          <div className="rounded-2xl border border-primary/20 bg-card/50 p-8">
            <h2 className="mb-3 font-display text-2xl font-bold text-primary">{t("about.story")}</h2>
            <p className="leading-relaxed text-muted-foreground">{t("about.storyBody")}</p>
          </div>
          <div className="rounded-2xl border border-primary/20 bg-card/50 p-8">
            <h2 className="mb-3 font-display text-2xl font-bold text-primary">{t("about.mission")}</h2>
            <p className="leading-relaxed text-muted-foreground">{t("about.missionBody")}</p>
          </div>
        </section>

        {/* Values */}
        <section className="container mx-auto px-4 pb-20">
          <h2 className="mb-8 text-center font-display text-3xl font-bold">{t("about.values")}</h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {values.map((v) => (
              <div key={v.label} className="group rounded-2xl border border-primary/15 bg-card/40 p-6 text-center transition hover:-translate-y-1 hover:border-primary/40 hover:shadow-lg hover:shadow-primary/10">
                <div className="mx-auto mb-3 grid h-12 w-12 place-items-center rounded-xl bg-primary/10 text-primary transition group-hover:bg-primary group-hover:text-background">
                  <v.icon className="h-6 w-6" />
                </div>
                <div className="font-medium">{v.label}</div>
              </div>
            ))}
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
