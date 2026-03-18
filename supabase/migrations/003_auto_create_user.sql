-- Ensure the trigger function exists and handles OAuth users (where email may come
-- from raw_user_meta_data rather than the top-level email column).
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.users (id, email)
  values (
    new.id,
    coalesce(new.email, new.raw_user_meta_data->>'email', '')
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

-- Re-create the trigger idempotently
drop trigger if exists on_auth_user_created on auth.users;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
