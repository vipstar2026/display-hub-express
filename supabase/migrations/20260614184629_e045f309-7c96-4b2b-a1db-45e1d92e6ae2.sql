DROP POLICY IF EXISTS "Owners update their vendor" ON public.vendors;

CREATE POLICY "Owners update their vendor"
ON public.vendors
FOR UPDATE
TO authenticated
USING (auth.uid() = owner_id OR public.has_role(auth.uid(), 'admin'))
WITH CHECK (
  public.has_role(auth.uid(), 'admin')
  OR (auth.uid() = owner_id AND status = (SELECT status FROM public.vendors WHERE id = vendors.id))
);