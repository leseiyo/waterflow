import React, { useState, useEffect, useMemo, useCallback, lazy } from 'react';
import { Link } from 'react-router-dom';
import {
  Mail,
  MapPin,
  RefreshCw,
  Bell,
  Plus,
  Filter,
  Heart,
  Truck,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  Edit,
  Star
} from 'lucide-react';

import Header from '../components/Header';
import OptimizedDashboardStats from '../components/OptimizedDashboardStats';
import LazyWrapper from '../components/LazyWrapper';

import { useAuth } from '../contexts/AuthContext';
import useApiCache from '../hooks/useApiCache';
import axios from 'axios';
import toast from 'react-hot-toast';

// lazy load placeholders (optional)
const LazyOrderForm = lazy(() => import('../components/OrderForm'));
const LazyDistributorSearch = lazy(() => import('../components/DistributorSearch'));
const LazyRatingForm = lazy(() => import('../components/RatingForm'));

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

  const fetchOrders = useCallback(async () => {
    try {
      if (refetchOrders) await refetchOrders();
    } catch (error) {
      console.error('fetchOrders error', error);
    }
  }, [refetchOrders]);

  const fetchNearbyDistributors = useCallback(async () => {
    try {
      if (refetchDistributors) await refetchDistributors();
    } catch (error) {
      console.error('fetchNearbyDistributors error', error);
    }
  }, [refetchDistributors]);

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
        { id: 3, type: 'reminder', message: "Don't forget to rate your recent delivery", time: '2 days ago', read: true }
      ]);
    }
  }, [token]);

  const loadFavorites = useCallback(() => {
    const favorites = JSON.parse(localStorage.getItem('favoriteDistributors') || '[]');
    setFavoriteDistributors(favorites);
  }, []);

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
    const rated = orders.filter(order => order.rating);
    const averageRating = rated.length > 0 ? (rated.reduce((sum, order) => sum + order.rating, 0) / rated.length) : 0;

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

    // Load critical data first so UI becomes interactive quickly
    const init = async () => {
      try {
        // prioritize orders + nearby distributors
        await Promise.all([fetchOrders(), fetchNearbyDistributors()]);
      } catch (err) {
        console.error('init critical fetch failed', err);
      } finally {
        // mark UI as ready as soon as critical data arrived
        loadFavorites();
        setLoading(false);

        // run non-critical analytics & notifications in idle time / background
        const backgroundWork = () => {
          fetchAnalytics().catch(e => console.error('fetchAnalytics failed', e));
          fetchNotifications().catch(e => console.error('fetchNotifications failed', e));
        };

        if ('requestIdleCallback' in window) {
          // schedule when browser is idle
          // @ts-ignore
          requestIdleCallback(backgroundWork, { timeout: 2000 });
        } else {
          // fallback: small delay so UI settles first
          setTimeout(backgroundWork, 800);
        }
      }
    };

    if (token) init();
    else {
      loadFavorites();
      setLoading(false);
      // still kick off background work for non-authenticated demos if desired
      setTimeout(() => {
        fetchAnalytics().catch(() => {});
        fetchNotifications().catch(() => {});
      }, 800);
    }
  }, [fetchOrders, fetchNearbyDistributors, fetchAnalytics, fetchNotifications, loadFavorites, token]);

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
      <Header />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <OptimizedDashboardStats stats={dashboardStats} loading={ordersLoading} type="consumer" />
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

        {/* Orders Table */}
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">My Orders</h3>
            <button
              onClick={refreshData}
              className="flex items-center text-sm font-medium text-gray-700 hover:text-gray-900"
            >
              <RefreshCw className="h-4 w-4 mr-1" />
              Refresh
            </button>
          </div>
          {orders.length === 0 ? (
            <p className="text-center text-gray-500 py-4">No orders found</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Order ID</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredOrders.map((order) => (
                    <tr key={order._id || order.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{order._id || order.id}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{order.createdAt ? new Date(order.createdAt).toLocaleDateString() : '—'}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(order.status)}`}>
                          {getStatusIcon(order.status)}
                          {order.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{((order.totalAmount ?? 0)).toFixed(2)} USD</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-right">
                        <Link
                          to={`/order/${order._id || order.id}`}
                          className="text-indigo-600 hover:text-indigo-900 font-medium"
                        >
                          View
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Nearby Distributors */}
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Nearby Distributors</h3>
            <button
              onClick={fetchNearbyDistributors}
              className="flex items-center text-sm font-medium text-gray-700 hover:text-gray-900"
            >
              <RefreshCw className="h-4 w-4 mr-1" />
              Refresh
            </button>
          </div>
          {distributors.length === 0 ? (
            <p className="text-center text-gray-500 py-4">No distributors found</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {distributors.map((distributor) => (
                <div key={distributor.id} className="bg-gray-50 rounded-lg p-4 shadow">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="text-md font-semibold text-gray-900">{distributor.name}</h4>
                    <button
                      onClick={() => toggleFavorite(distributor.id)}
                      className="text-gray-400 hover:text-gray-500"
                    >
                      {favoriteDistributors.includes(distributor.id) ? (
                        <Heart className="h-5 w-5 text-red-500" />
                      ) : (
                        <Heart className="h-5 w-5" />
                      )}
                    </button>
                  </div>
                  <p className="text-sm text-gray-700 mb-2">{distributor.address}</p>
                  <div className="flex flex-wrap gap-2">
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-50 text-blue-700">
                      <MapPin className="h-4 w-4 mr-1" />
                      {distributor.distance} km
                    </span>
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-50 text-green-700">
                      <Star className="h-4 w-4 mr-1" />
                      {distributor.rating.toFixed(1)}
                    </span>
                  </div>
                  <div className="mt-4">
                    <Link
                      to={`/distributor/${distributor.id}`}
                      className="w-full inline-flex items-center justify-center px-4 py-2 text-sm font-medium rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-colors"
                    >
                      View Details
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Analytics Overview */}
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Analytics Overview</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-blue-50 p-4 rounded-lg shadow">
              <div className="flex items-center justify-between mb-2">
                <div className="text-blue-700">
                  <Mail className="h-6 w-6" />
                </div>
                <div className="text-right">
                  <p className="text-xs font-medium text-gray-500">Total Orders</p>
                  <p className="text-lg font-semibold text-gray-900">{orders.length}</p>
                </div>
              </div>
            </div>
            <div className="bg-green-50 p-4 rounded-lg shadow">
              <div className="flex items-center justify-between mb-2">
                <div className="text-green-700">
                  <CheckCircle className="h-6 w-6" />
                </div>
                <div className="text-right">
                  <p className="text-xs font-medium text-gray-500">Completed Orders</p>
                  <p className="text-lg font-semibold text-gray-900">{orders.filter(order => order.status === 'completed').length}</p>
                </div>
              </div>
            </div>
            <div className="bg-yellow-50 p-4 rounded-lg shadow">
              <div className="flex items-center justify-between mb-2">
                <div className="text-yellow-700">
                  <Star className="h-6 w-6" />
                </div>
                <div className="text-right">
                  <p className="text-xs font-medium text-gray-500">Average Rating</p>
                  <p className="text-lg font-semibold text-gray-900">{Number(dashboardStats.averageRating || 0).toFixed(1)}</p>
                </div>
              </div>
            </div>
            <div className="bg-red-50 p-4 rounded-lg shadow">
              <div className="flex items-center justify-between mb-2">
                <div className="text-red-700">
                  <XCircle className="h-6 w-6" />
                </div>
                <div className="text-right">
                  <p className="text-xs font-medium text-gray-500">Cancelled Orders</p>
                  <p className="text-lg font-semibold text-gray-900">{orders.filter(order => order.status === 'cancelled').length}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Order Form Modal */}
      {showOrderForm && (
        <LazyWrapper component={LazyOrderForm} fallback={<div className="p-6">Loading form...</div>} isOpen={showOrderForm} onClose={() => setShowOrderForm(false)} />
      )}

      {/* Distributor Search Modal */}
      {showDistributorSearch && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <LazyWrapper component={LazyDistributorSearch} fallback={<div className="p-6">Loading search...</div>} onDistributorSelect={(d) => { /* ... */ }} selectedLocation={user?.location} />
          </div>
        </div>
      )}

      {/* Rating Form Modal */}
      {showRatingForm && (
        <LazyWrapper component={LazyRatingForm} fallback={<div className="p-6">Loading rating...</div>} order={selectedOrderForRating} onClose={() => setShowRatingForm(false)} />
      )}
    </div>
  );
};

export default ConsumerDashboard;