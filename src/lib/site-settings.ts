import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export const SITE_SETTINGS_QUERY_KEY = ["site-settings", "public"] as const;

export type PublicSiteSettings = {
  site_name: string | null;
  default_language: string | null;
  tagline_ar: string | null;
  tagline_en: string | null;
  tagline_ur: string | null;
  tagline_bn: string | null;
  logo_url: string | null;
  favicon_url: string | null;
  og_image_url: string | null;
  primary_color: string | null;
  accent_color: string | null;
  theme_preset: string | null;
  announcement_bar_enabled: boolean | null;
  announcement_bar_text: string | null;
  contact_email: string | null;
  contact_phone: string | null;
  whatsapp: string | null;
  business_hours: string | null;
  company_address: string | null;
  company_cr: string | null;
  company_vat_no: string | null;
  instagram_url: string | null;
  twitter_url: string | null;
  facebook_url: string | null;
  tiktok_url: string | null;
  youtube_url: string | null;
  snapchat_url: string | null;
  telegram_url: string | null;
  default_currency: string | null;
  shipping_flat: number | null;
  free_shipping_threshold: number | null;
  vat_percent: number | null;
  prices_include_vat: boolean | null;
  low_stock_threshold: number | null;
  allow_guest_checkout: boolean | null;
  meta_description_ar: string | null;
  meta_description_en: string | null;
  meta_description_ur: string | null;
  meta_description_bn: string | null;
  meta_keywords: string | null;
  google_analytics_id: string | null;
  meta_pixel_id: string | null;
  tiktok_pixel_id: string | null;
  notify_email_new_order: boolean | null;
  notify_email_low_stock: boolean | null;
  allow_signups: boolean | null;
  require_email_verification: boolean | null;
  maintenance_mode: boolean | null;
  maintenance_message: string | null;
  custom_head_html: string | null;
  hero_badge_text: string | null;
  hero_title_ar: string | null;
  hero_title_en: string | null;
  hero_title_ur: string | null;
  hero_title_bn: string | null;
  hero_subtitle_ar: string | null;
  hero_subtitle_en: string | null;
  hero_subtitle_ur: string | null;
  hero_subtitle_bn: string | null;
  hero_cta_ar: string | null;
  hero_cta_en: string | null;
  hero_cta_ur: string | null;
  hero_cta_bn: string | null;
  updated_at: string | null;
};

export const PUBLIC_SITE_SETTINGS_SELECT = `
  site_name,default_language,tagline_ar,tagline_en,tagline_ur,tagline_bn,
  logo_url,favicon_url,og_image_url,primary_color,accent_color,theme_preset,
  announcement_bar_enabled,announcement_bar_text,
  contact_email,contact_phone,whatsapp,business_hours,company_address,company_cr,company_vat_no,
  instagram_url,twitter_url,facebook_url,tiktok_url,youtube_url,snapchat_url,telegram_url,
  default_currency,shipping_flat,free_shipping_threshold,vat_percent,prices_include_vat,low_stock_threshold,allow_guest_checkout,
  meta_description_ar,meta_description_en,meta_description_ur,meta_description_bn,meta_keywords,google_analytics_id,meta_pixel_id,tiktok_pixel_id,
  notify_email_new_order,notify_email_low_stock,allow_signups,require_email_verification,maintenance_mode,maintenance_message,custom_head_html,
  hero_badge_text,hero_title_ar,hero_title_en,hero_title_ur,hero_title_bn,hero_subtitle_ar,hero_subtitle_en,hero_subtitle_ur,hero_subtitle_bn,hero_cta_ar,hero_cta_en,hero_cta_ur,hero_cta_bn,
  updated_at
`;

export async function fetchPublicSiteSettings() {
  const { data, error } = await supabase
    .from("site_settings")
    .select(PUBLIC_SITE_SETTINGS_SELECT)
    .eq("id", 1)
    .maybeSingle();

  if (error) throw error;
  return data as PublicSiteSettings | null;
}

export function useSiteSettings() {
  return useQuery({
    queryKey: SITE_SETTINGS_QUERY_KEY,
    queryFn: fetchPublicSiteSettings,
    staleTime: 0,
  });
}

export function pickLocalized(
  lang: string,
  values: { ar?: string | null; en?: string | null; ur?: string | null; bn?: string | null },
) {
  return (
    (lang === "ar" ? values.ar : lang === "ur" ? values.ur : lang === "bn" ? values.bn : values.en) ||
    values.en || values.ar || values.ur || values.bn || ""
  );
}

export function cleanPhoneNumber(value: string | null | undefined) {
  return value?.replace(/[^0-9]/g, "") ?? "";
}

export function socialHandle(url: string | null | undefined, fallback = "") {
  if (!url) return fallback;
  try {
    const parsed = new URL(url);
    const handle = parsed.pathname.split("/").filter(Boolean).at(-1);
    return handle ? `@${handle}` : fallback;
  } catch {
    return fallback;
  }
}