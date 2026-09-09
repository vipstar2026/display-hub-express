/**
 * Columns of `products` that are safe to expose to the storefront.
 * `cost_price` is internal wholesale data and is deliberately excluded —
 * it is only readable server-side / through the admin RPC.
 */
export const PRODUCT_PUBLIC_COLUMNS = [
  "id",
  "slug",
  "sku",
  "barcode",
  "name_ar",
  "name_en",
  "name_ur",
  "name_bn",
  "description_ar",
  "description_en",
  "description_ur",
  "description_bn",
  "category_id",
  "type",
  "status",
  "price",
  "compare_price",
  "currency",
  "stock",
  "track_stock",
  "weight_grams",
  "images",
  "features",
  "is_featured",
  "created_at",
  "updated_at",
].join(", ");
