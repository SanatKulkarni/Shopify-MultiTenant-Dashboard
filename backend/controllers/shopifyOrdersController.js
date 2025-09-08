// shopifyOrdersController.js
// Ingest orders from Shopify GraphQL into Supabase.
// Endpoints will support:
//   POST /ingest/shopify/orders          -> fetch first N orders (pagination params)
//   POST /ingest/shopify/order/:id       -> fetch single order by numeric ID or GID
// Requires X-Shopify-Access-Token header or SHOPIFY_ACCESS_TOKEN env.

import supabase from '../config/db.js';
import { ensureOrdersTable } from '../models/ordersModel.js';

const DEFAULT_API_VERSION = '2025-01';

function buildOrdersQuery(first, afterCursor) {
  return `query FetchOrders {\n  orders(first: ${first}${afterCursor ? `, after: \"${afterCursor}\"` : ''}) {\n    edges {\n      cursor\n      node {\n        id\n        name\n        createdAt\n        updatedAt\n        currencyCode\n        currentTotalPriceSet { shopMoney { amount currencyCode } }\n        customer { id email firstName lastName }\n        lineItems(first: 50) { edges { node { id title quantity sku } } }\n        displayFinancialStatus\n        displayFulfillmentStatus\n      }\n    }\n    pageInfo { hasNextPage endCursor }\n  }\n}`;
}

function buildSingleOrderQuery(gid) {
  return `query OneOrder {\n  order(id: \"${gid}\") {\n    id\n    name\n    createdAt\n    updatedAt\n    currencyCode\n    currentTotalPriceSet { shopMoney { amount currencyCode } }\n    customer { id email firstName lastName }\n    lineItems(first: 100) { edges { node { id title quantity sku } } }\n    displayFinancialStatus\n    displayFulfillmentStatus\n  }\n}`;
}

function parseOrderNode(node, shopDomain) {
  const numericId = parseInt(node.id.split('/').pop(), 10);
  const customerId = node.customer ? parseInt(node.customer.id.split('/').pop(), 10) : null;
  const totalPrice = node.currentTotalPriceSet?.shopMoney?.amount ? Number(node.currentTotalPriceSet.shopMoney.amount) : null;
  // Derive order number from name like "#1234" if present.
  let derivedOrderNumber = null;
  if (node.name) {
    const m = node.name.match(/(\d+)/);
    if (m) derivedOrderNumber = parseInt(m[1], 10);
  }
  return {
    shop_domain: shopDomain,
    order_id: numericId,
    order_number: derivedOrderNumber,
    customer_id: customerId,
    currency: node.currencyCode || null,
    total_price: totalPrice,
  financial_status: node.displayFinancialStatus || null,
  fulfillment_status: node.displayFulfillmentStatus || null,
    created_at: node.createdAt || null,
    updated_at: node.updatedAt || null,
    raw: node
  };
}

async function upsertOrders(rows) {
  if (!rows.length) return { inserted: 0, updated: 0 };
  // Determine existing
  const ids = [...new Set(rows.map(r => r.order_id))];
  let existingIds = new Set();
  const shopDomain = rows[0].shop_domain;
  const { data: existing, error: existErr } = await supabase
    .from('orders')
    .select('order_id')
    .eq('shop_domain', shopDomain)
    .in('order_id', ids);
  if (!existErr && existing) existingIds = new Set(existing.map(r => r.order_id));

  const { error } = await supabase
    .from('orders')
    .upsert(rows, { onConflict: 'shop_domain,order_id' });
  if (error) throw new Error(error.message);

  const inserted = rows.filter(r => !existingIds.has(r.order_id)).length;
  const updated = rows.length - inserted;
  return { inserted, updated };
}

export async function ingestOrders(req, res) {
  try {
    const shopDomain = req.query.shop || req.headers['x-shop-domain'];
    if (!shopDomain) return res.status(400).json({ status: 'error', message: 'Missing shop domain (?shop= or X-Shop-Domain)' });
    const accessToken = req.headers['x-shopify-access-token'] || process.env.SHOPIFY_ACCESS_TOKEN;
    if (!accessToken) return res.status(400).json({ status: 'error', message: 'Missing X-Shopify-Access-Token header' });

    const first = req.query.first ? parseInt(req.query.first, 10) : 10;
    const pages = req.query.pages ? parseInt(req.query.pages, 10) : 1;
    const apiVersion = req.query.api_version || DEFAULT_API_VERSION;

    await ensureOrdersTable();

    const collected = [];
    let cursor = null;
    for (let p = 0; p < pages; p++) {
      const query = buildOrdersQuery(first, cursor);
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
      const edges = json.data.orders.edges;
      edges.forEach(e => collected.push(parseOrderNode(e.node, shopDomain)));
      if (!json.data.orders.pageInfo.hasNextPage) break;
      cursor = json.data.orders.pageInfo.endCursor;
    }

    const { inserted, updated } = await upsertOrders(collected);
    return res.json({ status: 'success', processed: collected.length, inserted, updated });
  } catch (e) {
    console.error('[orders] ingest error', e);
    return res.status(500).json({ status: 'error', message: e.message });
  }
}

export async function ingestSingleOrder(req, res) {
  try {
    const shopDomain = req.query.shop || req.headers['x-shop-domain'];
    if (!shopDomain) return res.status(400).json({ status: 'error', message: 'Missing shop domain (?shop= or X-Shop-Domain)' });
    const accessToken = req.headers['x-shopify-access-token'] || process.env.SHOPIFY_ACCESS_TOKEN;
    if (!accessToken) return res.status(400).json({ status: 'error', message: 'Missing X-Shopify-Access-Token header' });

    const apiVersion = req.query.api_version || DEFAULT_API_VERSION;
    const idParam = req.params.id;
    let gid = idParam.startsWith('gid://') ? idParam : `gid://shopify/Order/${idParam}`;

    await ensureOrdersTable();

    const query = buildSingleOrderQuery(gid);
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
    if (!json.data.order) {
      return res.status(404).json({ status: 'error', message: 'Order not found' });
    }
    const row = parseOrderNode(json.data.order, shopDomain);
    const { inserted, updated } = await upsertOrders([row]);
    return res.json({ status: 'success', processed: 1, inserted, updated });
  } catch (e) {
    console.error('[orders] single ingest error', e);
    return res.status(500).json({ status: 'error', message: e.message });
  }
}
