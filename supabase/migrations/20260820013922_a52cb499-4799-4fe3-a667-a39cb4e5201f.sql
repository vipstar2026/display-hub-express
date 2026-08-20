ALTER TABLE public.payment_transactions
  ADD COLUMN IF NOT EXISTS provider_checkout_id text,
  ADD COLUMN IF NOT EXISTS provider_payment_id text;

-- Backfill: for settled AFS rows the gateway's own id lives in raw_response.id.
UPDATE public.payment_transactions
SET provider_payment_id = COALESCE(provider_payment_id, raw_response->>'id')
WHERE provider = 'afs'
  AND status IN ('succeeded','refunded')
  AND provider_payment_id IS NULL
  AND raw_response->>'id' IS NOT NULL;

-- Pending rows were created with the checkout id in provider_charge_id.
UPDATE public.payment_transactions
SET provider_checkout_id = COALESCE(provider_checkout_id, provider_charge_id)
WHERE provider = 'afs' AND provider_checkout_id IS NULL;

CREATE INDEX IF NOT EXISTS payment_transactions_afs_checkout_idx
  ON public.payment_transactions (provider, provider_checkout_id);
CREATE INDEX IF NOT EXISTS payment_transactions_afs_payment_idx
  ON public.payment_transactions (provider, provider_payment_id);