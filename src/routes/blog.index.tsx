import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { useI18n } from "@/lib/i18n";
import { Calendar, Eye, ArrowLeft, ArrowRight } from "lucide-react";

export const Route = createFileRoute("/blog/")({
  head: () => ({
    meta: [
      { title: "المدونة — VIPSTAR" },
      { name: "description", content: "أحدث الأخبار والمقالات والنصائح حول أجهزة الستلايت واشتراكات IPTV." },
      { property: "og:title", content: "المدونة — VIPSTAR" },
      { property: "og:description", content: "أحدث الأخبار والمقالات والنصائح حول أجهزة الستلايت واشتراكات IPTV." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: BlogList,
});

type Post = {
  id: string;
  slug: string;
  title_ar: string | null;
  title_en: string | null;
  title_ur: string | null;
  excerpt_ar: string | null;
  excerpt_en: string | null;
  excerpt_ur: string | null;
  cover_url: string | null;
  tags: string[];
  published_at: string | null;
  created_at: string;
  views: number;
};

const L = {
  ar: { title: "المدونة", subtitle: "أحدث الأخبار والمقالات والنصائح", empty: "لا توجد مقالات منشورة بعد", read: "اقرأ المزيد", views: "مشاهدة" },
  en: { title: "Blog", subtitle: "Latest news, articles and tips", empty: "No published posts yet", read: "Read more", views: "views" },
  ur: { title: "بلاگ", subtitle: "تازہ ترین خبریں، مضامین اور تجاویز", empty: "ابھی تک کوئی مضمون شائع نہیں ہوا", read: "مزید پڑھیں", views: "مناظر" },
};

function pick<T extends Record<string, any>>(p: T, base: string, lang: "ar" | "en" | "ur") {
  return p[`${base}_${lang}`] || p[`${base}_ar`] || p[`${base}_en`] || p[`${base}_ur`] || "";
}

function BlogList() {
  const { lang } = useI18n();
  const l = L[lang];
  const isRTL = lang !== "en";
  const Arrow = isRTL ? ArrowLeft : ArrowRight;

  const { data: posts, isLoading } = useQuery({
    queryKey: ["blog-posts-public"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("blog_posts" as any)
        .select("id, slug, title_ar, title_en, title_ur, excerpt_ar, excerpt_en, excerpt_ur, cover_url, tags, published_at, created_at, views")
        .eq("status", "published")
        .order("published_at", { ascending: false, nullsFirst: false })
        .limit(60);
      if (error) throw error;
      return (data ?? []) as unknown as Post[];
    },
  });

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />
      <main className="container mx-auto flex-1 px-4 py-10">
        <div className="mb-8 text-center">
          <h1 className="font-display text-4xl font-bold text-primary">{l.title}</h1>
          <p className="mt-2 text-muted-foreground">{l.subtitle}</p>
        </div>

        {isLoading ? (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="rounded-xl border border-primary/10 bg-card/60 overflow-hidden animate-pulse">
                <div className="aspect-[16/9] bg-primary/5" />
                <div className="p-4 space-y-2">
                  <div className="h-4 w-3/4 bg-primary/10 rounded" />
                  <div className="h-3 w-full bg-primary/5 rounded" />
                </div>
              </div>
            ))}
          </div>
        ) : (posts?.length ?? 0) === 0 ? (
          <div className="py-24 text-center text-muted-foreground">{l.empty}</div>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {posts!.map((p) => {
              const title = pick(p, "title", lang);
              const excerpt = pick(p, "excerpt", lang);
              const date = new Date(p.published_at || p.created_at);
              return (
                <Link
                  key={p.id}
                  to="/blog/$slug"
                  params={{ slug: p.slug }}
                  className="group flex flex-col rounded-xl border border-primary/10 bg-card/60 overflow-hidden transition hover:border-primary/40 hover:shadow-lg hover:shadow-primary/10"
                >
                  <div className="aspect-[16/9] overflow-hidden bg-primary/5">
                    {p.cover_url ? (
                      <img src={p.cover_url} alt={title} loading="lazy" className="h-full w-full object-cover transition duration-500 group-hover:scale-105" />
                    ) : (
                      <div className="h-full w-full bg-gradient-to-br from-primary/20 to-transparent" />
                    )}
                  </div>
                  <div className="flex flex-1 flex-col p-4">
                    {p.tags?.length > 0 && (
                      <div className="mb-2 flex flex-wrap gap-1">
                        {p.tags.slice(0, 3).map((t) => (
                          <span key={t} className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] uppercase tracking-wide text-primary">
                            {t}
                          </span>
                        ))}
                      </div>
                    )}
                    <h2 className="font-display text-lg font-semibold leading-tight text-foreground group-hover:text-primary transition line-clamp-2">
                      {title}
                    </h2>
                    {excerpt && <p className="mt-2 text-sm text-muted-foreground line-clamp-3">{excerpt}</p>}
                    <div className="mt-auto flex items-center justify-between pt-4 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1"><Calendar className="h-3 w-3" /> {date.toLocaleDateString(lang === "en" ? "en-GB" : "ar-BH")}</span>
                      <span className="flex items-center gap-3">
                        <span className="flex items-center gap-1"><Eye className="h-3 w-3" /> {p.views}</span>
                        <span className="flex items-center gap-1 text-primary">{l.read} <Arrow className="h-3 w-3" /></span>
                      </span>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
}
