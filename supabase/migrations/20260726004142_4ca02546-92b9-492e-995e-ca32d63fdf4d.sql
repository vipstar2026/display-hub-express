
-- 1) Revoke EXECUTE from PUBLIC/anon on SECURITY DEFINER functions that shouldn't be callable by anonymous users.
-- Keep publicly-callable ones: validate_coupon(*), track_order, increment_blog_views.

REVOKE EXECUTE ON FUNCTION public.admin_broadcast_notification(text, text, text, text, text) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.admin_customer_analytics() FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.admin_delete_coupon(uuid) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.admin_list_coupons() FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.admin_upsert_coupon(jsonb) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.assign_digital_codes(uuid) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.finalize_coupon_use(uuid, uuid, numeric) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.get_site_settings_admin() FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.redeem_coupon(text, numeric) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.update_site_settings_admin(jsonb) FROM PUBLIC, anon;

-- Trigger functions: revoke direct EXECUTE (they run as trigger owner regardless).
REVOKE EXECUTE ON FUNCTION public.award_loyalty_on_paid() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.tg_notify_new_contact() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.tg_notify_new_order() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.tg_notify_newsletter() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.tg_orders_on_paid() FROM PUBLIC, anon, authenticated;

-- Ensure authenticated can still call the admin/user-facing rpcs (they self-check roles).
GRANT EXECUTE ON FUNCTION public.admin_broadcast_notification(text, text, text, text, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_customer_analytics() TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_delete_coupon(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_list_coupons() TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_upsert_coupon(jsonb) TO authenticated;
GRANT EXECUTE ON FUNCTION public.finalize_coupon_use(uuid, uuid, numeric) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_site_settings_admin() TO authenticated;
GRANT EXECUTE ON FUNCTION public.redeem_coupon(text, numeric) TO authenticated;
GRANT EXECUTE ON FUNCTION public.update_site_settings_admin(jsonb) TO authenticated;

-- 2) Replace WITH CHECK (true) permissive policies with basic validation.
DROP POLICY IF EXISTS "Anyone can submit a contact message" ON public.contact_messages;
CREATE POLICY "Anyone can submit a contact message"
  ON public.contact_messages
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (
    email IS NOT NULL
    AND length(btrim(email)) BETWEEN 3 AND 320
    AND email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$'
    AND message IS NOT NULL
    AND length(btrim(message)) BETWEEN 1 AND 5000
  );

DROP POLICY IF EXISTS "Anyone can subscribe" ON public.newsletter_subscribers;
CREATE POLICY "Anyone can subscribe"
  ON public.newsletter_subscribers
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (
    email IS NOT NULL
    AND length(btrim(email)) BETWEEN 3 AND 320
    AND email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$'
  );
