// @lovable.dev/vite-tanstack-config already includes the following — do NOT add them manually
// or the app will break with duplicate plugins:
//   - tanstackStart, viteReact, tailwindcss, tsConfigPaths, cloudflare (build-only),
//     componentTagger (dev-only), VITE_* env injection, @ path alias, React/TanStack dedupe,
//     error logger plugins, and sandbox detection (port/host/strictPort).
// You can pass additional config via defineConfig({ vite: { ... } }) if needed.
import { defineConfig } from "@lovable.dev/vite-tanstack-config";
import { loadEnv } from "vite";
import path from "node:path";

// Load non-VITE_ env vars into process.env for server-side routes only
// (never added to client define — keeps service keys out of the bundle).
const serverEnv = loadEnv(process.env['NODE_ENV'] ?? "development", process.cwd(), "");
Object.assign(process.env, serverEnv);

// Redirect TanStack Start's bundled server entry to src/server.ts (our SSR error wrapper).
// @cloudflare/vite-plugin builds from this — wrangler.jsonc main alone is insufficient.
export default defineConfig({
  tanstackStart: {
    server: { entry: "server" },
  },
  vite: {
    // Force a single pre-bundled React instance; without this the router's
    // un-optimized ESM can pull a second copy and hooks read a null dispatcher.
    optimizeDeps: {
      include: [
        "react",
        "react-dom",
        "react-dom/client",
        "react/jsx-runtime",
        "react/jsx-dev-runtime",
        "@tanstack/react-router",
        "@tanstack/react-query",
        // Admin-only deps: pre-bundle them so navigating to /admin never triggers a
        // mid-session dependency re-optimization (which mixes old/new dep hashes and
        // leaves React with a null hook dispatcher).
        "recharts",
        "date-fns",
        "sonner",
        "cmdk",
        "react-hook-form",
        "zod",
        "embla-carousel-react",
        "react-day-picker",
        "@supabase/supabase-js",
      ],
    },
    resolve: {
      dedupe: ["react", "react-dom"],
      alias: {
        "entities/lib/decode.js": path.resolve(__dirname, "node_modules/entities/lib/decode.js"),
        "entities/lib/encode.js": path.resolve(__dirname, "node_modules/entities/lib/encode.js"),
        entities: path.resolve(__dirname, "node_modules/entities"),
      },
    },

    preview: {
      allowedHosts: ['vipstar.cc', 'localhost', '127.0.0.1'],
      host: true,
      port: 3000,
    },
    server: {
      allowedHosts: ['vipstar.cc', 'localhost', '127.0.0.1'],
    },
  },
});
