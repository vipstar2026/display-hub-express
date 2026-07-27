REVOKE ALL ON FUNCTION public.increment_blog_views(text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.track_order(text, text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.validate_coupon(text, numeric) FROM PUBLIC;

GRANT EXECUTE ON FUNCTION public.increment_blog_views(text) TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.track_order(text, text) TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.validate_coupon(text, numeric) TO anon, authenticated, service_role;

-- Harden inputs so these public helpers cannot be abused for enumeration/abuse
CREATE OR REPLACE FUNCTION public.increment_blog_views(_slug text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  IF _slug IS NULL OR length(_slug) = 0 OR length(_slug) > 200 THEN
    RETURN;
  END IF;
  UPDATE public.blog_posts
  SET views = views + 1
  WHERE slug = _slug
    AND status = 'published'
    AND (published_at IS NULL OR published_at <= now());
END;
$function$;

CREATE OR REPLACE FUNCTION public.track_order(_order_number text, _email text)
RETURNS TABLE(order_number text, status text, payment_status text, total numeric, currency text, created_at timestamp with time zone, updated_at timestamp with time zone, items jsonb)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
  SELECT o.order_number, o.status::text, o.payment_status::text, o.total, o.currency,
         o.created_at, o.updated_at,
         COALESCE((SELECT jsonb_agg(jsonb_build_object(
           'product_name', oi.product_name,
           'quantity', oi.quantity,
           'unit_price', oi.unit_price
         )) FROM public.order_items oi WHERE oi.order_id = o.id), '[]'::jsonb) AS items
  FROM public.orders o
  WHERE _order_number IS NOT NULL AND length(_order_number) BETWEEN 3 AND 64
    AND _email IS NOT NULL AND length(_email) BETWEEN 5 AND 254 AND position('@' in _email) > 1
    AND o.order_number = _order_number
    AND lower(o.buyer_email) = lower(_email)
  LIMIT 1
$function$;

REVOKE ALL ON FUNCTION public.increment_blog_views(text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.track_order(text, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.increment_blog_views(text) TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.track_order(text, text) TO anon, authenticated, service_role;