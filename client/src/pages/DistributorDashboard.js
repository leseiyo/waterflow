import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Link } from 'react-router-dom';
import { MOCK_MODE, mockApi } from '../config/api';
import LazyWrapper, { 
  LazyDistributorLocationMap, 
  LazyAvailabilityManager 
} from '../components/LazyWrapper';
import { 
  Package, 
  Clock, 
  Star, 
  MapPin, 
  Phone, 
  Mail, 
  Edit, 
  Truck,
  DollarSign,
  CheckCircle,
  XCircle,
  AlertCircle,
  TrendingUp,
  Users,
  RefreshCw,
  Bell,
  Zap,
  Settings
} from 'lucide-react';
import toast from 'react-hot-toast';
import axios from 'axios';

const DistributorDashboard = () => {
  const { user, token } = useAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalOrders: 0,
    pendingOrders: 0,
    completedOrders: 0,
    totalEarnings: 0,
    averageOrderValue: 0,
    monthlyEarnings: 0,
    customerCount: 0,
    rating: 0
  });
  const [orderFilter, setOrderFilter] = useState('all');
  const [notifications, setNotifications] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [performance, setPerformance] = useState({
    deliveryTime: 0,
    customerSatisfaction: 0,
    repeatCustomers: 0,
    responseTime: 0
  });
  const [showAvailabilityManager, setShowAvailabilityManager] = useState(false);
  const [businessMetrics, setBusinessMetrics] = useState({
    waterSupply: { available: 0, capacity: 0, unit: 'liters' },
    workingHours: { start: '08:00', end: '18:00', days: [] },
    transportMode: 'truck',
    pricing: { basePrice: 0, currency: 'USD', perUnit: 'liter', deliveryFee: 0 },
    isActive: true,
    isVerified: false
  });
  const [availability, setAvailability] = useState({
    isOnline: true,
    currentCapacity: 0,
    maxCapacity: 0,
    nextDelivery: null
  });

  useEffect(() => {
    fetchOrders();
    fetchStats();
    fetchNotifications();
    fetchPerformance();
    fetchBusinessMetrics();
    fetchAvailability();
  }, [token]); // Only depend on token to prevent infinite loop

  const fetchOrders = async () => {
    try {
      const response = await axios.get('/api/orders/distributor/orders', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setOrders(response.data);
    } catch (error) {
      toast.error('Failed to fetch orders');
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      if (MOCK_MODE) {
        const result = await mockApi.getProfile(token);
        if (result.success) {
          const mockOrders = await mockApi.getOrders(token);
          const safeOrders = Array.isArray(mockOrders.data) ? mockOrders.data : [];
          const totalOrders = safeOrders.length;
          const pendingOrders = safeOrders.filter(order => order.status === 'pending').length;
          const completedOrders = safeOrders.filter(order => order.status === 'completed').length;
          const totalEarnings = safeOrders
            .filter(order => order.status === 'completed')
            .reduce((sum, order) => sum + (order.totalAmount || 0), 0);
          setStats({ totalOrders, pendingOrders, completedOrders, totalEarnings });
        }
        return;
      }

      const response = await axios.get('/api/distributors/profile', {
        headers: { Authorization: `Bearer ${token}` }
      });
      // Calculate stats from orders
      const safeOrders = Array.isArray(orders) ? orders : [];
      const totalOrders = safeOrders.length;
      const pendingOrders = safeOrders.filter(order => order.status === 'pending').length;
      const completedOrders = safeOrders.filter(order => order.status === 'completed').length;
      const totalEarnings = safeOrders
        .filter(order => order.status === 'completed')
        .reduce((sum, order) => sum + (order.totalAmount || 0), 0);

      setStats({ totalOrders, pendingOrders, completedOrders, totalEarnings });
    } catch (error) {
      console.error('Failed to fetch stats:', error);
      
      // Fallback to mock data if API fails
      if (!MOCK_MODE && (error.code === 'ERR_NETWORK' || error.message.includes('CONNECTION_REFUSED'))) {
        try {
          const result = await mockApi.getProfile(token);
          if (result.success) {
            const mockOrders = await mockApi.getOrders(token);
            const safeOrders = Array.isArray(mockOrders.data) ? mockOrders.data : [];
            const totalOrders = safeOrders.length;
            const pendingOrders = safeOrders.filter(order => order.status === 'pending').length;
            const completedOrders = safeOrders.filter(order => order.status === 'completed').length;
            const totalEarnings = safeOrders
              .filter(order => order.status === 'completed')
              .reduce((sum, order) => sum + (order.totalAmount || 0), 0);
            setStats({ totalOrders, pendingOrders, completedOrders, totalEarnings });
          }
        } catch (mockError) {
          console.error('Mock API also failed:', mockError);
        }
      }
    }
  };

  const updateOrderStatus = async (orderId, status) => {
    try {
      await axios.patch(`/api/orders/${orderId}/status`, 
        { status },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success(`Order ${status}`);
      fetchOrders();
      fetchStats();
    } catch (error) {
      toast.error('Failed to update order status');
    }
  };

  const fetchNotifications = async () => {
    try {
      if (MOCK_MODE) {
        const result = await mockApi.getNotifications(token);
        if (result.success) {
          setNotifications(result.data);
        }
        return;
      }

      const response = await axios.get('/api/distributors/notifications', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setNotifications(response.data);
    } catch (error) {
      console.error('Failed to fetch notifications:', error);
      
      // Fallback to mock data if API fails
      if (!MOCK_MODE && (error.code === 'ERR_NETWORK' || error.message.includes('CONNECTION_REFUSED'))) {
        try {
          const result = await mockApi.getNotifications(token);
          if (result.success) {
            setNotifications(result.data);
          }
        } catch (mockError) {
          console.error('Mock API also failed:', mockError);
          // Final fallback to hardcoded mock data
          setNotifications([
            { id: 1, type: 'new_order', message: 'New order #123456 from John Doe', time: '5 minutes ago', read: false },
            { id: 2, type: 'rating', message: 'You received a 5-star rating!', time: '1 hour ago', read: true },
            { id: 3, type: 'reminder', message: 'Order #123450 is ready for pickup', time: '2 hours ago', read: false }
          ]);
        }
      } else {
        // Mock notifications for demo
        setNotifications([
          { id: 1, type: 'new_order', message: 'New order #123456 from John Doe', time: '5 minutes ago', read: false },
          { id: 2, type: 'rating', message: 'You received a 5-star rating!', time: '1 hour ago', read: true },
          { id: 3, type: 'reminder', message: 'Order #123450 is ready for pickup', time: '2 hours ago', read: false }
        ]);
      }
    }
  };

  const fetchPerformance = async () => {
    try {
      const response = await axios.get('/api/distributors/performance', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setPerformance(response.data);
    } catch (error) {
      // Mock performance data
      setPerformance({
        deliveryTime: 45, // minutes
        customerSatisfaction: 4.8,
        repeatCustomers: 75, // percentage
        responseTime: 5 // minutes
      });
    }
  };

  const refreshData = async () => {
    setRefreshing(true);
    try {
      await Promise.all([
        fetchOrders(),
        fetchStats(),
        fetchNotifications(),
        fetchPerformance()
      ]);
      toast.success('Data refreshed successfully');
    } catch (error) {
      toast.error('Failed to refresh data');
    } finally {
      setRefreshing(false);
    }
  };

  const fetchBusinessMetrics = async () => {
    try {
      const response = await axios.get('/api/distributors/profile', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const distributor = response.data;
      
      setBusinessMetrics({
        waterSupply: {
          available: distributor.waterSupply?.availableQuantity || 0,
          capacity: distributor.waterSupply?.capacity || 0,
          unit: distributor.waterSupply?.unit || 'liters'
        },
        workingHours: {
          start: distributor.workingHours?.start || '08:00',
          end: distributor.workingHours?.end || '18:00',
          days: distributor.workingHours?.daysOfWeek || []
        },
        transportMode: distributor.transportMode || 'truck',
        pricing: {
          basePrice: distributor.pricing?.basePrice || 0,
          currency: distributor.pricing?.currency || 'USD',
          perUnit: distributor.pricing?.perUnit || 'liter',
          deliveryFee: distributor.pricing?.deliveryFee || 0
        },
        isActive: distributor.isActive || false,
        isVerified: distributor.isVerified || false
      });
    } catch (error) {
      console.error('Failed to fetch business metrics:', error);
    }
  };

  const fetchAvailability = async () => {
    try {
      const response = await axios.get('/api/distributors/availability', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setAvailability(response.data);
    } catch (error) {
      // Mock availability data
      setAvailability({
        isOnline: true,
        currentCapacity: businessMetrics.waterSupply.available,
        maxCapacity: businessMetrics.waterSupply.capacity,
        nextDelivery: '2 hours'
      });
    }
  };

  const updateAvailability = async (isOnline) => {
    try {
      await axios.patch('/api/distributors/availability', 
        { isOnline },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setAvailability(prev => ({ ...prev, isOnline }));
      toast.success(`Status updated: ${isOnline ? 'Online' : 'Offline'}`);
    } catch (error) {
      toast.error('Failed to update availability');
    }
  };

  const updateWaterSupply = async (availableQuantity) => {
    try {
      await axios.patch('/api/distributors/supply', 
        { availableQuantity },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setBusinessMetrics(prev => ({
        ...prev,
        waterSupply: { ...prev.waterSupply, available: availableQuantity }
      }));
      toast.success('Water supply updated');
    } catch (error) {
      toast.error('Failed to update water supply');
    }
  };

  const safeOrders = Array.isArray(orders) ? orders : [];
  const filteredOrders = safeOrders.filter(order => {
    if (orderFilter === 'all') return true;
    return order.status === orderFilter;
  });

  const getStatusIcon = (status) => {
    switch (status) {
      case 'pending':
        return <Clock className="h-4 w-4 text-yellow-500" />;
      case 'in-progress':
        return <Truck className="h-4 w-4 text-blue-500" />;
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'cancelled':
        return <XCircle className="h-4 w-4 text-red-500" />;
      default:
        return <AlertCircle className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'in-progress':
        return 'bg-blue-100 text-blue-800';
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Business Dashboard</h1>
              <p className="mt-2 text-gray-600">Welcome back, {user?.name}!</p>
              <p className="text-sm text-gray-500">Manage your water distribution business operations</p>
            </div>
            <div className="flex space-x-3">
              <button
                onClick={() => setShowAvailabilityManager(true)}
                className="flex items-center px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
              >
                <Settings className="h-4 w-4 mr-2" />
                Manage Availability
              </button>
              <button
                onClick={() => updateAvailability(!availability.isOnline)}
                className={`flex items-center px-4 py-2 rounded-lg transition-colors ${
                  availability.isOnline 
                    ? 'bg-green-600 text-white hover:bg-green-700' 
                    : 'bg-gray-600 text-white hover:bg-gray-700'
                }`}
              >
                <div className={`h-2 w-2 rounded-full mr-2 ${availability.isOnline ? 'bg-green-300' : 'bg-gray-300'}`}></div>
                {availability.isOnline ? 'Online' : 'Offline'}
              </button>
              <button
                onClick={refreshData}
                disabled={refreshing}
                className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
                Refresh
              </button>
            </div>
          </div>
        </div>

        {/* Enhanced Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Orders</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalOrders}</p>
                <p className="text-xs text-gray-500 mt-1">All time</p>
              </div>
              <div className="p-3 bg-blue-100 rounded-full">
                <Package className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Earnings</p>
                <p className="text-2xl font-bold text-gray-900">${stats.totalEarnings.toFixed(2)}</p>
                <p className="text-xs text-gray-500 mt-1">Lifetime revenue</p>
              </div>
              <div className="p-3 bg-green-100 rounded-full">
                <DollarSign className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Avg Order Value</p>
                <p className="text-2xl font-bold text-gray-900">${stats.averageOrderValue.toFixed(2)}</p>
                <p className="text-xs text-gray-500 mt-1">Per order</p>
              </div>
              <div className="p-3 bg-purple-100 rounded-full">
                <TrendingUp className="h-6 w-6 text-purple-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Customer Rating</p>
                <p className="text-2xl font-bold text-gray-900">{stats.rating.toFixed(1)}</p>
                <p className="text-xs text-gray-500 mt-1">Out of 5 stars</p>
              </div>
              <div className="p-3 bg-yellow-100 rounded-full">
                <Star className="h-6 w-6 text-yellow-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Service Area Map */}
        <div className="bg-white rounded-lg shadow mb-8">
          <div className="p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Service Area & Order Tracking</h2>
            <LazyWrapper
              component={LazyDistributorLocationMap}
              fallbackType="map"
              distributorLocation={user?.location || { lat: 40.7128, lng: -74.0060 }}
              nearbyConsumers={[
                { name: 'John Doe', phone: '+1234567890', address: '123 Main St', location: { lat: 40.7589, lng: -73.9851 }, distance: 2.5 },
                { name: 'Jane Smith', phone: '+1234567891', address: '456 Oak Ave', location: { lat: 40.7505, lng: -73.9934 }, distance: 1.8 },
                { name: 'Bob Johnson', phone: '+1234567892', address: '789 Pine St', location: { lat: 40.7614, lng: -73.9776 }, distance: 3.2 }
              ]}
              orders={filteredOrders}
              apiKey={process.env.REACT_APP_GOOGLE_MAPS_API_KEY}
              className="w-full h-96"
              onLocationSelect={(location) => {
                console.log('Selected location:', location);
                // Here you would typically update the distributor's location
              }}
            />
          </div>
        </div>

        {/* Business Operations */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Water Supply Management */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Water Supply Management</h3>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Available Supply</span>
                <span className="font-medium">{businessMetrics.waterSupply.available} {businessMetrics.waterSupply.unit}</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-blue-600 h-2 rounded-full" 
                  style={{ 
                    width: `${(businessMetrics.waterSupply.available / businessMetrics.waterSupply.capacity) * 100}%` 
                  }}
                ></div>
              </div>
              <div className="flex justify-between items-center text-xs text-gray-500">
                <span>0 {businessMetrics.waterSupply.unit}</span>
                <span>{businessMetrics.waterSupply.capacity} {businessMetrics.waterSupply.unit}</span>
              </div>
              <div className="flex space-x-2">
                <input
                  type="number"
                  placeholder="Update supply"
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      updateWaterSupply(parseInt(e.target.value));
                      e.target.value = '';
                    }
                  }}
                />
                <button
                  onClick={() => {
                    const input = document.querySelector('input[placeholder="Update supply"]');
                    if (input.value) {
                      updateWaterSupply(parseInt(input.value));
                      input.value = '';
                    }
                  }}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors text-sm"
                >
                  Update
                </button>
              </div>
            </div>
          </div>

          {/* Business Hours & Status */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Business Information</h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Working Hours</span>
                <span className="font-medium">{businessMetrics.workingHours.start} - {businessMetrics.workingHours.end}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Transport Mode</span>
                <span className="font-medium capitalize">{businessMetrics.transportMode}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Pricing</span>
                <span className="font-medium">
                  {businessMetrics.pricing.currency} {businessMetrics.pricing.basePrice}/{businessMetrics.pricing.perUnit}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Delivery Fee</span>
                <span className="font-medium">
                  {businessMetrics.pricing.currency} {businessMetrics.pricing.deliveryFee}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Verification Status</span>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                  businessMetrics.isVerified 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-yellow-100 text-yellow-800'
                }`}>
                  {businessMetrics.isVerified ? 'Verified' : 'Pending'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Performance Metrics & Notifications */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* Performance Metrics */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Performance Metrics</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center p-4 bg-blue-50 rounded-lg">
                  <Clock className="h-8 w-8 text-blue-600 mx-auto mb-2" />
                  <p className="text-2xl font-bold text-gray-900">{performance.deliveryTime}m</p>
                  <p className="text-sm text-gray-600">Avg Delivery Time</p>
                </div>
                <div className="text-center p-4 bg-green-50 rounded-lg">
                  <Star className="h-8 w-8 text-green-600 mx-auto mb-2" />
                  <p className="text-2xl font-bold text-gray-900">{performance.customerSatisfaction}</p>
                  <p className="text-sm text-gray-600">Customer Satisfaction</p>
                </div>
                <div className="text-center p-4 bg-purple-50 rounded-lg">
                  <Users className="h-8 w-8 text-purple-600 mx-auto mb-2" />
                  <p className="text-2xl font-bold text-gray-900">{performance.repeatCustomers}%</p>
                  <p className="text-sm text-gray-600">Repeat Customers</p>
                </div>
                <div className="text-center p-4 bg-orange-50 rounded-lg">
                  <Zap className="h-8 w-8 text-orange-600 mx-auto mb-2" />
                  <p className="text-2xl font-bold text-gray-900">{performance.responseTime}m</p>
                  <p className="text-sm text-gray-600">Response Time</p>
                </div>
              </div>
            </div>
          </div>

          {/* Notifications */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Notifications</h3>
                <div className="flex items-center space-x-2">
                  {Array.isArray(notifications) && notifications.filter(n => !n.read).length > 0 && (
                    <span className="bg-red-500 text-white text-xs rounded-full px-2 py-1">
                      {notifications.filter(n => !n.read).length}
                    </span>
                  )}
                <Bell className="h-5 w-5 text-gray-400" />
                </div>
              </div>
              <div className="space-y-3">
                {Array.isArray(notifications) && notifications.slice(0, 3).map((notification) => (
                  <div key={notification.id} className={`p-3 rounded-lg cursor-pointer transition-all hover:shadow-md ${notification.read ? 'bg-gray-50' : 'bg-blue-50 border-l-4 border-blue-500'}`}>
                    <p className="text-sm text-gray-900">{notification.message}</p>
                    <p className="text-xs text-gray-500 mt-1">{notification.time}</p>
                  </div>
                ))}
                {(!Array.isArray(notifications) || notifications.length === 0) && (
                  <div className="text-center py-4">
                    <Bell className="h-8 w-8 text-gray-300 mx-auto mb-2" />
                    <p className="text-sm text-gray-500">No notifications</p>
                  </div>
                )}
                {Array.isArray(notifications) && notifications.length > 3 && (
                  <button className="w-full text-sm text-blue-600 hover:text-blue-800 font-medium">
                    View All ({notifications.length})
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Business Profile Card */}
        <div className="bg-white rounded-lg shadow mb-8">
          <div className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-gray-900">Business Profile</h2>
              <div className="flex space-x-2">
                <Link
                  to="/distributor/profile"
                  className="flex items-center px-3 py-1 text-blue-600 hover:text-blue-700 text-sm"
                >
                  <Edit className="h-4 w-4 mr-1" />
                  Edit Profile
                </Link>
                <Link
                  to="/distributor/settings"
                  className="flex items-center px-3 py-1 text-gray-600 hover:text-gray-700 text-sm"
                >
                  <Settings className="h-4 w-4 mr-1" />
                  Settings
                </Link>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-3">{user?.name}</h3>
                <div className="space-y-2">
                  <div className="flex items-center text-gray-600">
                    <Mail className="h-4 w-4 mr-2" />
                    {user?.email}
                  </div>
                  <div className="flex items-center text-gray-600">
                    <Phone className="h-4 w-4 mr-2" />
                    {user?.phone}
                  </div>
                  <div className="flex items-center text-gray-600">
                    <MapPin className="h-4 w-4 mr-2" />
                    {user?.address}
                  </div>
                </div>
              </div>
              
              <div>
                <h4 className="text-md font-medium text-gray-900 mb-3">Business Details</h4>
                <div className="space-y-2">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Water Supply Capacity</p>
                    <p className="text-gray-900">{businessMetrics.waterSupply.capacity} {businessMetrics.waterSupply.unit}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-600">Working Hours</p>
                    <p className="text-gray-900">{businessMetrics.workingHours.start} - {businessMetrics.workingHours.end}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-600">Transport Mode</p>
                    <p className="text-gray-900 capitalize">{businessMetrics.transportMode}</p>
                  </div>
                </div>
              </div>

              <div>
                <h4 className="text-md font-medium text-gray-900 mb-3">Pricing & Rating</h4>
                <div className="space-y-2">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Base Price</p>
                    <p className="text-gray-900">
                      {businessMetrics.pricing.currency} {businessMetrics.pricing.basePrice}/{businessMetrics.pricing.perUnit}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-600">Delivery Fee</p>
                    <p className="text-gray-900">
                      {businessMetrics.pricing.currency} {businessMetrics.pricing.deliveryFee}
                    </p>
                  </div>
                  <div className="flex items-center">
                    <Star className="h-4 w-4 text-yellow-400 mr-1" />
                    <span className="text-gray-900">{stats.rating.toFixed(1)} / 5</span>
                    <span className="text-sm text-gray-500 ml-2">({stats.totalOrders} orders)</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Orders Section */}
        <div className="bg-white rounded-lg shadow">
          <div className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-gray-900">Recent Orders</h2>
              <div className="flex items-center space-x-2">
                <select
                  value={orderFilter}
                  onChange={(e) => setOrderFilter(e.target.value)}
                  className="px-3 py-1 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">All Orders</option>
                  <option value="pending">Pending</option>
                  <option value="in-progress">In Progress</option>
                  <option value="completed">Completed</option>
                  <option value="cancelled">Cancelled</option>
                </select>
                <span className="text-sm text-gray-500">{filteredOrders.length} orders</span>
              </div>
            </div>
            
            {orders.length === 0 ? (
              <div className="text-center py-8">
                <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">No orders yet</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Order ID
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Customer
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Quantity
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Amount
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Date
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredOrders.map((order) => (
                      <tr key={order._id}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          #{order._id.slice(-6)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {order.consumer?.name}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {order.quantity} {order.unit}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          ${order.totalAmount}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(order.status)}`}>
                            {getStatusIcon(order.status)}
                            <span className="ml-1">{order.status}</span>
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {new Date(order.createdAt).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          {order.status === 'pending' && (
                            <div className="space-x-2">
                              <button
                                onClick={() => updateOrderStatus(order._id, 'in-progress')}
                                className="text-blue-600 hover:text-blue-900"
                              >
                                Accept
                              </button>
                              <button
                                onClick={() => updateOrderStatus(order._id, 'cancelled')}
                                className="text-red-600 hover:text-red-900"
                              >
                                Decline
                              </button>
                            </div>
                          )}
                          {order.status === 'in-progress' && (
                            <button
                              onClick={() => updateOrderStatus(order._id, 'completed')}
                              className="text-green-600 hover:text-green-900"
                            >
                              Complete
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Availability Manager Modal */}
      {showAvailabilityManager && (
        <LazyWrapper
          component={LazyAvailabilityManager}
          fallbackType="card"
          isOpen={showAvailabilityManager}
          onClose={() => setShowAvailabilityManager(false)}
          onAvailabilityUpdated={(updatedAvailability) => {
            setAvailability(updatedAvailability);
            fetchNotifications();
          }}
        />
      )}
    </div>
  );
};

export default DistributorDashboard; 