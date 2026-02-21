-- 📦 IDENTITY & CORE SCHEMA
-- Core profiles and automatic provisioning

CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  phone TEXT,
  address TEXT,
  role TEXT DEFAULT 'customer' CHECK (role IN ('customer', 'driver', 'admin')),
  points INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- 👤 Profile Policies
DROP POLICY IF EXISTS "users can read own profile" ON public.profiles;
CREATE POLICY "users can read own profile" ON public.profiles FOR SELECT USING (auth.uid() = id);

DROP POLICY IF EXISTS "users can update own profile" ON public.profiles;
CREATE POLICY "users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- 📦 CORE PRODUCT & KITS SCHEMA
-- This combines products and kits into a single optimized table as per App logic.

CREATE TABLE IF NOT EXISTS public.products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    name_ar TEXT,
    description TEXT,
    description_ar TEXT,
    price NUMERIC NOT NULL DEFAULT 0,
    cost NUMERIC DEFAULT 0,
    stock INTEGER DEFAULT 0,
    category TEXT DEFAULT 'general',
    image TEXT,
    tags TEXT[] DEFAULT '{}',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 🔐 Enable RLS
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

-- 🔓 Public Read Access (Kits + Products)
DROP POLICY IF EXISTS "Public read products" ON public.products;
CREATE POLICY "Public read products"
ON public.products
FOR SELECT
USING (is_active = true);

-- 🛡️ Admin Write Access
DROP POLICY IF EXISTS "Admins can manage products" ON public.products;
CREATE POLICY "Admins can manage products"
ON public.products
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'admin'
  )
);

-- ⏰ HAPPY HOURS SCHEMA (Unifying inconsistency)
CREATE TABLE IF NOT EXISTS public.happy_hours_schedule (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMPTZ DEFAULT now(),
    name TEXT NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    days_of_week INTEGER[] DEFAULT '{1,2,3,4,5,6,0}',
    multiplier NUMERIC DEFAULT 1.5,
    bonus_points INTEGER DEFAULT 100,
    active BOOLEAN DEFAULT true
);

ALTER TABLE public.happy_hours_schedule ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public read happy hours" ON public.happy_hours_schedule;
CREATE POLICY "Public read happy hours" ON public.happy_hours_schedule FOR SELECT USING (active = true);

-- 👤 DRIVERS TABLE (Referenced by many policies)
CREATE TABLE IF NOT EXISTS public.drivers (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    is_online BOOLEAN DEFAULT false,
    lat DOUBLE PRECISION,
    lng DOUBLE PRECISION,
    last_seen TIMESTAMPTZ DEFAULT now(),
    speed_score INTEGER DEFAULT 80,
    tier TEXT DEFAULT 'Bronze',
    acceptance_rate NUMERIC DEFAULT 1.0,
    total_accepted INTEGER DEFAULT 0,
    total_ignored INTEGER DEFAULT 0,
    consecutive_ignored INTEGER DEFAULT 0,
    completed_deliveries INTEGER DEFAULT 0,
    daily_earnings NUMERIC DEFAULT 0,
    current_streak INTEGER DEFAULT 0,
    total_online_hours FLOAT DEFAULT 0,
    onboarding_completed BOOLEAN DEFAULT false,
    language_pref TEXT DEFAULT 'en' CHECK (language_pref IN ('en', 'ar'))
);

ALTER TABLE public.drivers ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public read online drivers" ON public.drivers;
CREATE POLICY "Public read online drivers" ON public.drivers FOR SELECT USING (true);

-- 🏗️ AUTOMATIC PROVISIONING (Identity Link)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, phone, role)
  VALUES (
    NEW.id, 
    NEW.raw_user_meta_data->>'full_name', 
    NEW.raw_user_meta_data->>'phone', 
    COALESCE(NEW.raw_user_meta_data->>'role', 'customer')
  );
  
  -- Automatically bridge to Driver Terminal if role is driver
  IF (NEW.raw_user_meta_data->>'role') = 'driver' THEN
    INSERT INTO public.drivers (id) VALUES (NEW.id);
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- 📑 MISSION & ORDER ARCHITECTURE
CREATE TABLE IF NOT EXISTS public.orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    driver_id UUID REFERENCES auth.users(id),
    status TEXT NOT NULL DEFAULT 'pending',
    pickup_address TEXT,
    dropoff_address TEXT,
    pickup_lat DOUBLE PRECISION,
    pickup_lng DOUBLE PRECISION,
    price NUMERIC,
    total NUMERIC,
    payout_base NUMERIC DEFAULT 0,
    payout_bonus NUMERIC DEFAULT 0,
    items JSONB DEFAULT '[]',
    payment_method TEXT DEFAULT 'cash',
    expired BOOLEAN DEFAULT false,
    expires_at TIMESTAMPTZ,
    margin_floor_ratio NUMERIC DEFAULT 0.20,
    search_started_at TIMESTAMPTZ DEFAULT now(),
    boost_level INTEGER DEFAULT 0,
    matched_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    CONSTRAINT valid_status CHECK (status IN ('pending', 'assigned', 'accepted', 'picked_up', 'delivered', 'cancelled', 'approved', 'preparing', 'out_for_delivery'))
);

ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

-- 📜 AUDIT TRAIL
CREATE TABLE IF NOT EXISTS public.order_status_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID REFERENCES public.orders(id) ON DELETE CASCADE,
    status TEXT NOT NULL,
    note TEXT,
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 🛡️ ATOMIC MISSION ACCEPTANCE RPC
CREATE OR REPLACE FUNCTION public.accept_order(p_order_id UUID, p_driver_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Logic: Can accept if 'pending' (any driver) or 'assigned' (specific driver)
  UPDATE public.orders
  SET status = 'accepted',
      driver_id = p_driver_id,
      updated_at = now()
  WHERE id = p_order_id
    AND (status = 'pending' OR (status = 'assigned' AND driver_id = p_driver_id))
    AND expired = false;

  IF FOUND THEN
    INSERT INTO public.order_status_history (order_id, status, note, created_by)
    VALUES (p_order_id, 'accepted', 'Mission accepted by operator', p_driver_id);
    RETURN TRUE;
  END IF;

  RETURN FALSE;
END;
$$;

-- 📊 REALTIME PUBLICATION
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
        CREATE PUBLICATION supabase_realtime;
    END IF;
END $$;

-- 📈 Safe Table Addition to Realtime
DO $$
BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.products;
    ALTER PUBLICATION supabase_realtime ADD TABLE public.happy_hours_schedule;
    ALTER PUBLICATION supabase_realtime ADD TABLE public.drivers;
    ALTER PUBLICATION supabase_realtime ADD TABLE public.orders;
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

