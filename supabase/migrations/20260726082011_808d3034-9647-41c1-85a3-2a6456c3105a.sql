
CREATE TABLE IF NOT EXISTS public.newsletter_campaigns (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  subject_ar text, subject_en text, subject_ur text,
  body_ar text, body_en text, body_ur text,
  target_lang text,
  status text NOT NULL DEFAULT 'draft',
  audience_count integer NOT NULL DEFAULT 0,
  sent_count integer NOT NULL DEFAULT 0,
  scheduled_for timestamptz,
  sent_at timestamptz,
  notes text,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.newsletter_campaigns TO authenticated;
GRANT ALL ON public.newsletter_campaigns TO service_role;

ALTER TABLE public.newsletter_campaigns ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "admins manage newsletter campaigns" ON public.newsletter_campaigns;
CREATE POLICY "admins manage newsletter campaigns"
  ON public.newsletter_campaigns FOR ALL
  USING (private.has_role(auth.uid(), 'admin'::public.app_role))
  WITH CHECK (private.has_role(auth.uid(), 'admin'::public.app_role));

DROP TRIGGER IF EXISTS trg_newsletter_campaigns_updated ON public.newsletter_campaigns;
CREATE TRIGGER trg_newsletter_campaigns_updated
  BEFORE UPDATE ON public.newsletter_campaigns
  FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();

CREATE OR REPLACE FUNCTION public.admin_list_campaigns()
RETURNS SETOF public.newsletter_campaigns
LANGUAGE sql SECURITY DEFINER SET search_path = public, private
AS $$
  SELECT * FROM public.newsletter_campaigns
  WHERE private.has_role(auth.uid(), 'admin'::public.app_role)
  ORDER BY created_at DESC LIMIT 500;
$$;

CREATE OR REPLACE FUNCTION public.admin_campaign_audience(_lang text DEFAULT NULL)
RETURNS TABLE(email text, lang text, source text, created_at timestamptz)
LANGUAGE sql SECURITY DEFINER SET search_path = public, private
AS $$
  SELECT ns.email, ns.lang, ns.source, ns.created_at
  FROM public.newsletter_subscribers ns
  WHERE private.has_role(auth.uid(), 'admin'::public.app_role)
    AND ns.is_active = true
    AND (_lang IS NULL OR _lang = '' OR ns.lang = _lang)
  ORDER BY ns.created_at DESC;
$$;

CREATE OR REPLACE FUNCTION public.admin_mark_campaign_sent(_id uuid, _sent_count integer)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, private
AS $$
BEGIN
  IF NOT private.has_role(auth.uid(), 'admin'::public.app_role) THEN
    RAISE EXCEPTION 'not authorized';
  END IF;
  UPDATE public.newsletter_campaigns
    SET status = 'sent', sent_at = now(), sent_count = _sent_count
  WHERE id = _id;
END; $$;

REVOKE EXECUTE ON FUNCTION public.admin_list_campaigns() FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.admin_campaign_audience(text) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.admin_mark_campaign_sent(uuid, integer) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_list_campaigns() TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_campaign_audience(text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_mark_campaign_sent(uuid, integer) TO authenticated;
