CREATE OR REPLACE FUNCTION public.admin_customer_analytics()
RETURNS TABLE(buyer_email text, buyer_name text, orders_count bigint, total_spent numeric, last_order_at timestamp with time zone, first_order_at timestamp with time zone)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
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
  WHERE o.buyer_email IS NOT NULL AND o.payment_status = 'succeeded'::public.payment_status
  GROUP BY o.buyer_email
  ORDER BY SUM(o.total) DESC NULLS LAST;
END; $function$;