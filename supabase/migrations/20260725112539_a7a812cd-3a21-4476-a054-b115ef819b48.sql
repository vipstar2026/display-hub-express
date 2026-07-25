
CREATE OR REPLACE FUNCTION public.track_order(_order_number text, _email text)
RETURNS TABLE (
  order_number text,
  status text,
  payment_status text,
  total numeric,
  currency text,
  created_at timestamptz,
  updated_at timestamptz,
  items jsonb
)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT o.order_number, o.status::text, o.payment_status::text, o.total, o.currency,
         o.created_at, o.updated_at,
         COALESCE((SELECT jsonb_agg(jsonb_build_object(
           'product_name', oi.product_name,
           'quantity', oi.quantity,
           'unit_price', oi.unit_price
         )) FROM public.order_items oi WHERE oi.order_id = o.id), '[]'::jsonb) AS items
  FROM public.orders o
  WHERE o.order_number = _order_number
    AND lower(o.buyer_email) = lower(_email)
  LIMIT 1
$$;

GRANT EXECUTE ON FUNCTION public.track_order(text, text) TO anon, authenticated;

CREATE TABLE IF NOT EXISTS public.loyalty_points (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  buyer_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  order_id uuid REFERENCES public.orders(id) ON DELETE SET NULL,
  points integer NOT NULL,
  reason text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.loyalty_points TO authenticated;
GRANT ALL ON public.loyalty_points TO service_role;

ALTER TABLE public.loyalty_points ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users read own loyalty points"
ON public.loyalty_points FOR SELECT TO authenticated
USING (auth.uid() = buyer_id);

CREATE INDEX IF NOT EXISTS idx_loyalty_buyer ON public.loyalty_points(buyer_id);

CREATE OR REPLACE VIEW public.loyalty_balance
WITH (security_invoker = true) AS
SELECT buyer_id, COALESCE(SUM(points), 0)::integer AS balance
FROM public.loyalty_points
GROUP BY buyer_id;

GRANT SELECT ON public.loyalty_balance TO authenticated;

CREATE OR REPLACE FUNCTION public.award_loyalty_on_paid()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NEW.payment_status::text = 'succeeded'
     AND (OLD.payment_status::text IS DISTINCT FROM 'succeeded')
     AND NEW.buyer_id IS NOT NULL THEN
    INSERT INTO public.loyalty_points (buyer_id, order_id, points, reason)
    VALUES (NEW.buyer_id, NEW.id, FLOOR(NEW.total)::integer, 'order:' || NEW.order_number);
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_award_loyalty ON public.orders;
CREATE TRIGGER trg_award_loyalty
AFTER UPDATE OF payment_status ON public.orders
FOR EACH ROW EXECUTE FUNCTION public.award_loyalty_on_paid();

INSERT INTO public.loyalty_points (buyer_id, order_id, points, reason)
SELECT buyer_id, id, FLOOR(total)::integer, 'order:' || order_number
FROM public.orders o
WHERE payment_status::text = 'succeeded'
  AND buyer_id IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM public.loyalty_points lp WHERE lp.order_id = o.id);
