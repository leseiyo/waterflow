import { useState, useEffect } from 'react';
import { getSupabase } from '../config/supabase';

// Custom hook for Supabase operations
export const useSupabase = () => {
  const [supabase, setSupabase] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const initSupabase = async () => {
      try {
        const client = await getSupabase();
        setSupabase(client);
        setError(null);
      } catch (err) {
        setError(err.message);
        console.error('Supabase initialization error:', err);
      } finally {
        setLoading(false);
      }
    };

    initSupabase();
  }, []);

  return { supabase, loading, error };
};

// Hook for user profile data
export const useUserProfile = (userType) => {
  const { supabase, loading: supabaseLoading } = useSupabase();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!supabase || supabaseLoading) return;

    const fetchProfile = async () => {
      try {
        setLoading(true);
        const { data: { user } } = await supabase.auth.getUser();
        
        if (!user) {
          setProfile(null);
          return;
        }

        const table = userType === 'consumer' ? 'consumers' : 'distributors';
        const { data, error } = await supabase
          .from(table)
          .select('*')
          .eq('user_id', user.id)
          .single();

        if (error) throw error;
        setProfile(data);
      } catch (err) {
        setError(err.message);
        console.error('Profile fetch error:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [supabase, supabaseLoading, userType]);

  const updateProfile = async (updates) => {
    if (!supabase || !profile) return;

    try {
      const table = userType === 'consumer' ? 'consumers' : 'distributors';
      const { data, error } = await supabase
        .from(table)
        .update(updates)
        .eq('id', profile.id)
        .select()
        .single();

      if (error) throw error;
      setProfile(data);
      return { success: true, data };
    } catch (err) {
      setError(err.message);
      return { success: false, error: err.message };
    }
  };

  return { profile, loading, error, updateProfile };
};

// Hook for orders
export const useOrders = (userType, userId) => {
  const { supabase, loading: supabaseLoading } = useSupabase();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!supabase || supabaseLoading || !userId) return;

    const fetchOrders = async () => {
      try {
        setLoading(true);
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
        setOrders(data || []);
      } catch (err) {
        setError(err.message);
        console.error('Orders fetch error:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, [supabase, supabaseLoading, userType, userId]);

  const createOrder = async (orderData) => {
    if (!supabase) return { success: false, error: 'Supabase not initialized' };

    try {
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
      setOrders(prev => [data, ...prev]);
      return { success: true, data };
    } catch (err) {
      setError(err.message);
      return { success: false, error: err.message };
    }
  };

  const updateOrder = async (orderId, updates) => {
    if (!supabase) return { success: false, error: 'Supabase not initialized' };

    try {
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
      setOrders(prev => prev.map(order => order.id === orderId ? data : order));
      return { success: true, data };
    } catch (err) {
      setError(err.message);
      return { success: false, error: err.message };
    }
  };

  return { orders, loading, error, createOrder, updateOrder };
};

// Hook for distributors (for consumer search)
export const useDistributors = () => {
  const { supabase, loading: supabaseLoading } = useSupabase();
  const [distributors, setDistributors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!supabase || supabaseLoading) return;

    const fetchDistributors = async () => {
      try {
        setLoading(true);
        const { data, error } = await supabase
          .from('distributors')
          .select('*')
          .eq('is_active', true)
          .order('rating_average', { ascending: false });

        if (error) throw error;
        setDistributors(data || []);
      } catch (err) {
        setError(err.message);
        console.error('Distributors fetch error:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchDistributors();
  }, [supabase, supabaseLoading]);

  return { distributors, loading, error };
};

// Hook for ratings
export const useRatings = (distributorId) => {
  const { supabase, loading: supabaseLoading } = useSupabase();
  const [ratings, setRatings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!supabase || supabaseLoading || !distributorId) return;

    const fetchRatings = async () => {
      try {
        setLoading(true);
        const { data, error } = await supabase
          .from('ratings')
          .select(`
            *,
            consumer:consumers(name)
          `)
          .eq('distributor_id', distributorId)
          .order('created_at', { ascending: false });

        if (error) throw error;
        setRatings(data || []);
      } catch (err) {
        setError(err.message);
        console.error('Ratings fetch error:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchRatings();
  }, [supabase, supabaseLoading, distributorId]);

  const createRating = async (ratingData) => {
    if (!supabase) return { success: false, error: 'Supabase not initialized' };

    try {
      const { data, error } = await supabase
        .from('ratings')
        .insert([ratingData])
        .select(`
          *,
          consumer:consumers(name)
        `)
        .single();

      if (error) throw error;
      setRatings(prev => [data, ...prev]);
      return { success: true, data };
    } catch (err) {
      setError(err.message);
      return { success: false, error: err.message };
    }
  };

  return { ratings, loading, error, createRating };
};
