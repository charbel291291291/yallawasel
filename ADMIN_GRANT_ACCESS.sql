-- 🔑 ADMINISTRATIVE COMMAND: GRANT DRIVER ACCESS
-- Run this in the Supabase SQL Editor to elevate a specific user.

-- Option A: If you know the email and the user ALREADY exists in Auth
UPDATE public.profiles
SET role = 'driver'
WHERE id IN (
  SELECT id FROM auth.users WHERE email = 'charbelmaarbess@gmail.com'
);

-- Option B: Make sure they have a driver record as well
INSERT INTO public.drivers (id)
SELECT id FROM auth.users 
WHERE email = 'charbelmaarbess@gmail.com'
ON CONFLICT (id) DO NOTHING;

-- Verification query
SELECT p.full_name, p.role, u.email
FROM public.profiles p
JOIN auth.users u ON p.id = u.id
WHERE u.email = 'charbelmaarbess@gmail.com';
