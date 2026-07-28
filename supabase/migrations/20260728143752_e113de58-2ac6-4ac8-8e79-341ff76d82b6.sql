ALTER TABLE public.email_settings
  ADD COLUMN IF NOT EXISTS api_enabled boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS api_provider text,
  ADD COLUMN IF NOT EXISTS api_key text,
  ADD COLUMN IF NOT EXISTS api_endpoint text;

CREATE OR REPLACE FUNCTION public.update_email_settings_admin(payload jsonb)
 RETURNS email_settings
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'private'
AS $function$
DECLARE result public.email_settings;
BEGIN
  IF NOT private.has_role(auth.uid(), 'admin'::public.app_role) THEN
    RAISE EXCEPTION 'not authorized';
  END IF;
  UPDATE public.email_settings s SET
    smtp_enabled = CASE WHEN payload ? 'smtp_enabled' THEN (payload->>'smtp_enabled')::boolean ELSE s.smtp_enabled END,
    smtp_host = CASE WHEN payload ? 'smtp_host' THEN NULLIF(payload->>'smtp_host','') ELSE s.smtp_host END,
    smtp_port = CASE WHEN payload ? 'smtp_port' THEN NULLIF(payload->>'smtp_port','')::integer ELSE s.smtp_port END,
    smtp_secure = CASE WHEN payload ? 'smtp_secure' THEN (payload->>'smtp_secure')::boolean ELSE s.smtp_secure END,
    smtp_username = CASE WHEN payload ? 'smtp_username' THEN NULLIF(payload->>'smtp_username','') ELSE s.smtp_username END,
    smtp_password = CASE WHEN payload ? 'smtp_password' THEN NULLIF(payload->>'smtp_password','') ELSE s.smtp_password END,
    api_enabled = CASE WHEN payload ? 'api_enabled' THEN (payload->>'api_enabled')::boolean ELSE s.api_enabled END,
    api_provider = CASE WHEN payload ? 'api_provider' THEN NULLIF(payload->>'api_provider','') ELSE s.api_provider END,
    api_key = CASE WHEN payload ? 'api_key' THEN NULLIF(payload->>'api_key','') ELSE s.api_key END,
    api_endpoint = CASE WHEN payload ? 'api_endpoint' THEN NULLIF(payload->>'api_endpoint','') ELSE s.api_endpoint END,
    from_email = CASE WHEN payload ? 'from_email' THEN NULLIF(payload->>'from_email','') ELSE s.from_email END,
    from_name = CASE WHEN payload ? 'from_name' THEN NULLIF(payload->>'from_name','') ELSE s.from_name END,
    reply_to = CASE WHEN payload ? 'reply_to' THEN NULLIF(payload->>'reply_to','') ELSE s.reply_to END,
    signature_ar = CASE WHEN payload ? 'signature_ar' THEN NULLIF(payload->>'signature_ar','') ELSE s.signature_ar END,
    signature_en = CASE WHEN payload ? 'signature_en' THEN NULLIF(payload->>'signature_en','') ELSE s.signature_en END,
    updated_at = now()
  WHERE s.id = 1
  RETURNING * INTO result;
  RETURN result;
END;
$function$;

REVOKE EXECUTE ON FUNCTION public.update_email_settings_admin(jsonb) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.update_email_settings_admin(jsonb) TO authenticated;

INSERT INTO private.cron_keys (name, value)
VALUES ('email_dispatch', encode(gen_random_bytes(24), 'hex'))
ON CONFLICT (name) DO NOTHING;