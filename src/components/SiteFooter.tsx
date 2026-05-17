import { Link } from "@tanstack/react-router";
import { Phone, MapPin, Mail } from "lucide-react";

export function SiteFooter() {
  return (
    <footer className="mt-24 border-t border-border bg-card/40">
      <div className="mx-auto max-w-7xl px-6 py-12 grid gap-10 md:grid-cols-4">
        <div className="md:col-span-2">
          <h3 className="text-xl font-display font-bold text-gradient">SignalHub</h3>
          <p className="mt-3 text-sm text-muted-foreground max-w-sm">
            IPTV, ডিশ অ্যান্টেনা ও CCTV ক্যামেরার এক জায়গায় সমাধান। বিশ্বস্ত পণ্য, পেশাদার ইনস্টলেশন।
          </p>
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
            <li className="flex items-center gap-2"><Phone className="w-4 h-4 text-primary" /> 01XXX-XXXXXX</li>
            <li className="flex items-center gap-2"><Mail className="w-4 h-4 text-primary" /> info@signalhub.bd</li>
            <li className="flex items-center gap-2"><MapPin className="w-4 h-4 text-primary" /> ঢাকা, বাংলাদেশ</li>
          </ul>
        </div>
      </div>
      <div className="border-t border-border py-5 text-center text-xs text-muted-foreground">
        © {new Date().getFullYear()} SignalHub — সর্বস্বত্ব সংরক্ষিত
      </div>
    </footer>
  );
}
