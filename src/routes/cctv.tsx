import { createFileRoute } from "@tanstack/react-router";
import { PageShell, PageHero } from "@/components/PageShell";
import { ProductCard } from "@/components/ProductCard";
import cctvImg from "@/assets/cctv.jpg";

export const Route = createFileRoute("/cctv")({
  head: () => ({
    meta: [
      { title: "CCTV ক্যামেরা ও সিকিউরিটি সিস্টেম — VIP STAR" },
      { name: "description", content: "HD/4K CCTV ক্যামেরা, DVR/NVR, নাইট ভিশন ও মোবাইল মনিটরিং সিস্টেম।" },
      { property: "og:title", content: "CCTV ক্যামেরা — VIP STAR" },
      { property: "og:image", content: cctvImg },
    ],
  }),
  component: CctvPage,
});

const items = [
  { name: "Hikvision 2MP Dome", price: "৳২,৮০০", description: "ইনডোর, নাইট ভিশন, IR ৩০ মিটার। ১ বছর ওয়ারেন্টি।" },
  { name: "Dahua 4MP Bullet", price: "৳৩,৯০০", description: "আউটডোর, ওয়াটারপ্রুফ, রঙিন নাইট ভিশন।", badge: "জনপ্রিয়" },
  { name: "WiFi Smart Cam", price: "৳২,২০০", description: "মোবাইল থেকে দেখুন, টু-ওয়ে অডিও, মোশন অ্যালার্ট।", badge: "নতুন" },
  { name: "8 Channel DVR", price: "৳৫,৫০০", description: "৮ ক্যামেরা সাপোর্ট, ১TB HDD স্লট, রিমোট অ্যাক্সেস।" },
  { name: "16 Channel NVR", price: "৳৯,৮০০", description: "IP ক্যামেরার জন্য, 4K রেকর্ডিং, ক্লাউড ব্যাকআপ।" },
  { name: "৪ ক্যামেরা প্যাকেজ", price: "৳১৫,৫০০", description: "৪টি 2MP ক্যাম + DVR + ১TB HDD + ক্যাবল + ইনস্টলেশন।", badge: "কম্বো অফার" },
];

function CctvPage() {
  return (
    <PageShell>
      <PageHero
        eyebrow="CCTV সিকিউরিটি"
        title="নিরাপত্তা এখন হাতের মুঠোয়"
        subtitle="বাসা, দোকান বা অফিস — যেকোনো জায়গার জন্য পেশাদার নজরদারি সিস্টেম। মোবাইলে লাইভ দেখুন।"
      />
      <section className="mx-auto max-w-7xl px-6 py-16">
        <div className="rounded-2xl overflow-hidden border border-border shadow-card">
          <img src={cctvImg} alt="CCTV camera" width={1280} height={960} loading="lazy" className="w-full h-72 md:h-96 object-cover" />
        </div>
      </section>
      <section className="mx-auto max-w-7xl px-6 pb-20">
        <h2 className="text-3xl font-bold">ক্যামেরা ও সিস্টেম</h2>
        <div className="mt-8 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {items.map((p) => <ProductCard key={p.name} {...p} />)}
        </div>
      </section>
    </PageShell>
  );
}
