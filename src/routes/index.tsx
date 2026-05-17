import { createFileRoute, Link } from "@tanstack/react-router";
import { PageShell } from "@/components/PageShell";
import { Tv, Satellite, Camera, Wrench, ShieldCheck, Zap, Headphones } from "lucide-react";
import heroImg from "@/assets/hero.jpg";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "VIP STAR — IPTV, ডিশ ও CCTV সমাধান" },
      { name: "description", content: "IPTV সাবস্ক্রিপশন, ডিশ অ্যান্টেনা, CCTV ক্যামেরা ও পেশাদার ইনস্টলেশন সার্ভিস এক জায়গায়।" },
      { property: "og:title", content: "VIP STAR — IPTV, ডিশ ও CCTV সমাধান" },
      { property: "og:description", content: "এক ছাদের নিচে সব entertainment ও security প্রযুক্তি।" },
    ],
  }),
  component: HomePage,
});

const categories = [
  { to: "/iptv", icon: Tv, title: "IPTV সার্ভিস", desc: "৫০০+ চ্যানেল, 4K স্ট্রিমিং ও স্মার্ট বক্স।", tag: "জনপ্রিয়" },
  { to: "/dish", icon: Satellite, title: "ডিশ অ্যান্টেনা", desc: "প্রিমিয়াম ডিশ, LNB ও রিসিভার।", tag: "নতুন" },
  { to: "/cctv", icon: Camera, title: "CCTV ক্যামেরা", desc: "HD/4K সিকিউরিটি ক্যামেরা ও DVR।", tag: "সিকিউরিটি" },
  { to: "/services", icon: Wrench, title: "ইনস্টলেশন", desc: "ঘরে গিয়ে সেটআপ ও মেরামত সেবা।", tag: "ফ্রি ভিজিট" },
] as const;

const features = [
  { icon: ShieldCheck, title: "১ বছরের ওয়ারেন্টি", desc: "প্রতিটি পণ্যে নিশ্চিত গ্যারান্টি।" },
  { icon: Zap, title: "দ্রুত ইনস্টলেশন", desc: "২৪ ঘণ্টার মধ্যে সেবা পৌঁছে দেই।" },
  { icon: Headphones, title: "২৪/৭ সাপোর্ট", desc: "যেকোনো সমস্যায় পাশে আছি।" },
];

function HomePage() {
  return (
    <PageShell>
      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0">
          <img src={heroImg} alt="" width={1920} height={1080} className="w-full h-full object-cover opacity-40" />
          <div className="absolute inset-0 bg-gradient-to-b from-background/50 via-background/70 to-background" />
        </div>
        <div className="relative mx-auto max-w-7xl px-6 py-24 md:py-36">
          <span className="inline-block px-3 py-1 rounded-full text-xs font-medium glass text-glow">
            ◆ নতুন আউটলেট — এখন ঢাকায়
          </span>
          <h1 className="mt-5 text-5xl md:text-7xl font-bold leading-[1.05] max-w-4xl">
            আপনার বাড়ির জন্য <span className="text-gradient">স্মার্ট সিগন্যাল</span> সমাধান
          </h1>
          <p className="mt-6 text-lg text-muted-foreground max-w-2xl">
            IPTV, ডিশ অ্যান্টেনা, CCTV ক্যামেরা — সব ব্র্যান্ডের সেরা পণ্য এক ছাদের নিচে। পেশাদার ইনস্টলেশন সহ।
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link to="/iptv" className="px-6 py-3 rounded-lg bg-gradient-primary text-primary-foreground font-medium shadow-glow hover:opacity-90 transition-smooth">
              পণ্য দেখুন
            </Link>
            <Link to="/contact" className="px-6 py-3 rounded-lg glass text-foreground font-medium hover:bg-secondary transition-smooth">
              যোগাযোগ করুন
            </Link>
          </div>
        </div>
      </section>

      {/* Categories */}
      <section className="mx-auto max-w-7xl px-6 py-20">
        <div className="flex items-end justify-between mb-10">
          <div>
            <p className="text-sm text-glow font-medium">আমাদের বিভাগ</p>
            <h2 className="text-3xl md:text-4xl font-bold mt-2">যা যা পাচ্ছেন</h2>
          </div>
        </div>
        <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-4">
          {categories.map((c) => (
            <Link key={c.to} to={c.to} className="group relative rounded-2xl p-6 bg-gradient-card border border-border shadow-card hover:border-primary/60 hover:shadow-glow hover:-translate-y-1 transition-smooth">
              <span className="absolute top-4 right-4 text-[10px] uppercase tracking-wider px-2 py-1 rounded-full bg-primary/20 text-glow border border-primary/40">
                {c.tag}
              </span>
              <div className="w-12 h-12 rounded-xl bg-gradient-primary grid place-items-center shadow-glow">
                <c.icon className="w-6 h-6 text-primary-foreground" />
              </div>
              <h3 className="mt-5 text-lg font-display font-semibold">{c.title}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{c.desc}</p>
              <div className="mt-4 text-sm text-glow font-medium">বিস্তারিত →</div>
            </Link>
          ))}
        </div>
      </section>

      {/* Features */}
      <section className="mx-auto max-w-7xl px-6 py-16">
        <div className="grid gap-5 md:grid-cols-3">
          {features.map((f) => (
            <div key={f.title} className="glass rounded-2xl p-6">
              <f.icon className="w-8 h-8 text-glow" />
              <h3 className="mt-4 text-lg font-display font-semibold">{f.title}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="mx-auto max-w-7xl px-6 py-20">
        <div className="relative overflow-hidden rounded-3xl bg-gradient-primary p-10 md:p-16 shadow-glow">
          <div className="absolute inset-0 opacity-20 mix-blend-overlay" style={{ backgroundImage: "radial-gradient(circle at 20% 30%, white 1px, transparent 1px)", backgroundSize: "24px 24px" }} />
          <div className="relative">
            <h2 className="text-3xl md:text-5xl font-bold text-primary-foreground max-w-2xl">
              আজই অর্ডার দিন, কালই ইনস্টল
            </h2>
            <p className="mt-4 text-primary-foreground/80 max-w-xl">
              ফোন করুন বা শোরুমে আসুন — আপনার চাহিদা অনুযায়ী সেরা প্যাকেজ পেয়ে যাবেন।
            </p>
            <Link to="/contact" className="mt-8 inline-flex px-6 py-3 rounded-lg bg-background text-foreground font-medium hover:bg-card transition-smooth">
              যোগাযোগ করুন →
            </Link>
          </div>
        </div>
      </section>
    </PageShell>
  );
}
