
ALTER TABLE public.site_settings
  ADD COLUMN IF NOT EXISTS hero_badge_text TEXT,
  ADD COLUMN IF NOT EXISTS hero_title_ar TEXT,
  ADD COLUMN IF NOT EXISTS hero_title_en TEXT,
  ADD COLUMN IF NOT EXISTS hero_title_ur TEXT,
  ADD COLUMN IF NOT EXISTS hero_subtitle_ar TEXT,
  ADD COLUMN IF NOT EXISTS hero_subtitle_en TEXT,
  ADD COLUMN IF NOT EXISTS hero_subtitle_ur TEXT,
  ADD COLUMN IF NOT EXISTS hero_cta_ar TEXT,
  ADD COLUMN IF NOT EXISTS hero_cta_en TEXT,
  ADD COLUMN IF NOT EXISTS hero_cta_ur TEXT;

UPDATE public.site_settings SET
  hero_badge_text = COALESCE(hero_badge_text, 'VIPSTAR.CC'),
  hero_title_ar = COALESCE(hero_title_ar, 'أفضل أجهزة الستلايت و IPTV'),
  hero_title_en = COALESCE(hero_title_en, 'Premium Satellite & IPTV gear'),
  hero_title_ur = COALESCE(hero_title_ur, 'بہترین سیٹلائٹ اور IPTV آلات'),
  hero_subtitle_ar = COALESCE(hero_subtitle_ar, 'رسيفرات • أطباق • LNB • اشتراكات IPTV • إكسسوارات'),
  hero_subtitle_en = COALESCE(hero_subtitle_en, 'Receivers • Dishes • LNB • IPTV Subscriptions • Accessories'),
  hero_subtitle_ur = COALESCE(hero_subtitle_ur, 'ریسیورز • ڈشز • LNB • IPTV سبسکرپشنز • لوازمات'),
  hero_cta_ar = COALESCE(hero_cta_ar, 'تصفح المتجر'),
  hero_cta_en = COALESCE(hero_cta_en, 'Shop now'),
  hero_cta_ur = COALESCE(hero_cta_ur, 'ابھی خریدیں');

-- Allow public read for hero fields via existing public view/policy; add to public-safe columns if any policy restricts.
GRANT SELECT (hero_badge_text, hero_title_ar, hero_title_en, hero_title_ur, hero_subtitle_ar, hero_subtitle_en, hero_subtitle_ur, hero_cta_ar, hero_cta_en, hero_cta_ur) ON public.site_settings TO anon, authenticated;
