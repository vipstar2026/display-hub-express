
-- Enums
CREATE TYPE public.order_status AS ENUM ('pending','paid','processing','shipped','completed','cancelled');
CREATE TYPE public.order_item_status AS ENUM ('pending','processing','shipped','delivered','cancelled');

-- Addresses
CREATE TABLE public.addresses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  full_name text NOT NULL,
  phone text NOT NULL,
  line1 text NOT NULL,
  line2 text,
  city text NOT NULL,
  country text NOT NULL DEFAULT 'Qatar',
  is_default boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_addresses_user ON public.addresses(user_id);
ALTER TABLE public.addresses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own addresses" ON public.addresses
  FOR ALL USING (auth.uid() = user_id OR has_role(auth.uid(), 'admin'))
  WITH CHECK (auth.uid() = user_id);

CREATE TRIGGER trg_addresses_updated_at BEFORE UPDATE ON public.addresses
  FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();

-- Orders
CREATE TABLE public.orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  buyer_id uuid NOT NULL,
  status public.order_status NOT NULL DEFAULT 'pending',
  subtotal numeric NOT NULL DEFAULT 0,
  shipping numeric NOT NULL DEFAULT 0,
  total numeric NOT NULL DEFAULT 0,
  currency text NOT NULL DEFAULT 'QAR',
  payment_method text NOT NULL DEFAULT 'cod',
  ship_full_name text NOT NULL,
  ship_phone text NOT NULL,
  ship_line1 text NOT NULL,
  ship_line2 text,
  ship_city text NOT NULL,
  ship_country text NOT NULL,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_orders_buyer ON public.orders(buyer_id);
CREATE INDEX idx_orders_created ON public.orders(created_at DESC);
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

CREATE TRIGGER trg_orders_updated_at BEFORE UPDATE ON public.orders
  FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();

-- Order items
CREATE TABLE public.order_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  vendor_id uuid NOT NULL,
  product_id uuid NOT NULL,
  title text NOT NULL,
  image_url text,
  price numeric NOT NULL,
  qty integer NOT NULL CHECK (qty > 0),
  status public.order_item_status NOT NULL DEFAULT 'pending',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_order_items_order ON public.order_items(order_id);
CREATE INDEX idx_order_items_vendor ON public.order_items(vendor_id);
CREATE INDEX idx_order_items_product ON public.order_items(product_id);
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;

CREATE TRIGGER trg_order_items_updated_at BEFORE UPDATE ON public.order_items
  FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();

-- Orders policies
CREATE POLICY "Buyers view own orders" ON public.orders
  FOR SELECT USING (
    auth.uid() = buyer_id
    OR has_role(auth.uid(), 'admin')
    OR EXISTS (
      SELECT 1 FROM public.order_items oi
      JOIN public.vendors v ON v.id = oi.vendor_id
      WHERE oi.order_id = orders.id AND v.owner_id = auth.uid()
    )
  );

CREATE POLICY "Buyers create own orders" ON public.orders
  FOR INSERT WITH CHECK (auth.uid() = buyer_id);

CREATE POLICY "Buyers update own pending orders" ON public.orders
  FOR UPDATE USING (auth.uid() = buyer_id OR has_role(auth.uid(), 'admin'));

-- Order items policies
CREATE POLICY "View order items by buyer or vendor" ON public.order_items
  FOR SELECT USING (
    has_role(auth.uid(), 'admin')
    OR EXISTS (SELECT 1 FROM public.orders o WHERE o.id = order_items.order_id AND o.buyer_id = auth.uid())
    OR EXISTS (SELECT 1 FROM public.vendors v WHERE v.id = order_items.vendor_id AND v.owner_id = auth.uid())
  );

CREATE POLICY "Buyers insert items for own orders" ON public.order_items
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM public.orders o WHERE o.id = order_items.order_id AND o.buyer_id = auth.uid())
  );

CREATE POLICY "Vendors update their items" ON public.order_items
  FOR UPDATE USING (
    has_role(auth.uid(), 'admin')
    OR EXISTS (SELECT 1 FROM public.vendors v WHERE v.id = order_items.vendor_id AND v.owner_id = auth.uid())
  );
