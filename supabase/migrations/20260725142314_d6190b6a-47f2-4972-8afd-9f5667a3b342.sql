
ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS shipping_rate_id uuid REFERENCES public.shipping_rates(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS shipping_method text,
  ADD COLUMN IF NOT EXISTS shipping_cost numeric(10,3) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS address_id uuid REFERENCES public.addresses(id) ON DELETE SET NULL;
