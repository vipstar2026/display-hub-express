CREATE TABLE public.email_settings (
  id integer PRIMARY KEY DEFAULT 1,
  smtp_enabled boolean NOT NULL DEFAULT false,
  smtp_host text,
  smtp_port integer DEFAULT 587,
  smtp_secure boolean NOT NULL DEFAULT true,
  smtp_username text,
  smtp_password text,
  from_email text,
  from_name text,
  reply_to text,
  signature_ar text,
  signature_en text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT email_settings_singleton CHECK (id = 1)
);

GRANT ALL ON public.email_settings TO service_role;
ALTER TABLE public.email_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "admins manage email settings" ON public.email_settings
  FOR ALL TO authenticated
  USING (private.has_role(auth.uid(), 'admin'::public.app_role))
  WITH CHECK (private.has_role(auth.uid(), 'admin'::public.app_role));

CREATE TRIGGER email_settings_touch BEFORE UPDATE ON public.email_settings
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

INSERT INTO public.email_settings (id) VALUES (1);

CREATE OR REPLACE FUNCTION public.get_email_settings_admin()
RETURNS SETOF public.email_settings
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public, private
AS $$
  SELECT * FROM public.email_settings
  WHERE private.has_role(auth.uid(), 'admin'::public.app_role)
  LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION public.update_email_settings_admin(payload jsonb)
RETURNS public.email_settings
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, private
AS $$
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
$$;

REVOKE ALL ON FUNCTION public.get_email_settings_admin() FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.update_email_settings_admin(jsonb) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_email_settings_admin() TO authenticated;
GRANT EXECUTE ON FUNCTION public.update_email_settings_admin(jsonb) TO authenticated;