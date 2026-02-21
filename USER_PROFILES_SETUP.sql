-- 👤 USER PROFILES & ROLE PROTECTION
create table if not exists profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  phone text,
  address text,
  role text default 'customer' check (role in ('customer', 'driver', 'admin')),
  points integer default 0,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Enable RLS
alter table profiles enable row level security;

-- Policies for profiles
create policy "users can read own profile"
on profiles for select
using (auth.uid() = id);

create policy "users can update own profile"
on profiles for update
using (auth.uid() = id);

-- Trigger to create profile on signup
create or replace function handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, full_name, phone, role)
  values (new.id, new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'phone', coalesce(new.raw_user_meta_data->>'role', 'customer'));
  
  -- Also initialize driver record if role is driver
  if (new.raw_user_meta_data->>'role') = 'driver' then
    insert into public.drivers (id) values (new.id);
  end if;

  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
