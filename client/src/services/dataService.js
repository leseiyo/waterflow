import axios from 'axios';
import API_ENDPOINTS, { MOCK_MODE, mockApi } from '../config/api';
import { getSupabase, isSupabaseConfigured } from '../config/supabase';

const DEMO_DISTRIBUTORS = [
  {
    id: 'demo-dist-1',
    _id: 'demo-dist-1',
    name: 'AquaFlow Distributors',
    email: 'contact@aquaflow.com',
    phone: '+254700000001',
    address: 'Nairobi, Kenya',
    rating: 4.5,
    distance: 2.1,
    pricing: 'KES 50/liter',
    waterSupply: '5000 liters/day',
    isAvailable: true,
    userType: 'distributor',
  },
  {
    id: 'demo-dist-2',
    _id: 'demo-dist-2',
    name: 'Pure Water Solutions',
    email: 'info@purewater.co.ke',
    phone: '+254700000002',
    address: 'Mombasa, Kenya',
    rating: 4.2,
    distance: 5.4,
    pricing: 'KES 45/liter',
    waterSupply: '3000 liters/day',
    isAvailable: true,
    userType: 'distributor',
  },
];

export const normalizeOrder = (order) => {
  if (!order) return null;
  const id = order._id || order.id;
  const totalAmount = order.totalAmount ?? order.total_amount ?? 0;
  const deliveryAddress = order.deliveryAddress || order.delivery_address || '';
  const quantity = order.quantity ?? 0;
  const unit = order.unit || 'liters';
  const status = order.status || 'pending';

  return {
    ...order,
    _id: id,
    id,
    orderNumber: String(id || '').slice(-6) || '000000',
    status,
    quantity,
    unit,
    totalAmount,
    deliveryAddress,
    createdAt: order.createdAt || order.created_at,
    consumer: order.consumer || null,
    distributor: order.distributor || null,
    orderDetails: { quantity, unit },
    pricing: { totalAmount, currency: 'USD' },
    payment: {
      method: order.paymentMethod || order.payment_method || 'cash',
      status: status === 'completed' ? 'paid' : 'pending',
    },
    deliveryLocation: { address: deliveryAddress },
    tracking: {
      distance: order.tracking?.distance || 0,
      estimatedDeliveryTime: order.tracking?.estimatedDeliveryTime || null,
      actualDeliveryTime: order.tracking?.actualDeliveryTime || null,
    },
  };
};

const mapProfile = (row) => ({
  id: row.id,
  _id: row.id,
  name: row.name,
  email: row.email,
  phone: row.phone,
  address: row.address,
  userType: row.user_type,
  waterSupply: row.water_supply,
  workingHours: row.working_hours,
  transportMode: row.transport_mode,
  pricing: row.pricing,
  rating: Number(row.rating || 0),
  isAvailable: row.is_available,
  location: row.address ? { address: row.address } : null,
});

const profilePayload = (userData, userType) => ({
  user_type: userType,
  name: userData.name,
  email: userData.email,
  phone: userData.phone || null,
  address: userData.address || null,
  water_supply: userData.waterSupply || null,
  working_hours: userData.workingHours || null,
  transport_mode: userData.transportMode || null,
  pricing: userData.pricing || null,
  updated_at: new Date().toISOString(),
});

const authHeaders = (token) => (token ? { Authorization: `Bearer ${token}` } : {});

const useSupabase = () => isSupabaseConfigured();

export async function upsertProfile(userId, userData, userType) {
  if (!useSupabase()) return null;
  const supabase = await getSupabase();
  const { data, error } = await supabase
    .from('profiles')
    .upsert({ id: userId, ...profilePayload(userData, userType) }, { onConflict: 'id' })
    .select()
    .single();
  if (error) throw error;
  return mapProfile(data);
}

export async function getProfile(userId) {
  if (!useSupabase()) return null;
  const supabase = await getSupabase();
  const { data, error } = await supabase.from('profiles').select('*').eq('id', userId).maybeSingle();
  if (error) throw error;
  return data ? mapProfile(data) : null;
}

export async function updateProfile(userId, updates) {
  if (!useSupabase()) return null;
  const supabase = await getSupabase();
  const payload = {
    name: updates.name,
    phone: updates.phone,
    address: updates.address,
    water_supply: updates.waterSupply,
    working_hours: updates.workingHours,
    transport_mode: updates.transportMode,
    pricing: updates.pricing,
    is_available: updates.isAvailable,
    updated_at: new Date().toISOString(),
  };
  Object.keys(payload).forEach((key) => payload[key] === undefined && delete payload[key]);
  const { data, error } = await supabase.from('profiles').update(payload).eq('id', userId).select().single();
  if (error) throw error;
  return mapProfile(data);
}

