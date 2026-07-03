
-- Coupons
DROP POLICY IF EXISTS coupons_public_read ON public.coupons;
REVOKE SELECT ON public.coupons FROM anon, authenticated;
GRANT SELECT ON public.coupons TO service_role;

CREATE OR REPLACE FUNCTION public.validate_coupon(_code text)
RETURNS TABLE (id uuid, code text, discount_type text, discount_value numeric, min_total numeric)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT c.id, c.code, c.discount_type::text, c.discount_value, c.min_total
  FROM public.coupons c
  WHERE c.is_active = true
    AND upper(c.code) = upper(_code)
    AND (c.expires_at IS NULL OR c.expires_at >= now())
    AND (c.max_uses IS NULL OR c.used_count < c.max_uses)
  LIMIT 1;
$$;
GRANT EXECUTE ON FUNCTION public.validate_coupon(text) TO anon, authenticated;

-- Site settings: revoke full-row SELECT, grant only non-sensitive columns
DROP POLICY IF EXISTS settings_public_read ON public.site_settings;
REVOKE SELECT ON public.site_settings FROM anon, authenticated;

CREATE POLICY settings_public_read ON public.site_settings
  FOR SELECT TO anon, authenticated USING (true);

GRANT SELECT (id, site_name, default_language, tagline_ar, tagline_en, tagline_ur,
  logo_url, favicon_url, og_image_url, primary_color, accent_color,
  announcement_bar_enabled, announcement_bar_text,
  instagram_url, twitter_url, facebook_url, tiktok_url, youtube_url, snapchat_url, telegram_url,
  default_currency, shipping_flat, free_shipping_threshold, vat_percent, prices_include_vat,
  meta_description_ar, meta_description_en, meta_description_ur, meta_keywords,
  google_analytics_id, meta_pixel_id, tiktok_pixel_id,
  maintenance_mode, maintenance_message, business_hours, custom_head_html)
  ON public.site_settings TO anon, authenticated;
