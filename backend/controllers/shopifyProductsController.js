// shopifyProductsController.js
// Fetch and ingest products (list & single with metafields) into Supabase.

import supabase from '../config/db.js';
import { ensureProductsTable } from '../models/productsModel.js';

const DEFAULT_API_VERSION = '2025-01';

function buildProductsQuery(first, afterCursor) {
  return `query GetProducts {\n  products(first: ${first}${afterCursor ? `, after: \"${afterCursor}\"` : ''}) {\n    edges {\n      cursor\n      node {\n        id\n        title\n        handle\n        vendor\n        productType\n        status\n        tags\n        createdAt\n        updatedAt\n        variants(first: 1) { edges { node { id } } }\n      }\n    }\n    pageInfo { hasNextPage endCursor }\n  }\n}`;
}

function buildSingleProductQuery(gid, metafieldCount = 10) {
  return `query ProductWithMeta {\n  product(id: \"${gid}\") {\n    id\n    title\n    handle\n    vendor\n    productType\n    status\n    tags\n    createdAt\n    updatedAt\n    variants(first: 250) { edges { node { id title sku price } } }\n    metafields(first: ${metafieldCount}) { edges { node { namespace key value type } } }\n  }\n}`;
}

function parseProductNode(node, shopDomain) {
  const numericId = parseInt(node.id.split('/').pop(), 10);
  const variantCount = node.variants?.edges?.length || 0;
  return {
    shop_domain: shopDomain,
    product_id: numericId,
    title: node.title || null,
    handle: node.handle || null,
    vendor: node.vendor || null,
    product_type: node.productType || null,
    status: node.status || null,
    tags: node.tags || [],
    created_at: node.createdAt || null,
    updated_at: node.updatedAt || null,
    variant_count: variantCount,
    raw: node
  };
}

async function upsertProducts(rows) {
  if (!rows.length) return { inserted: 0, updated: 0 };
  const ids = [...new Set(rows.map(r => r.product_id))];
  let existingIds = new Set();
  const shopDomain = rows[0].shop_domain;
  const { data: existing, error: existErr } = await supabase
    .from('products')
    .select('product_id')
    .eq('shop_domain', shopDomain)
    .in('product_id', ids);
  if (!existErr && existing) existingIds = new Set(existing.map(r => r.product_id));

  const { error } = await supabase
    .from('products')
    .upsert(rows, { onConflict: 'shop_domain,product_id' });
  if (error) throw new Error(error.message);

  const inserted = rows.filter(r => !existingIds.has(r.product_id)).length;
  const updated = rows.length - inserted;
  return { inserted, updated };
}

export async function ingestProducts(req, res) {
  try {
    const shopDomain = req.query.shop || req.headers['x-shop-domain'];
    if (!shopDomain) return res.status(400).json({ status: 'error', message: 'Missing shop domain (?shop= or X-Shop-Domain)' });
    const accessToken = req.headers['x-shopify-access-token'] || process.env.SHOPIFY_ACCESS_TOKEN;
    if (!accessToken) return res.status(400).json({ status: 'error', message: 'Missing X-Shopify-Access-Token header' });

    const first = req.query.first ? parseInt(req.query.first, 10) : 10;
    const pages = req.query.pages ? parseInt(req.query.pages, 10) : 1;
    const apiVersion = req.query.api_version || DEFAULT_API_VERSION;

    await ensureProductsTable();

    const collected = [];
    let cursor = null;
    for (let p = 0; p < pages; p++) {
      const query = buildProductsQuery(first, cursor);
      const response = await fetch(`https://${shopDomain}/admin/api/${apiVersion}/graphql.json`, {
        method: 'POST',
        headers: {
          'X-Shopify-Access-Token': accessToken,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({ query })
      });
      if (!response.ok) {
        const text = await response.text();
        return res.status(502).json({ status: 'error', message: `Shopify GraphQL HTTP ${response.status}: ${text}` });
      }
      const json = await response.json();
      if (json.errors) {
        return res.status(502).json({ status: 'error', message: 'Shopify GraphQL errors', errors: json.errors });
      }
      const edges = json.data.products.edges;
      edges.forEach(e => collected.push(parseProductNode(e.node, shopDomain)));
      if (!json.data.products.pageInfo.hasNextPage) break;
      cursor = json.data.products.pageInfo.endCursor;
    }

    const { inserted, updated } = await upsertProducts(collected);
    return res.json({ status: 'success', processed: collected.length, inserted, updated });
  } catch (e) {
    console.error('[products] ingest error', e);
    return res.status(500).json({ status: 'error', message: e.message });
  }
}

export async function ingestSingleProduct(req, res) {
  try {
    const shopDomain = req.query.shop || req.headers['x-shop-domain'];
    if (!shopDomain) return res.status(400).json({ status: 'error', message: 'Missing shop domain (?shop= or X-Shop-Domain)' });
    const accessToken = req.headers['x-shopify-access-token'] || process.env.SHOPIFY_ACCESS_TOKEN;
    if (!accessToken) return res.status(400).json({ status: 'error', message: 'Missing X-Shopify-Access-Token header' });

    const apiVersion = req.query.api_version || DEFAULT_API_VERSION;
    const idParam = req.params.id;
    let gid = idParam.startsWith('gid://') ? idParam : `gid://shopify/Product/${idParam}`;

    await ensureProductsTable();

    const query = buildSingleProductQuery(gid, req.query.metafields ? parseInt(req.query.metafields, 10) : 10);
    const response = await fetch(`https://${shopDomain}/admin/api/${apiVersion}/graphql.json`, {
      method: 'POST',
      headers: {
        'X-Shopify-Access-Token': accessToken,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify({ query })
    });
    if (!response.ok) {
      const text = await response.text();
      return res.status(502).json({ status: 'error', message: `Shopify GraphQL HTTP ${response.status}: ${text}` });
    }
    const json = await response.json();
    if (json.errors) {
      return res.status(502).json({ status: 'error', message: 'Shopify GraphQL errors', errors: json.errors });
    }
    if (!json.data.product) {
      return res.status(404).json({ status: 'error', message: 'Product not found' });
    }
    const row = parseProductNode(json.data.product, shopDomain);
    const { inserted, updated } = await upsertProducts([row]);
    return res.json({ status: 'success', processed: 1, inserted, updated });
  } catch (e) {
    console.error('[products] single ingest error', e);
    return res.status(500).json({ status: 'error', message: e.message });
  }
}
