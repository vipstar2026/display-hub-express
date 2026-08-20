ALTER TABLE public.payment_attempts DROP CONSTRAINT IF EXISTS payment_attempts_state_check;
ALTER TABLE public.payment_attempts ADD CONSTRAINT payment_attempts_state_check CHECK (state = ANY (ARRAY['created','awaiting_customer','processing','succeeded','failed','cancelled','expired','requires_review','refunded','abandoned']));

CREATE OR REPLACE FUNCTION public.abandon_stale_payment_attempts(_minutes integer DEFAULT 30)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE _count integer;
BEGIN
  UPDATE public.payment_attempts
     SET state = 'abandoned',
         failure_code = COALESCE(failure_code, 'checkout_session_expired'),
         failure_reason = COALESCE(failure_reason, 'shopper never completed the hosted card page'),
         failed_at = COALESCE(failed_at, now()),
         updated_at = now()
   WHERE state IN ('created','awaiting_customer','processing')
     AND created_at < now() - make_interval(mins => _minutes);
  GET DIAGNOSTICS _count = ROW_COUNT;
  RETURN _count;
END;
$$;

REVOKE ALL ON FUNCTION public.abandon_stale_payment_attempts(integer) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.abandon_stale_payment_attempts(integer) TO service_role;

SELECT public.abandon_stale_payment_attempts(30);