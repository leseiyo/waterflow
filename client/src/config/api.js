// For Option B (Supabase-first), most data calls will go directly to Supabase.
// Keep API_BASE_URL for any remaining custom endpoints (or local dev).
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

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

// Supabase client (Option B)
// Set these in a .env.local file at client/ or via Vercel environment variables
// REACT_APP_SUPABASE_URL=your-url
// REACT_APP_SUPABASE_ANON_KEY=your-anon-key
export const createSupabaseClient = async () => {
  const { createClient } = await import('@supabase/supabase-js');
  const url = process.env.REACT_APP_SUPABASE_URL;
  const anonKey = process.env.REACT_APP_SUPABASE_ANON_KEY;
  if (!url || !anonKey) {
    console.warn('Supabase env vars missing: REACT_APP_SUPABASE_URL / REACT_APP_SUPABASE_ANON_KEY');
  }
  return createClient(url, anonKey);
};