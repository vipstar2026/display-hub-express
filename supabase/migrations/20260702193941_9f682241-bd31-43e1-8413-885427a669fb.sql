
ALTER TABLE public.payment_methods
  ADD COLUMN IF NOT EXISTS is_gateway boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS gateway_provider text,
  ADD COLUMN IF NOT EXISTS test_mode boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS credentials jsonb NOT NULL DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS config jsonb NOT NULL DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS supported_currencies text[] NOT NULL DEFAULT ARRAY['BHD']::text[],
  ADD COLUMN IF NOT EXISTS logo_url text;
