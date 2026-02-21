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

-- 📊 Ensure Realtime Publication Exists
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
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

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

DO $$
BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.happy_hours_schedule;
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

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
    consecutive_ignored INTEGER DEFAULT 0
);

ALTER TABLE public.drivers ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public read online drivers" ON public.drivers;
CREATE POLICY "Public read online drivers" ON public.drivers FOR SELECT USING (true);

DO $$
BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.drivers;
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;
