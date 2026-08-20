CREATE TABLE public.payment_attempts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL REFERENCES public.orders(id) ON DELETE RESTRICT,
  payment_method_id uuid REFERENCES public.payment_methods(id) ON DELETE SET NULL,
  legacy_transaction_id uuid UNIQUE REFERENCES public.payment_transactions(id) ON DELETE SET NULL,
  provider text NOT NULL,
  kind text NOT NULL CHECK (kind IN ('gateway','manual','cash')),
  state text NOT NULL DEFAULT 'created' CHECK (state IN ('created','awaiting_customer','processing','succeeded','failed','cancelled','expired','requires_review','refunded')),
  attempt_key text NOT NULL UNIQUE,
  expected_amount numeric(18,3) NOT NULL CHECK (expected_amount >= 0),
  currency text NOT NULL,
  merchant_reference text NOT NULL,
  external_checkout_id text,
  external_payment_id text,
  payment_brand text,
  failure_code text,
  failure_reason text,
  customer_return_url text,
  expires_at timestamptz,
  succeeded_at timestamptz,
  failed_at timestamptz,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.payment_attempts TO authenticated;
GRANT ALL ON public.payment_attempts TO service_role;
ALTER TABLE public.payment_attempts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "customers view own payment attempts" ON public.payment_attempts FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM public.orders o WHERE o.id = payment_attempts.order_id AND o.buyer_id = auth.uid()));
CREATE POLICY "admins manage payment attempts" ON public.payment_attempts FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE INDEX payment_attempts_order_idx ON public.payment_attempts(order_id, created_at DESC);
CREATE INDEX payment_attempts_pending_idx ON public.payment_attempts(provider, state, created_at) WHERE state IN ('created','awaiting_customer','processing','requires_review');
CREATE UNIQUE INDEX payment_attempts_provider_checkout_uq ON public.payment_attempts(provider, external_checkout_id) WHERE external_checkout_id IS NOT NULL;
CREATE UNIQUE INDEX payment_attempts_provider_payment_uq ON public.payment_attempts(provider, external_payment_id) WHERE external_payment_id IS NOT NULL AND state = 'succeeded';

CREATE TABLE public.payment_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  attempt_id uuid NOT NULL REFERENCES public.payment_attempts(id) ON DELETE CASCADE,
  event_type text NOT NULL,
  source text NOT NULL CHECK (source IN ('checkout','customer_return','webhook','reconciliation','admin','refund','system')),
  provider_code text,
  message text,
  sanitized_payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.payment_events TO authenticated;
GRANT ALL ON public.payment_events TO service_role;
ALTER TABLE public.payment_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "customers view own payment events" ON public.payment_events FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM public.payment_attempts a JOIN public.orders o ON o.id = a.order_id WHERE a.id = payment_events.attempt_id AND o.buyer_id = auth.uid()));
CREATE POLICY "admins manage payment events" ON public.payment_events FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE INDEX payment_events_attempt_idx ON public.payment_events(attempt_id, created_at DESC);

CREATE TABLE public.payment_refunds (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  attempt_id uuid NOT NULL REFERENCES public.payment_attempts(id) ON DELETE RESTRICT,
  amount numeric(18,3) NOT NULL CHECK (amount > 0),
  currency text NOT NULL,
  state text NOT NULL DEFAULT 'created' CHECK (state IN ('created','processing','succeeded','failed','requires_review')),
  idempotency_key text NOT NULL UNIQUE,
  provider_refund_id text,
  reason text,
  failure_code text,
  failure_reason text,
  requested_by uuid,
  processed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.payment_refunds TO authenticated;
GRANT ALL ON public.payment_refunds TO service_role;
ALTER TABLE public.payment_refunds ENABLE ROW LEVEL SECURITY;
CREATE POLICY "customers view own payment refunds" ON public.payment_refunds FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM public.payment_attempts a JOIN public.orders o ON o.id = a.order_id WHERE a.id = payment_refunds.attempt_id AND o.buyer_id = auth.uid()));
CREATE POLICY "admins manage payment refunds" ON public.payment_refunds FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE UNIQUE INDEX payment_refunds_provider_ref_uq ON public.payment_refunds(provider_refund_id) WHERE provider_refund_id IS NOT NULL;

CREATE TABLE public.manual_payment_reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  attempt_id uuid NOT NULL UNIQUE REFERENCES public.payment_attempts(id) ON DELETE RESTRICT,
  proof_path text,
  customer_reference text,
  state text NOT NULL DEFAULT 'pending' CHECK (state IN ('pending','approved','rejected')),
  review_notes text,
  reviewed_by uuid,
  reviewed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.manual_payment_reviews TO authenticated;
GRANT ALL ON public.manual_payment_reviews TO service_role;
ALTER TABLE public.manual_payment_reviews ENABLE ROW LEVEL SECURITY;
CREATE POLICY "customers view own manual reviews" ON public.manual_payment_reviews FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM public.payment_attempts a JOIN public.orders o ON o.id = a.order_id WHERE a.id = manual_payment_reviews.attempt_id AND o.buyer_id = auth.uid()));
CREATE POLICY "admins manage manual reviews" ON public.manual_payment_reviews FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER payment_attempts_touch_updated BEFORE UPDATE ON public.payment_attempts FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
CREATE TRIGGER payment_refunds_touch_updated BEFORE UPDATE ON public.payment_refunds FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
CREATE TRIGGER manual_payment_reviews_touch_updated BEFORE UPDATE ON public.manual_payment_reviews FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

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

CREATE OR REPLACE FUNCTION public.reject_payment_attempt(
  _attempt_id uuid,
  _state text,
  _source text,
  _provider_code text DEFAULT NULL,
  _reason text DEFAULT NULL,
  _sanitized_payload jsonb DEFAULT '{}'::jsonb
) RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  next_state text;
BEGIN
  IF _state NOT IN ('failed','cancelled','expired','requires_review','processing','awaiting_customer') THEN
    RAISE EXCEPTION 'invalid_payment_state';
  END IF;
  next_state := _state;

  UPDATE public.payment_attempts
  SET state = next_state,
      failure_code = CASE WHEN next_state IN ('failed','requires_review') THEN _provider_code ELSE failure_code END,
      failure_reason = CASE WHEN next_state IN ('failed','requires_review') THEN _reason ELSE failure_reason END,
      failed_at = CASE WHEN next_state = 'failed' THEN COALESCE(failed_at, now()) ELSE failed_at END,
      updated_at = now()
  WHERE id = _attempt_id AND state <> 'succeeded';

  IF NOT FOUND THEN RETURN; END IF;

  INSERT INTO public.payment_events(attempt_id, event_type, source, provider_code, message, sanitized_payload)
  VALUES (_attempt_id, 'payment_' || next_state, _source, _provider_code, _reason, COALESCE(_sanitized_payload, '{}'::jsonb));
END;
$$;
REVOKE ALL ON FUNCTION public.reject_payment_attempt(uuid,text,text,text,text,jsonb) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.reject_payment_attempt(uuid,text,text,text,text,jsonb) TO service_role;