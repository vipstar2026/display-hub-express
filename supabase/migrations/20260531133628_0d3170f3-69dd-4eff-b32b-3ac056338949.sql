
-- Add subcategories under Dish Antenna
INSERT INTO public.categories (name, slug, parent_id, sort_order)
SELECT 'أجهزة الاستقبال', 'dish-receivers', id, 1 FROM public.categories WHERE slug='dish'
ON CONFLICT (slug) DO NOTHING;

INSERT INTO public.categories (name, slug, parent_id, sort_order)
SELECT 'كابلات وأسلاك', 'dish-cables', id, 2 FROM public.categories WHERE slug='dish'
ON CONFLICT (slug) DO NOTHING;

INSERT INTO public.categories (name, slug, parent_id, sort_order)
SELECT 'أطباق وملحقات', 'dish-accessories', id, 3 FROM public.categories WHERE slug='dish'
ON CONFLICT (slug) DO NOTHING;

-- Move existing dish products (all are dishes/LNB) into the accessories subcategory
UPDATE public.products
SET category_id = (SELECT id FROM public.categories WHERE slug='dish-accessories')
WHERE category_id = (SELECT id FROM public.categories WHERE slug='dish');
