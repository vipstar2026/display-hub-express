
DROP POLICY IF EXISTS "Buyers update own pending orders" ON public.orders;

CREATE POLICY "Buyers update own pending orders"
ON public.orders
FOR UPDATE
TO authenticated
USING (
  (auth.uid() = buyer_id AND status = 'pending'::order_status)
  OR private.has_role(auth.uid(), 'admin'::app_role)
)
WITH CHECK (
  private.has_role(auth.uid(), 'admin'::app_role)
  OR (auth.uid() = buyer_id AND status = 'pending'::order_status)
);

CREATE POLICY "Users read own support tickets"
ON public.support_tickets
FOR SELECT
TO authenticated
USING (user_id = auth.uid());
