UPDATE public.products
SET name_en = trim(name_ar),
    name_ur = COALESCE(NULLIF(trim(name_ur), ''), trim(name_ar)),
    name_bn = COALESCE(NULLIF(trim(name_bn), ''), trim(name_ar))
WHERE slug = 'product-2'
  AND (name_en IS NULL OR trim(name_en) = '');