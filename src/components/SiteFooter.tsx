import { Link } from "@tanstack/react-router";
import { Phone, MapPin, Mail } from "lucide-react";

export function SiteFooter() {
  return (
    <footer className="mt-24 border-t border-border bg-card/40">
      <div className="mx-auto max-w-7xl px-6 py-12 grid gap-10 md:grid-cols-4">
        <div className="md:col-span-2">
          <h3 className="text-xl font-display font-bold text-gradient">VIP STAR</h3>
          <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground mt-1">Satellite & Electronics W.L.L</p>
          <p className="mt-3 text-sm text-muted-foreground max-w-sm">
            IPTV, ডিশ অ্যান্টেনা ও CCTV ক্যামেরার এক জায়গায় সমাধান। বিশ্বস্ত পণ্য, পেশাদার ইনস্টলেশন।
          </p>
          <p className="mt-3 text-xs text-muted-foreground">CR: 158814-1</p>
        </div>
        <div>
          <h4 className="text-sm font-semibold mb-3">দ্রুত লিংক</h4>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li><Link to="/iptv" className="hover:text-foreground">IPTV</Link></li>
            <li><Link to="/dish" className="hover:text-foreground">ডিশ অ্যান্টেনা</Link></li>
            <li><Link to="/cctv" className="hover:text-foreground">CCTV ক্যামেরা</Link></li>
            <li><Link to="/services" className="hover:text-foreground">ইনস্টলেশন</Link></li>
          </ul>
        </div>
        <div>
          <h4 className="text-sm font-semibold mb-3">যোগাযোগ</h4>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li className="flex items-center gap-2"><Phone className="w-4 h-4 text-primary" /> WhatsApp: 3316 1049</li>
            <li className="flex items-center gap-2"><Phone className="w-4 h-4 text-primary" /> Tel: 7708 2893</li>
            <li className="flex items-center gap-2"><Mail className="w-4 h-4 text-primary" /> pppahmed71@gmail.com</li>
            <li className="flex items-center gap-2"><MapPin className="w-4 h-4 text-primary" /> Instagram: @vipstar449</li>
          </ul>
        </div>
      </div>
      <div className="border-t border-border py-5 text-center text-xs text-muted-foreground">
        © {new Date().getFullYear()} VIP STAR Satellite & Electronics W.L.L — সর্বস্বত্ব সংরক্ষিত
      </div>
    </footer>
  );
}
