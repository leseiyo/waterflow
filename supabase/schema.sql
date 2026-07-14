-- Run this in Supabase SQL Editor (Dashboard → SQL → New query)

CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  user_type TEXT NOT NULL CHECK (user_type IN ('consumer', 'distributor')),
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  address TEXT,
  water_supply TEXT,
  working_hours TEXT,
  transport_mode TEXT,
  pricing TEXT,
  rating NUMERIC DEFAULT 0,
  is_available BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  consumer_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  distributor_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  quantity NUMERIC NOT NULL,
  unit TEXT NOT NULL DEFAULT 'liters',
  total_amount NUMERIC NOT NULL,
  delivery_address TEXT NOT NULL,
  special_instructions TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Profiles are viewable by authenticated users"
  ON profiles FOR SELECT TO authenticated USING (true);

CREATE POLICY "Users can insert own profile"
  ON profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE TO authenticated USING (auth.uid() = id);

CREATE POLICY "Orders viewable by participants"
  ON orders FOR SELECT TO authenticated
  USING (auth.uid() = consumer_id OR auth.uid() = distributor_id);

CREATE POLICY "Consumers can create orders"
  ON orders FOR INSERT TO authenticated WITH CHECK (auth.uid() = consumer_id);

CREATE POLICY "Participants can update orders"
  ON orders FOR UPDATE TO authenticated
  USING (auth.uid() = consumer_id OR auth.uid() = distributor_id);

CREATE TABLE IF NOT EXISTS ratings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
  distributor_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  consumer_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  rating NUMERIC NOT NULL CHECK (rating >= 1 AND rating <= 5),
  review TEXT,
  tags TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE ratings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Ratings viewable by authenticated users"
  ON ratings FOR SELECT TO authenticated USING (true);

CREATE POLICY "Consumers can create ratings"
  ON ratings FOR INSERT TO authenticated WITH CHECK (auth.uid() = consumer_id);
