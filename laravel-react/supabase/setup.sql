-- Inalog Silog Supabase setup
-- Paste this whole file into Supabase SQL Editor and run it once.
-- This is the fast functional setup for your current frontend.
-- It creates the booking tables, customer order table, public policies,
-- and realtime updates used by rider/admin/customer pages.

create extension if not exists pgcrypto;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
    new.updated_at = timezone('utc', now());
    return new;
end;
$$;

create table if not exists public.customer_orders (
    id uuid primary key default gen_random_uuid(),
    order_code text not null unique,
    customer_name text not null,
    email text not null,
    phone text,
    delivery_address text not null,
    order_mode text not null default 'delivery',
    status text not null default 'Waiting rider assignment',
    payment_method text,
    item_count integer not null default 0,
    notes text,
    rider_name text,
    rider_vehicle text,
    rider_code text,
    rider_zone text,
    delivery_estimate_minutes integer not null default 15,
    source_page text,
    order_items jsonb not null default '[]'::jsonb,
    total_amount numeric(12, 2) not null default 0,
    claimed_at timestamptz,
    delivered_at timestamptz,
    created_at timestamptz not null default timezone('utc', now()),
    updated_at timestamptz not null default timezone('utc', now())
);

alter table public.customer_orders add column if not exists id uuid default gen_random_uuid();
alter table public.customer_orders add column if not exists order_code text;
alter table public.customer_orders add column if not exists customer_name text;
alter table public.customer_orders add column if not exists email text;
alter table public.customer_orders add column if not exists phone text;
alter table public.customer_orders add column if not exists delivery_address text;
alter table public.customer_orders add column if not exists order_mode text default 'delivery';
alter table public.customer_orders add column if not exists status text default 'Waiting rider assignment';
alter table public.customer_orders add column if not exists payment_method text;
alter table public.customer_orders add column if not exists item_count integer default 0;
alter table public.customer_orders add column if not exists notes text;
alter table public.customer_orders add column if not exists rider_name text;
alter table public.customer_orders add column if not exists rider_vehicle text;
alter table public.customer_orders add column if not exists rider_code text;
alter table public.customer_orders add column if not exists rider_zone text;
alter table public.customer_orders add column if not exists delivery_estimate_minutes integer default 15;
alter table public.customer_orders add column if not exists source_page text;
alter table public.customer_orders add column if not exists order_items jsonb default '[]'::jsonb;
alter table public.customer_orders add column if not exists total_amount numeric(12, 2) default 0;
alter table public.customer_orders add column if not exists claimed_at timestamptz;
alter table public.customer_orders add column if not exists delivered_at timestamptz;
alter table public.customer_orders add column if not exists created_at timestamptz default timezone('utc', now());
alter table public.customer_orders add column if not exists updated_at timestamptz default timezone('utc', now());

update public.customer_orders
set
    order_mode = coalesce(nullif(order_mode, ''), 'delivery'),
    status = coalesce(nullif(status, ''), 'Waiting rider assignment'),
    item_count = coalesce(item_count, 0),
    delivery_estimate_minutes = coalesce(delivery_estimate_minutes, 15),
    order_items = coalesce(order_items, '[]'::jsonb),
    total_amount = coalesce(total_amount, 0),
    created_at = coalesce(created_at, timezone('utc', now())),
    updated_at = coalesce(updated_at, timezone('utc', now()))
where
    order_mode is null
    or order_mode = ''
    or status is null
    or status = ''
    or item_count is null
    or delivery_estimate_minutes is null
    or order_items is null
    or total_amount is null
    or created_at is null
    or updated_at is null;

create table if not exists public.table_bookings (
    id uuid primary key default gen_random_uuid(),
    booking_type text not null default 'standard',
    guest_name text not null,
    email text not null,
    guest_count text,
    service_window text,
    seat_code text,
    booking_date date,
    booking_time text,
    status text not null default 'Pending confirmation',
    assigned_staff text,
    assigned_to text,
    source_page text,
    auth_user_id uuid references auth.users (id) on delete set null,
    created_at timestamptz not null default timezone('utc', now()),
    updated_at timestamptz not null default timezone('utc', now())
);

