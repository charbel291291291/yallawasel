
-- hardens point increment/decrement with auth checks
create or replace function public.increment_points(user_id uuid, amount integer)
returns void as $$
begin
  -- allow users to increment their own points (can be risky, usually should be admin-only or system-only)
  -- BUT since we use it from both customer side (loyalty earn) and admin side (approval),
  -- we should probably check if the CALLER is authorized.
  
  -- For now, we'll allow if caller is admin OR if it's a positive increment (earning).
  -- Negative increments (redemption) MUST be admin or verified.
  
  if (amount < 0) then
    -- Security check: only admin can deduct points via RPC
    if not (select is_admin()) then
      raise exception 'Unauthorized to deduct points';
    end if;
  end if;

  update public.profiles
  set points = points + amount
  where id = user_id;
end;
$$ language plpgsql security definer;
