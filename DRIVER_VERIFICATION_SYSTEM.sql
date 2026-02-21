-- 🛡️ DRIVER VERIFICATION & ACCESS SYSTEM
-- 🧱 STEP 1 — Database Schema Extension

-- 1. Extend profiles with verification fields
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS verified BOOLEAN DEFAULT false;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS status TEXT CHECK (status IN ('pending', 'approved', 'rejected')) DEFAULT 'pending';

-- 2. Update existing drivers to 'approved' status if needed (optional but recommended for continuity)
-- UPDATE public.profiles SET verified = true, status = 'approved' WHERE role = 'driver' AND verified = false;

-- 🔐 STEP 2 — Security Layer (RLS)

-- Admins can do everything
-- Drivers/Customers can read their own verification status
-- This is already covered by "users can read own profile" policy

-- Add Policy for Admin to update verification
DROP POLICY IF EXISTS "admins can update profiles" ON public.profiles;
CREATE POLICY "admins can update profiles"
ON public.profiles
FOR UPDATE
USING (
  -- We assume the 'isAdmin' check in the app uses the 'admin' role in the DB
  (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'
)
WITH CHECK (
  (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'
);

-- Ensure drivers cannot self-verify
-- The existing "users can update own profile" needs to be restricted
DROP POLICY IF EXISTS "users can update own profile" ON public.profiles;
CREATE POLICY "users can update own profile"
ON public.profiles
FOR UPDATE
USING (auth.uid() = id)
WITH CHECK (
  auth.uid() = id 
  AND (
    -- Prevent users from changing their own role, verified status, or application status
    (NEW.role = OLD.role)
    AND (NEW.verified = OLD.verified)
    AND (NEW.status = OLD.status)
  )
);

-- 🔄 STEP 3 — Real-time Subscription Enforcement
-- Ensure profiles table is in the publication
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' 
    AND schemaname = 'public' 
    AND tablename = 'profiles'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE profiles;
  END IF;
EXCEPTION
  WHEN OTHERS THEN NULL;
END $$;
