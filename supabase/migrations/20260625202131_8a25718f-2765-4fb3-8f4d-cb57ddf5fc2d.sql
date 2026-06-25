
-- 1) Orders: restrict buyers' update WITH CHECK to status = 'pending' or 'cancelled'
DROP POLICY IF EXISTS "Buyers update own pending orders" ON public.orders;
CREATE POLICY "Buyers update own pending orders"
ON public.orders
FOR UPDATE
TO authenticated
USING (
  ((auth.uid() = buyer_id) AND (status = 'pending'::order_status))
  OR private.has_role(auth.uid(), 'admin'::app_role)
)
WITH CHECK (
  private.has_role(auth.uid(), 'admin'::app_role)
  OR (
    auth.uid() = buyer_id
    AND status IN ('pending'::order_status, 'cancelled'::order_status)
  )
);

-- 2) Order items: explicit deny-delete policy for non-admins (admins may delete)
DROP POLICY IF EXISTS "No deletes on order items" ON public.order_items;
CREATE POLICY "No deletes on order items"
ON public.order_items
FOR DELETE
TO authenticated
USING (private.has_role(auth.uid(), 'admin'::app_role));

-- 3) Vendors: prevent owner_id transfer by non-admins
DROP POLICY IF EXISTS "Owners update their vendor" ON public.vendors;
CREATE POLICY "Owners update their vendor"
ON public.vendors
FOR UPDATE
TO authenticated
USING (
  (auth.uid() = owner_id) OR private.has_role(auth.uid(), 'admin'::app_role)
)
WITH CHECK (
  private.has_role(auth.uid(), 'admin'::app_role)
  OR (
    auth.uid() = owner_id
    AND status = (SELECT v.status FROM public.vendors v WHERE v.id = vendors.id)
    AND owner_id = (SELECT v.owner_id FROM public.vendors v WHERE v.id = vendors.id)
  )
);
