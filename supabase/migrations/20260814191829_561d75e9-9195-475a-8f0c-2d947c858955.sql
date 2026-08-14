CREATE TABLE public.payment_links (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  token text NOT NULL UNIQUE DEFAULT encode(gen_random_bytes(12), 'hex'),
  amount numeric NOT NULL CHECK (amount > 0),
  currency text NOT NULL DEFAULT 'BHD',
  customer_name text,
  customer_email text,
  customer_phone text,
  description text,
  status text NOT NULL DEFAULT 'pending',
  order_id uuid REFERENCES public.orders(id) ON DELETE SET NULL,
  paid_at timestamptz,
  expires_at timestamptz,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.payment_links TO authenticated;
GRANT ALL ON public.payment_links TO service_role;

ALTER TABLE public.payment_links ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage payment links"
ON public.payment_links FOR ALL TO authenticated
USING (private.has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (private.has_role(auth.uid(), 'admin'::app_role));

CREATE OR REPLACE FUNCTION public.touch_payment_links_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION public.touch_payment_links_updated_at() FROM PUBLIC;

CREATE TRIGGER update_payment_links_updated_at
BEFORE UPDATE ON public.payment_links
FOR EACH ROW EXECUTE FUNCTION public.touch_payment_links_updated_at();

CREATE OR REPLACE FUNCTION public.get_payment_link(_token text)
RETURNS TABLE (
  token text,
  amount numeric,
  currency text,
  description text,
  customer_name text,
  customer_email text,
  status text,
  expires_at timestamptz,
  order_id uuid
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT pl.token, pl.amount, pl.currency, pl.description, pl.customer_name,
         pl.customer_email, pl.status, pl.expires_at, pl.order_id
  FROM public.payment_links pl
  WHERE pl.token = _token
$$;

REVOKE ALL ON FUNCTION public.get_payment_link(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_payment_link(text) TO anon, authenticated, service_role;