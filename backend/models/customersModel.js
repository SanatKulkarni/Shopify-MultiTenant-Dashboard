// customersModel.js
// Uses existing Supabase client to perform a lightweight existence check on the `customers` table.
// IMPORTANT: Supabase client cannot create tables via the standard REST interface; creation must be
// done manually in the Supabase SQL editor or via migrations. We only check and log guidance.

import supabase from '../config/db.js';

export async function ensureCustomersTable() {
  try {
    const { error } = await supabase.from('customers').select('id').limit(1);
    if (error && /find the table/i.test(error.message)) {
      console.warn('[ensureCustomersTable] Table "customers" does not exist. Create it with SQL:');
      console.warn(`CREATE TABLE public.customers (
  id BIGSERIAL PRIMARY KEY,
  shop_domain TEXT NOT NULL,
  customer_id BIGINT NOT NULL,
  email TEXT,
  first_name TEXT,
  last_name TEXT,
  phone TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (shop_domain, customer_id)
);`);
    } else if (!error) {
      console.log('[ensureCustomersTable] customers table found');
    }
  } catch (e) {
    console.error('[ensureCustomersTable] unexpected error', e.message);
  }
}
