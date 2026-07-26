
CREATE OR REPLACE FUNCTION public.admin_list_reviews()
RETURNS TABLE (
  id uuid, product_id uuid, product_name text, product_slug text,
  user_id uuid, user_email text, rating int, title text, body text,
  is_approved boolean, created_at timestamptz
)
LANGUAGE sql SECURITY DEFINER SET search_path = public, private
AS $$
  SELECT r.id, r.product_id,
         COALESCE(p.name_en, p.name_ar) AS product_name, p.slug,
         r.user_id, u.email::text,
         r.rating, r.title, r.body, r.is_approved, r.created_at
  FROM public.reviews r
  LEFT JOIN public.products p ON p.id = r.product_id
  LEFT JOIN auth.users u ON u.id = r.user_id
  WHERE private.has_role(auth.uid(), 'admin'::public.app_role)
  ORDER BY r.created_at DESC
  LIMIT 1000;
$$;
REVOKE ALL ON FUNCTION public.admin_list_reviews() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_list_reviews() TO authenticated;

CREATE OR REPLACE FUNCTION public.admin_set_review_approved(_id uuid, _approved boolean)
RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, private
AS $$
BEGIN
  IF NOT private.has_role(auth.uid(), 'admin'::public.app_role) THEN
    RAISE EXCEPTION 'not authorized';
  END IF;
  UPDATE public.reviews SET is_approved = _approved WHERE id = _id;
END; $$;
REVOKE ALL ON FUNCTION public.admin_set_review_approved(uuid, boolean) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_set_review_approved(uuid, boolean) TO authenticated;

CREATE OR REPLACE FUNCTION public.admin_delete_review(_id uuid)
RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, private
AS $$
BEGIN
  IF NOT private.has_role(auth.uid(), 'admin'::public.app_role) THEN
    RAISE EXCEPTION 'not authorized';
  END IF;
  DELETE FROM public.reviews WHERE id = _id;
END; $$;
REVOKE ALL ON FUNCTION public.admin_delete_review(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_delete_review(uuid) TO authenticated;

CREATE OR REPLACE FUNCTION public.admin_coupon_usage_report()
RETURNS TABLE (
  id uuid, coupon_id uuid, coupon_code text,
  user_id uuid, user_email text,
  order_id uuid, order_number text, order_total numeric,
  discount_amount numeric, created_at timestamptz
)
LANGUAGE sql SECURITY DEFINER SET search_path = public, private
AS $$
  SELECT cu.id, cu.coupon_id, c.code,
         cu.user_id, u.email::text,
         cu.order_id, o.order_number, o.total,
         cu.discount_amount, cu.created_at
  FROM public.coupon_usage cu
  LEFT JOIN public.coupons c ON c.id = cu.coupon_id
  LEFT JOIN auth.users u ON u.id = cu.user_id
  LEFT JOIN public.orders o ON o.id = cu.order_id
  WHERE private.has_role(auth.uid(), 'admin'::public.app_role)
  ORDER BY cu.created_at DESC
  LIMIT 2000;
$$;
REVOKE ALL ON FUNCTION public.admin_coupon_usage_report() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_coupon_usage_report() TO authenticated;
