
CREATE TABLE public.shipping_zones (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name_ar text NOT NULL,
  name_en text NOT NULL,
  name_ur text,
  country_code text NOT NULL DEFAULT 'BH',
  regions jsonb NOT NULL DEFAULT '[]'::jsonb,
  is_active boolean NOT NULL DEFAULT true,
  sort_order int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.shipping_zones TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.shipping_zones TO authenticated;
GRANT ALL ON public.shipping_zones TO service_role;
ALTER TABLE public.shipping_zones ENABLE ROW LEVEL SECURITY;

CREATE POLICY "zones_public_read" ON public.shipping_zones
  FOR SELECT TO anon, authenticated USING (is_active = true);
CREATE POLICY "zones_admin_all" ON public.shipping_zones
  FOR ALL TO authenticated
  USING (private.has_role(auth.uid(),'admin'::public.app_role))
  WITH CHECK (private.has_role(auth.uid(),'admin'::public.app_role));

CREATE TRIGGER trg_shipping_zones_updated
  BEFORE UPDATE ON public.shipping_zones
  FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();


CREATE TABLE public.shipping_rates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  zone_id uuid NOT NULL REFERENCES public.shipping_zones(id) ON DELETE CASCADE,
  name_ar text NOT NULL,
  name_en text NOT NULL,
  name_ur text,
  method text NOT NULL DEFAULT 'standard',
  price numeric(10,3) NOT NULL DEFAULT 0,
  free_over numeric(10,3),
  min_delivery_days int NOT NULL DEFAULT 1,
  max_delivery_days int NOT NULL DEFAULT 3,
  is_active boolean NOT NULL DEFAULT true,
  sort_order int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.shipping_rates TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.shipping_rates TO authenticated;
GRANT ALL ON public.shipping_rates TO service_role;
ALTER TABLE public.shipping_rates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "rates_public_read" ON public.shipping_rates
  FOR SELECT TO anon, authenticated USING (is_active = true);
CREATE POLICY "rates_admin_all" ON public.shipping_rates
  FOR ALL TO authenticated
  USING (private.has_role(auth.uid(),'admin'::public.app_role))
  WITH CHECK (private.has_role(auth.uid(),'admin'::public.app_role));

CREATE TRIGGER trg_shipping_rates_updated
  BEFORE UPDATE ON public.shipping_rates
  FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();

INSERT INTO public.shipping_zones (name_ar, name_en, name_ur, country_code, regions, sort_order)
VALUES ('البحرين','Bahrain','بحرین','BH',
  '["Manama","Muharraq","Riffa","Hamad Town","A''ali","Isa Town","Sitra","Budaiya","Jidhafs","Sanabis"]'::jsonb, 1);

INSERT INTO public.shipping_rates (zone_id, name_ar, name_en, name_ur, method, price, free_over, min_delivery_days, max_delivery_days, sort_order)
SELECT id, 'توصيل عادي','Standard Delivery','عام ڈیلیوری','standard', 2.000, 20.000, 1, 3, 1 FROM public.shipping_zones WHERE country_code='BH';

INSERT INTO public.shipping_rates (zone_id, name_ar, name_en, name_ur, method, price, min_delivery_days, max_delivery_days, sort_order)
SELECT id, 'توصيل سريع','Express Delivery','فوری ڈیلیوری','express', 4.500, 0, 1, 2 FROM public.shipping_zones WHERE country_code='BH';
