import React, { useState, useEffect } from 'react';
import { BarChart, Bar, PieChart, Pie, Cell, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { useAuth } from '../contexts/AuthContext';
import apiService from '../services/api';
import { TrendingUp, DollarSign, Users, ShoppingBag } from 'lucide-react';
import './TrendCharts.css';

const TrendCharts = () => {
  const { user } = useAuth();
  const [analyticsData, setAnalyticsData] = useState({
    revenueByMonth: [],
    orderValueDistribution: [],
    customerAcquisition: [],
    orderStatusDistribution: []
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchAnalyticsData = async () => {
      try {
        setError(null);
        const data = await apiService.getAnalyticsData(user.shopDomain);
        setAnalyticsData(data);
      } catch (error) {
        console.error('Failed to fetch analytics data:', error);
        setError('Failed to load analytics data');
      } finally {
        setLoading(false);
      }
    };

    if (user?.shopDomain) {
      fetchAnalyticsData();
    }
  }, [user]);

  if (loading) {
    return <div className="trend-charts-loading">Loading analytics...</div>;
  }

  if (error) {
    return <div className="trend-charts-error">{error}</div>;
  }

  return (
    <div className="trend-charts">
      <h2>Business Performance Insights</h2>
      
      <div className="charts-container">
        {/* Revenue Trend Chart */}
        <div className="chart-card">
          <div className="chart-header">
            <DollarSign size={20} />
            <h3>Revenue Trend (Last 6 Months)</h3>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={analyticsData.revenueByMonth}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip formatter={(value, name) => [
                name === 'revenue' ? `$${value.toLocaleString()}` : value,
                name === 'revenue' ? 'Revenue' : name === 'orders' ? 'Orders' : 'Avg Order Value'
              ]} />
              <Line type="monotone" dataKey="revenue" stroke="#3b82f6" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Order Value Distribution */}
        <div className="chart-card">
          <div className="chart-header">
            <ShoppingBag size={20} />
            <h3>Order Value Distribution</h3>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={analyticsData.orderValueDistribution}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="range" />
              <YAxis />
              <Tooltip formatter={(value, name) => [
                value,
                name === 'count' ? 'Orders' : 'Percentage'
              ]} />
              <Bar dataKey="count" fill="#10b981" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Customer Acquisition */}
        <div className="chart-card">
          <div className="chart-header">
            <Users size={20} />
            <h3>Customer Acquisition Trend</h3>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={analyticsData.customerAcquisition}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip formatter={(value) => [value, 'New Customers']} />
              <Line type="monotone" dataKey="newCustomers" stroke="#8b5cf6" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Order Status Distribution */}
        <div className="chart-card">
          <div className="chart-header">
            <TrendingUp size={20} />
            <h3>Order Status Distribution</h3>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={analyticsData.orderStatusDistribution}
                cx="50%"
                cy="50%"
                outerRadius={80}
                dataKey="value"
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
              >
                {analyticsData.orderStatusDistribution.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

export default TrendCharts;