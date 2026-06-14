DROP POLICY IF EXISTS "Vendor owners insert products" ON public.vendors;
CREATE POLICY "Vendor owners insert products" ON public.vendors
FOR INSERT TO authenticated
WITH CHECK (auth.uid() = owner_id AND status = 'pending');