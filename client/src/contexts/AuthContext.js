import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import API_ENDPOINTS from '../config/api';
import { getSupabase, isSupabaseConfigured } from '../config/supabase';

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

  // Initialize auth state from Supabase session or localStorage
  useEffect(() => {
    let unsub = null;
    (async () => {
      console.log('AuthContext: Initializing...');
      try {
        if (isSupabaseConfigured()) {
          const supabase = await getSupabase();
          const {
            data: { session },
          } = await supabase.auth.getSession();
          if (session?.user) {
            setUser({ id: session.user.id, email: session.user.email });
            const storedType = safeGetItem('userType');
            if (storedType) setUserType(storedType);
            setLoading(false);
          } else {
            // Fallback to localStorage (legacy)
            const token = safeGetItem('token');
            const storedUserType = safeGetItem('userType');
            const storedUser = safeGetItem('user');
            if (token && storedUserType && storedUser) {
              const parsedUser = safeJsonParse(storedUser);
              if (parsedUser) {
                setUser(parsedUser);
                setUserType(storedUserType);
                axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
              } else {
                clearAuthData();
              }
            } else {
              clearAuthData();
            }
            setLoading(false);
          }

          // Subscribe to auth state changes
          unsub = supabase.auth.onAuthStateChange((_event, sess) => {
            if (sess?.user) {
              setUser({ id: sess.user.id, email: sess.user.email });
            } else {
              clearAuthData();
            }
          }).data.subscription;
        } else {
          // No Supabase config; use legacy behavior
          const token = safeGetItem('token');
          const storedUserType = safeGetItem('userType');
          const storedUser = safeGetItem('user');
          if (token && storedUserType && storedUser) {
            const parsedUser = safeJsonParse(storedUser);
            if (parsedUser) {
              setUser(parsedUser);
              setUserType(storedUserType);
              axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
            } else {
              clearAuthData();
            }
          } else {
            clearAuthData();
          }
          setLoading(false);
        }
      } catch (e) {
        console.error('Auth init error:', e);
        setLoading(false);
      }
    })();

    return () => {
      if (unsub) unsub.unsubscribe();
    };
  }, []);

  const login = async (email, password, type) => {
    try {
      if (!email || !password) {
        toast.error('Please provide both email and password');
        return { success: false, error: 'Email and password are required' };
      }

      if (isSupabaseConfigured()) {
        const supabase = await getSupabase();
        const { data, error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        setUser({ id: data.user.id, email: data.user.email });
        if (type) safeSetItem('userType', type);
        setUserType(type || safeGetItem('userType'));
        toast.success('Login successful!');
        return { success: true };
      }

      console.log('AuthContext: Attempting login for type:', type);
      const endpoint = type === 'distributor' ? API_ENDPOINTS.DISTRIBUTOR_LOGIN : API_ENDPOINTS.CONSUMER_LOGIN;
      const response = await axios.post(endpoint, { email, password });
      const { token, user: userData } = response.data;
      if (!token || !userData) {
        toast.error('Invalid response from server');
        return { success: false, error: 'Invalid response from server' };
      }
      safeSetItem('token', token);
      safeSetItem('userType', type);
      safeSetItem('user', JSON.stringify(userData));
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      setUser(userData);
      setUserType(type);
      toast.success('Login successful!');
      return { success: true };
    } catch (error) {
      console.error('AuthContext: Login error:', error);
      const message = error.message || error.response?.data?.message || 'Login failed. Please check your credentials.';
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

      if (isSupabaseConfigured()) {
        const supabase = await getSupabase();
        const { data, error } = await supabase.auth.signUp({ email: userData.email, password: userData.password });
        if (error) throw error;
        // Store minimal profile locally; extend later with a public profile table
        setUser({ id: data.user.id, email: data.user.email, name: userData.name });
        if (type) safeSetItem('userType', type);
        setUserType(type || safeGetItem('userType'));
        toast.success('Registration successful! Check your email for verification.');
        return { success: true };
      }

      const endpoint = type === 'distributor' ? API_ENDPOINTS.DISTRIBUTOR_REGISTER : API_ENDPOINTS.CONSUMER_REGISTER;
      const response = await axios.post(endpoint, userData);
      const { token, user: newUser } = response.data;
      if (!token || !newUser) {
        toast.error('Invalid response from server');
        return { success: false, error: 'Invalid response from server' };
      }
      safeSetItem('token', token);
      safeSetItem('userType', type);
      safeSetItem('user', JSON.stringify(newUser));
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      setUser(newUser);
      setUserType(type);
      toast.success('Registration successful!');
      return { success: true };
    } catch (error) {
      console.error('AuthContext: Registration error:', error);
      const message = error.message || error.response?.data?.message || 'Registration failed. Please try again.';
      toast.error(message);
      return { success: false, error: message };
    }
  };

  const logout = async () => {
    try {
      if (isSupabaseConfigured()) {
        const supabase = await getSupabase();
        await supabase.auth.signOut();
      }
    } catch (e) {
      console.error('Supabase signOut error:', e);
    }
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