export async function getDistributors() {
  if (useSupabase()) {
    const supabase = await getSupabase();
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_type', 'distributor')
      .eq('is_available', true);
    if (error) throw error;
    const mapped = (data || []).map(mapProfile);
    return mapped.length ? mapped : DEMO_DISTRIBUTORS;
  }

  if (MOCK_MODE) {
    const result = await mockApi.getDistributors();
    return result.data || DEMO_DISTRIBUTORS;
  }

  const response = await axios.get(API_ENDPOINTS.DISTRIBUTOR_SEARCH);
  return response.data?.length ? response.data : response.data?.distributors || DEMO_DISTRIBUTORS;
}

export async function getConsumerOrders(userId, token) {
  if (useSupabase()) {
    const supabase = await getSupabase();
    const { data, error } = await supabase
      .from('orders')
      .select('*')
      .eq('consumer_id', userId)
      .order('created_at', { ascending: false });
    if (error) throw error;
    return (data || []).map((row) =>
      normalizeOrder({
        id: row.id,
        quantity: row.quantity,
        unit: row.unit,
        totalAmount: row.total_amount,
        deliveryAddress: row.delivery_address,
        status: row.status,
        createdAt: row.created_at,
        distributorId: row.distributor_id,
      })
    );
  }

  if (MOCK_MODE) {
    const result = await mockApi.getOrders(token);
    return (result.data || []).map(normalizeOrder);
  }

  const response = await axios.get(API_ENDPOINTS.CONSUMER_ORDERS, { headers: authHeaders(token) });
  return (response.data || []).map(normalizeOrder);
}

export async function getDistributorOrders(userId, token) {
  if (useSupabase()) {
    const supabase = await getSupabase();
    const { data, error } = await supabase
      .from('orders')
      .select('*')
      .eq('distributor_id', userId)
      .order('created_at', { ascending: false });
    if (error) throw error;
    return (data || []).map((row) =>
      normalizeOrder({
        id: row.id,
        quantity: row.quantity,
        unit: row.unit,
        totalAmount: row.total_amount,
        deliveryAddress: row.delivery_address,
        status: row.status,
        createdAt: row.created_at,
        consumerId: row.consumer_id,
      })
    );
  }

  if (MOCK_MODE) {
    const result = await mockApi.getOrders(token);
    return (result.data || []).map(normalizeOrder);
  }

  const response = await axios.get(`${API_ENDPOINTS.ORDERS}/distributor/orders`, { headers: authHeaders(token) });
  return (response.data || []).map(normalizeOrder);
}

export async function getOrderById(orderId, token) {
  if (useSupabase()) {
    const supabase = await getSupabase();
    const { data, error } = await supabase.from('orders').select('*').eq('id', orderId).maybeSingle();
    if (error) throw error;
    if (!data) return null;
    return normalizeOrder({
      id: data.id,
      quantity: data.quantity,
      unit: data.unit,
      totalAmount: data.total_amount,
      deliveryAddress: data.delivery_address,
      status: data.status,
      createdAt: data.created_at,
    });
  }

  if (MOCK_MODE) {
    const result = await mockApi.getOrders(token);
    const order = (result.data || []).find((o) => (o._id || o.id) === orderId);
    return order ? normalizeOrder(order) : null;
  }

  const response = await axios.get(`${API_ENDPOINTS.ORDERS}/${orderId}`, { headers: authHeaders(token) });
  return normalizeOrder(response.data);
}

export async function createOrder(orderData, userId, token) {
  const totalAmount = orderData.totalAmount || orderData.quantity * 2;

  if (useSupabase()) {
    const supabase = await getSupabase();
    const { data, error } = await supabase
      .from('orders')
      .insert({
        consumer_id: userId,
        distributor_id: orderData.distributorId,
        quantity: orderData.quantity,
        unit: orderData.unit,
        total_amount: totalAmount,
        delivery_address: orderData.deliveryAddress,
        special_instructions: orderData.specialInstructions || null,
        status: 'pending',
      })
      .select()
      .single();
    if (error) throw error;
    return normalizeOrder({
      id: data.id,
      quantity: data.quantity,
      unit: data.unit,
      totalAmount: data.total_amount,
      deliveryAddress: data.delivery_address,
      status: data.status,
      createdAt: data.created_at,
    });
  }

  if (MOCK_MODE) {
    return normalizeOrder({
      id: `order_${Date.now()}`,
      ...orderData,
      totalAmount,
      status: 'pending',
      createdAt: new Date().toISOString(),
    });
  }

  const response = await axios.post(API_ENDPOINTS.ORDERS, orderData, { headers: authHeaders(token) });
  return normalizeOrder(response.data.order || response.data);
}

