import React, { useState, useEffect, useCallback, memo, useMemo } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Link } from 'react-router-dom';
import useApiCache from '../hooks/useApiCache';
import LoadingSkeleton from '../components/LoadingSkeleton';
import OptimizedDashboardStats from '../components/OptimizedDashboardStats';
import LazyWrapper, { 
  LazyOrderTrackingMap, 
  LazyOrderForm, 
  LazyDistributorSearch, 
  LazyRatingForm 
} from '../components/LazyWrapper';
import { 
  Package, 
  Clock, 
  Star, 
  MapPin, 
  Phone, 
  Mail, 
  Edit, 
  Search,
  Plus,
  CheckCircle,
  XCircle,
  AlertCircle,
  Truck,
  TrendingUp,
  DollarSign,
  Calendar,
  Filter,
  RefreshCw,
  Bell,
  Heart,
  X,
} from 'lucide-react';
import toast from 'react-hot-toast';
import axios from 'axios';

const ConsumerDashboard = () => {
  const { user, token } = useAuth();
  const [orders, setOrders] = useState([]);
  const [distributors, setDistributors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchLocation, setSearchLocation] = useState('');
  const [favoriteDistributors, setFavoriteDistributors] = useState([]);
  const [orderFilter, setOrderFilter] = useState('all');
  const [analytics, setAnalytics] = useState({
    totalSpent: 0,
    averageOrderValue: 0,
    monthlyTrend: 0,
    topDistributor: null,
    orderFrequency: 0
  });
  const [notifications, setNotifications] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [showOrderForm, setShowOrderForm] = useState(false);
  const [showDistributorSearch, setShowDistributorSearch] = useState(false);
  const [showRatingForm, setShowRatingForm] = useState(false);
  const [selectedOrderForRating, setSelectedOrderForRating] = useState(null);

  console.log('ConsumerDashboard: Component rendered');
  console.log('ConsumerDashboard: User:', user);
  console.log('ConsumerDashboard: Token:', token);

  // Optimized data fetching with caching
  const { 
    data: ordersData, 
    loading: ordersLoading, 
    refetch: refetchOrders 
  } = useApiCache('/api/orders/consumer/orders', {
    headers: { Authorization: `Bearer ${token}` },
    cacheKey: `orders-${user?.id}`,
    enabled: !!token
  });

  const { 
    data: distributorsData, 
    loading: distributorsLoading, 
    refetch: refetchDistributors 
  } = useApiCache('/api/distributors/search', {
    headers: { Authorization: `Bearer ${token}` },
    params: { location: user?.address || searchLocation },
    cacheKey: `distributors-${user?.address || searchLocation}`,
    enabled: !!token
  });

  const handleSearchDistributors = () => {
    if (searchLocation) {
      fetchNearbyDistributors();
    }
  };

  const fetchAnalytics = useCallback(async () => {
    try {
      const response = await axios.get('/api/consumers/analytics', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setAnalytics(response.data);
    } catch (error) {
      // Calculate basic analytics from orders if API not available
      const totalSpent = orders.reduce((sum, order) => sum + (order.totalAmount || 0), 0);
      const averageOrderValue = orders.length > 0 ? totalSpent / orders.length : 0;
      const completedOrders = orders.filter(order => order.status === 'completed');
      const monthlyOrders = completedOrders.filter(order => {
        const orderDate = new Date(order.createdAt);
        const now = new Date();
        return orderDate.getMonth() === now.getMonth() && orderDate.getFullYear() === now.getFullYear();
      });
      
      setAnalytics({
        totalSpent,
        averageOrderValue,
        monthlyTrend: monthlyOrders.length,
        topDistributor: null,
        orderFrequency: orders.length
      });
    }
  }, [token, orders]);

  const fetchNotifications = useCallback(async () => {
    try {
      const response = await axios.get('/api/consumers/notifications', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setNotifications(response.data);
    } catch (error) {
      // Mock notifications for demo
      setNotifications([
        { id: 1, type: 'order_update', message: 'Your order #123456 has been delivered', time: '2 hours ago', read: false },
        { id: 2, type: 'promotion', message: '20% off your next order with AquaPure', time: '1 day ago', read: true },
        { id: 3, type: 'reminder', message: 'Don\'t forget to rate your recent delivery', time: '2 days ago', read: true }
      ]);
    }
  }, [token]);

  const loadFavorites = () => {
    const favorites = JSON.parse(localStorage.getItem('favoriteDistributors') || '[]');
    setFavoriteDistributors(favorites);
  };

  const toggleFavorite = (distributorId) => {
    const favorites = [...favoriteDistributors];
    const index = favorites.indexOf(distributorId);
    
    if (index > -1) {
      favorites.splice(index, 1);
      toast.success('Removed from favorites');
    } else {
      favorites.push(distributorId);
      toast.success('Added to favorites');
    }
    
    setFavoriteDistributors(favorites);
    localStorage.setItem('favoriteDistributors', JSON.stringify(favorites));
  };

  const refreshData = async () => {
    setRefreshing(true);
    try {
      await Promise.all([
        fetchOrders(),
        fetchNearbyDistributors(),
        fetchAnalytics(),
        fetchNotifications()
      ]);
      toast.success('Data refreshed successfully');
    } catch (error) {
      toast.error('Failed to refresh data');
    } finally {
      setRefreshing(false);
    }
  };

  // Memoized filtered orders
  const filteredOrders = useMemo(() => {
    return orders.filter(order => {
      if (orderFilter === 'all') return true;
      return order.status === orderFilter;
    });
  }, [orders, orderFilter]);

  // Memoized stats calculation
  const dashboardStats = useMemo(() => {
    const totalOrders = orders.length;
    const completedOrders = orders.filter(order => order.status === 'completed').length;
    const totalSpent = orders
      .filter(order => order.status === 'completed')
      .reduce((sum, order) => sum + (order.totalAmount || 0), 0);
    const averageRating = orders
      .filter(order => order.rating)
      .reduce((sum, order) => sum + order.rating, 0) / 
      orders.filter(order => order.rating).length || 0;

    return {
      totalOrders,
      completedOrders,
      totalSpent,
      averageRating
    };
  }, [orders]);

  // Update local state when cached data changes
  useEffect(() => {
    if (ordersData) {
      setOrders(ordersData);
    }
  }, [ordersData]);

  useEffect(() => {
    if (distributorsData) {
      setDistributors(distributorsData);
    }
  }, [distributorsData]);

  useEffect(() => {
    console.log('ConsumerDashboard: useEffect triggered');
    fetchAnalytics();
    fetchNotifications();
    loadFavorites();
  }, [fetchAnalytics, fetchNotifications, loadFavorites]);

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
              <h1 className="text-3xl font-bold text-gray-900">Consumer Dashboard</h1>
              <p className="mt-2 text-gray-600">Welcome back, {user?.name}!</p>
              <p className="text-sm text-gray-500">Track your water orders and discover nearby distributors</p>
            </div>
            <div className="flex space-x-3">
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

        {/* Optimized Stats Cards */}
        <OptimizedDashboardStats 
          stats={dashboardStats} 
          loading={ordersLoading} 
          type="consumer" 
        />

        {/* Notifications & Quick Actions */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* Notifications */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Notifications</h3>
                <Bell className="h-5 w-5 text-gray-400" />
              </div>
              <div className="space-y-3">
                {notifications.slice(0, 3).map((notification) => (
                  <div key={notification.id} className={`p-3 rounded-lg ${notification.read ? 'bg-gray-50' : 'bg-blue-50 border-l-4 border-blue-500'}`}>
                    <p className="text-sm text-gray-900">{notification.message}</p>
                    <p className="text-xs text-gray-500 mt-1">{notification.time}</p>
                  </div>
                ))}
                {notifications.length === 0 && (
                  <p className="text-sm text-gray-500 text-center py-4">No notifications</p>
                )}
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Link
                  to="/order/new"
                  className="flex flex-col items-center p-4 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors"
                >
                  <Plus className="h-8 w-8 text-blue-600 mb-2" />
                  <span className="text-sm font-medium text-blue-900">New Order</span>
                </Link>
                <Link
                  to="/consumer/profile"
                  className="flex flex-col items-center p-4 bg-green-50 rounded-lg hover:bg-green-100 transition-colors"
                >
                  <Edit className="h-8 w-8 text-green-600 mb-2" />
                  <span className="text-sm font-medium text-green-900">Edit Profile</span>
                </Link>
                <button
                  onClick={() => setOrderFilter(orderFilter === 'all' ? 'pending' : 'all')}
                  className="flex flex-col items-center p-4 bg-yellow-50 rounded-lg hover:bg-yellow-100 transition-colors"
                >
                  <Filter className="h-8 w-8 text-yellow-600 mb-2" />
                  <span className="text-sm font-medium text-yellow-900">Filter Orders</span>
                </button>
                <Link
                  to="/order/tracking"
                  className="flex flex-col items-center p-4 bg-purple-50 rounded-lg hover:bg-purple-100 transition-colors"
                >
                  <Truck className="h-8 w-8 text-purple-600 mb-2" />
                  <span className="text-sm font-medium text-purple-900">Track Order</span>
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Profile Card */}
        <div className="bg-white rounded-lg shadow mb-8">
          <div className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-gray-900">Profile Information</h2>
              <button className="flex items-center text-blue-600 hover:text-blue-700">
                <Edit className="h-4 w-4 mr-1" />
                Edit
              </button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                <div className="space-y-3">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Total Orders</p>
                    <p className="text-gray-900">{user?.orderStats?.totalOrders || 0}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-600">Total Spent</p>
                    <p className="text-gray-900">${user?.orderStats?.totalSpent || 0}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-600">Member Since</p>
                    <p className="text-gray-900">
                      {user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'N/A'}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Find Distributors Section */}
        <div className="bg-white rounded-lg shadow mb-8">
          <div className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-gray-900">Find Water Distributors</h2>
              <div className="flex items-center space-x-2">
                <span className="text-sm text-gray-500">{distributors.length} found</span>
                <div className="flex items-center space-x-1">
                  <Heart className="h-4 w-4 text-red-500" />
                  <span className="text-sm text-gray-500">{favoriteDistributors.length} favorites</span>
                </div>
              </div>
            </div>
            
            <div className="flex gap-4 mb-6">
              <div className="flex-1">
                <input
                  type="text"
                  placeholder="Enter your location"
                  value={searchLocation}
                  onChange={(e) => setSearchLocation(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <button
                onClick={handleSearchDistributors}
                className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
              >
                <Search className="h-4 w-4 mr-2" />
                Search
              </button>
            </div>

            {distributors.length === 0 ? (
              <div className="text-center py-8">
                <Search className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">No distributors found in your area</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {distributors.slice(0, 6).map((distributor) => (
                  <div key={distributor._id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow relative">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="font-medium text-gray-900">{distributor.name}</h3>
                      <div className="flex items-center space-x-2">
                        <div className="flex items-center">
                          <Star className="h-4 w-4 text-yellow-400 mr-1" />
                          <span className="text-sm text-gray-600">{distributor.rating || 0}</span>
                        </div>
                        <button
                          onClick={() => toggleFavorite(distributor._id)}
                          className="p-1 hover:bg-gray-100 rounded-full transition-colors"
                        >
                          <Heart 
                            className={`h-4 w-4 ${
                              favoriteDistributors.includes(distributor._id) 
                                ? 'text-red-500 fill-current' 
                                : 'text-gray-400'
                            }`} 
                          />
                        </button>
                      </div>
                    </div>
                    
                    <div className="space-y-2 text-sm text-gray-600 mb-4">
                      <div className="flex items-center">
                        <MapPin className="h-4 w-4 mr-2" />
                        {distributor.address}
                      </div>
                      <div className="flex items-center">
                        <Phone className="h-4 w-4 mr-2" />
                        {distributor.phone}
                      </div>
                      <div>
                        <span className="font-medium">Supply:</span> {distributor.waterSupply}
                      </div>
                      <div>
                        <span className="font-medium">Pricing:</span> {distributor.pricing}
                      </div>
                    </div>

                    <Link
                      to={`/order/new?distributor=${distributor._id}`}
                      className="w-full flex items-center justify-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Order Water
                    </Link>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Order Tracking Section */}
        {filteredOrders.filter(order => order.status === 'in-progress').length > 0 && (
          <div className="bg-white rounded-lg shadow mb-8">
            <div className="p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Track Your Orders</h2>
              <div className="space-y-6">
                {filteredOrders
                  .filter(order => order.status === 'in-progress')
                  .slice(0, 2)
                  .map((order) => (
                    <LazyWrapper
                      key={order._id}
                      component={LazyOrderTrackingMap}
                      fallbackType="map"
                      order={order}
                      distributorLocation={order.distributor?.location || { lat: 40.7128, lng: -74.0060 }}
                      consumerLocation={user?.location || { lat: 40.7589, lng: -73.9851 }}
                      currentLocation={order.currentLocation}
                      apiKey={process.env.REACT_APP_GOOGLE_MAPS_API_KEY}
                      className="w-full h-80"
                    />
                  ))}
              </div>
            </div>
          </div>
        )}

        {/* Recent Orders Section */}
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
                <Link
                  to="/order/new"
                  className="inline-flex items-center mt-4 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Place Your First Order
                </Link>
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
                        Distributor
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
                    {filteredOrders.slice(0, 10).map((order) => (
                      <tr key={order._id}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          #{order._id.slice(-6)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {order.distributor?.name}
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
                          <Link
                            to={`/order/${order._id}`}
                            className="text-blue-600 hover:text-blue-900"
                          >
                            View Details
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        <div className="mt-8 text-center">
          <Link to="/consumer/dashboard" className="text-blue-600 hover:text-blue-900">
            Consumer Dashboard
          </Link>
        </div>
      </div>

      {/* Order Form Modal */}
      {showOrderForm && (
        <LazyWrapper
          component={LazyOrderForm}
          fallbackType="card"
          isOpen={showOrderForm}
          onClose={() => setShowOrderForm(false)}
        />
      )}

      {/* Distributor Search Modal */}
      {showDistributorSearch && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-900">Browse Distributors</h2>
                <button
                  onClick={() => setShowDistributorSearch(false)}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>
              <LazyWrapper
                component={LazyDistributorSearch}
                fallbackType="list"
                fallbackCount={3}
                onDistributorSelect={(distributor) => {
                  setShowDistributorSearch(false);
                  setShowOrderForm(true);
                }}
                selectedLocation={user?.location}
              />
            </div>
          </div>
        </div>
      )}

      {/* Rating Form Modal */}
      {showRatingForm && (
        <LazyWrapper
          component={LazyRatingForm}
          fallbackType="card"
          isOpen={showRatingForm}
          onClose={() => {
            setShowRatingForm(false);
            setSelectedOrderForRating(null);
          }}
          order={selectedOrderForRating}
          onRatingSubmitted={() => {
            refetchOrders();
            fetchAnalytics();
          }}
        />
      )}
    </div>
  );
};

export default ConsumerDashboard;