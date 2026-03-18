create or replace function public.decrement_credits(uid uuid)
returns void language plpgsql security definer as $$
begin
  update public.users
  set rfq_credits = greatest(0, rfq_credits - 1)
  where id = uid;
end;
$$;
