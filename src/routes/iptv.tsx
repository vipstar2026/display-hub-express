import { createFileRoute } from "@tanstack/react-router";
import { PageShell, PageHero } from "@/components/PageShell";
import { ProductCard } from "@/components/ProductCard";
import iptvImg from "@/assets/iptv.jpg";

export const Route = createFileRoute("/iptv")({
  head: () => ({
    meta: [
      { title: "IPTV সার্ভিস ও সেট-টপ বক্স — SignalHub" },
      { name: "description", content: "৫০০+ লাইভ চ্যানেল, 4K স্ট্রিমিং, ভারতীয়/বাংলা/ইংলিশ প্যাকেজ এবং স্মার্ট IPTV বক্স।" },
      { property: "og:title", content: "IPTV সার্ভিস — SignalHub" },
      { property: "og:image", content: iptvImg },
    ],
  }),
  component: IptvPage,
});

const plans = [
  { name: "Basic প্যাকেজ", price: "৳৩০০/মাস", description: "১৫০+ চ্যানেল, HD কোয়ালিটি, ১ ডিভাইস।", badge: "শুরুর জন্য" },
  { name: "Premium প্যাকেজ", price: "৳৬০০/মাস", description: "৫০০+ চ্যানেল, 4K, ২ ডিভাইস, ভিডিও অন ডিমান্ড।", badge: "জনপ্রিয়" },
  { name: "Family প্যাকেজ", price: "৳৯০০/মাস", description: "৮০০+ চ্যানেল, 4K, ৪ ডিভাইস, পুরো OTT অ্যাক্সেস।", badge: "সেরা ডিল" },
];

const boxes = [
  { name: "MAG 524 IPTV Box", price: "৳৫,৫০০", description: "4K HDR, Wi-Fi 6, দ্রুত প্রসেসর। ১ বছর ওয়ারেন্টি।" },
  { name: "Formuler Z11 Pro", price: "৳৮,৯০০", description: "Android 11, ডুয়াল ব্যান্ড Wi-Fi, ব্যাকলিট রিমোট।" },
  { name: "Xtream Mini Box", price: "৳৩,২০০", description: "বাজেট ফ্রেন্ডলি, Full HD স্ট্রিমিং, সহজ সেটআপ।" },
];

function IptvPage() {
  return (
    <PageShell>
      <PageHero
        eyebrow="IPTV"
        title="৫০০+ চ্যানেল, এক রিমোটে সব বিনোদন"
        subtitle="দেশি-বিদেশি চ্যানেল, স্পোর্টস, মুভি ও OTT — সব এক প্যাকেজে। যেকোনো TV-তে চলবে।"
      />
      <section className="mx-auto max-w-7xl px-6 py-16">
        <div className="rounded-2xl overflow-hidden border border-border shadow-card">
          <img src={iptvImg} alt="IPTV setup" width={1280} height={960} loading="lazy" className="w-full h-72 md:h-96 object-cover" />
        </div>
      </section>
      <section className="mx-auto max-w-7xl px-6">
        <h2 className="text-3xl font-bold">সাবস্ক্রিপশন প্যাকেজ</h2>
        <div className="mt-8 grid gap-5 md:grid-cols-3">
          {plans.map((p) => <ProductCard key={p.name} {...p} />)}
        </div>
      </section>
      <section className="mx-auto max-w-7xl px-6 py-20">
        <h2 className="text-3xl font-bold">IPTV সেট-টপ বক্স</h2>
        <div className="mt-8 grid gap-5 md:grid-cols-3">
          {boxes.map((p) => <ProductCard key={p.name} {...p} />)}
        </div>
      </section>
    </PageShell>
  );
}
