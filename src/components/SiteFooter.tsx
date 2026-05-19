import { Link } from "@tanstack/react-router";
import { Phone, Mail, Instagram, Facebook, Youtube, ShieldCheck, Truck, RotateCcw, Headphones } from "lucide-react";

export function SiteFooter() {
  return (
    <footer className="mt-16 bg-card border-t border-border">
      {/* Service highlights */}
      <div className="border-b border-border">
        <div className="mx-auto max-w-7xl px-4 py-8 grid grid-cols-2 md:grid-cols-4 gap-6">
          {[
            { icon: Truck, title: "Fast Delivery", sub: "Across the country" },
            { icon: RotateCcw, title: "Easy Returns", sub: "7-day return policy" },
            { icon: ShieldCheck, title: "Genuine Products", sub: "100% authentic" },
            { icon: Headphones, title: "24/7 Support", sub: "Always here to help" },
          ].map((f) => (
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

      {/* Main footer */}
      <div className="mx-auto max-w-7xl px-4 py-10 grid gap-8 md:grid-cols-5">
        <div className="md:col-span-2">
          <h3 className="text-lg font-bold text-brand">VIP STAR</h3>
          <p className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground mt-1">Satellite & Electronics W.L.L</p>
          <p className="mt-3 text-sm text-muted-foreground max-w-sm">
            Your one-stop marketplace for IPTV, Satellite Dish, CCTV Cameras and professional installation services.
          </p>
          <p className="mt-3 text-xs text-muted-foreground">CR: 158814-1</p>
          <div className="mt-4 flex gap-2">
            <a href="#" aria-label="Facebook" className="w-9 h-9 grid place-items-center rounded-full bg-accent text-brand hover:bg-brand hover:text-white transition-smooth"><Facebook className="w-4 h-4" /></a>
            <a href="https://instagram.com/vipstar449" aria-label="Instagram" className="w-9 h-9 grid place-items-center rounded-full bg-accent text-brand hover:bg-brand hover:text-white transition-smooth"><Instagram className="w-4 h-4" /></a>
            <a href="#" aria-label="YouTube" className="w-9 h-9 grid place-items-center rounded-full bg-accent text-brand hover:bg-brand hover:text-white transition-smooth"><Youtube className="w-4 h-4" /></a>
          </div>
        </div>

        <div>
          <h4 className="text-sm font-semibold mb-3 text-foreground">Categories</h4>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li><Link to="/iptv" className="hover:text-brand">IPTV</Link></li>
            <li><Link to="/dish" className="hover:text-brand">Dish Antenna</Link></li>
            <li><Link to="/cctv" className="hover:text-brand">CCTV Cameras</Link></li>
            <li><Link to="/services" className="hover:text-brand">Installation</Link></li>
          </ul>
        </div>

        <div>
          <h4 className="text-sm font-semibold mb-3 text-foreground">Customer Care</h4>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li><Link to="/contact" className="hover:text-brand">Help Center</Link></li>
            <li><Link to="/contact" className="hover:text-brand">How to Buy</Link></li>
            <li><Link to="/services" className="hover:text-brand">Returns</Link></li>
            <li><Link to="/contact" className="hover:text-brand">Contact Us</Link></li>
          </ul>
        </div>

        <div>
          <h4 className="text-sm font-semibold mb-3 text-foreground">Contact</h4>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li className="flex items-center gap-2"><Phone className="w-4 h-4 text-brand" /><span>WhatsApp: 3316 1049</span></li>
            <li className="flex items-center gap-2"><Phone className="w-4 h-4 text-brand" /><span>Tel: 7708 2893</span></li>
            <li className="flex items-center gap-2"><Mail className="w-4 h-4 text-brand" /><span>pppahmed71@gmail.com</span></li>
          </ul>
        </div>
      </div>

      <div className="border-t border-border py-4 text-center text-xs text-muted-foreground">
        © {new Date().getFullYear()} VIP STAR Satellite & Electronics W.L.L — All rights reserved
      </div>
    </footer>
  );
}
