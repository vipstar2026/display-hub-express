import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { useI18n } from "@/lib/i18n";
import { Calendar, Eye, ArrowLeft } from "lucide-react";

export const Route = createFileRoute("/blog/$slug")({
  component: BlogPost,
});

type Post = {
  id: string;
  slug: string;
  title_ar: string | null; title_en: string | null; title_ur: string | null;
  excerpt_ar: string | null; excerpt_en: string | null; excerpt_ur: string | null;
  content_ar: string | null; content_en: string | null; content_ur: string | null;
  cover_url: string | null;
  tags: string[];
  published_at: string | null;
  created_at: string;
  views: number;
};

function pick<T extends Record<string, any>>(p: T, base: string, lang: "ar" | "en" | "ur") {
  return p[`${base}_${lang}`] || p[`${base}_ar`] || p[`${base}_en`] || p[`${base}_ur`] || "";
}

function BlogPost() {
  const { slug } = Route.useParams();
  const { lang } = useI18n();

  const { data, isLoading } = useQuery({
    queryKey: ["blog-post", slug],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("blog_posts" as any)
        .select("*")
        .eq("slug", slug)
        .eq("status", "published")
        .maybeSingle();
      if (error) throw error;
      return data as unknown as Post | null;
    },
  });

  useEffect(() => {
    if (data?.slug) {
      supabase.rpc("increment_blog_views" as any, { _slug: data.slug });
    }
  }, [data?.slug]);

  if (!isLoading && !data) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <Header />
        <main className="container mx-auto flex-1 px-4 py-20 text-center">
          <h1 className="font-display text-3xl font-bold">404</h1>
          <p className="mt-2 text-muted-foreground">Article not found</p>
          <Link to="/blog" className="mt-6 inline-block text-primary hover:underline">← Blog</Link>
        </main>
        <Footer />
      </div>
    );
  }

  const title = data ? pick(data, "title", lang) : "";
  const excerpt = data ? pick(data, "excerpt", lang) : "";
  const content = data ? pick(data, "content", lang) : "";
  const date = data ? new Date(data.published_at || data.created_at) : new Date();

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />
      <main className="container mx-auto flex-1 px-4 py-10 max-w-4xl">
        <Link to="/blog" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary mb-6">
          <ArrowLeft className="h-4 w-4 rtl:rotate-180" /> {lang === "en" ? "Blog" : lang === "ur" ? "بلاگ" : "المدونة"}
        </Link>

        {isLoading ? (
          <div className="space-y-4 animate-pulse">
            <div className="h-8 w-2/3 bg-primary/10 rounded" />
            <div className="aspect-[16/9] bg-primary/5 rounded-xl" />
            <div className="space-y-2">
              {Array.from({ length: 6 }).map((_, i) => <div key={i} className="h-4 w-full bg-primary/5 rounded" />)}
            </div>
          </div>
        ) : data && (
          <article>
            {data.tags?.length > 0 && (
              <div className="mb-3 flex flex-wrap gap-1.5">
                {data.tags.map((t) => (
                  <span key={t} className="rounded-full bg-primary/10 px-2.5 py-0.5 text-xs uppercase tracking-wide text-primary">{t}</span>
                ))}
              </div>
            )}
            <h1 className="font-display text-3xl md:text-4xl font-bold text-foreground leading-tight">{title}</h1>
            {excerpt && <p className="mt-3 text-lg text-muted-foreground">{excerpt}</p>}

            <div className="mt-4 flex items-center gap-5 text-xs text-muted-foreground border-b border-primary/10 pb-4">
              <span className="flex items-center gap-1"><Calendar className="h-3.5 w-3.5" /> {date.toLocaleDateString(lang === "en" ? "en-GB" : "ar-BH")}</span>
              <span className="flex items-center gap-1"><Eye className="h-3.5 w-3.5" /> {data.views}</span>
            </div>

            {data.cover_url && (
              <div className="my-6 overflow-hidden rounded-xl border border-primary/10">
                <img src={data.cover_url} alt={title} className="w-full object-cover" />
              </div>
            )}

            <div
              className="prose prose-invert max-w-none prose-headings:font-display prose-headings:text-foreground prose-a:text-primary prose-strong:text-foreground prose-img:rounded-lg"
              dangerouslySetInnerHTML={{ __html: content.replace(/\n/g, "<br/>") }}
            />
          </article>
        )}
      </main>
      <Footer />
    </div>
  );
}
