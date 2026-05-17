import { createFileRoute } from "@tanstack/react-router";
import { PageShell, PageHero } from "@/components/PageShell";
import { ProductCard } from "@/components/ProductCard";
import dishImg from "@/assets/dish.jpg";

export const Route = createFileRoute("/dish")({
  head: () => ({
    meta: [
      { title: "ডিশ অ্যান্টেনা ও সরঞ্জাম — SignalHub" },
      { name: "description", content: "প্রিমিয়াম ডিশ অ্যান্টেনা, LNB, রিসিভার ও ক্যাবল — সব ব্র্যান্ডের আসল পণ্য।" },
      { property: "og:title", content: "ডিশ অ্যান্টেনা — SignalHub" },
      { property: "og:image", content: dishImg },
    ],
  }),
  component: DishPage,
});

const items = [
  { name: "Solid 6ft ডিশ", price: "৳৪,৫০০", description: "ভারী গেজ স্টিল, দীর্ঘস্থায়ী, সব দিকনির্দেশে শক্ত সিগন্যাল।" },
  { name: "Ku-Band LNB", price: "৳৮৫০", description: "উচ্চ গেইন, কম নয়েজ — পরিষ্কার ছবি নিশ্চিত।", badge: "নতুন" },
  { name: "HD Receiver Pro", price: "৳২,২০০", description: "Full HD, USB রেকর্ডিং, EPG সাপোর্ট, রিমোট সহ।" },
  { name: "4K UHD Receiver", price: "৳৪,৮০০", description: "4K, Wi-Fi, YouTube ও OTT অ্যাপ বিল্ট-ইন।", badge: "জনপ্রিয়" },
  { name: "Coaxial Cable (১০০ ft)", price: "৳১,২০০", description: "প্রিমিয়াম কপার কোর — সিগন্যাল লস কমায়।" },
  { name: "Universal Mount Kit", price: "৳৬৫০", description: "যেকোনো দেয়ালে শক্ত ও স্থিতিশীল মাউন্টিং।" },
];

function DishPage() {
  return (
    <PageShell>
      <PageHero
        eyebrow="ডিশ অ্যান্টেনা"
        title="শক্ত সিগন্যাল, ক্রিস্টাল ক্লিয়ার ছবি"
        subtitle="ছোট পরিবার থেকে শুরু করে বড় ভবন — প্রতিটি প্রয়োজনের জন্য সঠিক ডিশ সমাধান।"
      />
      <section className="mx-auto max-w-7xl px-6 py-16">
        <div className="rounded-2xl overflow-hidden border border-border shadow-card">
          <img src={dishImg} alt="Satellite dish" width={1280} height={960} loading="lazy" className="w-full h-72 md:h-96 object-cover" />
        </div>
      </section>
      <section className="mx-auto max-w-7xl px-6 pb-20">
        <h2 className="text-3xl font-bold">পণ্য তালিকা</h2>
        <div className="mt-8 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {items.map((p) => <ProductCard key={p.name} {...p} />)}
        </div>
      </section>
    </PageShell>
  );
}
