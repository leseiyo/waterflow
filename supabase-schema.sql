-- WaterFlow Supabase Database Schema
-- Run this in your Supabase SQL Editor

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create custom types
CREATE TYPE user_type AS ENUM ('consumer', 'distributor');
CREATE TYPE order_status AS ENUM ('pending', 'confirmed', 'preparing', 'out_for_delivery', 'in_transit', 'delivered', 'cancelled');
CREATE TYPE transport_mode AS ENUM ('truck', 'motorcycle', 'bicycle', 'walking', 'boat');
CREATE TYPE water_type AS ENUM ('drinking', 'mineral', 'purified', 'spring', 'other');

-- Consumers table
CREATE TABLE consumers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  phone TEXT NOT NULL,
  address TEXT NOT NULL,
  location GEOGRAPHY(POINT, 4326),
  preferences JSONB DEFAULT '{}',
  total_orders INTEGER DEFAULT 0,
  total_spent DECIMAL(10,2) DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Distributors table
CREATE TABLE distributors (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  phone TEXT NOT NULL,
  address TEXT NOT NULL,
  location GEOGRAPHY(POINT, 4326),
  water_supply JSONB NOT NULL DEFAULT '{}',
  working_hours JSONB NOT NULL DEFAULT '{}',
  transport_mode transport_mode NOT NULL,
  pricing JSONB NOT NULL DEFAULT '{}',
  rating_average DECIMAL(3,2) DEFAULT 0,
  rating_count INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Orders table
CREATE TABLE orders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_number TEXT UNIQUE NOT NULL,
  consumer_id UUID REFERENCES consumers(id) ON DELETE CASCADE,
  distributor_id UUID REFERENCES distributors(id) ON DELETE CASCADE,
  order_details JSONB NOT NULL DEFAULT '{}',
  delivery_location GEOGRAPHY(POINT, 4326),
  delivery_address TEXT NOT NULL,
  pricing JSONB NOT NULL DEFAULT '{}',
  status order_status DEFAULT 'pending',
  tracking JSONB DEFAULT '{}',
  payment JSONB DEFAULT '{}',
  scheduled_delivery JSONB DEFAULT '{}',
  notes JSONB DEFAULT '{}',
  is_urgent BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Ratings table
CREATE TABLE ratings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  consumer_id UUID REFERENCES consumers(id) ON DELETE CASCADE,
  distributor_id UUID REFERENCES distributors(id) ON DELETE CASCADE,
  order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  review TEXT,
  categories JSONB DEFAULT '{}',
  is_verified BOOLEAN DEFAULT false,
  helpful_count INTEGER DEFAULT 0,
  helpful_users UUID[] DEFAULT '{}',
  response TEXT,
  responded_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(order_id) -- One rating per order
);

-- Create indexes for performance
CREATE INDEX idx_consumers_user_id ON consumers(user_id);
CREATE INDEX idx_consumers_email ON consumers(email);
CREATE INDEX idx_consumers_location ON consumers USING GIST(location);

CREATE INDEX idx_distributors_user_id ON distributors(user_id);
CREATE INDEX idx_distributors_email ON distributors(email);
CREATE INDEX idx_distributors_location ON distributors USING GIST(location);
CREATE INDEX idx_distributors_active ON distributors(is_active);

CREATE INDEX idx_orders_consumer_id ON orders(consumer_id);
CREATE INDEX idx_orders_distributor_id ON orders(distributor_id);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_delivery_location ON orders USING GIST(delivery_location);
CREATE INDEX idx_orders_created_at ON orders(created_at DESC);

CREATE INDEX idx_ratings_consumer_id ON ratings(consumer_id);
CREATE INDEX idx_ratings_distributor_id ON ratings(distributor_id);
CREATE INDEX idx_ratings_order_id ON ratings(order_id);
CREATE INDEX idx_ratings_created_at ON ratings(created_at DESC);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Add updated_at triggers
CREATE TRIGGER update_consumers_updated_at BEFORE UPDATE ON consumers FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_distributors_updated_at BEFORE UPDATE ON distributors FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_orders_updated_at BEFORE UPDATE ON orders FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_ratings_updated_at BEFORE UPDATE ON ratings FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Row Level Security (RLS) Policies

-- Enable RLS on all tables
ALTER TABLE consumers ENABLE ROW LEVEL SECURITY;
ALTER TABLE distributors ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE ratings ENABLE ROW LEVEL SECURITY;

