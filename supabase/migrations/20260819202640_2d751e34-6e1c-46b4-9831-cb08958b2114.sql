-- ============================================================
-- PHASE 1: least privilege on public schema
-- ============================================================
REVOKE ALL ON ALL TABLES IN SCHEMA public FROM anon, authenticated;
ALTER DEFAULT PRIVILEGES IN SCHEMA public REVOKE ALL ON TABLES FROM anon, authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO service_role;

-- Public catalogue: anonymous read only
GRANT SELECT ON public.products, public.categories, public.banners, public.blog_posts,
  public.flash_sales, public.reviews, public.shipping_rates, public.shipping_zones,
  public.site_settings, public.payment_methods_public, public.reviews_public TO anon;

-- Public write endpoints (RLS-restricted inserts)
GRANT INSERT ON public.contact_messages, public.newsletter_subscribers TO anon;

-- Signed-in users / admins (RLS still decides row visibility)
GRANT SELECT, INSERT, UPDATE, DELETE ON
  public.accounts, public.addresses, public.banners, public.blog_posts, public.categories,
  public.contact_messages, public.coupons, public.digital_codes, public.email_outbox,
  public.flash_sales, public.inventory_movements, public.invoices, public.journal_entries,
  public.journal_lines, public.newsletter_campaigns, public.newsletter_subscribers,
  public.notifications, public.order_items, public.orders, public.payment_links,
  public.payment_methods, public.payment_transactions, public.pos_sale_items, public.pos_sales,
  public.pos_sessions, public.products, public.purchase_order_items, public.purchase_orders,
  public.reviews, public.shipping_rates, public.shipping_zones, public.site_settings,
  public.suppliers, public.user_roles, public.wishlist
TO authenticated;

GRANT SELECT, INSERT ON public.activity_log, public.coupon_usage TO authenticated;
GRANT SELECT ON public.loyalty_points, public.user_permissions,
  public.payment_methods_public, public.reviews_public, public.loyalty_balance TO authenticated;

-- Profiles keep column-level grants only (staff_notes stays hidden)
GRANT SELECT (id, display_name, avatar_url, phone, created_at, updated_at) ON public.profiles TO authenticated;
GRANT UPDATE (display_name, avatar_url, phone, updated_at) ON public.profiles TO authenticated;

-- Email infrastructure + secrets: service role only (server functions use it)
-- (email_settings, email_send_log, email_send_state, email_unsubscribe_tokens,
--  suppressed_emails deliberately receive no anon/authenticated grants)

-- ============================================================
-- Email secrets never leave the server
-- ============================================================
DROP FUNCTION IF EXISTS public.get_email_settings_admin();
CREATE FUNCTION public.get_email_settings_admin()
RETURNS TABLE(
  id integer, smtp_enabled boolean, smtp_host text, smtp_port integer, smtp_secure boolean,
  smtp_username text, from_email text, from_name text, reply_to text,
  signature_ar text, signature_en text, api_enabled boolean, api_provider text,
  api_endpoint text, smtp_password_set boolean, api_key_set boolean,
  created_at timestamptz, updated_at timestamptz
)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public', 'private'
AS $$
  SELECT s.id, s.smtp_enabled, s.smtp_host, s.smtp_port, s.smtp_secure,
         s.smtp_username, s.from_email, s.from_name, s.reply_to,
         s.signature_ar, s.signature_en, s.api_enabled, s.api_provider,
         s.api_endpoint,
         (s.smtp_password IS NOT NULL AND s.smtp_password <> ''),
         (s.api_key IS NOT NULL AND s.api_key <> ''),
         s.created_at, s.updated_at
  FROM public.email_settings s
  WHERE private.has_role(auth.uid(), 'admin'::public.app_role)
  LIMIT 1;
$$;
REVOKE ALL ON FUNCTION public.get_email_settings_admin() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_email_settings_admin() TO authenticated;

