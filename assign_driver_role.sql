-- 1. Ensure the role column exists (in case migration wasn't run)
alter table public.profiles add column if not exists role text default 'customer';

-- 2. Grant driver role to the specific email
UPDATE public.profiles
SET role = 'driver'
FROM auth.users
WHERE profiles.id = auth.users.id
AND auth.users.email = 'albasma12182@gmail.com';

-- 3. Verify the update
SELECT auth.users.email, public.profiles.role 
FROM public.profiles 
JOIN auth.users ON profiles.id = auth.users.id
WHERE auth.users.email = 'albasma12182@gmail.com';
