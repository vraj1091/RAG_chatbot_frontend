import React, { createContext, useContext, useState, useEffect } from 'react';
import { apiService } from '../services/apiService.js';
import toast from 'react-hot-toast';

const AuthContext = createContext();

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    initializeAuth();
  }, []);

  const initializeAuth = async () => {
    try {
      const token = localStorage.getItem('token');
      const savedUser = localStorage.getItem('user');

      if (token && savedUser) {
        try {
          const userData = await apiService.getCurrentUser();
          setUser(userData);
          setIsAuthenticated(true);
        } catch (err) {
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          setUser(null);
          setIsAuthenticated(false);
        }
      }
    } catch (err) {
      console.error('Auth initialization error:', err);
    } finally {
      setLoading(false);
    }
  };

  const register = async (username, email, password) => {
    try {
      setLoading(true);
      const response = await apiService.register(username, email, password);
      localStorage.setItem('token', response.access_token);
      localStorage.setItem('user', JSON.stringify(response.user));
      setUser(response.user);
      setIsAuthenticated(true);
      toast.success(`Welcome ${response.user.username}! Account created successfully.`);
      return response;
    } catch (err) {
      const errorMessage = err.response?.data?.detail || 'Registration failed';
      toast.error(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const login = async (username, password) => {
    try {
      setLoading(true);
      const response = await apiService.login(username, password);
      localStorage.setItem('token', response.access_token);
      localStorage.setItem('user', JSON.stringify(response.user));
      setUser(response.user);
      setIsAuthenticated(true);
      toast.success(`Welcome back ${response.user.username}!`);
      return response;
    } catch (err) {
      const errorMessage = err.response?.data?.detail || 'Login failed';
      toast.error(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
    setIsAuthenticated(false);
    toast.success('Logged out successfully');
  };

  const value = { user, isAuthenticated, loading, login, register, logout };
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}