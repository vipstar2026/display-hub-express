DROP POLICY IF EXISTS "Auth users upload own folder vendor-assets" ON storage.objects;
DROP POLICY IF EXISTS "Auth users update own folder vendor-assets" ON storage.objects;
DROP POLICY IF EXISTS "Auth users delete own folder vendor-assets" ON storage.objects;

CREATE POLICY "Admins upload vendor-assets"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'vendor-assets' AND public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins update vendor-assets"
ON storage.objects FOR UPDATE TO authenticated
USING (bucket_id = 'vendor-assets' AND public.has_role(auth.uid(), 'admin'))
WITH CHECK (bucket_id = 'vendor-assets' AND public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins delete vendor-assets"
ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'vendor-assets' AND public.has_role(auth.uid(), 'admin'));