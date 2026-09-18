DROP POLICY IF EXISTS app_settings_public_read ON public.app_settings;

CREATE OR REPLACE FUNCTION public.public_payment_flags()
RETURNS jsonb
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT jsonb_build_object(
    'afs_enabled', COALESCE((SELECT value FROM public.app_settings WHERE key = 'afs_enabled'), 'true'::jsonb),
    'bpg_enabled', COALESCE((SELECT value FROM public.app_settings WHERE key = 'bpg_enabled'), 'true'::jsonb),
    'bpg_show_in_checkout', COALESCE((SELECT value FROM public.app_settings WHERE key = 'bpg_show_in_checkout'), 'false'::jsonb),
    'bin_routing_enabled', COALESCE((SELECT value FROM public.app_settings WHERE key = 'bin_routing_enabled'), 'true'::jsonb)
  );
$$;

REVOKE ALL ON FUNCTION public.public_payment_flags() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.public_payment_flags() TO anon, authenticated;