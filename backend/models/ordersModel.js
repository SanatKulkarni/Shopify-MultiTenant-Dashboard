// ordersModel.js
// Lightweight existence check for `orders` table using Supabase client.
// Creation must be done manually via SQL (logged if missing).

import supabase from '../config/db.js';

export async function ensureOrdersTable() {
  try {
    const { error } = await supabase.from('orders').select('order_id').limit(1);
    if (error && /find the table/i.test(error.message)) {
      console.warn('[ensureOrdersTable] Table "orders" does not exist. Create it with SQL:');
      console.warn(`CREATE TABLE public.orders (
  id BIGSERIAL PRIMARY KEY,
  shop_domain TEXT NOT NULL,
  order_id BIGINT NOT NULL,
  order_number BIGINT,
  customer_id BIGINT,
  currency TEXT,
  total_price NUMERIC(14,2),
  financial_status TEXT,
  fulfillment_status TEXT,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ,
  raw JSONB,
  UNIQUE (shop_domain, order_id)
);`);
    } else if (!error) {
      console.log('[ensureOrdersTable] orders table found');
    }
  } catch (e) {
    console.error('[ensureOrdersTable] unexpected error', e.message);
  }
}
