import { useEffect, useRef, useState } from "react";
import { ChevronDown, Coins } from "lucide-react";
import { CURRENCIES, useCurrency, type CurrencyCode } from "@/lib/currency";

export function CurrencySwitcher({ compact = false }: { compact?: boolean }) {
  const { currency, setCurrency } = useCurrency();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  const current = CURRENCIES.find((c) => c.code === currency)!;

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((v) => !v)}
        className={`flex items-center gap-1 hover:underline ${compact ? "text-xs" : "text-sm"}`}
        aria-haspopup="menu"
        aria-expanded={open}
      >
        <Coins className="w-3 h-3" />
        <span className="font-semibold">{current.code}</span>
        <ChevronDown className="w-3 h-3" />
      </button>
      {open && (
        <div className="absolute end-0 mt-1 w-44 rounded-md bg-card shadow-card border border-border text-foreground overflow-hidden z-50">
          {CURRENCIES.map((c) => (
            <button
              key={c.code}
              onClick={() => { setCurrency(c.code as CurrencyCode); setOpen(false); }}
              className={`w-full text-start px-3 py-2 text-xs hover:bg-accent transition-smooth flex items-center justify-between ${c.code === currency ? "bg-accent text-brand font-semibold" : ""}`}
            >
              <span>{c.label}</span>
              <span className="opacity-70">{c.code}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
