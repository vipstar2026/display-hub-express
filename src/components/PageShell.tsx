import type { ReactNode } from "react";
import { SiteHeader } from "./SiteHeader";
import { SiteFooter } from "./SiteFooter";

export function PageShell({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <SiteHeader />
      <main className="flex-1">{children}</main>
      <SiteFooter />
    </div>
  );
}

export function PageHero({ eyebrow, title, subtitle }: { eyebrow: string; title: string; subtitle: string }) {
  return (
    <section className="bg-gradient-brand border-b border-border">
      <div className="mx-auto max-w-7xl px-6 py-14 md:py-20 text-white">
        <span className="inline-block px-3 py-1 rounded-full text-xs font-medium bg-white/20 backdrop-blur">{eyebrow}</span>
        <h1 className="mt-4 text-3xl md:text-5xl font-bold leading-tight max-w-3xl">{title}</h1>
        <p className="mt-4 text-sm md:text-base text-white/85 max-w-2xl">{subtitle}</p>
      </div>
    </section>
  );
}
