CREATE OR REPLACE FUNCTION public.reject_payment_attempt(_attempt_id uuid, _state text, _source text, _provider_code text DEFAULT NULL::text, _reason text DEFAULT NULL::text, _sanitized_payload jsonb DEFAULT '{}'::jsonb)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  next_state text;
BEGIN
  IF _state NOT IN ('failed','cancelled','expired','requires_review','processing','awaiting_customer','abandoned') THEN
    RAISE EXCEPTION 'invalid_payment_state';
  END IF;
  next_state := _state;

  UPDATE public.payment_attempts
  SET state = next_state,
      failure_code = CASE WHEN next_state IN ('failed','requires_review','abandoned') THEN _provider_code ELSE failure_code END,
      failure_reason = CASE WHEN next_state IN ('failed','requires_review','abandoned') THEN _reason ELSE failure_reason END,
      failed_at = CASE WHEN next_state IN ('failed','abandoned') THEN COALESCE(failed_at, now()) ELSE failed_at END,
      updated_at = now()
  WHERE id = _attempt_id AND state <> 'succeeded';

  IF NOT FOUND THEN RETURN; END IF;

  INSERT INTO public.payment_events(attempt_id, event_type, source, provider_code, message, sanitized_payload)
  VALUES (_attempt_id, 'payment_' || next_state, _source, _provider_code, _reason, COALESCE(_sanitized_payload, '{}'::jsonb));
END;
$function$;