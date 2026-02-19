-- ========================================================
-- STORAGE HARDENING
-- ========================================================

-- 0. HELPERS (Ensuring they exist for policies)
create or replace function public.is_admin()
returns boolean as $$
begin
  return exists (
    select 1 from public.profiles
    where id = auth.uid()
    and (is_admin = true or role = 'admin')
  );
end;
$$ language plpgsql security definer;

create or replace function public.is_driver()
returns boolean as $$
begin
  return exists (
    select 1 from public.profiles
    where id = auth.uid()
    and role = 'driver'
  );
end;
$$ language plpgsql security definer;

-- 1. Create buckets if they don't exist
insert into storage.buckets (id, name, public)
values 
  ('products', 'products', true),
  ('avatars', 'avatars', true),
  ('delivery_proofs', 'delivery_proofs', false) -- Private by default
on conflict (id) do nothing;

-- 2. PRODUCTS BUCKET POLICIES (Public Read, Admin Write)
drop policy if exists "Public Read Products" on storage.objects;
create policy "Public Read Products" on storage.objects
  for select using (bucket_id = 'products');

drop policy if exists "Admin Manage Products" on storage.objects;
create policy "Admin Manage Products" on storage.objects
  for all using (bucket_id = 'products' and public.is_admin());

-- 3. AVATARS BUCKET POLICIES (Public Read, Owner Write)
drop policy if exists "Public Read Avatars" on storage.objects;
create policy "Public Read Avatars" on storage.objects
  for select using (bucket_id = 'avatars');

drop policy if exists "Users Manage Own Avatar" on storage.objects;
create policy "Users Manage Own Avatar" on storage.objects
  for all using (bucket_id = 'avatars' and auth.uid() = (storage.foldername(name))[1]::uuid);

-- 4. DELIVERY PROOFS BUCKET POLICIES (Admin & Assigned Driver Read, Assigned Driver Write)
drop policy if exists "Admin View Proofs" on storage.objects;
create policy "Admin View Proofs" on storage.objects
  for select using (bucket_id = 'delivery_proofs' and public.is_admin());

drop policy if exists "Drivers Manage Own Proofs" on storage.objects;
create policy "Drivers Manage Own Proofs" on storage.objects
  for all using (bucket_id = 'delivery_proofs' and public.is_driver());
