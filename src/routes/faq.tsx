import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { useI18n } from "@/lib/i18n";
import { ChevronDown, HelpCircle } from "lucide-react";

export const Route = createFileRoute("/faq")({
  component: FAQPage,
  head: () => ({
    meta: [
      { title: "FAQ — VIPSTAR Satellite & IPTV Bahrain" },
      { name: "description", content: "Answers to common VIPSTAR questions: delivery times, taxes, payment methods, tracking, warranty, returns." },
      { property: "og:title", content: "VIPSTAR — Frequently Asked Questions" },
      { property: "og:description", content: "Delivery, payment, warranty and return policy answers for VIPSTAR customers in Bahrain." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
});

function FAQPage() {
  const { t } = useI18n();
  const items = [1, 2, 3, 4, 5, 6].map((n) => ({ q: t(`faq.q${n}` as any), a: t(`faq.a${n}` as any) }));

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: items.map((it) => ({
      "@type": "Question",
      name: it.q,
      acceptedAnswer: { "@type": "Answer", text: it.a },
    })),
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 py-12">
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
        <div className="mx-auto max-w-3xl">
          <div className="mb-10 text-center">
            <HelpCircle className="mx-auto mb-3 h-10 w-10 text-primary" />
            <h1 className="mb-3 bg-gradient-to-r from-primary to-primary/60 bg-clip-text font-display text-4xl font-bold text-transparent md:text-5xl">
              {t("faq.title")}
            </h1>
            <p className="text-muted-foreground">{t("faq.subtitle")}</p>
          </div>

          <div className="space-y-3">
            {items.map((it, i) => (
              <FaqItem key={i} q={it.q} a={it.a} defaultOpen={i === 0} />
            ))}
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}

function FaqItem({ q, a, defaultOpen }: { q: string; a: string; defaultOpen?: boolean }) {
  const [open, setOpen] = useState(!!defaultOpen);
  return (
    <div className="overflow-hidden rounded-xl border border-primary/15 bg-card/40 transition hover:border-primary/30">
      <button type="button" onClick={() => setOpen((v) => !v)} className="flex w-full items-center gap-3 px-5 py-4 text-start">
        <span className="flex-1 font-medium">{q}</span>
        <ChevronDown className={`h-4 w-4 text-primary transition-transform ${open ? "rotate-180" : ""}`} />
      </button>
      {open && <div className="border-t border-primary/10 px-5 py-4 text-sm leading-relaxed text-muted-foreground">{a}</div>}
    </div>
  );
}
