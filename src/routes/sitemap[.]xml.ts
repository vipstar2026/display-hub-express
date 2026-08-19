import { createFileRoute } from "@tanstack/react-router";
import type {} from "@tanstack/react-start";
import { createClient } from "@supabase/supabase-js";

const BASE_URL = "https://vipstar.cc";

interface SitemapEntry {
  path: string;
  lastmod?: string;
  changefreq?: "weekly" | "daily" | "monthly";
  priority?: string;
}

export const Route = createFileRoute("/sitemap.xml")({
  server: {
    handlers: {
      GET: async () => {
        const key = process.env.SUPABASE_PUBLISHABLE_KEY!;
        const supa = createClient(process.env.SUPABASE_URL!, key, {
          auth: { persistSession: false, autoRefreshToken: false },
          global: {
            fetch: (input, init) => {
              const h = new Headers(init?.headers);
              if (key.startsWith("sb_") && h.get("Authorization") === `Bearer ${key}`) h.delete("Authorization");
              h.set("apikey", key);
              return fetch(input, { ...init, headers: h });
            },
          },
        });

        const entries: SitemapEntry[] = [
          { path: "/", changefreq: "weekly", priority: "1.0" },
          { path: "/shop", changefreq: "daily", priority: "0.9" },
          { path: "/auth", changefreq: "monthly", priority: "0.3" },
        ];

        const [cats, prods] = await Promise.all([
          supa.from("categories").select("slug, updated_at").eq("is_active", true),
          supa.from("products").select("slug, updated_at").eq("status", "active"),
        ]);

        (cats.data ?? []).forEach((c) =>
          entries.push({ path: `/category/${c.slug}`, lastmod: c.updated_at?.slice(0, 10), changefreq: "weekly", priority: "0.7" }),
        );
        (prods.data ?? []).forEach((p) =>
          entries.push({ path: `/product/${p.slug}`, lastmod: p.updated_at?.slice(0, 10), changefreq: "weekly", priority: "0.8" }),
        );

        const urls = entries.map((e) =>
          [
            `  <url>`,
            `    <loc>${BASE_URL}${e.path}</loc>`,
            e.lastmod ? `    <lastmod>${e.lastmod}</lastmod>` : null,
            e.changefreq ? `    <changefreq>${e.changefreq}</changefreq>` : null,
            e.priority ? `    <priority>${e.priority}</priority>` : null,
            `  </url>`,
          ].filter(Boolean).join("\n"),
        );

        const xml = [
          `<?xml version="1.0" encoding="UTF-8"?>`,
          `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">`,
          ...urls,
          `</urlset>`,
        ].join("\n");

        return new Response(xml, {
          headers: { "Content-Type": "application/xml", "Cache-Control": "public, max-age=3600" },
        });
      },
    },
  },
});
