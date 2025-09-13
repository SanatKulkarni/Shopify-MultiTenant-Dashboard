// Base model with tenant-aware database operations
import supabase from '../config/db.js';

export class TenantAwareModel {
  constructor(tableName) {
    this.tableName = tableName;
  }

  // Get Supabase client with tenant context
  getClient(tenantId) {
    // For basic tenant isolation, we'll use the same client
    // but always filter by tenant_id/shop_domain
    return supabase;
  }

  // Tenant-aware select
  async select(tenantId, columns = '*', filters = {}) {
    const query = this.getClient(tenantId)
      .from(this.tableName)
      .select(columns)
      .eq('shop_domain', tenantId);

    // Apply additional filters
    Object.entries(filters).forEach(([key, value]) => {
      if (Array.isArray(value)) {
        query.in(key, value);
      } else {
        query.eq(key, value);
      }
    });

    return query;
  }

  // Tenant-aware insert
  async insert(tenantId, data) {
    // Ensure tenant isolation
    const tenantData = Array.isArray(data) 
      ? data.map(item => ({ ...item, shop_domain: tenantId }))
      : { ...data, shop_domain: tenantId };

    return this.getClient(tenantId)
      .from(this.tableName)
      .insert(tenantData);
  }

  // Tenant-aware upsert
  async upsert(tenantId, data, options = {}) {
    const tenantData = Array.isArray(data)
      ? data.map(item => ({ ...item, shop_domain: tenantId }))
      : { ...data, shop_domain: tenantId };

    return this.getClient(tenantId)
      .from(this.tableName)
      .upsert(tenantData, {
        onConflict: `shop_domain,${options.conflictColumns || 'id'}`,
        ...options
      });
  }

  // Tenant-aware update
  async update(tenantId, filters, data) {
    const query = this.getClient(tenantId)
      .from(this.tableName)
      .update(data)
      .eq('shop_domain', tenantId);

    Object.entries(filters).forEach(([key, value]) => {
      query.eq(key, value);
    });

    return query;
  }

  // Tenant-aware delete
  async delete(tenantId, filters) {
    const query = this.getClient(tenantId)
      .from(this.tableName)
      .delete()
      .eq('shop_domain', tenantId);

    Object.entries(filters).forEach(([key, value]) => {
      query.eq(key, value);
    });

    return query;
  }

  // Count records for tenant
  async count(tenantId, filters = {}) {
    const query = this.getClient(tenantId)
      .from(this.tableName)
      .select('*', { count: 'exact', head: true })
      .eq('shop_domain', tenantId);

    Object.entries(filters).forEach(([key, value]) => {
      query.eq(key, value);
    });

    return query;
  }
}

// Enhanced customer model with tenant awareness
export class TenantCustomersModel extends TenantAwareModel {
  constructor() {
    super('customers');
  }

  async findByCustomerId(tenantId, customerId) {
    return this.select(tenantId, '*', { customer_id: customerId });
  }

  async findByEmail(tenantId, email) {
    return this.select(tenantId, '*', { email });
  }

  async upsertCustomers(tenantId, customers) {
    return this.upsert(tenantId, customers, { 
      conflictColumns: 'customer_id' 
    });
  }
}

// Enhanced orders model
export class TenantOrdersModel extends TenantAwareModel {
  constructor() {
    super('orders');
  }

  async findByOrderId(tenantId, orderId) {
    return this.select(tenantId, '*', { order_id: orderId });
  }

  async findByCustomer(tenantId, customerId) {
    return this.select(tenantId, '*', { customer_id: customerId });
  }

  async upsertOrders(tenantId, orders) {
    return this.upsert(tenantId, orders, { 
      conflictColumns: 'order_id' 
    });
  }
}

// Enhanced products model
export class TenantProductsModel extends TenantAwareModel {
  constructor() {
    super('products');
  }

  async findByProductId(tenantId, productId) {
    return this.select(tenantId, '*', { product_id: productId });
  }

  async findByHandle(tenantId, handle) {
    return this.select(tenantId, '*', { handle });
  }

  async upsertProducts(tenantId, products) {
    return this.upsert(tenantId, products, { 
      conflictColumns: 'product_id' 
    });
  }
}