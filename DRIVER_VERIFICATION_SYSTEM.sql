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

-- Ensure drivers cannot self-verify or change roles
DROP POLICY IF EXISTS "users can update own profile" ON public.profiles;
CREATE POLICY "users can update own profile"
ON public.profiles
FOR UPDATE
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- 🛡️ PROTECT SENSITIVE COLUMNS (Trigger based enforcement)
CREATE OR REPLACE FUNCTION public.protect_profile_roles()
RETURNS TRIGGER AS $$
BEGIN
  -- If not an admin, prevent changing sensitive fields
  IF (SELECT role FROM public.profiles WHERE id = auth.uid()) != 'admin' THEN
    IF (NEW.role IS DISTINCT FROM OLD.role) OR 
       (NEW.verified IS DISTINCT FROM OLD.verified) OR 
       (NEW.status IS DISTINCT FROM OLD.status) THEN
      RAISE EXCEPTION 'Restricted: You cannot modify your own role or verification status.';
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS tr_protect_profile_roles ON public.profiles;
CREATE TRIGGER tr_protect_profile_roles
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE PROCEDURE public.protect_profile_roles();

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
