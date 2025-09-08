import express from 'express';
import { ingestShopifyCustomers } from '../controllers/shopifyIngestController.js';
import { ingestOrders, ingestSingleOrder } from '../controllers/shopifyOrdersController.js';
import { ingestProducts, ingestSingleProduct } from '../controllers/shopifyProductsController.js';

const router = express.Router();

router.post('/shopify/customers', ingestShopifyCustomers);
router.post('/shopify/orders', ingestOrders); // query params: shop, first, pages
router.post('/shopify/order/:id', ingestSingleOrder); // :id can be numeric or full GID
router.post('/shopify/products', ingestProducts); // query params: shop, first, pages
router.post('/shopify/product/:id', ingestSingleProduct); // :id numeric or GID, ?metafields=15

export default router;
