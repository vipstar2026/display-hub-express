ALTER TABLE public.banners ADD COLUMN IF NOT EXISTS title_bn text, ADD COLUMN IF NOT EXISTS subtitle_bn text, ADD COLUMN IF NOT EXISTS cta_label_bn text;
ALTER TABLE public.blog_posts ADD COLUMN IF NOT EXISTS title_bn text, ADD COLUMN IF NOT EXISTS excerpt_bn text, ADD COLUMN IF NOT EXISTS content_bn text;
ALTER TABLE public.categories ADD COLUMN IF NOT EXISTS name_bn text;
ALTER TABLE public.flash_sales ADD COLUMN IF NOT EXISTS name_bn text;
ALTER TABLE public.newsletter_campaigns ADD COLUMN IF NOT EXISTS subject_bn text, ADD COLUMN IF NOT EXISTS body_bn text;
ALTER TABLE public.payment_methods ADD COLUMN IF NOT EXISTS name_bn text, ADD COLUMN IF NOT EXISTS instructions_bn text;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS name_bn text, ADD COLUMN IF NOT EXISTS description_bn text;
ALTER TABLE public.shipping_rates ADD COLUMN IF NOT EXISTS name_bn text;
ALTER TABLE public.shipping_zones ADD COLUMN IF NOT EXISTS name_bn text;
ALTER TABLE public.site_settings
  ADD COLUMN IF NOT EXISTS tagline_bn text,
  ADD COLUMN IF NOT EXISTS meta_description_bn text,
  ADD COLUMN IF NOT EXISTS hero_title_bn text,
  ADD COLUMN IF NOT EXISTS hero_subtitle_bn text,
  ADD COLUMN IF NOT EXISTS hero_cta_bn text;

DROP VIEW IF EXISTS public.payment_methods_public;
CREATE VIEW public.payment_methods_public
WITH (security_invoker = on) AS
 SELECT id, code, name_ar, name_en, name_ur, name_bn, type, icon,
    instructions_ar, instructions_en, instructions_ur, instructions_bn,
    account_details, requires_proof, is_active, sort_order, fee_amount, fee_percent,
    min_amount, max_amount, is_gateway, gateway_provider, test_mode,
    supported_currencies, logo_url, created_at, updated_at
   FROM public.payment_methods
  WHERE is_active = true;
GRANT SELECT ON public.payment_methods_public TO anon, authenticated;

DO $do$
DECLARE def text;
BEGIN
  SELECT pg_get_functiondef(p.oid) INTO def
  FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace
  WHERE n.nspname='public' AND p.proname='update_site_settings_admin';

  def := regexp_replace(
    def,
    '(\w+)_ur = CASE WHEN payload \? ''(\w+)_ur'' THEN payload->>''(\w+)_ur'' ELSE s\.(\w+)_ur END,',
    E'\\1_ur = CASE WHEN payload ? ''\\1_ur'' THEN payload->>''\\1_ur'' ELSE s.\\1_ur END,\n    \\1_bn = CASE WHEN payload ? ''\\1_bn'' THEN payload->>''\\1_bn'' ELSE s.\\1_bn END,',
    'g');

  EXECUTE def;
END
$do$;

REVOKE ALL ON FUNCTION public.update_site_settings_admin(jsonb) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.update_site_settings_admin(jsonb) TO authenticated;