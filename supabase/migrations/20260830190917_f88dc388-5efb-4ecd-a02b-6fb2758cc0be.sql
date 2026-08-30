-- B1: remove any simulation leftovers from payment method settings
UPDATE public.payment_methods
SET config = config - 'simulation' - 'simulation_enabled' - 'allow_simulation' - 'test_simulation'
WHERE config ?| array['simulation','simulation_enabled','allow_simulation','test_simulation'];

-- B2: payment_attempts is the single source of truth; stop dual writes
CREATE OR REPLACE FUNCTION public.finalize_payment_attempt(
  _attempt_id uuid,
  _external_payment_id text,
  _payment_brand text,
  _source text,
  _provider_code text DEFAULT NULL,
  _sanitized_payload jsonb DEFAULT '{}'::jsonb
) RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  a public.payment_attempts%ROWTYPE;
  o public.orders%ROWTYPE;
BEGIN
  SELECT * INTO a FROM public.payment_attempts WHERE id = _attempt_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'payment_attempt_not_found'; END IF;
  SELECT * INTO o FROM public.orders WHERE id = a.order_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'order_not_found'; END IF;
  IF a.state = 'succeeded' THEN RETURN false; END IF;
  IF a.state IN ('cancelled','expired','refunded') THEN RAISE EXCEPTION 'payment_attempt_not_payable'; END IF;
  IF _external_payment_id IS NULL OR btrim(_external_payment_id) = '' THEN RAISE EXCEPTION 'external_payment_id_required'; END IF;
  IF round(a.expected_amount, 3) <> round(o.total, 3) THEN RAISE EXCEPTION 'amount_mismatch'; END IF;
  IF upper(a.currency) <> upper(o.currency) THEN RAISE EXCEPTION 'currency_mismatch'; END IF;
  IF a.merchant_reference <> o.order_number THEN RAISE EXCEPTION 'reference_mismatch'; END IF;
  IF o.payment_status::text = 'refunded' OR o.status::text IN ('cancelled','refunded') THEN RAISE EXCEPTION 'order_not_payable'; END IF;

  UPDATE public.payment_attempts
  SET state = 'succeeded', external_payment_id = _external_payment_id,
      payment_brand = _payment_brand, failure_code = NULL, failure_reason = NULL,
      succeeded_at = COALESCE(succeeded_at, now()), updated_at = now()
  WHERE id = a.id;

  INSERT INTO public.payment_events(attempt_id, event_type, source, provider_code, message, sanitized_payload)
  VALUES (a.id, 'payment_succeeded', _source, _provider_code, 'Payment verified and finalized', COALESCE(_sanitized_payload, '{}'::jsonb));

  UPDATE public.orders
  SET payment_status = 'succeeded', status = 'paid', paid_at = COALESCE(paid_at, now()),
      payment_method = upper(a.provider), payment_reference = _external_payment_id
  WHERE id = o.id AND payment_status::text <> 'succeeded';
  RETURN true;
END;
$$;
REVOKE ALL ON FUNCTION public.finalize_payment_attempt(uuid,text,text,text,text,jsonb) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.finalize_payment_attempt(uuid,text,text,text,text,jsonb) TO service_role;

CREATE OR REPLACE FUNCTION public.finalize_payment_refund(
  _refund_id uuid,
  _provider_refund_id text,
  _provider_code text DEFAULT NULL
) RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  r public.payment_refunds%ROWTYPE;
  a public.payment_attempts%ROWTYPE;
  refunded_total numeric(18,3);
  is_full boolean;
BEGIN
  SELECT * INTO r FROM public.payment_refunds WHERE id = _refund_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'refund_not_found'; END IF;
  IF r.state = 'succeeded' THEN RETURN false; END IF;
  SELECT * INTO a FROM public.payment_attempts WHERE id = r.attempt_id FOR UPDATE;
  IF NOT FOUND OR a.state NOT IN ('succeeded','refunded') THEN RAISE EXCEPTION 'payment_not_refundable'; END IF;
  IF upper(r.currency) <> upper(a.currency) THEN RAISE EXCEPTION 'currency_mismatch'; END IF;

  UPDATE public.payment_refunds
  SET state = 'succeeded', provider_refund_id = _provider_refund_id,
      failure_code = NULL, failure_reason = NULL, processed_at = now(), updated_at = now()
  WHERE id = r.id;

  SELECT COALESCE(sum(amount), 0) INTO refunded_total
  FROM public.payment_refunds WHERE attempt_id = a.id AND state = 'succeeded';
  is_full := round(refunded_total, 3) >= round(a.expected_amount, 3);

  INSERT INTO public.payment_events(attempt_id, event_type, source, provider_code, message, sanitized_payload)
  VALUES (a.id, 'refund_succeeded', 'refund', _provider_code, r.reason, jsonb_build_object('refund_id', r.id, 'amount', r.amount));

  IF is_full THEN
    UPDATE public.payment_attempts SET state = 'refunded', updated_at = now() WHERE id = a.id;
    UPDATE public.orders SET payment_status = 'refunded', status = 'refunded' WHERE id = a.order_id;
  END IF;
  RETURN true;
END;
$$;
REVOKE ALL ON FUNCTION public.finalize_payment_refund(uuid,text,text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.finalize_payment_refund(uuid,text,text) TO service_role;

-- Legacy table becomes read-only (data preserved)
REVOKE INSERT, UPDATE, DELETE ON public.payment_transactions FROM authenticated;
REVOKE INSERT, UPDATE, DELETE ON public.payment_transactions FROM anon;

-- Unified read-only history: new attempts + refunds + legacy rows
CREATE OR REPLACE VIEW public.payment_ledger
WITH (security_invoker = on) AS
SELECT
  a.id,
  'attempt'::text AS record_source,
  a.order_id,
  a.provider,
  COALESCE(a.external_payment_id, a.external_checkout_id) AS reference,
  a.expected_amount AS amount,
  a.currency,
  CASE a.state WHEN 'succeeded' THEN 'succeeded' WHEN 'refunded' THEN 'refunded'
       WHEN 'failed' THEN 'failed' WHEN 'cancelled' THEN 'failed' WHEN 'expired' THEN 'failed'
       ELSE 'pending' END AS status,
  a.payment_brand AS payment_method,
  a.failure_reason,
  a.succeeded_at AS paid_at,
  a.created_at
FROM public.payment_attempts a
UNION ALL
SELECT
  r.id,
  'refund'::text,
  a.order_id,
  a.provider,
  r.provider_refund_id,
  -r.amount,
  r.currency,
  CASE r.state WHEN 'succeeded' THEN 'refunded' WHEN 'failed' THEN 'failed' ELSE 'pending' END,
  upper(a.provider) || ' refund',
  r.failure_reason,
  r.processed_at,
  r.created_at
FROM public.payment_refunds r
JOIN public.payment_attempts a ON a.id = r.attempt_id
UNION ALL
SELECT
  t.id,
  'legacy'::text,
  t.order_id,
  t.provider,
  COALESCE(t.provider_payment_id, t.provider_charge_id),
  t.amount,
  t.currency,
  t.status,
  t.payment_method,
  t.failure_reason,
  t.paid_at,
  t.created_at
FROM public.payment_transactions t
WHERE NOT EXISTS (
  SELECT 1 FROM public.payment_attempts pa WHERE pa.legacy_transaction_id = t.id
);

GRANT SELECT ON public.payment_ledger TO authenticated;
GRANT SELECT ON public.payment_ledger TO service_role;