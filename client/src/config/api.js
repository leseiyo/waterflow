// API Configuration
// In production, if no API_URL is set, we'll use mock data
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

// More robust mock mode detection
const isProduction = process.env.NODE_ENV === 'production' || window.location.hostname !== 'localhost';
const hasApiUrl = process.env.REACT_APP_API_URL && process.env.REACT_APP_API_URL !== 'http://localhost:5000';
const MOCK_MODE = process.env.REACT_APP_MOCK_MODE === 'true' || (isProduction && !hasApiUrl);

// Debug logging
console.log('API Config Debug:', {
  NODE_ENV: process.env.NODE_ENV,
  REACT_APP_API_URL: process.env.REACT_APP_API_URL,
  REACT_APP_MOCK_MODE: process.env.REACT_APP_MOCK_MODE,
  isProduction,
  hasApiUrl,
  MOCK_MODE,
  hostname: window.location.hostname
});

export const API_ENDPOINTS = {
  // Authentication
  DISTRIBUTOR_LOGIN: `${API_BASE_URL}/api/distributors/login`,
  DISTRIBUTOR_REGISTER: `${API_BASE_URL}/api/distributors/register`,
  CONSUMER_LOGIN: `${API_BASE_URL}/api/consumers/login`,
  CONSUMER_REGISTER: `${API_BASE_URL}/api/consumers/register`,
  
  // Distributor endpoints
  DISTRIBUTOR_PROFILE: `${API_BASE_URL}/api/distributors/profile`,
  DISTRIBUTOR_SEARCH: `${API_BASE_URL}/api/distributors/search`,
  DISTRIBUTOR_AVAILABILITY: `${API_BASE_URL}/api/distributors/availability`,
  DISTRIBUTOR_SUPPLY: `${API_BASE_URL}/api/distributors/supply`,
  
  // Consumer endpoints
  CONSUMER_PROFILE: `${API_BASE_URL}/api/consumers/profile`,
  CONSUMER_LOCATION: `${API_BASE_URL}/api/consumers/location`,
  CONSUMER_ORDERS: `${API_BASE_URL}/api/consumers/orders`,
  
  // Order endpoints
  ORDERS: `${API_BASE_URL}/api/orders`,
  ORDER_STATUS: (orderId) => `${API_BASE_URL}/api/orders/${orderId}/status`,
  ORDER_LOCATION: (orderId) => `${API_BASE_URL}/api/orders/${orderId}/location`,
  ORDER_CANCEL: (orderId) => `${API_BASE_URL}/api/orders/${orderId}/cancel`,
  
  // Rating endpoints
  RATINGS: `${API_BASE_URL}/api/ratings`,
  DISTRIBUTOR_RATINGS: (distributorId) => `${API_BASE_URL}/api/ratings/distributor/${distributorId}`,
  RATING_STATS: (distributorId) => `${API_BASE_URL}/api/ratings/distributor/${distributorId}/stats`,
  
  // Health check
  HEALTH: `${API_BASE_URL}/api/health`,
};

export default API_ENDPOINTS;

// Mock data for when backend is not available
const MOCK_DATA = {
  distributors: [
    {
      id: 'dist_1',
      name: 'AquaFlow Distributors',
      email: 'contact@aquaflow.com',
      phone: '+254700000001',
      address: 'Nairobi, Kenya',
      location: { lat: -1.2921, lng: 36.8219 },
      rating: 4.5,
      totalOrders: 150,
      isAvailable: true,
      waterTypes: ['Bottled Water', 'Bulk Water'],
      deliveryRadius: 10
    },
    {
      id: 'dist_2', 
      name: 'Pure Water Solutions',
      email: 'info@purewater.co.ke',
      phone: '+254700000002',
      address: 'Mombasa, Kenya',
      location: { lat: -4.0435, lng: 39.6682 },
      rating: 4.2,
      totalOrders: 89,
      isAvailable: true,
      waterTypes: ['Spring Water', 'Mineral Water'],
      deliveryRadius: 15
    }
  ],
  orders: [
    {
      id: 'order_1',
      consumerId: 'consumer_1',
      distributorId: 'dist_1',
      waterType: 'Bottled Water',
      quantity: 20,
      totalAmount: 2000,
      status: 'pending',
      deliveryAddress: '123 Main St, Nairobi',
      createdAt: new Date().toISOString(),
      estimatedDelivery: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString()
    }
  ],
  notifications: [
    {
      id: 'notif_1',
      message: 'New order received from John Doe',
      time: '2 minutes ago',
      read: false
    },
    {
      id: 'notif_2', 
      message: 'Order #1234 has been completed',
      time: '1 hour ago',
      read: true
    }
  ]
};

// Mock API functions
export const mockApi = {
  async login(userType, credentials) {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    if (credentials.email === 'demo@example.com' && credentials.password === 'password') {
      return {
        success: true,
        token: 'mock-jwt-token-' + Date.now(),
        user: {
          id: userType === 'distributor' ? 'dist_1' : 'consumer_1',
          name: userType === 'distributor' ? 'Demo Distributor' : 'Demo Consumer',
          email: credentials.email,
          userType: userType
        }
      };
    }
    
    return {
      success: false,
      message: 'Invalid credentials. Use demo@example.com / password for demo'
    };
  },

  async register(userType, userData) {
    await new Promise(resolve => setTimeout(resolve, 1000));
    return {
      success: true,
      message: 'Registration successful',
      user: {
        id: userType + '_' + Date.now(),
        ...userData,
        userType: userType
      }
    };
  },

  async getDistributors() {
    await new Promise(resolve => setTimeout(resolve, 500));
    return { success: true, data: MOCK_DATA.distributors };
  },

  async getOrders(token) {
    await new Promise(resolve => setTimeout(resolve, 500));
    return { success: true, data: MOCK_DATA.orders };
  },

  async getNotifications(token) {
    await new Promise(resolve => setTimeout(resolve, 300));
    return { success: true, data: MOCK_DATA.notifications };
  },

  async getProfile(token) {
    await new Promise(resolve => setTimeout(resolve, 500));
    return {
      success: true,
      data: {
        id: 'dist_1',
        name: 'Demo Distributor',
        email: 'demo@example.com',
        phone: '+254700000001',
        address: 'Nairobi, Kenya',
        rating: 4.5,
        totalOrders: 150,
        isAvailable: true
      }
    };
  }
};

// Export mock mode flag
export { MOCK_MODE };