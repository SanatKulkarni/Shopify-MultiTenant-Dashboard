import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import apiService from '../services/api';
import { Crown, DollarSign } from 'lucide-react';
import './TopCustomers.css';

const TopCustomers = ({ expanded = false }) => {
  const { user } = useAuth();
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchTopCustomers = async () => {
      try {
        setError(null);
        const data = await apiService.getTopCustomers(user.shopDomain, expanded ? 10 : 5);
        setCustomers(data);
      } catch (error) {
        console.error('Failed to fetch top customers:', error);
        setError('Failed to load customers data');
      } finally {
        setLoading(false);
      }
    };

    if (user?.shopDomain) {
      fetchTopCustomers();
    }
  }, [user, expanded]);

  if (loading) {
    return <div className="customers-loading">Loading top customers...</div>;
  }

  if (error) {
    return <div className="customers-error">{error}</div>;
  }

  return (
    <div className={`top-customers ${expanded ? 'expanded' : ''}`}>
      <div className="customers-header">
        <h3>
          <Crown size={20} />
          Top {expanded ? 10 : 5} Customers by Spend
        </h3>
      </div>

      <div className="customers-list">
        {customers.map((customer, index) => (
          <div key={customer.id} className="customer-item">
            <div className="customer-rank">
              #{index + 1}
            </div>
            <div className="customer-info">
              <h4>{customer.name}</h4>
              <p>{customer.email}</p>
            </div>
            <div className="customer-stats">
              <div className="stat">
                <DollarSign size={16} />
                <span>${customer.totalSpent.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
              </div>
              <div className="stat orders">
                <span>{customer.orders} orders</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default TopCustomers;