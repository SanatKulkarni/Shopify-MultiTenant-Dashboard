import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import apiService from '../services/api';
import { Users, ShoppingCart, DollarSign, TrendingUp } from 'lucide-react';
import './MetricsOverview.css';

const MetricsOverview = () => {
  const { user } = useAuth();
  const [metrics, setMetrics] = useState({
    totalCustomers: 0,
    totalOrders: 0,
    totalRevenue: 0,
    revenueGrowth: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchMetrics = async () => {
      try {
        setError(null);
        const data = await apiService.getDashboardMetrics(user.shopDomain);
        setMetrics(data);
      } catch (error) {
        console.error('Failed to fetch metrics:', error);
        setError('Failed to load metrics data');
      } finally {
        setLoading(false);
      }
    };

    if (user?.shopDomain) {
      fetchMetrics();
    }
  }, [user]);

  if (loading) {
    return <div className="metrics-loading">Loading metrics...</div>;
  }

  if (error) {
    return <div className="metrics-error">{error}</div>;
  }

  const metricCards = [
    {
      title: 'Total Customers',
      value: metrics.totalCustomers.toLocaleString(),
      icon: Users,
      color: 'blue'
    },
    {
      title: 'Total Orders',
      value: metrics.totalOrders.toLocaleString(),
      icon: ShoppingCart,
      color: 'green'
    },
    {
      title: 'Total Revenue',
      value: `$${metrics.totalRevenue.toLocaleString('en-US', { minimumFractionDigits: 2 })}`,
      icon: DollarSign,
      color: 'purple'
    },
    {
      title: 'Revenue Growth',
      value: `${metrics.revenueGrowth > 0 ? '+' : ''}${metrics.revenueGrowth}%`,
      icon: TrendingUp,
      color: metrics.revenueGrowth > 0 ? 'green' : 'red'
    }
  ];

  if (loading) {
    return <div className="metrics-loading">Loading metrics...</div>;
  }

  return (
    <div className="metrics-overview">
      <h2>Key Metrics</h2>
      <div className="metrics-grid">
        {metricCards.map((metric, index) => {
          const Icon = metric.icon;
          return (
            <div key={index} className={`metric-card ${metric.color}`}>
              <div className="metric-icon">
                <Icon size={24} />
              </div>
              <div className="metric-content">
                <h3>{metric.title}</h3>
                <p className="metric-value">{metric.value}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default MetricsOverview;