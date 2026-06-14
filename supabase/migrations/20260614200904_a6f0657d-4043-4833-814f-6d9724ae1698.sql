DROP POLICY IF EXISTS "Owners update their vendor" ON public.vendors;

CREATE POLICY "Owners update their vendor"
ON public.vendors
FOR UPDATE
TO authenticated
USING (auth.uid() = owner_id OR public.has_role(auth.uid(), 'admin'))
WITH CHECK (
  public.has_role(auth.uid(), 'admin')
  OR (
    auth.uid() = owner_id
    AND status = (
      SELECT vendors_1.status
      FROM public.vendors AS vendors_1
      WHERE vendors_1.id = vendors.id
    )
  )
);