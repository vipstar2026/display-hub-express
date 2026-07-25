
CREATE OR REPLACE FUNCTION public.finalize_coupon_use(_coupon_id uuid, _order_id uuid, _discount numeric)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'not_authenticated'; END IF;
  -- ensure order belongs to caller
  IF NOT EXISTS (SELECT 1 FROM public.orders WHERE id = _order_id AND buyer_id = auth.uid()) THEN
    RAISE EXCEPTION 'not_owner';
  END IF;
  INSERT INTO public.coupon_usage(coupon_id, order_id, user_id, discount_amount)
    VALUES (_coupon_id, _order_id, auth.uid(), _discount);
  UPDATE public.coupons SET used_count = used_count + 1 WHERE id = _coupon_id;
END $$;
GRANT EXECUTE ON FUNCTION public.finalize_coupon_use(uuid, uuid, numeric) TO authenticated;
