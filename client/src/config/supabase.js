export const isSupabaseConfigured = () => {
  return Boolean(process.env.REACT_APP_SUPABASE_URL && process.env.REACT_APP_SUPABASE_ANON_KEY);
};

let cachedClient = null;

export const getSupabase = async () => {
  if (cachedClient) return cachedClient;
  const { createClient } = await import('@supabase/supabase-js');
  const url = process.env.REACT_APP_SUPABASE_URL;
  const anonKey = process.env.REACT_APP_SUPABASE_ANON_KEY;
  if (!url || !anonKey) {
    throw new Error('Supabase not configured (REACT_APP_SUPABASE_URL / REACT_APP_SUPABASE_ANON_KEY).');
  }
  cachedClient = createClient(url, anonKey);
  return cachedClient;
};


