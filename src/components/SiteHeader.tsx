import { Link } from "@tanstack/react-router";
import { Search, ShoppingCart, User, Heart, Bell, Globe, ChevronDown, Menu } from "lucide-react";
import { useState } from "react";
import logo from "@/assets/logo.png";

const categories = [
  { name: "IPTV", to: "/iptv" },
  { name: "Dish Antenna", to: "/dish" },
  { name: "CCTV Cameras", to: "/cctv" },
  { name: "Installation", to: "/services" },
  { name: "Accessories", to: "/iptv" },
  { name: "Smart TV", to: "/iptv" },
  { name: "Receivers", to: "/dish" },
  { name: "Cables & Wires", to: "/dish" },
];

export function SiteHeader() {
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 bg-card shadow-card">
      {/* Top utility strip */}
      <div className="bg-gradient-topbar text-white text-xs">
        <div className="mx-auto max-w-7xl px-4 h-8 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <span className="hidden sm:inline">Save More on App</span>
            <span className="hidden md:inline opacity-70">|</span>
            <Link to="/services" className="hidden md:inline hover:underline">Become a Seller</Link>
            <span className="hidden md:inline opacity-70">|</span>
            <span className="hidden md:inline">Help & Support</span>
          </div>
          <div className="flex items-center gap-3">
            <button className="flex items-center gap-1 hover:underline"><Bell className="w-3 h-3" /> Notifications</button>
            <span className="opacity-70">|</span>
            <button className="flex items-center gap-1 hover:underline"><Globe className="w-3 h-3" /> EN <ChevronDown className="w-3 h-3" /></button>
            <span className="opacity-70 hidden sm:inline">|</span>
            <Link to="/contact" className="hidden sm:inline hover:underline">Login</Link>
            <Link to="/contact" className="hidden sm:inline hover:underline">Sign Up</Link>
          </div>
        </div>
      </div>

      {/* Main header: logo + search + cart */}
      <div className="border-b border-border">
        <div className="mx-auto max-w-7xl px-4 h-16 flex items-center gap-4">
          <Link to="/" className="flex items-center gap-2 shrink-0">
            <img src={logo} alt="VIP STAR" className="h-10 w-auto" />
            <span className="hidden sm:flex flex-col leading-tight">
              <span className="text-base font-bold text-brand">VIP STAR</span>
              <span className="text-[10px] text-muted-foreground uppercase tracking-wider">Marketplace</span>
            </span>
          </Link>

          {/* Search */}
          <form className="flex-1 max-w-2xl mx-auto">
            <div className="flex items-stretch h-10 rounded-md border-2 border-brand overflow-hidden bg-white">
              <input
                type="search"
                placeholder="Search in VIP STAR"
                className="flex-1 px-4 text-sm outline-none text-foreground placeholder:text-muted-foreground"
              />
              <button type="submit" className="bg-brand hover:bg-brand-dark text-brand-foreground px-5 transition-smooth">
                <Search className="w-5 h-5" />
              </button>
            </div>
          </form>

          {/* Right icons */}
          <div className="flex items-center gap-2 sm:gap-4 shrink-0">
            <button className="hidden sm:flex flex-col items-center text-foreground hover:text-brand transition-smooth">
              <Heart className="w-5 h-5" />
              <span className="text-[10px] mt-0.5">Wishlist</span>
            </button>
            <Link to="/contact" className="hidden sm:flex flex-col items-center text-foreground hover:text-brand transition-smooth">
              <User className="w-5 h-5" />
              <span className="text-[10px] mt-0.5">Account</span>
            </Link>
            <button className="relative flex flex-col items-center text-foreground hover:text-brand transition-smooth">
              <div className="relative">
                <ShoppingCart className="w-5 h-5" />
                <span className="absolute -top-2 -right-2 bg-sale text-white text-[10px] rounded-full w-4 h-4 grid place-items-center font-bold">0</span>
              </div>
              <span className="text-[10px] mt-0.5">Cart</span>
            </button>
            <button onClick={() => setOpen((v) => !v)} className="md:hidden text-foreground">
              <Menu className="w-6 h-6" />
            </button>
          </div>
        </div>
      </div>

      {/* Category nav strip */}
      <nav className="hidden md:block border-b border-border bg-card">
        <div className="mx-auto max-w-7xl px-4 h-11 flex items-center gap-1 overflow-x-auto">
          {categories.map((c) => (
            <Link
              key={c.name}
              to={c.to}
              className="text-sm font-medium text-foreground/80 hover:text-brand px-3 py-1.5 rounded-md hover:bg-accent transition-smooth whitespace-nowrap"
              activeProps={{ className: "text-brand bg-accent" }}
            >
              {c.name}
            </Link>
          ))}
        </div>
      </nav>

      {/* Mobile menu */}
      {open && (
        <div className="md:hidden border-t border-border bg-card">
          <div className="px-4 py-3 flex flex-col gap-1">
            {categories.map((c) => (
              <Link key={c.name} to={c.to} onClick={() => setOpen(false)} className="text-sm py-2 px-3 rounded-md hover:bg-accent text-foreground">
                {c.name}
              </Link>
            ))}
          </div>
        </div>
      )}
    </header>
  );
}
