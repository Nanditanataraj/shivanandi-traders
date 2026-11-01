-- ====================================================================
-- SHIVANANDI TRADERS - OFFICIAL SUPABASE DATABASE SETUP SCRIPT
-- Project ID: aswuluewjyvdzynfcsbg
-- Direct Link: https://supabase.com/dashboard/project/aswuluewjyvdzynfcsbg/sql
-- ====================================================================

-- 1. Create ORDERS Table
create table if not exists public.orders (
  id text primary key,
  order_number text unique not null,
  customer_id text,
  customer_name text,
  customer_phone text,
  delivery_address jsonb,
  items jsonb,
  subtotal numeric,
  delivery_fee numeric,
  discount_amount numeric default 0,
  coupon_code text,
  total_amount numeric not null,
  payment_status text not null default 'paid',
  payment_method text not null,
  razorpay_payment_id text,
  status text not null default 'ORDER_PLACED',
  delivery_distance_km numeric,
  estimated_delivery_mins numeric,
  created_at timestamptz default now()
);

-- Enable Row Level Security (RLS)
alter table public.orders enable row level security;

-- Drop policy if exists so this script can be re-run safely
drop policy if exists "Allow all public operations on orders" on public.orders;

-- Create policy allowing inserts, updates, and reads from website
create policy "Allow all public operations on orders"
  on public.orders for all
  using (true)
  with check (true);

-- Create fast indexes for order lookups and phone search
create index if not exists idx_orders_created_at on public.orders (created_at desc);
create index if not exists idx_orders_phone on public.orders (customer_phone);
create index if not exists idx_orders_order_number on public.orders (order_number);


-- 2. Create CUSTOMERS Table
create table if not exists public.customers (
  id text primary key,
  phone text unique not null,
  name text,
  email text,
  addresses jsonb,
  created_at timestamptz default now()
);

alter table public.customers enable row level security;

drop policy if exists "Allow all public operations on customers" on public.customers;

create policy "Allow all public operations on customers"
  on public.customers for all
  using (true)
  with check (true);


-- 3. Create PRODUCTS Table (for optional inventory catalog sync)
create table if not exists public.products (
  id text primary key,
  name text not null,
  category_name text,
  price numeric not null,
  discount_price numeric not null,
  stock integer default 20,
  weight text,
  images jsonb,
  expiry_date text,
  created_at timestamptz default now()
);

alter table public.products enable row level security;

drop policy if exists "Allow all public operations on products" on public.products;

create policy "Allow all public operations on products"
  on public.products for all
  using (true)
  with check (true);

-- Enable Supabase Realtime for instant updates on the orders table
do $$
begin
  if not exists (
    select 1 from pg_publication_tables 
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'orders'
  ) then
    alter publication supabase_realtime add table public.orders;
  end if;
exception
  when others then null;
end $$;