alter table public.table_bookings add column if not exists id uuid default gen_random_uuid();
alter table public.table_bookings add column if not exists booking_type text default 'standard';
alter table public.table_bookings add column if not exists guest_name text;
alter table public.table_bookings add column if not exists email text;
alter table public.table_bookings add column if not exists guest_count text;
alter table public.table_bookings add column if not exists service_window text;
alter table public.table_bookings add column if not exists seat_code text;
alter table public.table_bookings add column if not exists booking_date date;
alter table public.table_bookings add column if not exists booking_time text;
alter table public.table_bookings add column if not exists status text default 'Pending confirmation';
alter table public.table_bookings add column if not exists assigned_staff text;
alter table public.table_bookings add column if not exists assigned_to text;
alter table public.table_bookings add column if not exists source_page text;
alter table public.table_bookings add column if not exists auth_user_id uuid references auth.users (id) on delete set null;
alter table public.table_bookings add column if not exists created_at timestamptz default timezone('utc', now());
alter table public.table_bookings add column if not exists updated_at timestamptz default timezone('utc', now());

update public.table_bookings
set
    booking_type = coalesce(nullif(booking_type, ''), 'standard'),
    status = coalesce(nullif(status, ''), 'Pending confirmation'),
    created_at = coalesce(created_at, timezone('utc', now())),
    updated_at = coalesce(updated_at, timezone('utc', now()))
where
    booking_type is null
    or booking_type = ''
    or status is null
    or status = ''
    or created_at is null
    or updated_at is null;

create table if not exists public.vip_bookings (
    id uuid primary key default gen_random_uuid(),
    guest_name text not null,
    email text not null,
    guest_count text,
    vip_section text,
    seat_code text,
    decor_option text,
    booking_date date,
    booking_time text,
    status text not null default 'Pending VIP confirmation',
    assigned_staff text,
    assigned_to text,
    source_page text,
    auth_user_id uuid references auth.users (id) on delete set null,
    created_at timestamptz not null default timezone('utc', now()),
    updated_at timestamptz not null default timezone('utc', now())
);

alter table public.vip_bookings add column if not exists id uuid default gen_random_uuid();
alter table public.vip_bookings add column if not exists guest_name text;
alter table public.vip_bookings add column if not exists email text;
alter table public.vip_bookings add column if not exists guest_count text;
alter table public.vip_bookings add column if not exists vip_section text;
alter table public.vip_bookings add column if not exists seat_code text;
alter table public.vip_bookings add column if not exists decor_option text;
alter table public.vip_bookings add column if not exists booking_date date;
alter table public.vip_bookings add column if not exists booking_time text;
alter table public.vip_bookings add column if not exists status text default 'Pending VIP confirmation';
alter table public.vip_bookings add column if not exists assigned_staff text;
alter table public.vip_bookings add column if not exists assigned_to text;
alter table public.vip_bookings add column if not exists source_page text;
alter table public.vip_bookings add column if not exists auth_user_id uuid references auth.users (id) on delete set null;
alter table public.vip_bookings add column if not exists created_at timestamptz default timezone('utc', now());
alter table public.vip_bookings add column if not exists updated_at timestamptz default timezone('utc', now());

update public.vip_bookings
set
    status = coalesce(nullif(status, ''), 'Pending VIP confirmation'),
    created_at = coalesce(created_at, timezone('utc', now())),
    updated_at = coalesce(updated_at, timezone('utc', now()))
where
    status is null
    or status = ''
    or created_at is null
    or updated_at is null;

create table if not exists public.event_booking_requests (
    id uuid primary key default gen_random_uuid(),
    contact_name text not null,
    email text not null,
    event_type text,
    guest_count integer,
    target_date date,
    target_time text,
    event_brief text,
    status text not null default 'Awaiting quote review',
    assigned_staff text,
    assigned_to text,
    source_page text,
    auth_user_id uuid references auth.users (id) on delete set null,
    created_at timestamptz not null default timezone('utc', now()),
    updated_at timestamptz not null default timezone('utc', now())
);

alter table public.event_booking_requests add column if not exists id uuid default gen_random_uuid();
alter table public.event_booking_requests add column if not exists contact_name text;
alter table public.event_booking_requests add column if not exists email text;
alter table public.event_booking_requests add column if not exists event_type text;
alter table public.event_booking_requests add column if not exists guest_count integer;
alter table public.event_booking_requests add column if not exists target_date date;
alter table public.event_booking_requests add column if not exists target_time text;
alter table public.event_booking_requests add column if not exists event_brief text;
alter table public.event_booking_requests add column if not exists status text default 'Awaiting quote review';
alter table public.event_booking_requests add column if not exists assigned_staff text;
alter table public.event_booking_requests add column if not exists assigned_to text;
alter table public.event_booking_requests add column if not exists source_page text;
alter table public.event_booking_requests add column if not exists auth_user_id uuid references auth.users (id) on delete set null;
alter table public.event_booking_requests add column if not exists created_at timestamptz default timezone('utc', now());
alter table public.event_booking_requests add column if not exists updated_at timestamptz default timezone('utc', now());

