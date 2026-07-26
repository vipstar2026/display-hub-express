CREATE OR REPLACE FUNCTION public.update_site_settings_admin(payload jsonb)
 RETURNS public.site_settings
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'private'
AS $function$
DECLARE
  result public.site_settings;
BEGIN
  IF NOT private.has_role(auth.uid(), 'admin'::public.app_role) THEN
    RAISE EXCEPTION 'not authorized';
  END IF;

  UPDATE public.site_settings s
  SET
    site_name = CASE WHEN payload ? 'site_name' THEN NULLIF(payload->>'site_name', '') ELSE s.site_name END,
    default_language = CASE WHEN payload ? 'default_language' THEN NULLIF(payload->>'default_language', '') ELSE s.default_language END,
    tagline_ar = CASE WHEN payload ? 'tagline_ar' THEN NULLIF(payload->>'tagline_ar', '') ELSE s.tagline_ar END,
    tagline_en = CASE WHEN payload ? 'tagline_en' THEN NULLIF(payload->>'tagline_en', '') ELSE s.tagline_en END,
    tagline_ur = CASE WHEN payload ? 'tagline_ur' THEN NULLIF(payload->>'tagline_ur', '') ELSE s.tagline_ur END,
    logo_url = CASE WHEN payload ? 'logo_url' THEN NULLIF(payload->>'logo_url', '') ELSE s.logo_url END,
    favicon_url = CASE WHEN payload ? 'favicon_url' THEN NULLIF(payload->>'favicon_url', '') ELSE s.favicon_url END,
    og_image_url = CASE WHEN payload ? 'og_image_url' THEN NULLIF(payload->>'og_image_url', '') ELSE s.og_image_url END,
    primary_color = CASE WHEN payload ? 'primary_color' THEN NULLIF(payload->>'primary_color', '') ELSE s.primary_color END,
    accent_color = CASE WHEN payload ? 'accent_color' THEN NULLIF(payload->>'accent_color', '') ELSE s.accent_color END,
    theme_preset = CASE WHEN payload ? 'theme_preset' THEN NULLIF(payload->>'theme_preset', '') ELSE s.theme_preset END,
    announcement_bar_enabled = CASE WHEN payload ? 'announcement_bar_enabled' THEN COALESCE((payload->>'announcement_bar_enabled')::boolean, false) ELSE s.announcement_bar_enabled END,
    announcement_bar_text = CASE WHEN payload ? 'announcement_bar_text' THEN NULLIF(payload->>'announcement_bar_text', '') ELSE s.announcement_bar_text END,
    contact_email = CASE WHEN payload ? 'contact_email' THEN NULLIF(payload->>'contact_email', '') ELSE s.contact_email END,
    contact_phone = CASE WHEN payload ? 'contact_phone' THEN NULLIF(payload->>'contact_phone', '') ELSE s.contact_phone END,
    whatsapp = CASE WHEN payload ? 'whatsapp' THEN NULLIF(payload->>'whatsapp', '') ELSE s.whatsapp END,
    business_hours = CASE WHEN payload ? 'business_hours' THEN NULLIF(payload->>'business_hours', '') ELSE s.business_hours END,
    company_address = CASE WHEN payload ? 'company_address' THEN NULLIF(payload->>'company_address', '') ELSE s.company_address END,
    company_cr = CASE WHEN payload ? 'company_cr' THEN NULLIF(payload->>'company_cr', '') ELSE s.company_cr END,
    company_vat_no = CASE WHEN payload ? 'company_vat_no' THEN NULLIF(payload->>'company_vat_no', '') ELSE s.company_vat_no END,
    instagram_url = CASE WHEN payload ? 'instagram_url' THEN NULLIF(payload->>'instagram_url', '') ELSE s.instagram_url END,
    twitter_url = CASE WHEN payload ? 'twitter_url' THEN NULLIF(payload->>'twitter_url', '') ELSE s.twitter_url END,
    facebook_url = CASE WHEN payload ? 'facebook_url' THEN NULLIF(payload->>'facebook_url', '') ELSE s.facebook_url END,
    tiktok_url = CASE WHEN payload ? 'tiktok_url' THEN NULLIF(payload->>'tiktok_url', '') ELSE s.tiktok_url END,
    youtube_url = CASE WHEN payload ? 'youtube_url' THEN NULLIF(payload->>'youtube_url', '') ELSE s.youtube_url END,
    snapchat_url = CASE WHEN payload ? 'snapchat_url' THEN NULLIF(payload->>'snapchat_url', '') ELSE s.snapchat_url END,
    telegram_url = CASE WHEN payload ? 'telegram_url' THEN NULLIF(payload->>'telegram_url', '') ELSE s.telegram_url END,
    default_currency = CASE WHEN payload ? 'default_currency' THEN NULLIF(payload->>'default_currency', '') ELSE s.default_currency END,
    shipping_flat = CASE WHEN payload ? 'shipping_flat' THEN COALESCE(NULLIF(payload->>'shipping_flat', '')::numeric, 0) ELSE s.shipping_flat END,
    free_shipping_threshold = CASE WHEN payload ? 'free_shipping_threshold' THEN NULLIF(payload->>'free_shipping_threshold', '')::numeric ELSE s.free_shipping_threshold END,
    vat_percent = CASE WHEN payload ? 'vat_percent' THEN COALESCE(NULLIF(payload->>'vat_percent', '')::numeric, 0) ELSE s.vat_percent END,
    prices_include_vat = CASE WHEN payload ? 'prices_include_vat' THEN COALESCE((payload->>'prices_include_vat')::boolean, false) ELSE s.prices_include_vat END,
    low_stock_threshold = CASE WHEN payload ? 'low_stock_threshold' THEN COALESCE(NULLIF(payload->>'low_stock_threshold', '')::int, 0) ELSE s.low_stock_threshold END,
    allow_guest_checkout = CASE WHEN payload ? 'allow_guest_checkout' THEN COALESCE((payload->>'allow_guest_checkout')::boolean, false) ELSE s.allow_guest_checkout END,
    meta_description_ar = CASE WHEN payload ? 'meta_description_ar' THEN NULLIF(payload->>'meta_description_ar', '') ELSE s.meta_description_ar END,
    meta_description_en = CASE WHEN payload ? 'meta_description_en' THEN NULLIF(payload->>'meta_description_en', '') ELSE s.meta_description_en END,
    meta_description_ur = CASE WHEN payload ? 'meta_description_ur' THEN NULLIF(payload->>'meta_description_ur', '') ELSE s.meta_description_ur END,
    meta_keywords = CASE WHEN payload ? 'meta_keywords' THEN NULLIF(payload->>'meta_keywords', '') ELSE s.meta_keywords END,
    google_analytics_id = CASE WHEN payload ? 'google_analytics_id' THEN NULLIF(payload->>'google_analytics_id', '') ELSE s.google_analytics_id END,
    meta_pixel_id = CASE WHEN payload ? 'meta_pixel_id' THEN NULLIF(payload->>'meta_pixel_id', '') ELSE s.meta_pixel_id END,
    tiktok_pixel_id = CASE WHEN payload ? 'tiktok_pixel_id' THEN NULLIF(payload->>'tiktok_pixel_id', '') ELSE s.tiktok_pixel_id END,
    notify_email_new_order = CASE WHEN payload ? 'notify_email_new_order' THEN COALESCE((payload->>'notify_email_new_order')::boolean, false) ELSE s.notify_email_new_order END,
    notify_email_low_stock = CASE WHEN payload ? 'notify_email_low_stock' THEN COALESCE((payload->>'notify_email_low_stock')::boolean, false) ELSE s.notify_email_low_stock END,
    allow_signups = CASE WHEN payload ? 'allow_signups' THEN COALESCE((payload->>'allow_signups')::boolean, false) ELSE s.allow_signups END,
    require_email_verification = CASE WHEN payload ? 'require_email_verification' THEN COALESCE((payload->>'require_email_verification')::boolean, false) ELSE s.require_email_verification END,
    maintenance_mode = CASE WHEN payload ? 'maintenance_mode' THEN COALESCE((payload->>'maintenance_mode')::boolean, false) ELSE s.maintenance_mode END,
    maintenance_message = CASE WHEN payload ? 'maintenance_message' THEN NULLIF(payload->>'maintenance_message', '') ELSE s.maintenance_message END,
    custom_head_html = CASE WHEN payload ? 'custom_head_html' THEN NULLIF(payload->>'custom_head_html', '') ELSE s.custom_head_html END,
    hero_badge_text = CASE WHEN payload ? 'hero_badge_text' THEN NULLIF(payload->>'hero_badge_text', '') ELSE s.hero_badge_text END,
    hero_title_ar = CASE WHEN payload ? 'hero_title_ar' THEN NULLIF(payload->>'hero_title_ar', '') ELSE s.hero_title_ar END,
    hero_title_en = CASE WHEN payload ? 'hero_title_en' THEN NULLIF(payload->>'hero_title_en', '') ELSE s.hero_title_en END,
    hero_title_ur = CASE WHEN payload ? 'hero_title_ur' THEN NULLIF(payload->>'hero_title_ur', '') ELSE s.hero_title_ur END,
    hero_subtitle_ar = CASE WHEN payload ? 'hero_subtitle_ar' THEN NULLIF(payload->>'hero_subtitle_ar', '') ELSE s.hero_subtitle_ar END,
    hero_subtitle_en = CASE WHEN payload ? 'hero_subtitle_en' THEN NULLIF(payload->>'hero_subtitle_en', '') ELSE s.hero_subtitle_en END,
    hero_subtitle_ur = CASE WHEN payload ? 'hero_subtitle_ur' THEN NULLIF(payload->>'hero_subtitle_ur', '') ELSE s.hero_subtitle_ur END,
    hero_cta_ar = CASE WHEN payload ? 'hero_cta_ar' THEN NULLIF(payload->>'hero_cta_ar', '') ELSE s.hero_cta_ar END,
    hero_cta_en = CASE WHEN payload ? 'hero_cta_en' THEN NULLIF(payload->>'hero_cta_en', '') ELSE s.hero_cta_en END,
    hero_cta_ur = CASE WHEN payload ? 'hero_cta_ur' THEN NULLIF(payload->>'hero_cta_ur', '') ELSE s.hero_cta_ur END,
    updated_at = now()
  WHERE s.id = 1
  RETURNING * INTO result;

  RETURN result;
END;
$function$;