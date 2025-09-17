export const isSupabaseConfigured = () => {
  return Boolean(process.env.REACT_APP_SUPABASE_URL && process.env.REACT_APP_SUPABASE_ANON_KEY);
};

// Get Supabase client instance
export const getSupabase = async () => {
  if (!isSupabaseConfigured()) {
    throw new Error('Supabase not configured (REACT_APP_SUPABASE_URL / REACT_APP_SUPABASE_ANON_KEY).');
  }
  const { createClient } = await import('@supabase/supabase-js');
  const url = process.env.REACT_APP_SUPABASE_URL;
  const anonKey = process.env.REACT_APP_SUPABASE_ANON_KEY;
  
  return createClient(url, anonKey);
};