update public.event_booking_requests
set
    status = coalesce(nullif(status, ''), 'Awaiting quote review'),
    created_at = coalesce(created_at, timezone('utc', now())),
    updated_at = coalesce(updated_at, timezone('utc', now()))
where
    status is null
    or status = ''
    or created_at is null
    or updated_at is null;

drop trigger if exists trg_customer_orders_set_updated_at on public.customer_orders;
create trigger trg_customer_orders_set_updated_at
before update on public.customer_orders
for each row
execute function public.set_updated_at();

drop trigger if exists trg_table_bookings_set_updated_at on public.table_bookings;
create trigger trg_table_bookings_set_updated_at
before update on public.table_bookings
for each row
execute function public.set_updated_at();

drop trigger if exists trg_vip_bookings_set_updated_at on public.vip_bookings;
create trigger trg_vip_bookings_set_updated_at
before update on public.vip_bookings
for each row
execute function public.set_updated_at();

drop trigger if exists trg_event_booking_requests_set_updated_at on public.event_booking_requests;
create trigger trg_event_booking_requests_set_updated_at
before update on public.event_booking_requests
for each row
execute function public.set_updated_at();

create index if not exists idx_customer_orders_created_at on public.customer_orders (created_at desc);
create index if not exists idx_customer_orders_email_created_at on public.customer_orders (email, created_at desc);
create unique index if not exists idx_customer_orders_order_code on public.customer_orders (order_code);
create index if not exists idx_customer_orders_status on public.customer_orders (status);
create index if not exists idx_customer_orders_rider_name on public.customer_orders (rider_name);

create index if not exists idx_table_bookings_created_at on public.table_bookings (created_at desc);
create index if not exists idx_vip_bookings_created_at on public.vip_bookings (created_at desc);
create index if not exists idx_event_booking_requests_created_at on public.event_booking_requests (created_at desc);

grant usage on schema public to anon, authenticated;
grant select, insert, update on public.customer_orders to anon, authenticated;
grant select, insert, update on public.table_bookings to anon, authenticated;
grant select, insert, update on public.vip_bookings to anon, authenticated;
grant select, insert, update on public.event_booking_requests to anon, authenticated;

alter table public.customer_orders enable row level security;
alter table public.table_bookings enable row level security;
alter table public.vip_bookings enable row level security;
alter table public.event_booking_requests enable row level security;

drop policy if exists "public_customer_orders_select" on public.customer_orders;
create policy "public_customer_orders_select"
on public.customer_orders
for select
to public
using (true);

drop policy if exists "public_customer_orders_insert" on public.customer_orders;
create policy "public_customer_orders_insert"
on public.customer_orders
for insert
to public
with check (true);

drop policy if exists "public_customer_orders_update" on public.customer_orders;
create policy "public_customer_orders_update"
on public.customer_orders
for update
to public
using (true)
with check (true);

drop policy if exists "public_table_bookings_select" on public.table_bookings;
create policy "public_table_bookings_select"
on public.table_bookings
for select
to public
using (true);

drop policy if exists "public_table_bookings_insert" on public.table_bookings;
create policy "public_table_bookings_insert"
on public.table_bookings
for insert
to public
with check (true);

drop policy if exists "public_table_bookings_update" on public.table_bookings;
create policy "public_table_bookings_update"
on public.table_bookings
for update
to public
using (true)
with check (true);

drop policy if exists "public_vip_bookings_select" on public.vip_bookings;
create policy "public_vip_bookings_select"
on public.vip_bookings
for select
to public
using (true);

drop policy if exists "public_vip_bookings_insert" on public.vip_bookings;
create policy "public_vip_bookings_insert"
on public.vip_bookings
for insert
to public
with check (true);

drop policy if exists "public_vip_bookings_update" on public.vip_bookings;
create policy "public_vip_bookings_update"
on public.vip_bookings
for update
to public
using (true)
with check (true);

drop policy if exists "public_event_booking_requests_select" on public.event_booking_requests;
create policy "public_event_booking_requests_select"
on public.event_booking_requests
for select
to public
using (true);

drop policy if exists "public_event_booking_requests_insert" on public.event_booking_requests;
create policy "public_event_booking_requests_insert"
on public.event_booking_requests
for insert
to public
with check (true);

drop policy if exists "public_event_booking_requests_update" on public.event_booking_requests;
create policy "public_event_booking_requests_update"
on public.event_booking_requests
for update
to public
using (true)
with check (true);

do $$
begin
    if not exists (
        select 1
        from pg_publication_tables
        where pubname = 'supabase_realtime'
          and schemaname = 'public'
          and tablename = 'customer_orders'
    ) then
        alter publication supabase_realtime add table public.customer_orders;
    end if;
end
$$;