-- Consumers policies
CREATE POLICY "Users can view their own consumer profile" ON consumers
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own consumer profile" ON consumers
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own consumer profile" ON consumers
  FOR UPDATE USING (auth.uid() = user_id);

-- Distributors policies
CREATE POLICY "Users can view their own distributor profile" ON distributors
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own distributor profile" ON distributors
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own distributor profile" ON distributors
  FOR UPDATE USING (auth.uid() = user_id);

-- Public distributor search (read-only for consumers)
CREATE POLICY "Anyone can view active distributors" ON distributors
  FOR SELECT USING (is_active = true);

-- Orders policies
CREATE POLICY "Users can view their own orders" ON orders
  FOR SELECT USING (
    consumer_id IN (SELECT id FROM consumers WHERE user_id = auth.uid()) OR
    distributor_id IN (SELECT id FROM distributors WHERE user_id = auth.uid())
  );

CREATE POLICY "Consumers can create orders" ON orders
  FOR INSERT WITH CHECK (
    consumer_id IN (SELECT id FROM consumers WHERE user_id = auth.uid())
  );

CREATE POLICY "Distributors can update their orders" ON orders
  FOR UPDATE USING (
    distributor_id IN (SELECT id FROM distributors WHERE user_id = auth.uid())
  );

-- Ratings policies
CREATE POLICY "Users can view ratings for their orders" ON ratings
  FOR SELECT USING (
    consumer_id IN (SELECT id FROM consumers WHERE user_id = auth.uid()) OR
    distributor_id IN (SELECT id FROM distributors WHERE user_id = auth.uid())
  );

CREATE POLICY "Consumers can create ratings for their orders" ON ratings
  FOR INSERT WITH CHECK (
    consumer_id IN (SELECT id FROM consumers WHERE user_id = auth.uid())
  );

CREATE POLICY "Distributors can respond to their ratings" ON ratings
  FOR UPDATE USING (
    distributor_id IN (SELECT id FROM distributors WHERE user_id = auth.uid())
  );

-- Public ratings view (for distributor profiles)
CREATE POLICY "Anyone can view public ratings" ON ratings
  FOR SELECT USING (true);

-- Functions for common operations

-- Function to get user type
CREATE OR REPLACE FUNCTION get_user_type(user_uuid UUID)
RETURNS user_type AS $$
BEGIN
  IF EXISTS (SELECT 1 FROM consumers WHERE user_id = user_uuid) THEN
    RETURN 'consumer';
  ELSIF EXISTS (SELECT 1 FROM distributors WHERE user_id = user_uuid) THEN
    RETURN 'distributor';
  ELSE
    RETURN NULL;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to update distributor rating
CREATE OR REPLACE FUNCTION update_distributor_rating()
RETURNS TRIGGER AS $$
BEGIN
  -- Update distributor rating when a rating is inserted/updated/deleted
  UPDATE distributors 
  SET 
    rating_average = (
      SELECT COALESCE(AVG(rating), 0) 
      FROM ratings 
      WHERE distributor_id = COALESCE(NEW.distributor_id, OLD.distributor_id)
    ),
    rating_count = (
      SELECT COUNT(*) 
      FROM ratings 
      WHERE distributor_id = COALESCE(NEW.distributor_id, OLD.distributor_id)
    )
  WHERE id = COALESCE(NEW.distributor_id, OLD.distributor_id);
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Create trigger for rating updates
CREATE TRIGGER update_distributor_rating_trigger
  AFTER INSERT OR UPDATE OR DELETE ON ratings
  FOR EACH ROW EXECUTE FUNCTION update_distributor_rating();

-- Function to generate order number
CREATE OR REPLACE FUNCTION generate_order_number()
RETURNS TEXT AS $$
BEGIN
  RETURN 'WD' || EXTRACT(EPOCH FROM NOW())::BIGINT || LPAD(FLOOR(RANDOM() * 1000)::TEXT, 3, '0');
END;
$$ LANGUAGE plpgsql;

-- Create trigger for order number generation
CREATE TRIGGER generate_order_number_trigger
  BEFORE INSERT ON orders
  FOR EACH ROW 
  WHEN (NEW.order_number IS NULL OR NEW.order_number = '')
  EXECUTE FUNCTION generate_order_number();
