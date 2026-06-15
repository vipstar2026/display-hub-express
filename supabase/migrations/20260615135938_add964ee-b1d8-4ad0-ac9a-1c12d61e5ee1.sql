DROP POLICY IF EXISTS "Admins or owner delete vendor" ON public.vendors;
CREATE POLICY "Admins delete vendor" ON public.vendors
FOR DELETE TO authenticated
USING (private.has_role(auth.uid(), 'admin'::app_role));