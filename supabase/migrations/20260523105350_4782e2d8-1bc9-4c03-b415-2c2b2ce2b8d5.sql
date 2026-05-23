CREATE TABLE IF NOT EXISTS public.site_settings (
  key TEXT PRIMARY KEY,
  value JSONB NOT NULL DEFAULT '{}'::jsonb,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_by UUID
);

ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Site settings public read" ON public.site_settings FOR SELECT USING (true);
CREATE POLICY "Admins manage site settings" ON public.site_settings FOR ALL
  USING (public.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

INSERT INTO public.site_settings (key, value) VALUES
  ('hero', '{"title":"VIP STAR","subtitle":"Premium IPTV, Dish & CCTV solutions","cta_label":"Shop now","cta_link":"/iptv"}'::jsonb),
  ('contact', '{"phone":"","email":"","whatsapp":"","address":"Doha, Qatar"}'::jsonb),
  ('social', '{"facebook":"","instagram":"","twitter":"","youtube":""}'::jsonb),
  ('announcement', '{"enabled":false,"message":"","link":""}'::jsonb)
ON CONFLICT (key) DO NOTHING;