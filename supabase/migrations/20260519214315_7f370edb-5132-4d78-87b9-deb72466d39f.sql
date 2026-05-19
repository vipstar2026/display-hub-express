
-- Public bucket for vendor + product images
INSERT INTO storage.buckets (id, name, public)
VALUES ('vendor-assets', 'vendor-assets', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Public read vendor-assets"
ON storage.objects FOR SELECT
USING (bucket_id = 'vendor-assets');

CREATE POLICY "Auth users upload own folder vendor-assets"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'vendor-assets'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Auth users update own folder vendor-assets"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'vendor-assets'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Auth users delete own folder vendor-assets"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'vendor-assets'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Auto-grant 'vendor' role on vendor creation
CREATE OR REPLACE FUNCTION public.grant_vendor_role()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.owner_id, 'vendor')
  ON CONFLICT (user_id, role) DO NOTHING;
  RETURN NEW;
END;
$$;
REVOKE EXECUTE ON FUNCTION public.grant_vendor_role() FROM PUBLIC, anon, authenticated;

CREATE TRIGGER trg_grant_vendor_role
AFTER INSERT ON public.vendors
FOR EACH ROW EXECUTE FUNCTION public.grant_vendor_role();
