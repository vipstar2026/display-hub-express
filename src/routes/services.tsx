import { createFileRoute } from "@tanstack/react-router";
import { PageShell, PageHero } from "@/components/PageShell";
import { Wrench, Settings, RefreshCw, ShieldCheck } from "lucide-react";

export const Route = createFileRoute("/services")({
  head: () => ({
    meta: [
      { title: "ইনস্টলেশন ও সার্ভিস — SignalHub" },
      { name: "description", content: "ঘরে গিয়ে IPTV, ডিশ ও CCTV সেটআপ, মেরামত ও রক্ষণাবেক্ষণ সেবা।" },
      { property: "og:title", content: "সার্ভিস — SignalHub" },
    ],
  }),
  component: ServicesPage,
});

const services = [
  { icon: Wrench, title: "নতুন ইনস্টলেশন", desc: "ডিশ, IPTV বক্স বা CCTV — পেশাদার টিম এসে সেটআপ করে দেবে।", price: "৳৫০০ থেকে" },
  { icon: Settings, title: "কনফিগারেশন", desc: "চ্যানেল টিউনিং, মোবাইল অ্যাপ সেটআপ, নেটওয়ার্ক কনফিগ।", price: "৳৩০০ থেকে" },
  { icon: RefreshCw, title: "মেরামত সেবা", desc: "সিগন্যাল সমস্যা, রিসিভার বা ক্যামেরা মেরামত।", price: "ফ্রি ডায়াগনসিস" },
  { icon: ShieldCheck, title: "বার্ষিক মেইনটেন্যান্স", desc: "বছরে ৩ বার ভিজিট, ফ্রি ক্লিনিং ও চেকআপ।", price: "৳২,০০০/বছর" },
];

function ServicesPage() {
  return (
    <PageShell>
      <PageHero
        eyebrow="সার্ভিস"
        title="ইনস্টলেশন থেকে মেইনটেন্যান্স — সব আমাদের কাজ"
        subtitle="ঢাকা শহরের যেকোনো জায়গায় আমাদের পেশাদার টেকনিশিয়ান টিম পৌঁছে যাবে।"
      />
      <section className="mx-auto max-w-7xl px-6 py-20">
        <div className="grid gap-5 md:grid-cols-2">
          {services.map((s) => (
            <div key={s.title} className="rounded-2xl p-7 bg-gradient-card border border-border shadow-card hover:border-primary/60 transition-smooth">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl bg-gradient-primary grid place-items-center shadow-glow shrink-0">
                  <s.icon className="w-6 h-6 text-primary-foreground" />
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-display font-semibold">{s.title}</h3>
                  <p className="mt-2 text-muted-foreground">{s.desc}</p>
                  <div className="mt-4 text-sm font-medium text-glow">{s.price}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>
    </PageShell>
  );
}
