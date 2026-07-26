import { Link } from "@tanstack/react-router";
import { Satellite, Mail, Phone, MessageCircle, MapPin } from "lucide-react";
import { useI18n } from "@/lib/i18n";
import { NewsletterSignup } from "./NewsletterSignup";
import { cleanPhoneNumber, pickLocalized, useSiteSettings } from "@/lib/site-settings";

export function Footer() {
  const { t, lang } = useI18n();
  const { data: s } = useSiteSettings();
  const tagline = pickLocalized(lang, { ar: s?.tagline_ar, en: s?.tagline_en, ur: s?.tagline_ur }) || t("site.tagline");

  const nav = [
    { to: "/", label: t("nav.home") },
    { to: "/shop", label: t("nav.shop") },
    { to: "/track", label: t("nav.track") },
    { to: "/about", label: t("nav.about") },
    { to: "/faq", label: t("nav.faq") },
    { to: "/contact", label: t("nav.contact") },
  ];

  return (
    <footer className="mt-20 border-t border-primary/20 bg-card/40">
      <div className="container mx-auto grid gap-10 px-4 py-12 md:grid-cols-5">
        <div className="md:col-span-1">
          <div className="mb-3 flex items-center gap-2 font-display text-lg font-bold text-primary">
            <Satellite className="h-5 w-5" /> {s?.site_name ?? "VIPSTAR"}
          </div>
          <p className="text-sm text-muted-foreground">{tagline}</p>
          {s?.company_cr && <p className="mt-2 text-xs text-muted-foreground">CR: {s.company_cr}</p>}
        </div>

        <div>
          <h4 className="mb-3 text-xs font-semibold uppercase tracking-wider text-primary">{t("footer.pages")}</h4>
          <ul className="space-y-2 text-sm">
            {nav.map((l) => (
              <li key={l.to}>
                <Link to={l.to} className="text-muted-foreground transition hover:text-primary">{l.label}</Link>
              </li>
            ))}
          </ul>
        </div>

        <div className="md:col-span-2">
          <h4 className="mb-3 text-xs font-semibold uppercase tracking-wider text-primary">{t("footer.contact")}</h4>
          <ul className="space-y-2 text-sm text-muted-foreground">
            {s?.contact_email && (
              <li><a href={`mailto:${s.contact_email}`} className="inline-flex items-center gap-2 hover:text-primary"><Mail className="h-4 w-4" /> {s.contact_email}</a></li>
            )}
            {s?.contact_phone && (
              <li><a href={`tel:${s.contact_phone}`} className="inline-flex items-center gap-2 hover:text-primary"><Phone className="h-4 w-4" /> {s.contact_phone}</a></li>
            )}
            {s?.whatsapp && (
              <li><a href={`https://wa.me/${cleanPhoneNumber(s.whatsapp)}`} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 hover:text-primary"><MessageCircle className="h-4 w-4" /> {s.whatsapp}</a></li>
            )}
            {s?.company_address && (
              <li className="inline-flex items-start gap-2"><MapPin className="mt-0.5 h-4 w-4 shrink-0" /> {s.company_address}</li>
            )}
          </ul>
        </div>

        <div className="md:col-span-2">
          <NewsletterSignup />
        </div>
      </div>

      <div className="border-t border-primary/10 py-4 text-center text-xs text-muted-foreground">
        © {new Date().getFullYear()} {s?.site_name ?? "VIPSTAR"} — {t("footer.rights")}
      </div>
    </footer>
  );
}
