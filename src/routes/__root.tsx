import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Outlet, Link, createRootRouteWithContext, useRouter, HeadContent, Scripts } from "@tanstack/react-router";
import appCss from "../styles.css?url";
import { I18nProvider } from "@/lib/i18n";
import { CartProvider } from "@/lib/cart";
import { WishlistProvider } from "@/lib/wishlist";
import { CompareProvider } from "@/lib/compare";
import { Toaster } from "sonner";
import logoUrl from "@/assets/logo.png";
import { ThemeApplier } from "@/components/ThemeApplier";
import { MobileBottomNav } from "@/components/MobileBottomNav";
import { PWAInstaller } from "@/components/PWAInstaller";
import { FloatingWhatsApp } from "@/components/FloatingWhatsApp";
import { ScrollToTop } from "@/components/ScrollToTop";
import { CookieConsent } from "@/components/CookieConsent";
import { CompareBar } from "@/components/CompareBar";
import { LiveChatWidget } from "@/components/LiveChatWidget";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="font-mono text-7xl font-bold text-primary">404</h1>
        <h2 className="mt-4 text-xl font-semibold">Page not found</h2>
        <div className="mt-6">
          <Link to="/" className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-background transition hover:bg-primary">
            Go home
          </Link>
        </div>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  console.error(error);
  const router = useRouter();
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-xl font-semibold">This page didn't load</h1>
        <p className="mt-2 text-sm text-muted-foreground">Try refreshing or head back home.</p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <button onClick={() => { router.invalidate(); reset(); }} className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-background">Try again</button>
          <a href="/" className="rounded-md border border-primary/30 px-4 py-2 text-sm">Go home</a>
        </div>
      </div>
    </div>
  );
}

export const queryClient = new QueryClient();

export function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <I18nProvider>
        <CartProvider>
          <WishlistProvider>
            <CompareProvider>
              <ThemeApplier />
              <Outlet />
              <MobileBottomNav />
              <PWAInstaller />
              <FloatingWhatsApp />
              <ScrollToTop />
              <CookieConsent />
              <CompareBar />
              <LiveChatWidget />
              <Toaster position="top-center" theme="dark" richColors />
            </CompareProvider>
          </WishlistProvider>
        </CartProvider>
      </I18nProvider>
    </QueryClientProvider>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  component: App,
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { name: "theme-color", content: "#0a0a0f" },
      { title: "VIPSTAR — Satellite & IPTV Store" },
      { name: "description", content: "Premium satellite receivers, dishes, LNB, IPTV subscriptions and accessories." },
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      { rel: "icon", href: logoUrl },
      { rel: "apple-touch-icon", href: "/icon-192.png" },
      { rel: "manifest", href: "/manifest.webmanifest" },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      { rel: "stylesheet", href: "https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700&family=Space+Grotesk:wght@500;700&family=JetBrains+Mono:wght@500;700&display=swap" },
    ],
  }),
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
  shellComponent: RootShell,
});

function RootShell({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ar" dir="rtl">
      <head><HeadContent /></head>
      <body>{children}<Scripts /></body>
    </html>
  );
}
