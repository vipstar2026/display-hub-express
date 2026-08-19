import { useEffect } from "react";
import { useRouterState } from "@tanstack/react-router";
import { useSiteSettings } from "@/lib/site-settings";
import { analytics, initAnalytics, isAnalyticsActive, CONSENT_EVENT } from "@/lib/analytics";

/**
 * Loads the configured trackers (GA4 / Meta / TikTok) once cookie consent is
 * given and reports a page_view on every client-side navigation.
 */
export function Analytics() {
  const { data: settings } = useSiteSettings();
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  const ga4 = settings?.google_analytics_id ?? null;
  const metaPixel = settings?.meta_pixel_id ?? null;
  const tiktokPixel = settings?.tiktok_pixel_id ?? null;

  useEffect(() => {
    const ids = { ga4, metaPixel, tiktokPixel };
    initAnalytics(ids);
    const onConsent = () => initAnalytics(ids);
    window.addEventListener(CONSENT_EVENT, onConsent);
    return () => window.removeEventListener(CONSENT_EVENT, onConsent);
  }, [ga4, metaPixel, tiktokPixel]);

  useEffect(() => {
    if (!isAnalyticsActive()) return;
    analytics.pageView(pathname, document.title);
  }, [pathname]);

  return null;
}
