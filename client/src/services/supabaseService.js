import { getSupabase } from '../config/supabase';

// Service functions for Supabase operations
export class SupabaseService {
  static async getClient() {
    return await getSupabase();
  }

  // Profile operations
  static async createProfile(userType, profileData) {
    const supabase = await this.getClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) throw new Error('User not authenticated');

    const table = userType === 'consumer' ? 'consumers' : 'distributors';
    const { data, error } = await supabase
      .from(table)
      .insert([{
        user_id: user.id,
        ...profileData
      }])
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  static async getProfile(userType, userId) {
    const supabase = await this.getClient();
    const table = userType === 'consumer' ? 'consumers' : 'distributors';
    
    const { data, error } = await supabase
      .from(table)
      .select('*')
      .eq('user_id', userId)
      .single();

    if (error) throw error;
    return data;
  }

  static async updateProfile(userType, profileId, updates) {
    const supabase = await this.getClient();
    const table = userType === 'consumer' ? 'consumers' : 'distributors';
    
    const { data, error } = await supabase
      .from(table)
      .update(updates)
      .eq('id', profileId)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  // Order operations
  static async createOrder(orderData) {
    const supabase = await this.getClient();
    
    const { data, error } = await supabase
      .from('orders')
      .insert([orderData])
      .select(`
        *,
        consumer:consumers(name, email, phone),
        distributor:distributors(name, email, phone, rating_average)
      `)
      .single();

    if (error) throw error;
    return data;
  }

  static async getOrders(userType, userId) {
    const supabase = await this.getClient();
    
    const { data, error } = await supabase
      .from('orders')
      .select(`
        *,
        consumer:consumers(name, email, phone),
        distributor:distributors(name, email, phone, rating_average)
      `)
      .eq(userType === 'consumer' ? 'consumer_id' : 'distributor_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  }

  static async updateOrder(orderId, updates) {
    const supabase = await this.getClient();
    
    const { data, error } = await supabase
      .from('orders')
      .update(updates)
      .eq('id', orderId)
      .select(`
        *,
        consumer:consumers(name, email, phone),
        distributor:distributors(name, email, phone, rating_average)
      `)
      .single();

    if (error) throw error;
    return data;
  }

  // Distributor operations
  static async getDistributors() {
    const supabase = await this.getClient();
    
    const { data, error } = await supabase
      .from('distributors')
      .select('*')
      .eq('is_active', true)
      .order('rating_average', { ascending: false });

    if (error) throw error;
    return data || [];
  }

  static async getDistributorById(distributorId) {
    const supabase = await this.getClient();
    
    const { data, error } = await supabase
      .from('distributors')
      .select('*')
      .eq('id', distributorId)
      .single();

    if (error) throw error;
    return data;
  }

  // Rating operations
  static async createRating(ratingData) {
    const supabase = await this.getClient();
    
    const { data, error } = await supabase
      .from('ratings')
      .insert([ratingData])
      .select(`
        *,
        consumer:consumers(name)
      `)
      .single();

    if (error) throw error;
    return data;
  }

  static async getRatings(distributorId) {
    const supabase = await this.getClient();
    
    const { data, error } = await supabase
      .from('ratings')
      .select(`
        *,
        consumer:consumers(name)
      `)
      .eq('distributor_id', distributorId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  }

  static async getRatingStats(distributorId) {
    const supabase = await this.getClient();
    
    const { data, error } = await supabase
      .from('ratings')
      .select('rating, categories')
      .eq('distributor_id', distributorId);

    if (error) throw error;

    if (!data || data.length === 0) {
      return {
        totalRatings: 0,
        averageRating: 0,
        ratingDistribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
        categoryAverages: {}
      };
    }

    const totalRatings = data.length;
    const averageRating = data.reduce((sum, r) => sum + r.rating, 0) / totalRatings;
    
    const ratingDistribution = data.reduce((acc, r) => {
      acc[r.rating] = (acc[r.rating] || 0) + 1;
      return acc;
    }, {});

    // Calculate category averages
    const categoryAverages = {};
    const categories = ['waterQuality', 'deliverySpeed', 'serviceQuality', 'communication', 'pricing'];
    
    categories.forEach(category => {
      const validRatings = data.filter(r => r.categories && typeof r.categories[category] === 'number');
      if (validRatings.length > 0) {
        categoryAverages[category] = validRatings.reduce((sum, r) => sum + r.categories[category], 0) / validRatings.length;
      }
    });

    return {
      totalRatings,
      averageRating: Math.round(averageRating * 10) / 10,
      ratingDistribution,
      categoryAverages
    };
  }

  // Location-based search
  static async searchDistributorsByLocation(lat, lng, radiusKm = 10) {
    const supabase = await this.getClient();
    
    const { data, error } = await supabase
      .rpc('search_distributors_by_location', {
        user_lat: lat,
        user_lng: lng,
        radius_km: radiusKm
      });

    if (error) throw error;
    return data || [];
  }

  // Helper function to get current user
  static async getCurrentUser() {
    const supabase = await this.getClient();
    const { data: { user } } = await supabase.auth.getUser();
    return user;
  }

  // Helper function to get user type
  static async getUserType() {
    const user = await this.getCurrentUser();
    if (!user) return null;

    const supabase = await this.getClient();
    
    // Check if user is a consumer
    const { data: consumer } = await supabase
      .from('consumers')
      .select('id')
      .eq('user_id', user.id)
      .single();

    if (consumer) return 'consumer';

    // Check if user is a distributor
    const { data: distributor } = await supabase
      .from('distributors')
      .select('id')
      .eq('user_id', user.id)
      .single();

    if (distributor) return 'distributor';

    return null;
  }
}
