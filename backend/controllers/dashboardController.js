import supabase from '../config/db.js';

// Get dashboard metrics (total customers, orders, revenue)
export async function getDashboardMetrics(req, res) {
  try {
    const { shop_domain } = req.query;
    
    if (!shop_domain) {
      return res.status(400).json({ error: 'shop_domain is required' });
    }

    // Get total customers
    const { count: totalCustomers, error: customersError } = await supabase
      .from('customers')
      .select('*', { count: 'exact', head: true })
      .eq('shop_domain', shop_domain);

    if (customersError) {
      console.error('Error fetching customers count:', customersError);
    }

    // Get total orders and revenue
    const { data: ordersData, error: ordersError } = await supabase
      .from('orders')
      .select('total_price')
      .eq('shop_domain', shop_domain);

    if (ordersError) {
      console.error('Error fetching orders:', ordersError);
    }

    const totalOrders = ordersData?.length || 0;
    const totalRevenue = ordersData?.reduce((sum, order) => {
      const price = parseFloat(order.total_price) || 0;
      return sum + price;
    }, 0) || 0;

    // Calculate revenue growth (mock calculation - you can implement proper logic)
    const revenueGrowth = totalRevenue > 0 ? Math.random() * 20 - 5 : 0; // Random between -5% and 15%

    res.json({
      totalCustomers: totalCustomers || 0,
      totalOrders,
      totalRevenue,
      revenueGrowth: parseFloat(revenueGrowth.toFixed(1))
    });
  } catch (error) {
    console.error('Dashboard metrics error:', error);
    res.status(500).json({ error: 'Failed to fetch dashboard metrics' });
  }
}

// Get orders by date for chart
export async function getOrdersByDate(req, res) {
  try {
    const { shop_domain, start_date, end_date } = req.query;
    
    if (!shop_domain || !start_date || !end_date) {
      return res.status(400).json({ error: 'shop_domain, start_date, and end_date are required' });
    }

    const { data: ordersData, error } = await supabase
      .from('orders')
      .select('created_at, total_price')
      .eq('shop_domain', shop_domain)
      .gte('created_at', start_date)
      .lte('created_at', end_date)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Error fetching orders by date:', error);
      return res.status(500).json({ error: 'Failed to fetch orders data' });
    }

    // Group orders by date
    const groupedData = {};
    ordersData?.forEach(order => {
      const date = order.created_at.split('T')[0]; // Get date part only
      if (!groupedData[date]) {
        groupedData[date] = { orders: 0, revenue: 0 };
      }
      groupedData[date].orders += 1;
      groupedData[date].revenue += parseFloat(order.total_price) || 0;
    });

    // Convert to array format for charts
    const chartData = Object.entries(groupedData).map(([date, data]) => ({
      date,
      orders: data.orders,
      revenue: Math.round(data.revenue * 100) / 100 // Round to 2 decimal places
    }));

    res.json(chartData);
  } catch (error) {
    console.error('Orders by date error:', error);
    res.status(500).json({ error: 'Failed to fetch orders by date' });
  }
}

// Get top customers by spend
export async function getTopCustomers(req, res) {
  try {
    const { shop_domain, limit = 5 } = req.query;
    
    if (!shop_domain) {
      return res.status(400).json({ error: 'shop_domain is required' });
    }

    // Get customers with their order totals
    const { data: customersData, error: customersError } = await supabase
      .from('customers')
      .select('customer_id, email, first_name, last_name')
      .eq('shop_domain', shop_domain);

    if (customersError) {
      console.error('Error fetching customers:', customersError);
      return res.status(500).json({ error: 'Failed to fetch customers' });
    }

    // Get orders for each customer and calculate totals
    const customerSpending = [];
    
    for (const customer of customersData || []) {
      const { data: orders, error: ordersError } = await supabase
        .from('orders')
        .select('total_price')
        .eq('shop_domain', shop_domain)
        .eq('customer_id', customer.customer_id);

      if (!ordersError && orders) {
        const totalSpent = orders.reduce((sum, order) => {
          return sum + (parseFloat(order.total_price) || 0);
        }, 0);

        if (totalSpent > 0) {
          customerSpending.push({
            id: customer.customer_id,
            name: `${customer.first_name || ''} ${customer.last_name || ''}`.trim() || 'Unknown Customer',
            email: customer.email || 'No email',
            totalSpent,
            orders: orders.length
          });
        }
      }
    }

    // Sort by total spent and limit results
    const topCustomers = customerSpending
      .sort((a, b) => b.totalSpent - a.totalSpent)
      .slice(0, parseInt(limit));

    res.json(topCustomers);
  } catch (error) {
    console.error('Top customers error:', error);
    res.status(500).json({ error: 'Failed to fetch top customers' });
  }
}

