// productsModel.js
// Checks existence of `products` table. Logs SQL if missing.
import supabase from '../config/db.js';

export async function ensureProductsTable() {
  try {
    const { error } = await supabase.from('products').select('product_id').limit(1);
    if (error && /find the table/i.test(error.message)) {
      console.warn('[ensureProductsTable] Table "products" missing. Create it with SQL:');
      console.warn(`CREATE TABLE public.products (
  id BIGSERIAL PRIMARY KEY,
  shop_domain TEXT NOT NULL,
  product_id BIGINT NOT NULL,
  title TEXT,
  handle TEXT,
  vendor TEXT,
  product_type TEXT,
  status TEXT,
  tags TEXT[],
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ,
  variant_count INT,
  raw JSONB,
  UNIQUE (shop_domain, product_id)
);`);
    } else if (!error) {
      console.log('[ensureProductsTable] products table found');
    }
  } catch (e) {
    console.error('[ensureProductsTable] unexpected error', e.message);
  }
}
