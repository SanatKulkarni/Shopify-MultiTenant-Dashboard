import React, { createContext, useContext, useState, useEffect } from 'react';
import apiService from '../services/api';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('authToken');
    const shopDomain = localStorage.getItem('shopDomain');
    if (token && shopDomain) {
      setUser({ shopDomain });
    }
    setLoading(false);
  }, []);

  const login = async (email, shopDomain) => {
    // Simulate authentication - in real app, this would call your auth API
    const mockToken = `mock-token-${Date.now()}`;
    apiService.setAuth(mockToken, shopDomain);
    setUser({ email, shopDomain });
    return true;
  };

  const logout = () => {
    apiService.clearAuth();
    setUser(null);
  };

  const value = {
    user,
    login,
    logout,
    loading
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};