// Get additional analytics data for trend charts
export async function getAnalyticsData(req, res) {
  try {
    const { shop_domain } = req.query;
    
    if (!shop_domain) {
      return res.status(400).json({ error: 'shop_domain is required' });
    }

    // 1. Revenue by Month (last 6 months)
    const { data: revenueData, error: revenueError } = await supabase
      .from('orders')
      .select('total_price, created_at')
      .eq('shop_domain', shop_domain)
      .gte('created_at', new Date(Date.now() - 6 * 30 * 24 * 60 * 60 * 1000).toISOString())
      .order('created_at', { ascending: true });

    if (revenueError) {
      console.error('Error fetching revenue data:', revenueError);
    }

    // Group revenue by month
    const monthlyRevenue = {};
    revenueData?.forEach(order => {
      const date = new Date(order.created_at);
      const monthKey = `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}`;
      if (!monthlyRevenue[monthKey]) {
        monthlyRevenue[monthKey] = { revenue: 0, orders: 0 };
      }
      monthlyRevenue[monthKey].revenue += parseFloat(order.total_price) || 0;
      monthlyRevenue[monthKey].orders += 1;
    });

    const revenueByMonth = Object.entries(monthlyRevenue)
      .map(([month, data]) => ({
        month,
        revenue: Math.round(data.revenue * 100) / 100,
        orders: data.orders,
        avgOrderValue: Math.round((data.revenue / data.orders) * 100) / 100 || 0
      }))
      .sort((a, b) => a.month.localeCompare(b.month));

    // 2. Order Value Distribution
    const { data: orderValues, error: orderValuesError } = await supabase
      .from('orders')
      .select('total_price')
      .eq('shop_domain', shop_domain);

    if (orderValuesError) {
      console.error('Error fetching order values:', orderValuesError);
    }

    const valueRanges = {
      '$0-$25': 0,
      '$25-$50': 0,
      '$50-$100': 0,
      '$100-$200': 0,
      '$200+': 0
    };

    orderValues?.forEach(order => {
      const value = parseFloat(order.total_price) || 0;
      if (value <= 25) valueRanges['$0-$25']++;
      else if (value <= 50) valueRanges['$25-$50']++;
      else if (value <= 100) valueRanges['$50-$100']++;
      else if (value <= 200) valueRanges['$100-$200']++;
      else valueRanges['$200+']++;
    });

    const orderValueDistribution = Object.entries(valueRanges).map(([range, count]) => ({
      range,
      count,
      percentage: orderValues?.length ? Math.round((count / orderValues.length) * 100) : 0
    }));

    // 3. Customer Acquisition Trend (new customers per month)
    const { data: customerData, error: customerError } = await supabase
      .from('customers')
      .select('created_at')
      .eq('shop_domain', shop_domain)
      .gte('created_at', new Date(Date.now() - 6 * 30 * 24 * 60 * 60 * 1000).toISOString())
      .order('created_at', { ascending: true });

    if (customerError) {
      console.error('Error fetching customer data:', customerError);
    }

    const monthlyCustomers = {};
    customerData?.forEach(customer => {
      const date = new Date(customer.created_at);
      const monthKey = `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}`;
      monthlyCustomers[monthKey] = (monthlyCustomers[monthKey] || 0) + 1;
    });

    const customerAcquisition = Object.entries(monthlyCustomers)
      .map(([month, newCustomers]) => ({ month, newCustomers }))
      .sort((a, b) => a.month.localeCompare(b.month));

    // 4. Order Status Distribution (keep this as it's useful)
    const { data: orderStatusData, error: statusError } = await supabase
      .from('orders')
      .select('financial_status, fulfillment_status')
      .eq('shop_domain', shop_domain);

    if (statusError) {
      console.error('Error fetching order status:', statusError);
    }

    const statusCounts = {
      'Completed': 0,
      'Processing': 0,
      'Shipped': 0,
      'Cancelled': 0
    };

    orderStatusData?.forEach(order => {
      const financial = order.financial_status?.toLowerCase();
      const fulfillment = order.fulfillment_status?.toLowerCase();
      
      if (financial === 'paid' && fulfillment === 'fulfilled') {
        statusCounts['Completed']++;
      } else if (financial === 'paid' && fulfillment === 'shipped') {
        statusCounts['Shipped']++;
      } else if (financial === 'paid') {
        statusCounts['Processing']++;
      } else if (financial === 'refunded' || financial === 'voided') {
        statusCounts['Cancelled']++;
      } else {
        statusCounts['Processing']++;
      }
    });

    const orderStatusDistribution = Object.entries(statusCounts).map(([name, value]) => ({
      name,
      value,
      color: {
        'Completed': '#10b981',
        'Processing': '#f59e0b',
        'Shipped': '#3b82f6',
        'Cancelled': '#ef4444'
      }[name]
    }));

    res.json({
      revenueByMonth,
      orderValueDistribution,
      customerAcquisition,
      orderStatusDistribution
    });
  } catch (error) {
    console.error('Analytics data error:', error);
    res.status(500).json({ error: 'Failed to fetch analytics data' });
  }
}