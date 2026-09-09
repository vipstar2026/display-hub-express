REVOKE SELECT ON public.products FROM anon;
REVOKE SELECT ON public.products FROM authenticated;

GRANT SELECT (id, slug, sku, barcode, name_ar, name_en, name_ur, name_bn,
  description_ar, description_en, description_ur, description_bn,
  category_id, type, status, price, compare_price, currency, stock,
  track_stock, weight_grams, images, features, is_featured, created_at, updated_at)
ON public.products TO anon, authenticated;