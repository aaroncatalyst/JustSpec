-- Users table (extends auth.users)
create table public.users (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  company_name text,
  plan text not null default 'free',
  rfq_credits int not null default 1,
  created_at timestamptz not null default now()
);

-- RFQs table
create table public.rfqs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  status text not null default 'draft',
  product_description text,
  product_category text,
  material text,
  quantities int[],
  destination_country text not null default 'US',
  supplier_region text,
  compliance text[],
  additional_notes text,
  reference_links text[],
  created_at timestamptz not null default now(),
  completed_at timestamptz
);

-- Quotes table
create table public.quotes (
  id uuid primary key default gen_random_uuid(),
  rfq_id uuid not null references public.rfqs(id) on delete cascade,
  supplier_name text,
  supplier_email text,
  price_tiers jsonb,
  moq int,
  lead_time_days int,
  payment_terms text,
  sample_available bool,
  sample_cost float,
  tooling_fee float,
  existing_mold bool,
  fda_compliant bool,
  landed_cost_estimate jsonb,
  raw_email text,
  parsed_at timestamptz
);

-- Enable RLS
alter table public.users enable row level security;
alter table public.rfqs enable row level security;
alter table public.quotes enable row level security;

-- RLS policies: users
create policy "Users can view own profile"
  on public.users for select
  using (auth.uid() = id);

create policy "Users can update own profile"
  on public.users for update
  using (auth.uid() = id);

create policy "Users can insert own profile"
  on public.users for insert
  with check (auth.uid() = id);

-- RLS policies: rfqs
create policy "Users can view own RFQs"
  on public.rfqs for select
  using (auth.uid() = user_id);

create policy "Users can insert own RFQs"
  on public.rfqs for insert
  with check (auth.uid() = user_id);

create policy "Users can update own RFQs"
  on public.rfqs for update
  using (auth.uid() = user_id);

create policy "Users can delete own RFQs"
  on public.rfqs for delete
  using (auth.uid() = user_id);

-- RLS policies: quotes (users access via their RFQs)
create policy "Users can view quotes for own RFQs"
  on public.quotes for select
  using (
    exists (
      select 1 from public.rfqs
      where rfqs.id = quotes.rfq_id
      and rfqs.user_id = auth.uid()
    )
  );

-- Auto-create user profile on signup
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.users (id, email)
  values (new.id, new.email);
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
