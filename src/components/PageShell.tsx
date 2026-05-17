import type { ReactNode } from "react";
import { SiteHeader } from "./SiteHeader";
import { SiteFooter } from "./SiteFooter";

export function PageShell({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col">
      <SiteHeader />
      <main className="flex-1">{children}</main>
      <SiteFooter />
    </div>
  );
}

export function PageHero({ eyebrow, title, subtitle }: { eyebrow: string; title: string; subtitle: string }) {
  return (
    <section className="bg-gradient-hero border-b border-border">
      <div className="mx-auto max-w-7xl px-6 py-20 md:py-28">
        <span className="inline-block px-3 py-1 rounded-full text-xs font-medium glass text-glow">{eyebrow}</span>
        <h1 className="mt-4 text-4xl md:text-6xl font-bold leading-tight max-w-3xl">{title}</h1>
        <p className="mt-5 text-base md:text-lg text-muted-foreground max-w-2xl">{subtitle}</p>
      </div>
    </section>
  );
}
