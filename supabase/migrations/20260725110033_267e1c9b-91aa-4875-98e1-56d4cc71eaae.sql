
-- ============ WISHLIST ============
CREATE TABLE public.wishlist (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, product_id)
);
GRANT SELECT, INSERT, DELETE ON public.wishlist TO authenticated;
GRANT ALL ON public.wishlist TO service_role;
ALTER TABLE public.wishlist ENABLE ROW LEVEL SECURITY;
CREATE POLICY "wishlist_owner_all" ON public.wishlist FOR ALL TO authenticated
  USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- ============ COUPON USAGE ============
CREATE TABLE public.coupon_usage (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  coupon_id uuid NOT NULL REFERENCES public.coupons(id) ON DELETE CASCADE,
  order_id uuid REFERENCES public.orders(id) ON DELETE SET NULL,
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  discount_amount numeric(12,3) NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.coupon_usage TO authenticated;
GRANT ALL ON public.coupon_usage TO service_role;
ALTER TABLE public.coupon_usage ENABLE ROW LEVEL SECURITY;
CREATE POLICY "coupon_usage_owner_read" ON public.coupon_usage FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR private.has_role(auth.uid(), 'admin'::public.app_role));
CREATE POLICY "coupon_usage_self_insert" ON public.coupon_usage FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid() OR private.has_role(auth.uid(), 'admin'::public.app_role));

-- Coupon columns on orders (if not exist)
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS coupon_id uuid REFERENCES public.coupons(id);
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS coupon_code text;

-- ============ REDEEM COUPON ============
CREATE OR REPLACE FUNCTION public.redeem_coupon(_code text, _subtotal numeric)
RETURNS TABLE(coupon_id uuid, code text, discount numeric)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE c public.coupons%ROWTYPE; disc numeric := 0;
BEGIN
  SELECT * INTO c FROM public.coupons
    WHERE upper(code) = upper(_code) AND is_active = true
      AND (expires_at IS NULL OR expires_at >= now())
      AND (max_uses IS NULL OR used_count < max_uses)
    LIMIT 1;
  IF NOT FOUND THEN RAISE EXCEPTION 'invalid_coupon'; END IF;
  IF _subtotal < c.min_total THEN RAISE EXCEPTION 'min_total_not_met'; END IF;
  IF c.discount_type = 'percent' THEN disc := round(_subtotal * c.discount_value / 100, 3);
  ELSE disc := c.discount_value; END IF;
  IF disc > _subtotal THEN disc := _subtotal; END IF;
  RETURN QUERY SELECT c.id, c.code, disc;
END $$;
GRANT EXECUTE ON FUNCTION public.redeem_coupon(text, numeric) TO authenticated, anon;

-- ============ DIGITAL CODE ASSIGNMENT ============
CREATE OR REPLACE FUNCTION public.assign_digital_codes(_order_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE it record; needed int; picked jsonb; code_ids uuid[];
BEGIN
  IF NOT (private.has_role(auth.uid(), 'admin'::public.app_role) OR auth.uid() IS NULL) THEN
    RAISE EXCEPTION 'not_authorized';
  END IF;
  FOR it IN
    SELECT id, product_id, quantity, COALESCE(jsonb_array_length(delivered_codes),0) AS delivered
    FROM public.order_items WHERE order_id = _order_id
  LOOP
    needed := it.quantity - it.delivered;
    IF needed <= 0 THEN CONTINUE; END IF;
    WITH picks AS (
      SELECT id, code FROM public.digital_codes
      WHERE product_id = it.product_id AND is_used = false
      ORDER BY created_at LIMIT needed FOR UPDATE SKIP LOCKED
    )
    SELECT jsonb_agg(jsonb_build_object('id', id, 'code', code)),
           array_agg(id) INTO picked, code_ids FROM picks;
    IF picked IS NULL OR jsonb_array_length(picked) = 0 THEN CONTINUE; END IF;
    UPDATE public.order_items SET delivered_codes =
      COALESCE(delivered_codes, '[]'::jsonb) || picked WHERE id = it.id;
    UPDATE public.digital_codes SET is_used = true, used_at = now(), order_item_id = it.id
      WHERE id = ANY(code_ids);
  END LOOP;
END $$;
GRANT EXECUTE ON FUNCTION public.assign_digital_codes(uuid) TO authenticated, service_role;

-- Trigger: auto-assign codes when order is marked paid
CREATE OR REPLACE FUNCTION public.tg_orders_on_paid()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NEW.payment_status = 'paid' AND (OLD.payment_status IS DISTINCT FROM 'paid') THEN
    PERFORM public.assign_digital_codes(NEW.id);
  END IF;
  RETURN NEW;
END $$;
DROP TRIGGER IF EXISTS trg_orders_on_paid ON public.orders;
CREATE TRIGGER trg_orders_on_paid AFTER UPDATE ON public.orders
  FOR EACH ROW EXECUTE FUNCTION public.tg_orders_on_paid();

-- ============ REVIEWS PUBLIC VIEW ============
DROP VIEW IF EXISTS public.reviews_public;
CREATE VIEW public.reviews_public
WITH (security_invoker = true) AS
SELECT r.id, r.product_id, r.rating, r.title, r.body, r.created_at,
       p.display_name AS author_name, p.avatar_url AS author_avatar
FROM public.reviews r
LEFT JOIN public.profiles p ON p.id = r.user_id
WHERE r.is_approved = true;
GRANT SELECT ON public.reviews_public TO anon, authenticated;
