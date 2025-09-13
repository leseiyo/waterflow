import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import API_ENDPOINTS from '../config/api';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

// Safe localStorage utilities
const safeGetItem = (key) => {
  try {
    const item = localStorage.getItem(key);
    return item === 'undefined' || item === 'null' ? null : item;
  } catch (error) {
    console.error('Error reading from localStorage:', error);
    return null;
  }
};

const safeSetItem = (key, value) => {
  try {
    localStorage.setItem(key, value);
  } catch (error) {
    console.error('Error writing to localStorage:', error);
  }
};

const safeRemoveItem = (key) => {
  try {
    localStorage.removeItem(key);
  } catch (error) {
    console.error('Error removing from localStorage:', error);
  }
};

const safeClear = () => {
  try {
    localStorage.clear();
  } catch (error) {
    console.error('Error clearing localStorage:', error);
  }
};

// Safe JSON parsing
const safeJsonParse = (str) => {
  if (!str) return null;
  try {
    return JSON.parse(str);
  } catch (error) {
    console.error('Error parsing JSON:', error);
    return null;
  }
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [userType, setUserType] = useState(null);
  const [loading, setLoading] = useState(true);

  // Utility function to clear all auth data
  const clearAuthData = () => {
    safeRemoveItem('token');
    safeRemoveItem('userType');
    safeRemoveItem('user');
    delete axios.defaults.headers.common['Authorization'];
    setUser(null);
    setUserType(null);
  };

  // Initialize auth state from localStorage
  useEffect(() => {
    console.log('AuthContext: Initializing...');
    
    // Clear any corrupted data first
    const token = safeGetItem('token');
    const storedUserType = safeGetItem('userType');
    const storedUser = safeGetItem('user');
    
    console.log('AuthContext: Found in localStorage:', { 
      hasToken: !!token, 
      hasUserType: !!storedUserType, 
      hasUser: !!storedUser 
    });

    // If we have all required data, try to restore the session
    if (token && storedUserType && storedUser) {
      const parsedUser = safeJsonParse(storedUser);
      
      if (parsedUser) {
        setUser(parsedUser);
        setUserType(storedUserType);
        axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        console.log('AuthContext: Successfully restored user session:', { user: parsedUser, userType: storedUserType });
      } else {
        console.log('AuthContext: Failed to parse user data, clearing...');
        clearAuthData();
      }
    } else {
      console.log('AuthContext: No valid session found, starting fresh');
      clearAuthData();
    }
    
    setLoading(false);

    // Add global utility for debugging (development only)
    if (process.env.NODE_ENV === 'development') {
      window.clearAuthStorage = () => {
        console.log('Clearing auth storage...');
        clearAuthData();
        console.log('Auth storage cleared!');
      };
      
      window.debugAuthStorage = () => {
        const token = safeGetItem('token');
        const userType = safeGetItem('userType');
        const user = safeGetItem('user');
        
        console.log('=== Auth Storage Debug ===');
        console.log('Token:', token);
        console.log('User Type:', userType);
        console.log('User:', user);
        
        if (user) {
          const parsed = safeJsonParse(user);
          console.log('Parsed User:', parsed);
        }
        
        console.log('Current State:', { user, userType });
        console.log('=======================');
      };
      
      window.forceClearAndReload = () => {
        console.log('Force clearing localStorage and reloading...');
        safeClear();
        window.location.reload();
      };
      
      console.log('Debug utilities available:');
      console.log('- window.clearAuthStorage() - Clear auth data');
      console.log('- window.debugAuthStorage() - Show current storage state');
      console.log('- window.forceClearAndReload() - Clear all localStorage and reload');
    }
  }, []);

  const login = async (email, password, type) => {
    try {
      if (!email || !password) {
        toast.error('Please provide both email and password');
        return { success: false, error: 'Email and password are required' };
      }

      console.log('AuthContext: Attempting login for type:', type);
      const endpoint = type === 'distributor' ? API_ENDPOINTS.DISTRIBUTOR_LOGIN : API_ENDPOINTS.CONSUMER_LOGIN;
      console.log('AuthContext: Using endpoint:', endpoint);
      
      const response = await axios.post(endpoint, {
        email,
        password
      });

      console.log('AuthContext: Server response:', response.data);
      const { token, user: userData } = response.data;
      
      // Validate that we have the required data before storing
      if (!token || !userData) {
        console.error('AuthContext: Invalid response data:', response.data);
        toast.error('Invalid response from server');
        return { success: false, error: 'Invalid response from server' };
      }
      
      safeSetItem('token', token);
      safeSetItem('userType', type);
      safeSetItem('user', JSON.stringify(userData));
      
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      
      setUser(userData);
      setUserType(type);
      
      console.log('AuthContext: User state updated:', { user: userData, userType: type });
      
      toast.success('Login successful!');
      return { success: true };
    } catch (error) {
      console.error('AuthContext: Login error:', error);
      const message = error.response?.data?.message || 'Login failed. Please check your credentials.';
      toast.error(message);
      return { success: false, error: message };
    }
  };

  const register = async (userData, type) => {
    try {
      if (!userData.email || !userData.password || !userData.name) {
        toast.error('Please provide all required fields');
        return { success: false, error: 'All required fields must be provided' };
      }

      console.log('AuthContext: Attempting registration for type:', type);
      const endpoint = type === 'distributor' ? API_ENDPOINTS.DISTRIBUTOR_REGISTER : API_ENDPOINTS.CONSUMER_REGISTER;
      console.log('AuthContext: Using endpoint:', endpoint);
      
      const response = await axios.post(endpoint, userData);
      
      console.log('AuthContext: Registration response:', response.data);
      const { token, user: newUser } = response.data;
      
      // Validate that we have the required data before storing
      if (!token || !newUser) {
        console.error('AuthContext: Invalid registration response:', response.data);
        toast.error('Invalid response from server');
        return { success: false, error: 'Invalid response from server' };
      }
      
      safeSetItem('token', token);
      safeSetItem('userType', type);
      safeSetItem('user', JSON.stringify(newUser));
      
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      
      setUser(newUser);
      setUserType(type);
      
      console.log('AuthContext: Registration successful:', { user: newUser, userType: type });
      
      toast.success('Registration successful!');
      return { success: true };
    } catch (error) {
      console.error('AuthContext: Registration error:', error);
      const message = error.response?.data?.message || 'Registration failed. Please try again.';
      toast.error(message);
      return { success: false, error: message };
    }
  };

  const logout = () => {
    clearAuthData();
    toast.success('Logged out successfully');
  };

  const updateUser = (updatedUser) => {
    setUser(updatedUser);
    safeSetItem('user', JSON.stringify(updatedUser));
  };

  const value = {
    user,
    userType,
    loading,
    login,
    register,
    logout,
    updateUser
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}; 