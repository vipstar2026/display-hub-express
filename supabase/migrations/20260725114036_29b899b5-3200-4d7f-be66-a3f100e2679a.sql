
ALTER TABLE public.coupons
  ADD COLUMN IF NOT EXISTS starts_at timestamptz,
  ADD COLUMN IF NOT EXISTS description text;

-- Validate coupon function respecting starts_at
CREATE OR REPLACE FUNCTION public.validate_coupon(_code text, _subtotal numeric)
RETURNS TABLE(valid boolean, coupon_id uuid, discount_type text, discount_value numeric, discount_amount numeric, message text)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  c public.coupons%ROWTYPE;
  d numeric := 0;
BEGIN
  SELECT * INTO c FROM public.coupons WHERE upper(code) = upper(_code) LIMIT 1;
  IF NOT FOUND THEN
    RETURN QUERY SELECT false, NULL::uuid, NULL::text, NULL::numeric, 0::numeric, 'invalid'::text; RETURN;
  END IF;
  IF NOT c.is_active THEN
    RETURN QUERY SELECT false, NULL::uuid, NULL::text, NULL::numeric, 0::numeric, 'inactive'::text; RETURN;
  END IF;
  IF c.starts_at IS NOT NULL AND now() < c.starts_at THEN
    RETURN QUERY SELECT false, NULL::uuid, NULL::text, NULL::numeric, 0::numeric, 'not_started'::text; RETURN;
  END IF;
  IF c.expires_at IS NOT NULL AND now() > c.expires_at THEN
    RETURN QUERY SELECT false, NULL::uuid, NULL::text, NULL::numeric, 0::numeric, 'expired'::text; RETURN;
  END IF;
  IF c.max_uses IS NOT NULL AND c.used_count >= c.max_uses THEN
    RETURN QUERY SELECT false, NULL::uuid, NULL::text, NULL::numeric, 0::numeric, 'max_uses'::text; RETURN;
  END IF;
  IF c.min_total IS NOT NULL AND _subtotal < c.min_total THEN
    RETURN QUERY SELECT false, NULL::uuid, NULL::text, NULL::numeric, 0::numeric, 'min_total'::text; RETURN;
  END IF;
  IF c.discount_type = 'percent' THEN
    d := round(_subtotal * c.discount_value / 100, 3);
  ELSE
    d := c.discount_value;
  END IF;
  IF d > _subtotal THEN d := _subtotal; END IF;
  RETURN QUERY SELECT true, c.id, c.discount_type, c.discount_value, d, 'ok'::text;
END;
$$;

GRANT EXECUTE ON FUNCTION public.validate_coupon(text, numeric) TO anon, authenticated;

-- Admin coupon management (bypass RLS)
CREATE OR REPLACE FUNCTION public.admin_list_coupons()
RETURNS SETOF public.coupons
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin'::app_role) THEN
    RAISE EXCEPTION 'forbidden';
  END IF;
  RETURN QUERY SELECT * FROM public.coupons ORDER BY created_at DESC;
END; $$;

CREATE OR REPLACE FUNCTION public.admin_upsert_coupon(_data jsonb)
RETURNS public.coupons
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  r public.coupons;
  _id uuid := NULLIF(_data->>'id','')::uuid;
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin'::app_role) THEN
    RAISE EXCEPTION 'forbidden';
  END IF;
  IF _id IS NULL THEN
    INSERT INTO public.coupons (code, description, discount_type, discount_value, min_total, max_uses, starts_at, expires_at, is_active)
    VALUES (
      upper(_data->>'code'),
      _data->>'description',
      COALESCE(_data->>'discount_type','percent'),
      COALESCE((_data->>'discount_value')::numeric, 0),
      NULLIF(_data->>'min_total','')::numeric,
      NULLIF(_data->>'max_uses','')::integer,
      NULLIF(_data->>'starts_at','')::timestamptz,
      NULLIF(_data->>'expires_at','')::timestamptz,
      COALESCE((_data->>'is_active')::boolean, true)
    ) RETURNING * INTO r;
  ELSE
    UPDATE public.coupons SET
      code = upper(_data->>'code'),
      description = _data->>'description',
      discount_type = COALESCE(_data->>'discount_type', discount_type),
      discount_value = COALESCE((_data->>'discount_value')::numeric, discount_value),
      min_total = NULLIF(_data->>'min_total','')::numeric,
      max_uses = NULLIF(_data->>'max_uses','')::integer,
      starts_at = NULLIF(_data->>'starts_at','')::timestamptz,
      expires_at = NULLIF(_data->>'expires_at','')::timestamptz,
      is_active = COALESCE((_data->>'is_active')::boolean, is_active)
    WHERE id = _id RETURNING * INTO r;
  END IF;
  RETURN r;
END; $$;

CREATE OR REPLACE FUNCTION public.admin_delete_coupon(_id uuid)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin'::app_role) THEN
    RAISE EXCEPTION 'forbidden';
  END IF;
  DELETE FROM public.coupons WHERE id = _id;
END; $$;

GRANT EXECUTE ON FUNCTION public.admin_list_coupons() TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_upsert_coupon(jsonb) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_delete_coupon(uuid) TO authenticated;

-- Customer analytics
CREATE OR REPLACE FUNCTION public.admin_customer_analytics()
RETURNS TABLE(
  buyer_email text,
  buyer_name text,
  orders_count bigint,
  total_spent numeric,
  last_order_at timestamptz,
  first_order_at timestamptz
) LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin'::app_role) THEN
    RAISE EXCEPTION 'forbidden';
  END IF;
  RETURN QUERY
  SELECT
    o.buyer_email,
    MAX(o.buyer_name),
    COUNT(*)::bigint,
    COALESCE(SUM(o.total), 0),
    MAX(o.created_at),
    MIN(o.created_at)
  FROM public.orders o
  WHERE o.buyer_email IS NOT NULL AND o.payment_status = 'paid'
  GROUP BY o.buyer_email
  ORDER BY SUM(o.total) DESC NULLS LAST;
END; $$;

GRANT EXECUTE ON FUNCTION public.admin_customer_analytics() TO authenticated;
