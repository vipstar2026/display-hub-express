
-- ============================================================
-- VIPSTAR v2.0 — Full Database Reset & Rebuild
-- ============================================================

-- 1) DROP existing trigger on auth.users (managed by us)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- 2) DROP old tables (CASCADE drops dependent policies/triggers/FKs)
DROP TABLE IF EXISTS public.support_tickets   CASCADE;
DROP TABLE IF EXISTS public.order_items       CASCADE;
DROP TABLE IF EXISTS public.orders            CASCADE;
DROP TABLE IF EXISTS public.product_images    CASCADE;
DROP TABLE IF EXISTS public.products          CASCADE;
DROP TABLE IF EXISTS public.categories        CASCADE;
DROP TABLE IF EXISTS public.addresses         CASCADE;
DROP TABLE IF EXISTS public.vendors           CASCADE;
DROP TABLE IF EXISTS public.site_settings     CASCADE;
DROP TABLE IF EXISTS public.user_roles        CASCADE;
DROP TABLE IF EXISTS public.profiles          CASCADE;

-- 3) DROP old functions
DROP FUNCTION IF EXISTS public.handle_new_user()                CASCADE;
DROP FUNCTION IF EXISTS public.grant_vendor_role()              CASCADE;
DROP FUNCTION IF EXISTS public.auto_approve_admin_vendor()      CASCADE;
DROP FUNCTION IF EXISTS public.force_product_draft_on_insert()  CASCADE;
DROP FUNCTION IF EXISTS public.prevent_admin_self_assignment()  CASCADE;
DROP FUNCTION IF EXISTS public.restrict_buyer_order_updates()   CASCADE;
DROP FUNCTION IF EXISTS public.tg_set_updated_at()              CASCADE;
DROP FUNCTION IF EXISTS private.has_role(uuid, text)            CASCADE;
DROP FUNCTION IF EXISTS private.has_role(uuid, public.app_role) CASCADE;

-- 4) DROP old types
DROP TYPE IF EXISTS public.app_role         CASCADE;
DROP TYPE IF EXISTS public.order_status     CASCADE;
DROP TYPE IF EXISTS public.product_status   CASCADE;
DROP TYPE IF EXISTS public.product_type     CASCADE;
DROP TYPE IF EXISTS public.payment_status   CASCADE;

-- ============================================================
-- SHARED HELPERS
-- ============================================================
CREATE SCHEMA IF NOT EXISTS private;

CREATE OR REPLACE FUNCTION public.tg_set_updated_at()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$;

-- ============================================================
-- ENUMS
-- ============================================================
CREATE TYPE public.app_role        AS ENUM ('admin', 'customer');
CREATE TYPE public.product_type    AS ENUM ('physical', 'digital', 'subscription');
CREATE TYPE public.product_status  AS ENUM ('draft', 'active', 'archived');
CREATE TYPE public.order_status    AS ENUM ('pending', 'paid', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded');
CREATE TYPE public.payment_status  AS ENUM ('pending', 'succeeded', 'failed', 'refunded');

-- ============================================================
-- PROFILES
-- ============================================================
CREATE TABLE public.profiles (
  id           uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name text,
  avatar_url   text,
  phone        text,
  created_at   timestamptz NOT NULL DEFAULT now(),
  updated_at   timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "profiles_self_select" ON public.profiles FOR SELECT TO authenticated USING (id = auth.uid());
CREATE POLICY "profiles_self_update" ON public.profiles FOR UPDATE TO authenticated USING (id = auth.uid()) WITH CHECK (id = auth.uid());
CREATE TRIGGER profiles_updated BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();

-- ============================================================
-- USER ROLES (separate, secure)
-- ============================================================
CREATE TABLE public.user_roles (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role       public.app_role NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role)
$$;

CREATE POLICY "roles_self_read" ON public.user_roles FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "roles_admin_all"  ON public.user_roles FOR ALL    TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- ============================================================
-- AUTO-CREATE PROFILE + ROLE ON SIGNUP
-- ============================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE is_first boolean;
BEGIN
  INSERT INTO public.profiles (id, display_name, avatar_url)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'display_name', NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
    NEW.raw_user_meta_data->>'avatar_url'
  );
  SELECT NOT EXISTS (SELECT 1 FROM public.user_roles WHERE role = 'admin') INTO is_first;
  IF is_first THEN
    INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'admin');
  END IF;
  INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'customer')
    ON CONFLICT (user_id, role) DO NOTHING;
  RETURN NEW;
