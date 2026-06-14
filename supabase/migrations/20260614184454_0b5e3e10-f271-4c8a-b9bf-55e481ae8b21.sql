DROP POLICY IF EXISTS "Users create their vendor" ON public.vendors;
DROP POLICY IF EXISTS "Vendor owners insert products" ON public.vendors;

CREATE POLICY "Users insert their vendor as pending"
ON public.vendors
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = owner_id AND status = 'pending');