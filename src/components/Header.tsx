import { Link } from "@tanstack/react-router";
import { ShoppingCart, User, Menu, X, Globe, Satellite } from "lucide-react";
import { useEffect, useState } from "react";
import { useI18n, type Lang } from "@/lib/i18n";
import { useCart } from "@/lib/cart";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

export function Header() {
  const { t, lang, setLang } = useI18n();
  const { count } = useCart();
  const [open, setOpen] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUserId(data.user?.id ?? null));
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => setUserId(s?.user?.id ?? null));
    return () => sub.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!userId) { setIsAdmin(false); return; }
    supabase.from("user_roles").select("role").eq("user_id", userId).eq("role", "admin").maybeSingle()
      .then(({ data }) => setIsAdmin(!!data));
  }, [userId]);

  const links = [
    { to: "/", label: t("nav.home") },
    { to: "/shop", label: t("nav.shop") },
  ];

  return (
    <header className="sticky top-0 z-50 border-b border-cyan-500/20 bg-background/80 backdrop-blur-xl">
      <div className="container mx-auto flex h-16 items-center gap-4 px-4">
        <Link to="/" className="flex items-center gap-2 font-display text-lg font-bold">
          <Satellite className="h-6 w-6 text-cyan-400" />
          <span className="bg-gradient-to-r from-cyan-400 to-cyan-200 bg-clip-text text-transparent">VIPSTAR</span>
        </Link>

        <nav className="hidden flex-1 items-center gap-6 md:flex">
          {links.map((l) => (
            <Link key={l.to} to={l.to} className="text-sm font-medium text-foreground/80 transition hover:text-cyan-400">
              {l.label}
            </Link>
          ))}
        </nav>

        <div className="ms-auto flex items-center gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" aria-label="Language">
                <Globe className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {(["ar", "en", "ur"] as Lang[]).map((l) => (
                <DropdownMenuItem key={l} onClick={() => setLang(l)} className={lang === l ? "bg-cyan-500/10 text-cyan-400" : ""}>
                  {l === "ar" ? "العربية" : l === "en" ? "English" : "اردو"}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          <Link to="/cart" className="relative">
            <Button variant="ghost" size="icon" aria-label="Cart">
              <ShoppingCart className="h-4 w-4" />
              {count > 0 && (
                <span className="absolute -top-1 -end-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-cyan-500 px-1 text-[10px] font-bold text-background">
                  {count}
                </span>
              )}
            </Button>
          </Link>

          {userId ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" aria-label="Account">
                  <User className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem asChild><Link to="/account">{t("nav.account")}</Link></DropdownMenuItem>
                {isAdmin && <DropdownMenuItem asChild><Link to="/admin">{t("nav.admin")}</Link></DropdownMenuItem>}
                <DropdownMenuItem onClick={async () => { await supabase.auth.signOut(); window.location.href = "/"; }}>
                  {t("nav.signout")}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Link to="/auth"><Button size="sm" className="bg-cyan-500 text-background hover:bg-cyan-400">{t("nav.signin")}</Button></Link>
          )}

          <button className="md:hidden" onClick={() => setOpen(!open)} aria-label="Menu">
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>
      {open && (
        <nav className="border-t border-cyan-500/20 md:hidden">
          <div className="container mx-auto flex flex-col gap-1 px-4 py-2">
            {links.map((l) => (
              <Link key={l.to} to={l.to} className="rounded px-2 py-2 text-sm hover:bg-cyan-500/10" onClick={() => setOpen(false)}>
                {l.label}
              </Link>
            ))}
          </div>
        </nav>
      )}
    </header>
  );
}
