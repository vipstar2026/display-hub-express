import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { useI18n } from "@/lib/i18n";
import { getPolicy, COMPANY, type PolicyKey } from "@/lib/policies";
import { ScrollText } from "lucide-react";

export function PolicyPage({ policyKey }: { policyKey: PolicyKey }) {
  const { lang } = useI18n();
  const doc = getPolicy(policyKey, lang);
  const dir = lang === "ar" || lang === "ur" ? "rtl" : "ltr";

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 py-12" dir={dir}>
        <article className="mx-auto max-w-3xl">
          <header className="mb-10 text-center">
            <ScrollText className="mx-auto mb-3 h-10 w-10 text-primary" />
            <h1 className="bg-gradient-to-r from-primary to-primary/60 bg-clip-text font-display text-3xl font-bold text-transparent md:text-4xl">
              {doc.title}
            </h1>
            <p className="mt-2 text-xs text-muted-foreground">
              {lang === "ar" ? COMPANY.name_ar : COMPANY.name_en} — {COMPANY.cr}
            </p>
          </header>

          {doc.intro && (
            <p className="mb-8 rounded-xl border border-primary/15 bg-card/40 p-5 text-sm leading-relaxed text-muted-foreground">
              {doc.intro}
            </p>
          )}

          <div className="space-y-8">
            {doc.sections.map((s) => (
              <section key={s.heading}>
                <h2 className="mb-3 font-display text-lg font-semibold text-primary">{s.heading}</h2>
                <div className="space-y-3">
                  {s.body.map((p, i) => (
                    <p key={i} className="text-sm leading-relaxed text-muted-foreground">{p}</p>
                  ))}
                </div>
              </section>
            ))}
          </div>

          <div className="mt-12 rounded-xl border border-primary/15 bg-card/40 p-5 text-sm text-muted-foreground">
            <p className="mb-1 font-semibold text-foreground">
              {lang === "ar" ? "للتواصل" : "Contact us"}
            </p>
            <p>{lang === "ar" ? COMPANY.address_ar : COMPANY.address_en}</p>
            <p dir="ltr" className={dir === "rtl" ? "text-right" : ""}>
              {COMPANY.phone} · {COMPANY.whatsapp} · {COMPANY.email}
            </p>
          </div>
        </article>
      </main>
      <Footer />
    </div>
  );
}
