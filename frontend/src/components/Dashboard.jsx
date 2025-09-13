import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import MetricsOverview from './MetricsOverview';
import OrdersChart from './OrdersChart';
import TopCustomers from './TopCustomers';
import TrendCharts from './TrendCharts';
import { LogOut, BarChart3, Users, ShoppingCart } from 'lucide-react';
import './Dashboard.css';

const Dashboard = () => {
  const { user, logout } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');

  const tabs = [
    { id: 'overview', label: 'Overview', icon: BarChart3 },
    { id: 'customers', label: 'Customers', icon: Users },
    { id: 'orders', label: 'Orders', icon: ShoppingCart },
  ];

  return (
    <div className="dashboard">
      <header className="dashboard-header">
        <div className="header-content">
          <h1>Analytics Dashboard</h1>
          <div className="header-info">
            <span className="shop-domain">{user?.shopDomain}</span>
            <button onClick={logout} className="logout-button">
              <LogOut size={16} />
              Logout
            </button>
          </div>
        </div>
      </header>

      <nav className="dashboard-nav">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`nav-tab ${activeTab === tab.id ? 'active' : ''}`}
            >
              <Icon size={20} />
              {tab.label}
            </button>
          );
        })}
      </nav>

      <main className="dashboard-content">
        {activeTab === 'overview' && (
          <div className="overview-tab">
            <MetricsOverview />
            <div className="charts-grid">
              <OrdersChart />
              <TopCustomers />
            </div>
            <TrendCharts />
          </div>
        )}
        
        {activeTab === 'customers' && (
          <div className="customers-tab">
            <TopCustomers expanded={true} />
          </div>
        )}
        
        {activeTab === 'orders' && (
          <div className="orders-tab">
            <OrdersChart expanded={true} />
          </div>
        )}
      </main>
    </div>
  );
};

export default Dashboard;