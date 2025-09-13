import React, { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useAuth } from '../contexts/AuthContext';
import apiService from '../services/api';
import { Calendar } from 'lucide-react';
import './OrdersChart.css';

const OrdersChart = ({ expanded = false }) => {
  const { user } = useAuth();
  const [chartData, setChartData] = useState([]);
  const [dateRange, setDateRange] = useState({
    startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0]
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchOrdersData = async () => {
      try {
        setError(null);
        const data = await apiService.getOrdersByDate(
          user.shopDomain,
          dateRange.startDate,
          dateRange.endDate
        );
        setChartData(data);
      } catch (error) {
        console.error('Failed to fetch orders data:', error);
        setError('Failed to load orders data');
      } finally {
        setLoading(false);
      }
    };

    if (user?.shopDomain) {
      fetchOrdersData();
    }
  }, [user, dateRange]);

  if (loading) {
    return <div className="chart-loading">Loading orders chart...</div>;
  }

  if (error) {
    return <div className="chart-error">{error}</div>;
  }

  const handleDateChange = (field, value) => {
    setDateRange(prev => ({ ...prev, [field]: value }));
  };

  return (
    <div className={`orders-chart ${expanded ? 'expanded' : ''}`}>
      <div className="chart-header">
        <h3>Orders by Date</h3>
        <div className="date-filters">
          <div className="date-input">
            <Calendar size={16} />
            <input
              type="date"
              value={dateRange.startDate}
              onChange={(e) => handleDateChange('startDate', e.target.value)}
            />
          </div>
          <span>to</span>
          <div className="date-input">
            <Calendar size={16} />
            <input
              type="date"
              value={dateRange.endDate}
              onChange={(e) => handleDateChange('endDate', e.target.value)}
            />
          </div>
        </div>
      </div>

      {loading ? (
        <div className="chart-loading">Loading chart data...</div>
      ) : (
        <ResponsiveContainer width="100%" height={expanded ? 400 : 300}>
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis 
              dataKey="date" 
              tickFormatter={(date) => new Date(date).toLocaleDateString()}
            />
            <YAxis yAxisId="orders" orientation="left" />
            <YAxis yAxisId="revenue" orientation="right" />
            <Tooltip 
              labelFormatter={(date) => new Date(date).toLocaleDateString()}
              formatter={(value, name) => [
                name === 'orders' ? value : `$${value.toLocaleString()}`,
                name === 'orders' ? 'Orders' : 'Revenue'
              ]}
            />
            <Line 
              yAxisId="orders"
              type="monotone" 
              dataKey="orders" 
              stroke="#3b82f6" 
              strokeWidth={2}
              dot={{ fill: '#3b82f6', strokeWidth: 2, r: 4 }}
            />
            <Line 
              yAxisId="revenue"
              type="monotone" 
              dataKey="revenue" 
              stroke="#10b981" 
              strokeWidth={2}
              dot={{ fill: '#10b981', strokeWidth: 2, r: 4 }}
            />
          </LineChart>
        </ResponsiveContainer>
      )}
    </div>
  );
};

export default OrdersChart;