END $$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================================
-- CATEGORIES
-- ============================================================
CREATE TABLE public.categories (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug        text NOT NULL UNIQUE,
  name_ar     text NOT NULL,
  name_en     text NOT NULL,
  name_ur     text,
  description text,
  icon        text,
  parent_id   uuid REFERENCES public.categories(id) ON DELETE SET NULL,
  sort_order  int  NOT NULL DEFAULT 0,
  is_active   boolean NOT NULL DEFAULT true,
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.categories TO anon, authenticated;
GRANT ALL ON public.categories TO service_role;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "categories_public_read" ON public.categories FOR SELECT TO anon, authenticated USING (is_active = true);
CREATE POLICY "categories_admin_all"   ON public.categories FOR ALL    TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE TRIGGER categories_updated BEFORE UPDATE ON public.categories
  FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();

-- ============================================================
-- PRODUCTS
-- ============================================================
CREATE TABLE public.products (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug            text NOT NULL UNIQUE,
  sku             text UNIQUE,
  name_ar         text NOT NULL,
  name_en         text NOT NULL,
  name_ur         text,
  description_ar  text,
  description_en  text,
  description_ur  text,
  category_id     uuid REFERENCES public.categories(id) ON DELETE SET NULL,
  type            public.product_type NOT NULL DEFAULT 'physical',
  status          public.product_status NOT NULL DEFAULT 'draft',
  price           numeric(12,2) NOT NULL CHECK (price >= 0),
  compare_price   numeric(12,2),
  currency        text NOT NULL DEFAULT 'USD',
  stock           int  NOT NULL DEFAULT 0,
  track_stock     boolean NOT NULL DEFAULT true,
  weight_grams    int,
  images          jsonb NOT NULL DEFAULT '[]'::jsonb,
  features        jsonb NOT NULL DEFAULT '[]'::jsonb,
  is_featured     boolean NOT NULL DEFAULT false,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX products_category_idx ON public.products(category_id);
CREATE INDEX products_status_idx   ON public.products(status);
GRANT SELECT ON public.products TO anon, authenticated;
GRANT ALL ON public.products TO service_role;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
CREATE POLICY "products_public_read" ON public.products FOR SELECT TO anon, authenticated USING (status = 'active');
CREATE POLICY "products_admin_read"  ON public.products FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "products_admin_write" ON public.products FOR ALL    TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE TRIGGER products_updated BEFORE UPDATE ON public.products
  FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();

-- ============================================================
-- IPTV / DIGITAL CODES
-- ============================================================
CREATE TABLE public.digital_codes (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id    uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  code          text NOT NULL,
  notes         text,
  is_used       boolean NOT NULL DEFAULT false,
  used_at       timestamptz,
  order_item_id uuid,
  created_at    timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX digital_codes_product_idx ON public.digital_codes(product_id, is_used);
GRANT ALL ON public.digital_codes TO service_role;
GRANT SELECT ON public.digital_codes TO authenticated;
ALTER TABLE public.digital_codes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "codes_admin_all" ON public.digital_codes FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- ============================================================
-- ADDRESSES
-- ============================================================
CREATE TABLE public.addresses (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name    text NOT NULL,
  phone        text NOT NULL,
  country      text NOT NULL,
  city         text NOT NULL,
  address_line text NOT NULL,
  postal_code  text,
  is_default   boolean NOT NULL DEFAULT false,
  created_at   timestamptz NOT NULL DEFAULT now(),
  updated_at   timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.addresses TO authenticated;
GRANT ALL ON public.addresses TO service_role;
ALTER TABLE public.addresses ENABLE ROW LEVEL SECURITY;
CREATE POLICY "addresses_self_all" ON public.addresses FOR ALL TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY "addresses_admin_read" ON public.addresses FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE TRIGGER addresses_updated BEFORE UPDATE ON public.addresses
  FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();

-- ============================================================
-- ORDERS
-- ============================================================
CREATE TABLE public.orders (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_number     text NOT NULL UNIQUE DEFAULT ('VIP-' || to_char(now(),'YYMMDD') || '-' || substr(replace(gen_random_uuid()::text,'-',''),1,6)),
  buyer_id         uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  buyer_email      text NOT NULL,
  buyer_name       text,
  buyer_phone      text,
  status           public.order_status NOT NULL DEFAULT 'pending',
  payment_status   public.payment_status NOT NULL DEFAULT 'pending',
  subtotal         numeric(12,2) NOT NULL DEFAULT 0,
  shipping         numeric(12,2) NOT NULL DEFAULT 0,
  discount         numeric(12,2) NOT NULL DEFAULT 0,
  total            numeric(12,2) NOT NULL DEFAULT 0,
  currency         text NOT NULL DEFAULT 'USD',
  shipping_address jsonb,
  notes            text,
  stripe_session_id text,
  paid_at          timestamptz,
  created_at       timestamptz NOT NULL DEFAULT now(),
  updated_at       timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX orders_buyer_idx ON public.orders(buyer_id);
CREATE INDEX orders_status_idx ON public.orders(status);
GRANT SELECT ON public.orders TO authenticated;
GRANT ALL ON public.orders TO service_role;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
CREATE POLICY "orders_self_read"  ON public.orders FOR SELECT TO authenticated USING (buyer_id = auth.uid());
CREATE POLICY "orders_admin_all"  ON public.orders FOR ALL    TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE TRIGGER orders_updated BEFORE UPDATE ON public.orders
  FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();

-- ============================================================
-- ORDER ITEMS
-- ============================================================
CREATE TABLE public.order_items (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id        uuid NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  product_id      uuid REFERENCES public.products(id) ON DELETE SET NULL,
  product_name    text NOT NULL,
  product_type    public.product_type NOT NULL,
  unit_price      numeric(12,2) NOT NULL,
  quantity        int NOT NULL CHECK (quantity > 0),
  total           numeric(12,2) NOT NULL,
  delivered_codes jsonb DEFAULT '[]'::jsonb,
  created_at      timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX order_items_order_idx ON public.order_items(order_id);
GRANT SELECT ON public.order_items TO authenticated;
GRANT ALL ON public.order_items TO service_role;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "order_items_self_read"  ON public.order_items FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.orders o WHERE o.id = order_id AND o.buyer_id = auth.uid()));
CREATE POLICY "order_items_admin_all"  ON public.order_items FOR ALL    TO authenticated
  USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- ============================================================
-- COUPONS
-- ============================================================
CREATE TABLE public.coupons (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code            text NOT NULL UNIQUE,
  discount_type   text NOT NULL CHECK (discount_type IN ('percent','fixed')),
  discount_value  numeric(12,2) NOT NULL,
  min_total       numeric(12,2) DEFAULT 0,
  max_uses        int,
  used_count      int NOT NULL DEFAULT 0,
  expires_at      timestamptz,
  is_active       boolean NOT NULL DEFAULT true,
  created_at      timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.coupons TO anon, authenticated;
GRANT ALL ON public.coupons TO service_role;
ALTER TABLE public.coupons ENABLE ROW LEVEL SECURITY;
CREATE POLICY "coupons_public_read" ON public.coupons FOR SELECT TO anon, authenticated USING (is_active = true);
CREATE POLICY "coupons_admin_all"   ON public.coupons FOR ALL    TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- ============================================================
-- REVIEWS
-- ============================================================
CREATE TABLE public.reviews (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id  uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  user_id     uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  rating      int  NOT NULL CHECK (rating BETWEEN 1 AND 5),
  title       text,
  body        text,
  is_approved boolean NOT NULL DEFAULT false,
  created_at  timestamptz NOT NULL DEFAULT now(),
  UNIQUE (product_id, user_id)
);
GRANT SELECT ON public.reviews TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.reviews TO authenticated;
GRANT ALL ON public.reviews TO service_role;
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
CREATE POLICY "reviews_public_read"  ON public.reviews FOR SELECT TO anon, authenticated USING (is_approved = true);
CREATE POLICY "reviews_self_read"    ON public.reviews FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "reviews_self_insert"  ON public.reviews FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "reviews_self_update"  ON public.reviews FOR UPDATE TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid() AND is_approved = false);
CREATE POLICY "reviews_self_delete"  ON public.reviews FOR DELETE TO authenticated USING (user_id = auth.uid());
CREATE POLICY "reviews_admin_all"    ON public.reviews FOR ALL    TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- ============================================================
-- SITE SETTINGS (singleton)
-- ============================================================
CREATE TABLE public.site_settings (
  id              int PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  site_name       text NOT NULL DEFAULT 'VIPSTAR',
  tagline_ar      text DEFAULT 'متجرك المتخصص للستلايت و IPTV',
  tagline_en      text DEFAULT 'Your specialist Satellite & IPTV store',
  tagline_ur      text DEFAULT 'سیٹلائٹ اور IPTV کا ماہر اسٹور',
  logo_url        text,
  contact_email   text DEFAULT 'pppahmed71@gmail.com',
  contact_phone   text,
  whatsapp        text,
  default_currency text NOT NULL DEFAULT 'USD',
  shipping_flat   numeric(12,2) NOT NULL DEFAULT 15,
  free_shipping_threshold numeric(12,2) DEFAULT 200,
  social_links    jsonb NOT NULL DEFAULT '{}'::jsonb,
  updated_at      timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.site_settings TO anon, authenticated;
GRANT ALL ON public.site_settings TO service_role;
ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "settings_public_read" ON public.site_settings FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "settings_admin_write" ON public.site_settings FOR ALL    TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
INSERT INTO public.site_settings (id) VALUES (1) ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- SEED CATEGORIES
-- ============================================================
INSERT INTO public.categories (slug, name_ar, name_en, name_ur, icon, sort_order) VALUES
  ('receivers',    'رسيفرات',           'Satellite Receivers', 'سیٹلائٹ ریسیورز', 'tv', 1),
  ('dishes',       'أطباق ستلايت',      'Satellite Dishes',    'سیٹلائٹ ڈشز',     'satellite', 2),
  ('lnb',          'LNB ومحولات',       'LNB & Converters',    'LNB اور کنورٹرز', 'radio', 3),
  ('cables',       'كوابل وموصلات',     'Cables & Connectors', 'کیبلز اور کنیکٹرز','cable',4),
  ('iptv',         'اشتراكات IPTV',     'IPTV Subscriptions',  'IPTV سبسکرپشنز',  'play-circle', 5),
  ('accessories',  'إكسسوارات',         'Accessories',         'لوازمات',          'package', 6)
ON CONFLICT (slug) DO NOTHING;