-- Saving with a blank secret keeps the stored value, and the function never returns secrets
DROP FUNCTION IF EXISTS public.update_email_settings_admin(jsonb);
CREATE FUNCTION public.update_email_settings_admin(payload jsonb)
RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public', 'private'
AS $$
BEGIN
  IF NOT private.has_role(auth.uid(), 'admin'::public.app_role) THEN
    RAISE EXCEPTION 'not authorized';
  END IF;
  UPDATE public.email_settings s SET
    smtp_enabled = CASE WHEN payload ? 'smtp_enabled' THEN (payload->>'smtp_enabled')::boolean ELSE s.smtp_enabled END,
    smtp_host = CASE WHEN payload ? 'smtp_host' THEN NULLIF(payload->>'smtp_host','') ELSE s.smtp_host END,
    smtp_port = CASE WHEN payload ? 'smtp_port' THEN NULLIF(payload->>'smtp_port','')::integer ELSE s.smtp_port END,
    smtp_secure = CASE WHEN payload ? 'smtp_secure' THEN (payload->>'smtp_secure')::boolean ELSE s.smtp_secure END,
    smtp_username = CASE WHEN payload ? 'smtp_username' THEN NULLIF(payload->>'smtp_username','') ELSE s.smtp_username END,
    -- secrets: only replaced when a non-empty value is supplied
    smtp_password = CASE WHEN COALESCE(payload->>'smtp_password','') <> '' THEN payload->>'smtp_password' ELSE s.smtp_password END,
    api_key = CASE WHEN COALESCE(payload->>'api_key','') <> '' THEN payload->>'api_key' ELSE s.api_key END,
    api_enabled = CASE WHEN payload ? 'api_enabled' THEN (payload->>'api_enabled')::boolean ELSE s.api_enabled END,
    api_provider = CASE WHEN payload ? 'api_provider' THEN NULLIF(payload->>'api_provider','') ELSE s.api_provider END,
    api_endpoint = CASE WHEN payload ? 'api_endpoint' THEN NULLIF(payload->>'api_endpoint','') ELSE s.api_endpoint END,
    from_email = CASE WHEN payload ? 'from_email' THEN NULLIF(payload->>'from_email','') ELSE s.from_email END,
    from_name = CASE WHEN payload ? 'from_name' THEN NULLIF(payload->>'from_name','') ELSE s.from_name END,
    reply_to = CASE WHEN payload ? 'reply_to' THEN NULLIF(payload->>'reply_to','') ELSE s.reply_to END,
    signature_ar = CASE WHEN payload ? 'signature_ar' THEN NULLIF(payload->>'signature_ar','') ELSE s.signature_ar END,
    signature_en = CASE WHEN payload ? 'signature_en' THEN NULLIF(payload->>'signature_en','') ELSE s.signature_en END,
    updated_at = now()
  WHERE s.id = 1;
END;
$$;
REVOKE ALL ON FUNCTION public.update_email_settings_admin(jsonb) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.update_email_settings_admin(jsonb) TO authenticated;

-- ============================================================
-- Digital inventory protection + duplicate order protection
-- ============================================================
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS idempotency_key text;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS guest_token text;
CREATE UNIQUE INDEX IF NOT EXISTS orders_idempotency_key_uidx ON public.orders (idempotency_key) WHERE idempotency_key IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS orders_guest_token_uidx ON public.orders (guest_token) WHERE guest_token IS NOT NULL;

CREATE OR REPLACE FUNCTION public.tg_order_items_check_digital_stock()
RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $$
DECLARE p_type public.product_type; avail int; reserved int;
BEGIN
  IF NEW.product_id IS NULL THEN RETURN NEW; END IF;
  SELECT type INTO p_type FROM public.products WHERE id = NEW.product_id;
  IF p_type NOT IN ('digital','subscription') THEN RETURN NEW; END IF;

  SELECT count(*) INTO avail FROM public.digital_codes
    WHERE product_id = NEW.product_id AND is_used = false;

  SELECT COALESCE(SUM(oi.quantity - COALESCE(jsonb_array_length(oi.delivered_codes),0)),0)
    INTO reserved
  FROM public.order_items oi
  JOIN public.orders o ON o.id = oi.order_id
  WHERE oi.product_id = NEW.product_id
    AND oi.id <> NEW.id
    AND o.status::text NOT IN ('cancelled','refunded');

  IF avail < reserved + NEW.quantity THEN
    RAISE EXCEPTION 'digital_stock_unavailable'
      USING HINT = 'Not enough digital codes available for this product';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS order_items_check_digital_stock ON public.order_items;
CREATE TRIGGER order_items_check_digital_stock
  BEFORE INSERT ON public.order_items
  FOR EACH ROW EXECUTE FUNCTION public.tg_order_items_check_digital_stock();

-- Digital availability for the storefront (no code values exposed)
CREATE OR REPLACE FUNCTION public.digital_stock_available(_product_id uuid)
RETURNS integer
LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public'
AS $$
  SELECT GREATEST(
    (SELECT count(*) FROM public.digital_codes WHERE product_id = _product_id AND is_used = false)
    - COALESCE((SELECT SUM(oi.quantity - COALESCE(jsonb_array_length(oi.delivered_codes),0))
                FROM public.order_items oi JOIN public.orders o ON o.id = oi.order_id
                WHERE oi.product_id = _product_id AND o.status::text NOT IN ('cancelled','refunded')), 0)
  , 0)::integer;
$$;
REVOKE ALL ON FUNCTION public.digital_stock_available(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.digital_stock_available(uuid) TO anon, authenticated, service_role;