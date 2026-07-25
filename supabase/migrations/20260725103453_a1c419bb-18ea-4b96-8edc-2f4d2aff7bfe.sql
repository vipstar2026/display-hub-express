
CREATE OR REPLACE FUNCTION public.get_site_settings_admin()
RETURNS SETOF public.site_settings
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public, private
AS $$
  SELECT * FROM public.site_settings
  WHERE private.has_role(auth.uid(), 'admin'::public.app_role)
  LIMIT 1;
$$;

REVOKE ALL ON FUNCTION public.get_site_settings_admin() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_site_settings_admin() TO authenticated;

CREATE OR REPLACE FUNCTION public.update_site_settings_admin(payload jsonb)
RETURNS public.site_settings
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, private
AS $$
DECLARE
  result public.site_settings;
BEGIN
  IF NOT private.has_role(auth.uid(), 'admin'::public.app_role) THEN
    RAISE EXCEPTION 'not authorized';
  END IF;

  UPDATE public.site_settings s
  SET
    site_name = COALESCE(payload->>'site_name', s.site_name),
    default_language = COALESCE(payload->>'default_language', s.default_language),
    tagline_ar = COALESCE(payload->>'tagline_ar', s.tagline_ar),
    tagline_en = COALESCE(payload->>'tagline_en', s.tagline_en),
    tagline_ur = COALESCE(payload->>'tagline_ur', s.tagline_ur),
    logo_url = COALESCE(payload->>'logo_url', s.logo_url),
    favicon_url = COALESCE(payload->>'favicon_url', s.favicon_url),
    og_image_url = COALESCE(payload->>'og_image_url', s.og_image_url),
    primary_color = COALESCE(payload->>'primary_color', s.primary_color),
    accent_color = COALESCE(payload->>'accent_color', s.accent_color),
    theme_preset = COALESCE(payload->>'theme_preset', s.theme_preset),
    announcement_bar_enabled = COALESCE((payload->>'announcement_bar_enabled')::boolean, s.announcement_bar_enabled),
    announcement_bar_text = COALESCE(payload->>'announcement_bar_text', s.announcement_bar_text),
    contact_email = COALESCE(payload->>'contact_email', s.contact_email),
    contact_phone = COALESCE(payload->>'contact_phone', s.contact_phone),
    whatsapp = COALESCE(payload->>'whatsapp', s.whatsapp),
    business_hours = COALESCE(payload->>'business_hours', s.business_hours),
    company_address = COALESCE(payload->>'company_address', s.company_address),
    company_cr = COALESCE(payload->>'company_cr', s.company_cr),
    company_vat_no = COALESCE(payload->>'company_vat_no', s.company_vat_no),
    instagram_url = COALESCE(payload->>'instagram_url', s.instagram_url),
    twitter_url = COALESCE(payload->>'twitter_url', s.twitter_url),
    facebook_url = COALESCE(payload->>'facebook_url', s.facebook_url),
    tiktok_url = COALESCE(payload->>'tiktok_url', s.tiktok_url),
    youtube_url = COALESCE(payload->>'youtube_url', s.youtube_url),
    snapchat_url = COALESCE(payload->>'snapchat_url', s.snapchat_url),
    telegram_url = COALESCE(payload->>'telegram_url', s.telegram_url),
    default_currency = COALESCE(payload->>'default_currency', s.default_currency),
    shipping_flat = COALESCE((payload->>'shipping_flat')::numeric, s.shipping_flat),
    free_shipping_threshold = CASE WHEN payload ? 'free_shipping_threshold' THEN NULLIF(payload->>'free_shipping_threshold','')::numeric ELSE s.free_shipping_threshold END,
    vat_percent = COALESCE((payload->>'vat_percent')::numeric, s.vat_percent),
    prices_include_vat = COALESCE((payload->>'prices_include_vat')::boolean, s.prices_include_vat),
    low_stock_threshold = COALESCE((payload->>'low_stock_threshold')::int, s.low_stock_threshold),
    allow_guest_checkout = COALESCE((payload->>'allow_guest_checkout')::boolean, s.allow_guest_checkout),
    meta_description_ar = COALESCE(payload->>'meta_description_ar', s.meta_description_ar),
    meta_description_en = COALESCE(payload->>'meta_description_en', s.meta_description_en),
    meta_description_ur = COALESCE(payload->>'meta_description_ur', s.meta_description_ur),
    meta_keywords = COALESCE(payload->>'meta_keywords', s.meta_keywords),
    google_analytics_id = COALESCE(payload->>'google_analytics_id', s.google_analytics_id),
    meta_pixel_id = COALESCE(payload->>'meta_pixel_id', s.meta_pixel_id),
    tiktok_pixel_id = COALESCE(payload->>'tiktok_pixel_id', s.tiktok_pixel_id),
    notify_email_new_order = COALESCE((payload->>'notify_email_new_order')::boolean, s.notify_email_new_order),
    notify_email_low_stock = COALESCE((payload->>'notify_email_low_stock')::boolean, s.notify_email_low_stock),
    allow_signups = COALESCE((payload->>'allow_signups')::boolean, s.allow_signups),
    require_email_verification = COALESCE((payload->>'require_email_verification')::boolean, s.require_email_verification),
    maintenance_mode = COALESCE((payload->>'maintenance_mode')::boolean, s.maintenance_mode),
    maintenance_message = COALESCE(payload->>'maintenance_message', s.maintenance_message),
    custom_head_html = COALESCE(payload->>'custom_head_html', s.custom_head_html),
    updated_at = now()
  WHERE s.id = 1
  RETURNING * INTO result;

  RETURN result;
END;
$$;

REVOKE ALL ON FUNCTION public.update_site_settings_admin(jsonb) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.update_site_settings_admin(jsonb) TO authenticated;
