CREATE OR REPLACE FUNCTION public.admin_set_payment_config(_id uuid, _config jsonb)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE current jsonb; merged jsonb;
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin'::public.app_role) THEN RAISE EXCEPTION 'not_authorized'; END IF;
  SELECT COALESCE(config, '{}'::jsonb) INTO current FROM public.payment_methods WHERE id = _id;
  IF current IS NULL THEN RAISE EXCEPTION 'payment_method_not_found'; END IF;
  SELECT COALESCE(jsonb_object_agg(k, CASE WHEN v = '***set***' THEN current -> k ELSE to_jsonb(v) END), '{}'::jsonb)
    INTO merged
    FROM jsonb_each_text(COALESCE(_config, '{}'::jsonb)) AS t(k, v);
  UPDATE public.payment_methods SET config = merged, updated_at = now() WHERE id = _id;
END;
$function$;

REVOKE ALL ON FUNCTION public.admin_set_payment_config(uuid, jsonb) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.admin_set_payment_config(uuid, jsonb) TO authenticated;