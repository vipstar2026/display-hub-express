
-- 1) Ensure every product has a slug + prevent future empty slugs
CREATE OR REPLACE FUNCTION public.tg_products_ensure_slug()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
DECLARE base text; candidate text; n int := 1;
BEGIN
  IF NEW.slug IS NULL OR btrim(NEW.slug) = '' THEN
    base := lower(regexp_replace(COALESCE(NEW.name_en, NEW.name_ar, NEW.sku, NEW.id::text), '[^a-z0-9]+', '-', 'gi'));
    base := btrim(base, '-');
    IF base = '' THEN base := 'product'; END IF;
    candidate := base;
    WHILE EXISTS (SELECT 1 FROM public.products WHERE slug = candidate AND id <> NEW.id) LOOP
      n := n + 1; candidate := base || '-' || n;
    END LOOP;
    NEW.slug := candidate;
  END IF;
  RETURN NEW;
END $$;
REVOKE EXECUTE ON FUNCTION public.tg_products_ensure_slug() FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS products_ensure_slug ON public.products;
CREATE TRIGGER products_ensure_slug BEFORE INSERT OR UPDATE ON public.products
  FOR EACH ROW EXECUTE FUNCTION public.tg_products_ensure_slug();

-- Backfill any missing slugs
UPDATE public.products SET slug = NULL WHERE slug = '';
UPDATE public.products p SET slug = COALESCE(
  NULLIF(lower(regexp_replace(COALESCE(p.name_en, p.name_ar, p.sku, p.id::text), '[^a-z0-9]+','-','gi')),''),
  'product-' || substr(p.id::text,1,8)
) WHERE p.slug IS NULL;

-- Enforce NOT NULL + uniqueness
ALTER TABLE public.products ALTER COLUMN slug SET NOT NULL;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE schemaname='public' AND indexname='products_slug_key') THEN
    CREATE UNIQUE INDEX products_slug_key ON public.products(slug);
  END IF;
END $$;

-- 2) Lock down SECURITY DEFINER functions — revoke EXECUTE from anon/authenticated
--    where the function is admin-only or a trigger. Public-facing functions keep EXECUTE.

-- Admin-only functions: revoke from anon, keep authenticated (function checks has_role internally)
REVOKE EXECUTE ON FUNCTION public.update_site_settings_admin(jsonb) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.get_site_settings_admin() FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.admin_broadcast_notification(text, text, text, text, text) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.admin_upsert_coupon(jsonb) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.admin_list_coupons() FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.admin_delete_coupon(uuid) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.admin_customer_analytics() FROM PUBLIC, anon;

-- Trigger-only functions: no direct calls needed by any client role
REVOKE EXECUTE ON FUNCTION public.touch_updated_at() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.tg_set_updated_at() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.tg_orders_on_paid() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.award_loyalty_on_paid() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.tg_notify_new_order() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.tg_notify_new_contact() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.tg_notify_newsletter() FROM PUBLIC, anon, authenticated;

-- Internal helper: only trigger + admin
REVOKE EXECUTE ON FUNCTION public.assign_digital_codes(uuid) FROM PUBLIC, anon;

-- Authenticated-only actions (keep authenticated)
REVOKE EXECUTE ON FUNCTION public.finalize_coupon_use(uuid, uuid, numeric) FROM PUBLIC, anon;

-- Drop duplicate/legacy validate_coupon(single-arg) — the (text, numeric) variant is used
DROP FUNCTION IF EXISTS public.validate_coupon(text);
