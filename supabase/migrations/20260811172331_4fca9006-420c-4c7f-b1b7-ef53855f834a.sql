ALTER FUNCTION public.enqueue_email(text, jsonb) SET search_path = pgmq, public;
ALTER FUNCTION public.read_email_batch(text, integer, integer) SET search_path = pgmq, public;
ALTER FUNCTION public.delete_email(text, bigint) SET search_path = pgmq, public;
ALTER FUNCTION public.move_to_dlq(text, text, bigint, jsonb) SET search_path = pgmq, public;

DROP POLICY IF EXISTS coupon_usage_self_insert ON public.coupon_usage;
CREATE POLICY coupon_usage_self_insert ON public.coupon_usage
FOR INSERT TO authenticated
WITH CHECK (
  user_id = auth.uid()
  AND order_id IS NOT NULL
  AND EXISTS (
    SELECT 1 FROM public.orders o
    WHERE o.id = coupon_usage.order_id
      AND o.buyer_id = auth.uid()
      AND o.coupon_id = coupon_usage.coupon_id
      AND round(o.discount, 3) = round(coupon_usage.discount_amount, 3)
  )
);