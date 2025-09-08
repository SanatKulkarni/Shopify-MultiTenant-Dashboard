// Controller to ingest Shopify customers into Supabase
// Assumes Supabase table `customers` with columns:
//   id (PK), shop_domain, customer_id, email, first_name, last_name, phone, created_at
// Upsert on (shop_domain, customer_id) using a Postgres unique constraint or index.

import supabase from '../config/db.js';
import { ensureCustomersTable } from '../models/customersModel.js';

// Fetch customers directly from Shopify REST API if not provided in payload.
// Uses X-Shopify-Access-Token header (preferred) or env SHOPIFY_ACCESS_TOKEN.
// Pagination handled via Link headers (cursor-based page_info).

async function fetchShopifyCustomers({ shopDomain, accessToken, apiVersion = '2025-01', limit = 250, maxPages = 10 }) {
  const collected = [];
  let pageInfo = null;
  let pages = 0;
  while (pages < maxPages) {
    const url = new URL(`https://${shopDomain}/admin/api/${apiVersion}/customers.json`);
    url.searchParams.set('limit', String(limit));
    if (pageInfo) url.searchParams.set('page_info', pageInfo);
    const resp = await fetch(url, {
      headers: {
        'X-Shopify-Access-Token': accessToken,
        'Accept': 'application/json'
      }
    });
    if (!resp.ok) {
      const text = await resp.text();
      throw new Error(`Shopify customers fetch failed ${resp.status}: ${text}`);
    }
    const json = await resp.json();
    const batch = json.customers || [];
    collected.push(...batch);
    const link = resp.headers.get('link');
    if (!link || !/rel="next"/.test(link)) break;
    // Extract next page_info
    const m = link.match(/<[^>]*[?&]page_info=([^&>]+)[^>]*>; rel="next"/);
    if (!m) break;
    pageInfo = decodeURIComponent(m[1]);
    pages += 1;
  }
  return collected;
}

function mapCustomer(raw, shopDomain) {
  return {
    shop_domain: shopDomain,
    customer_id: raw.id,
    email: raw.email || null,
    first_name: raw.first_name || null,
    last_name: raw.last_name || null,
    phone: raw.phone || null,
    created_at: raw.created_at || new Date().toISOString(),
  };
}

export async function ingestShopifyCustomers(req, res) {
  try {
    const shopDomain = req.query.shop || req.body.shop_domain || req.headers['x-shop-domain'];
    if (!shopDomain) {
      return res.status(400).json({ status: 'error', message: 'Missing shop domain (provide ?shop=, body.shop_domain, or X-Shop-Domain header)' });
    }
    const apiVersion = req.query.api_version || '2025-01';
    const limit = req.query.limit ? parseInt(req.query.limit, 10) : 250;
    const maxPages = req.query.max_pages ? parseInt(req.query.max_pages, 10) : 1; // default single page unless specified
    const accessToken = req.headers['x-shopify-access-token'] || process.env.SHOPIFY_ACCESS_TOKEN;

    // Normalize body (could be undefined if no JSON Content-Type was sent)
    const payload = (req.body && typeof req.body === 'object') ? req.body : {};
    // Accept either { customers: [...] } (Shopify REST) or raw array. If none, fetch from Shopify.
    let customersArray = Array.isArray(payload)
      ? payload
      : Array.isArray(payload.customers || [])
        ? (payload.customers || [])
        : [];

    if (customersArray.length === 0) {
      if (!accessToken) {
        return res.status(400).json({ status: 'error', message: 'No customers in body and missing X-Shopify-Access-Token header or SHOPIFY_ACCESS_TOKEN env' });
      }
      customersArray = await fetchShopifyCustomers({ shopDomain, accessToken, apiVersion, limit, maxPages });
    }

  await ensureCustomersTable();
  const rows = customersArray.map(c => mapCustomer(c, shopDomain));

    // Perform upsert. Requires a unique constraint on (shop_domain, customer_id) named e.g. customers_shop_domain_customer_id_key
    // Pre-fetch existing keys for inserted/updated counts.
    const ids = [...new Set(rows.map(r => r.customer_id))];
    let existingIds = new Set();
    if (ids.length > 0) {
      const { data: existing, error: existErr } = await supabase
        .from('customers')
        .select('customer_id')
        .eq('shop_domain', shopDomain)
        .in('customer_id', ids);
      if (existErr) {
        console.warn('[ingest] existing lookup failed (continuing)', existErr.message);
      } else if (existing) {
        existingIds = new Set(existing.map(r => r.customer_id));
      }
    }

    const { data, error } = await supabase
      .from('customers')
      .upsert(rows, { onConflict: 'shop_domain,customer_id' })
      .select('shop_domain, customer_id');

    if (error) {
      console.error('[ingest] upsert error', error);
      return res.status(500).json({ status: 'error', message: error.message });
    }

    // Since Supabase does not directly tell inserted vs updated counts, we can approximate by comparing count vs input.
    // For precise metrics you'd need a separate check (fetch existing first) which adds latency. We'll implement a light version.
  const inserted = rows.filter(r => !existingIds.has(r.customer_id)).length;
  const updated = rows.length - inserted;
  return res.json({ status: 'success', processed: rows.length, inserted, updated, source: customersArray === payload.customers || Array.isArray(payload) ? 'body' : 'shopify_api' });
  } catch (e) {
    console.error('[ingest] unexpected error', e);
    return res.status(500).json({ status: 'error', message: e.message });
  }
}
