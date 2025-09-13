// Middleware to extract and validate tenant information
// Supports multiple ways to identify tenants: shop domain, tenant ID, etc.

export function extractTenant(req, res, next) {
  // Extract tenant identifier from multiple sources
  const shopDomain = req.query.shop || 
                    req.headers['x-shop-domain'] || 
                    req.body?.shop_domain;
  
  const tenantId = req.headers['x-tenant-id'] || 
                  req.query.tenant_id;

  // Validate tenant identifier
  if (!shopDomain && !tenantId) {
    return res.status(400).json({
      status: 'error',
      message: 'Tenant identifier required. Provide shop domain via ?shop=, X-Shop-Domain header, or X-Tenant-Id header'
    });
  }

  // Normalize tenant identifier
  const tenant = {
    id: tenantId || shopDomain,
    shopDomain: shopDomain,
    // Add additional tenant metadata as needed
  };

  // Validate tenant format (Shopify domain format)
  if (shopDomain && !isValidShopDomain(shopDomain)) {
    return res.status(400).json({
      status: 'error',
      message: 'Invalid shop domain format. Expected: shop-name.myshopify.com'
    });
  }

  // Attach tenant context to request
  req.tenant = tenant;
  next();
}

// Middleware to ensure tenant access token is provided
export function requireTenantAuth(req, res, next) {
  const accessToken = req.headers['x-shopify-access-token'] || 
                     process.env.SHOPIFY_ACCESS_TOKEN;
  
  if (!accessToken) {
    return res.status(401).json({
      status: 'error',
      message: 'Missing X-Shopify-Access-Token header or SHOPIFY_ACCESS_TOKEN env var'
    });
  }

  req.tenantAuth = { accessToken };
  next();
}

// Utility function to validate Shopify domain format
function isValidShopDomain(domain) {
  const shopifyDomainRegex = /^[a-zA-Z0-9][a-zA-Z0-9\-]*\.myshopify\.com$/;
  return shopifyDomainRegex.test(domain);
}

// Advanced tenant validation (optional - for production use)
export async function validateTenantAccess(req, res, next) {
  try {
    const { tenant, tenantAuth } = req;
    
    // Here you could add additional validation:
    // - Check if tenant exists in your tenant registry
    // - Validate access token against tenant
    // - Check tenant subscription status
    // - Rate limiting per tenant
    
    // Example: Basic Shopify API validation
    if (tenant.shopDomain && tenantAuth.accessToken) {
      const response = await fetch(`https://${tenant.shopDomain}/admin/api/2025-01/shop.json`, {
        headers: {
          'X-Shopify-Access-Token': tenantAuth.accessToken,
          'Accept': 'application/json'
        }
      });
      
      if (!response.ok) {
        return res.status(403).json({
          status: 'error',
          message: 'Invalid tenant credentials or access denied'
        });
      }
    }
    
    next();
  } catch (error) {
    console.error('[validateTenantAccess] Error:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Tenant validation failed'
    });
  }
}