export async function updateOrderStatus(orderId, status, token) {
  if (useSupabase()) {
    const supabase = await getSupabase();
    const { data, error } = await supabase
      .from('orders')
      .update({ status, updated_at: new Date().toISOString() })
      .eq('id', orderId)
      .select()
      .single();
    if (error) throw error;
    return normalizeOrder({
      id: data.id,
      quantity: data.quantity,
      unit: data.unit,
      totalAmount: data.total_amount,
      deliveryAddress: data.delivery_address,
      status: data.status,
      createdAt: data.created_at,
    });
  }

  if (MOCK_MODE) {
    return normalizeOrder({ id: orderId, status });
  }

  const response = await axios.patch(API_ENDPOINTS.ORDER_STATUS(orderId), { status }, { headers: authHeaders(token) });
  return normalizeOrder(response.data.order || response.data);
}

export async function getDistributorProfile(userId, token) {
  if (useSupabase()) {
    return getProfile(userId);
  }
  if (MOCK_MODE) {
    const result = await mockApi.getProfile(token);
    return result.data;
  }
  const response = await axios.get(API_ENDPOINTS.DISTRIBUTOR_PROFILE, { headers: authHeaders(token) });
  return response.data;
}

export async function getConsumerProfile(userId, token) {
  if (useSupabase()) {
    return getProfile(userId);
  }
  if (MOCK_MODE) {
    const result = await mockApi.getProfile(token);
    return result.data;
  }
  const response = await axios.get(API_ENDPOINTS.CONSUMER_PROFILE, { headers: authHeaders(token) });
  return response.data;
}

export async function saveProfile(userId, profileData, userType, token) {
  const updates = {
    name: profileData.name,
    phone: profileData.phone,
    address: profileData.address,
    waterSupply: profileData.waterSupply || profileData.businessInfo?.waterSupply,
    workingHours: profileData.workingHours || profileData.businessInfo?.workingHours,
    transportMode: profileData.transportMode || profileData.businessInfo?.transportMode,
    pricing: profileData.pricing || profileData.businessInfo?.pricing,
  };

  if (useSupabase()) {
    return updateProfile(userId, updates);
  }

  if (MOCK_MODE) {
    return { id: userId, ...updates, userType };
  }

  const endpoint = userType === 'distributor' ? API_ENDPOINTS.DISTRIBUTOR_PROFILE : API_ENDPOINTS.CONSUMER_PROFILE;
  const response = await axios.put(endpoint, profileData, { headers: authHeaders(token) });
  return response.data;
}

export async function updateAvailability(userId, isOnline, token) {
  if (useSupabase()) {
    return updateProfile(userId, { isAvailable: isOnline });
  }
  if (MOCK_MODE) {
    return { isOnline };
  }
  const response = await axios.patch(
    API_ENDPOINTS.DISTRIBUTOR_AVAILABILITY,
    { isOnline },
    { headers: authHeaders(token) }
  );
  return response.data;
}

export async function updateWaterSupply(userId, availableQuantity, token) {
  const supplyText = `${availableQuantity} liters`;
  if (useSupabase()) {
    return updateProfile(userId, { waterSupply: supplyText });
  }
  if (MOCK_MODE) {
    return { waterSupply: supplyText };
  }
  const response = await axios.patch(
    API_ENDPOINTS.DISTRIBUTOR_SUPPLY,
    { availableQuantity },
    { headers: authHeaders(token) }
  );
  return response.data;
}

export async function saveAvailabilitySettings(userId, availability, token) {
  const workingHours = JSON.stringify(availability.workingHours || {});
  const payload = {
    isAvailable: availability.isOnline,
    workingHours,
  };

  if (useSupabase()) {
    return updateProfile(userId, payload);
  }
  if (MOCK_MODE) {
    return availability;
  }
  const response = await axios.put(API_ENDPOINTS.DISTRIBUTOR_AVAILABILITY, availability, {
    headers: authHeaders(token),
  });
  return response.data;
}

