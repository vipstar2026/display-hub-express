import { Link } from "@tanstack/react-router";
import { Phone, Mail, Instagram, Facebook, Youtube, ShieldCheck, Truck, RotateCcw, Headphones } from "lucide-react";
import { useI18n } from "@/lib/i18n";

export function SiteFooter() {
  const { t } = useI18n();
  const features = [
    { icon: Truck, title: t("foot.fastDelivery"), sub: t("foot.fastDeliverySub") },
    { icon: RotateCcw, title: t("foot.returns"), sub: t("foot.returnsSub") },
    { icon: ShieldCheck, title: t("foot.genuine"), sub: t("foot.genuineSub") },
    { icon: Headphones, title: t("foot.support"), sub: t("foot.supportSub") },
  ];

  return (
    <footer className="mt-16 bg-card border-t border-border">
      <div className="border-b border-border">
        <div className="mx-auto max-w-7xl px-4 py-8 grid grid-cols-2 md:grid-cols-4 gap-6">
          {features.map((f) => (
            <div key={f.title} className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-full bg-accent grid place-items-center text-brand">
                <f.icon className="w-5 h-5" />
              </div>
              <div>
                <div className="text-sm font-semibold text-foreground">{f.title}</div>
                <div className="text-xs text-muted-foreground">{f.sub}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 py-10 grid gap-8 md:grid-cols-5">
        <div className="md:col-span-2">
          <h3 className="text-lg font-bold text-brand">VIP STAR</h3>
          <p className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground mt-1">{t("foot.brandSub")}</p>
          <p className="mt-3 text-sm text-muted-foreground max-w-sm">{t("foot.about")}</p>
          <p className="mt-3 text-xs text-muted-foreground">CR: 158814-1</p>
          <div className="mt-4 flex gap-2">
            <a href="#" aria-label="Facebook" className="w-9 h-9 grid place-items-center rounded-full bg-accent text-brand hover:bg-brand hover:text-white transition-smooth"><Facebook className="w-4 h-4" /></a>
            <a href="https://instagram.com/vipstar449" aria-label="Instagram" className="w-9 h-9 grid place-items-center rounded-full bg-accent text-brand hover:bg-brand hover:text-white transition-smooth"><Instagram className="w-4 h-4" /></a>
            <a href="#" aria-label="YouTube" className="w-9 h-9 grid place-items-center rounded-full bg-accent text-brand hover:bg-brand hover:text-white transition-smooth"><Youtube className="w-4 h-4" /></a>
          </div>
        </div>

        <div>
          <h4 className="text-sm font-semibold mb-3 text-foreground">{t("foot.cat")}</h4>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li><Link to="/iptv" className="hover:text-brand">{t("cat.iptv")}</Link></li>
            <li><Link to="/dish" className="hover:text-brand">{t("cat.dish")}</Link></li>
            <li><Link to="/cctv" className="hover:text-brand">{t("cat.cctv")}</Link></li>
            <li><Link to="/services" className="hover:text-brand">{t("cat.install")}</Link></li>
          </ul>
        </div>

        <div>
          <h4 className="text-sm font-semibold mb-3 text-foreground">{t("foot.care")}</h4>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li><Link to="/contact" className="hover:text-brand">{t("foot.help")}</Link></li>
            <li><Link to="/contact" className="hover:text-brand">{t("foot.howBuy")}</Link></li>
            <li><Link to="/services" className="hover:text-brand">{t("foot.returnsLink")}</Link></li>
            <li><Link to="/contact" className="hover:text-brand">{t("foot.contact")}</Link></li>
          </ul>
        </div>

        <div>
          <h4 className="text-sm font-semibold mb-3 text-foreground">{t("foot.contactTitle")}</h4>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li className="flex items-center gap-2"><Phone className="w-4 h-4 text-brand" /><span>WhatsApp: 3316 1049</span></li>
            <li className="flex items-center gap-2"><Phone className="w-4 h-4 text-brand" /><span>Tel: 7708 2893</span></li>
            <li className="flex items-center gap-2"><Mail className="w-4 h-4 text-brand" /><span>pppahmed71@gmail.com</span></li>
          </ul>
        </div>
      </div>

      <div className="border-t border-border py-4 text-center text-xs text-muted-foreground">
        © {new Date().getFullYear()} VIP STAR Satellite & Electronics W.L.L — {t("foot.rights")}
      </div>
    </footer>
  );
}
