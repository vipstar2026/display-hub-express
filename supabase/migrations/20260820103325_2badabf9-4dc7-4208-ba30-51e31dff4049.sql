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
  tx_id uuid;
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

  INSERT INTO public.payment_transactions(
    order_id, provider, provider_charge_id, provider_checkout_id, provider_payment_id,
    amount, currency, status, payment_method, raw_response, paid_at
  ) VALUES (
    a.order_id, a.provider, COALESCE(a.external_checkout_id, _external_payment_id), a.external_checkout_id,
    _external_payment_id, a.expected_amount, a.currency, 'succeeded', _payment_brand,
    COALESCE(_sanitized_payload, '{}'::jsonb), now()
  ) RETURNING id INTO tx_id;

  UPDATE public.payment_attempts
  SET state = 'succeeded', external_payment_id = _external_payment_id,
      payment_brand = _payment_brand, failure_code = NULL, failure_reason = NULL,
      legacy_transaction_id = tx_id, succeeded_at = COALESCE(succeeded_at, now()), updated_at = now()
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

CREATE OR REPLACE FUNCTION public.review_manual_payment_attempt(
  _attempt_id uuid,
  _approved boolean,
  _reviewed_by uuid,
  _notes text DEFAULT NULL
) RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  a public.payment_attempts%ROWTYPE;
BEGIN
  SELECT * INTO a FROM public.payment_attempts WHERE id = _attempt_id FOR UPDATE;
  IF NOT FOUND OR a.kind <> 'manual' THEN RAISE EXCEPTION 'manual_payment_attempt_not_found'; END IF;
  IF a.state = 'succeeded' THEN RETURN; END IF;

  UPDATE public.manual_payment_reviews
  SET state = CASE WHEN _approved THEN 'approved' ELSE 'rejected' END,
      review_notes = _notes, reviewed_by = _reviewed_by, reviewed_at = now(), updated_at = now()
  WHERE attempt_id = a.id;

  IF _approved THEN
    PERFORM public.finalize_payment_attempt(a.id, 'manual:' || a.id::text, 'MANUAL', 'admin', 'approved', jsonb_build_object('reviewed_by', _reviewed_by));
  ELSE
    PERFORM public.reject_payment_attempt(a.id, 'failed', 'admin', 'rejected', COALESCE(_notes, 'Manual payment rejected'), '{}'::jsonb);
    UPDATE public.orders SET payment_status = 'failed', status = 'cancelled', admin_notes = _notes WHERE id = a.order_id AND payment_status::text <> 'succeeded';
  END IF;
END;
$$;
REVOKE ALL ON FUNCTION public.review_manual_payment_attempt(uuid,boolean,uuid,text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.review_manual_payment_attempt(uuid,boolean,uuid,text) TO service_role;

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

  INSERT INTO public.payment_transactions(order_id, provider, provider_charge_id, provider_payment_id, amount, currency, status, payment_method, paid_at)
  VALUES (a.order_id, a.provider, _provider_refund_id, _provider_refund_id, -r.amount, r.currency, 'refunded', upper(a.provider) || ' refund', now());
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