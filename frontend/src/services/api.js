const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000/api';

class ApiService {
  constructor() {
    this.token = localStorage.getItem('authToken');
    this.shopDomain = localStorage.getItem('shopDomain');
  }

  async request(endpoint, options = {}) {
    const url = `${API_BASE_URL}${endpoint}`;
    const config = {
      headers: {
        'Content-Type': 'application/json',
        ...(this.token && { 'Authorization': `Bearer ${this.token}` }),
        ...(this.shopDomain && { 'X-Shop-Domain': this.shopDomain }),
        ...options.headers,
      },
      ...options,
    };

    const response = await fetch(url, config);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return response.json();
  }

  // Dashboard data methods
  async getDashboardMetrics(shopDomain) {
    return this.request(`/dashboard/metrics?shop_domain=${shopDomain}`);
  }

  async getOrdersByDate(shopDomain, startDate, endDate) {
    return this.request(`/dashboard/orders-by-date?shop_domain=${shopDomain}&start_date=${startDate}&end_date=${endDate}`);
  }

  async getTopCustomers(shopDomain, limit = 5) {
    return this.request(`/dashboard/top-customers?shop_domain=${shopDomain}&limit=${limit}`);
  }

  async getAnalyticsData(shopDomain) {
    return this.request(`/dashboard/analytics?shop_domain=${shopDomain}`);
  }

  // Auth methods
  setAuth(token, shopDomain) {
    this.token = token;
    this.shopDomain = shopDomain;
    localStorage.setItem('authToken', token);
    localStorage.setItem('shopDomain', shopDomain);
  }

  clearAuth() {
    this.token = null;
    this.shopDomain = null;
    localStorage.removeItem('authToken');
    localStorage.removeItem('shopDomain');
  }
}

export default new ApiService();