export async function submitRating(ratingData, userId, token) {
  if (useSupabase()) {
    const supabase = await getSupabase();
    const { data, error } = await supabase
      .from('ratings')
      .insert({
        order_id: ratingData.orderId,
        distributor_id: ratingData.distributorId,
        consumer_id: userId,
        rating: ratingData.rating,
        review: ratingData.review || null,
        tags: ratingData.tags || [],
      })
      .select()
      .single();
    if (error) throw error;
    return data;
  }
  if (MOCK_MODE) {
    await new Promise((resolve) => setTimeout(resolve, 500));
    return { id: `rating_${Date.now()}`, ...ratingData };
  }
  const response = await axios.post(API_ENDPOINTS.RATINGS, ratingData, { headers: authHeaders(token) });
  return response.data;
}

export function computeConsumerAnalytics(orders) {
  const totalSpent = orders.reduce((sum, order) => sum + (order.totalAmount || 0), 0);
  const averageOrderValue = orders.length > 0 ? totalSpent / orders.length : 0;
  const completedOrders = orders.filter((order) => order.status === 'completed');
  const monthlyOrders = completedOrders.filter((order) => {
    const orderDate = new Date(order.createdAt);
    const now = new Date();
    return orderDate.getMonth() === now.getMonth() && orderDate.getFullYear() === now.getFullYear();
  });

  return {
    totalSpent,
    averageOrderValue,
    monthlyTrend: monthlyOrders.length,
    topDistributor: null,
    orderFrequency: orders.length,
  };
}

export function getMockConsumerNotifications() {
  return [
    { id: 1, type: 'order_update', message: 'Your order has been delivered', time: '2 hours ago', read: false },
    { id: 2, type: 'promotion', message: '20% off your next order with AquaPure', time: '1 day ago', read: true },
    { id: 3, type: 'reminder', message: "Don't forget to rate your recent delivery", time: '2 days ago', read: true },
  ];
}

export function getMockDistributorNotifications() {
  return [
    { id: 1, type: 'new_order', message: 'New order received', time: '5 minutes ago', read: false },
    { id: 2, type: 'rating', message: 'You received a 5-star rating!', time: '1 hour ago', read: true },
    { id: 3, type: 'reminder', message: 'An order is ready for pickup', time: '2 hours ago', read: false },
  ];
}

export function getMockDistributorPerformance() {
  return {
    deliveryTime: 45,
    customerSatisfaction: 4.8,
    repeatCustomers: 75,
    responseTime: 5,
  };
}

export function computeDistributorStats(orders, profile) {
  const safeOrders = Array.isArray(orders) ? orders : [];
  const totalOrders = safeOrders.length;
  const pendingOrders = safeOrders.filter((order) => order.status === 'pending').length;
  const completedOrders = safeOrders.filter((order) => order.status === 'completed').length;
  const totalEarnings = safeOrders
    .filter((order) => order.status === 'completed')
    .reduce((sum, order) => sum + (order.totalAmount || 0), 0);

  return {
    totalOrders,
    pendingOrders,
    completedOrders,
    totalEarnings,
    averageOrderValue: totalOrders > 0 ? totalEarnings / totalOrders : 0,
    monthlyEarnings: totalEarnings,
    customerCount: new Set(safeOrders.map((o) => o.consumerId || o.consumer?.id)).size,
    rating: profile?.rating || 0,
  };
}

export function mapProfileToBusinessMetrics(profile) {
  if (!profile) {
    return {
      waterSupply: { available: 0, capacity: 5000, unit: 'liters' },
      workingHours: { start: '08:00', end: '18:00', days: [] },
      transportMode: 'truck',
      pricing: { basePrice: 2, currency: 'USD', perUnit: 'liter', deliveryFee: 0 },
      isActive: true,
      isVerified: false,
    };
  }

  const capacityMatch = String(profile.waterSupply || '').match(/(\d+)/);
  const capacity = capacityMatch ? parseInt(capacityMatch[1], 10) : 5000;

  return {
    waterSupply: { available: capacity, capacity, unit: 'liters' },
    workingHours: { start: '08:00', end: '18:00', days: [] },
    transportMode: profile.transportMode || 'truck',
    pricing: { basePrice: 2, currency: 'USD', perUnit: 'liter', deliveryFee: 0 },
    isActive: profile.isAvailable !== false,
    isVerified: false,
  };
}
