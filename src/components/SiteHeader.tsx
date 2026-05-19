import { Link } from "@tanstack/react-router";
import { Search, ShoppingCart, User, Heart, Bell, Globe, ChevronDown, Menu } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import logo from "@/assets/logo.png";
import { LANGS, useI18n, type Lang } from "@/lib/i18n";
import { useCart } from "@/lib/cart";

export function SiteHeader() {
  const [open, setOpen] = useState(false);
  const [langOpen, setLangOpen] = useState(false);
  const { lang, setLang, t } = useI18n();
  const { count } = useCart();
  const langRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (langRef.current && !langRef.current.contains(e.target as Node)) setLangOpen(false);
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  const categories = [
    { name: t("nav.iptv"), to: "/iptv" as const },
    { name: t("nav.dish"), to: "/dish" as const },
    { name: t("nav.cctv"), to: "/cctv" as const },
    { name: t("nav.installation"), to: "/services" as const },
    { name: t("nav.accessories"), to: "/iptv" as const },
    { name: t("nav.smartTv"), to: "/iptv" as const },
    { name: t("nav.receivers"), to: "/dish" as const },
    { name: t("nav.cables"), to: "/dish" as const },
  ];

  const currentLang = LANGS.find((l) => l.code === lang)!;

  return (
    <header className="sticky top-0 z-50 bg-card shadow-card">
      {/* Top utility strip */}
      <div className="bg-gradient-topbar text-white text-xs">
        <div className="mx-auto max-w-7xl px-4 h-8 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <span className="hidden sm:inline">{t("top.saveApp")}</span>
            <span className="hidden md:inline opacity-70">|</span>
            <Link to="/services" className="hidden md:inline hover:underline">{t("top.becomeSeller")}</Link>
            <span className="hidden md:inline opacity-70">|</span>
            <span className="hidden md:inline">{t("top.help")}</span>
          </div>
          <div className="flex items-center gap-3">
            <button className="flex items-center gap-1 hover:underline"><Bell className="w-3 h-3" /> {t("top.notifications")}</button>
            <span className="opacity-70">|</span>
            <div className="relative" ref={langRef}>
              <button
                onClick={() => setLangOpen((v) => !v)}
                className="flex items-center gap-1 hover:underline"
                aria-haspopup="menu"
                aria-expanded={langOpen}
              >
                <Globe className="w-3 h-3" /> {currentLang.label} <ChevronDown className="w-3 h-3" />
              </button>
              {langOpen && (
                <div className="absolute end-0 mt-1 w-32 rounded-md bg-card shadow-card border border-border text-foreground overflow-hidden z-50">
                  {LANGS.map((l) => (
                    <button
                      key={l.code}
                      onClick={() => { setLang(l.code as Lang); setLangOpen(false); }}
                      className={`w-full text-start px-3 py-2 text-xs hover:bg-accent transition-smooth ${l.code === lang ? "bg-accent text-brand font-semibold" : ""}`}
                    >
                      {l.native}
                    </button>
                  ))}
                </div>
              )}
            </div>
            <span className="opacity-70 hidden sm:inline">|</span>
            <Link to="/contact" className="hidden sm:inline hover:underline">{t("top.login")}</Link>
            <Link to="/contact" className="hidden sm:inline hover:underline">{t("top.signup")}</Link>
          </div>
        </div>
      </div>

      {/* Main header */}
      <div className="border-b border-border">
        <div className="mx-auto max-w-7xl px-4 h-16 flex items-center gap-4">
          <Link to="/" className="flex items-center gap-2 shrink-0">
            <img src={logo} alt="VIP STAR" className="h-10 w-auto" />
            <span className="hidden sm:flex flex-col leading-tight">
              <span className="text-base font-bold text-brand">VIP STAR</span>
              <span className="text-[10px] text-muted-foreground uppercase tracking-wider">{t("header.tagline")}</span>
            </span>
          </Link>

          <form className="flex-1 max-w-2xl mx-auto">
            <div className="flex items-stretch h-10 rounded-md border-2 border-brand overflow-hidden bg-white">
              <input
                type="search"
                placeholder={t("header.searchPlaceholder")}
                className="flex-1 px-4 text-sm outline-none text-foreground placeholder:text-muted-foreground"
              />
              <button type="submit" className="bg-brand hover:bg-brand-dark text-brand-foreground px-5 transition-smooth">
                <Search className="w-5 h-5" />
              </button>
            </div>
          </form>

          <div className="flex items-center gap-2 sm:gap-4 shrink-0">
            <Link to="/wishlist" className="hidden sm:flex flex-col items-center text-foreground hover:text-brand transition-smooth">
              <Heart className="w-5 h-5" />
              <span className="text-[10px] mt-0.5">{t("header.wishlist")}</span>
            </Link>
            <Link to="/contact" className="hidden sm:flex flex-col items-center text-foreground hover:text-brand transition-smooth">
              <User className="w-5 h-5" />
              <span className="text-[10px] mt-0.5">{t("header.account")}</span>
            </Link>
            <Link to="/cart" className="relative flex flex-col items-center text-foreground hover:text-brand transition-smooth">
              <div className="relative">
                <ShoppingCart className="w-5 h-5" />
                <span className="absolute -top-2 -end-2 bg-sale text-white text-[10px] rounded-full min-w-4 h-4 px-1 grid place-items-center font-bold">{count}</span>
              </div>
              <span className="text-[10px] mt-0.5">{t("header.cart")}</span>
            </Link>
            <button onClick={() => setOpen((v) => !v)} className="md:hidden text-foreground">
              <Menu className="w-6 h-6" />
            </button>
          </div>
        </div>
      </div>

      {/* Category nav */}
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
