import { Link } from "@tanstack/react-router";
import { useState } from "react";
import { Menu, X } from "lucide-react";
import logo from "@/assets/logo.png";

const nav = [
  { to: "/", label: "হোম" },
  { to: "/iptv", label: "IPTV" },
  { to: "/dish", label: "ডিশ" },
  { to: "/cctv", label: "CCTV" },
  { to: "/services", label: "সার্ভিস" },
  { to: "/contact", label: "যোগাযোগ" },
] as const;

export function SiteHeader() {
  const [open, setOpen] = useState(false);
  return (
    <header className="sticky top-0 z-50 glass">
      <div className="mx-auto max-w-7xl px-6 h-16 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-3 font-display font-bold">
          <img src={logo} alt="VIP STAR logo" width={40} height={40} className="w-10 h-10 object-contain drop-shadow-[0_0_12px_rgba(255,80,80,0.45)]" />
          <span className="leading-tight">
            <span className="block text-lg text-gradient">VIP STAR</span>
            <span className="block text-[10px] uppercase tracking-[0.2em] text-muted-foreground">Satellite & Electronics</span>
          </span>
        </Link>
        <nav className="hidden md:flex items-center gap-1">
          {nav.map((n) => (
            <Link
              key={n.to}
              to={n.to}
              className="px-3 py-2 text-sm rounded-md text-muted-foreground hover:text-foreground hover:bg-secondary transition-smooth"
              activeProps={{ className: "px-3 py-2 text-sm rounded-md text-foreground bg-secondary" }}
            >
              {n.label}
            </Link>
          ))}
        </nav>
        <Link
          to="/contact"
          className="hidden md:inline-flex items-center px-4 py-2 rounded-md bg-gradient-primary text-primary-foreground text-sm font-medium shadow-glow hover:opacity-90 transition-smooth"
        >
          অর্ডার করুন
        </Link>
        <button className="md:hidden text-foreground" onClick={() => setOpen(!open)} aria-label="Menu">
          {open ? <X /> : <Menu />}
        </button>
      </div>
      {open && (
        <div className="md:hidden border-t border-border px-6 py-4 flex flex-col gap-2 bg-card">
          {nav.map((n) => (
            <Link key={n.to} to={n.to} onClick={() => setOpen(false)} className="py-2 text-sm">
              {n.label}
            </Link>
          ))}
        </div>
      )}
    </header>
  );
}
