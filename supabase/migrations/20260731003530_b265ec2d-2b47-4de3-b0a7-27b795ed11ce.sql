-- 1) payment_methods: no direct anon/authenticated SELECT on the base table (credentials/config columns)
DROP POLICY IF EXISTS "Anyone can view active payment methods" ON public.payment_methods;
REVOKE SELECT ON public.payment_methods FROM anon, authenticated;

-- 2) notifications: only explicit admin broadcasts are visible to all authenticated users
DROP POLICY IF EXISTS "Users read own notifications" ON public.notifications;
CREATE POLICY "Users read own notifications"
  ON public.notifications FOR SELECT
  TO authenticated
  USING (user_id = auth.uid() OR (user_id IS NULL AND type = 'broadcast'));