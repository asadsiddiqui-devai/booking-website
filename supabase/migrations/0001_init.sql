-- Booking website — initial schema
-- Tables, enums, RLS policies, and geocode cache.

-- ============================================================
-- Extensions
-- ============================================================
create extension if not exists "pgcrypto";

-- ============================================================
-- Enums
-- ============================================================
do $$ begin
  create type trip_status as enum ('draft', 'booked', 'cancelled');
exception when duplicate_object then null; end $$;

do $$ begin
  create type booking_status as enum ('pending', 'confirmed', 'cancelled');
exception when duplicate_object then null; end $$;

do $$ begin
  create type cabin_class as enum ('economy', 'premium_economy', 'business', 'first');
exception when duplicate_object then null; end $$;

do $$ begin
  create type vehicle_category as enum (
    'economy', 'compact', 'midsize', 'fullsize',
    'suv', 'luxury', 'van', 'convertible'
  );
exception when duplicate_object then null; end $$;

do $$ begin
  create type payment_status as enum ('simulated_success', 'simulated_failed');
exception when duplicate_object then null; end $$;

-- ============================================================
-- profiles
-- ============================================================
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  avatar_url text,
  phone text,
  preferred_currency text not null default 'USD',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Auto-create a profile row on user signup
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, avatar_url)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name'),
    new.raw_user_meta_data->>'avatar_url'
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

-- ============================================================
-- trips
-- ============================================================
create table if not exists public.trips (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text,
  origin_city text,
  origin_iata text,
  destination_city text,
  destination_iata text,
  start_date date,
  end_date date,
  passenger_count int not null default 1 check (passenger_count > 0),
  status trip_status not null default 'draft',
  total_price numeric(12, 2),
  currency text not null default 'USD',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists trips_user_id_idx on public.trips (user_id);
create index if not exists trips_status_idx on public.trips (status);

-- ============================================================
-- flight_bookings
-- ============================================================
create table if not exists public.flight_bookings (
  id uuid primary key default gen_random_uuid(),
  trip_id uuid not null references public.trips(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  duffel_offer_id text not null,
  origin_iata text not null,
  destination_iata text not null,
  departure_at timestamptz not null,
  arrival_at timestamptz not null,
  airline_iata text,
  airline_name text,
  flight_number text,
  cabin_class cabin_class not null default 'economy',
  fare_basis text,
  stops int not null default 0,
  duration_minutes int,
  seat_selection jsonb,
  passengers jsonb,
  price numeric(12, 2) not null,
  currency text not null default 'USD',
  status booking_status not null default 'pending',
  created_at timestamptz not null default now()
);

create index if not exists flight_bookings_trip_id_idx on public.flight_bookings (trip_id);
create index if not exists flight_bookings_user_id_idx on public.flight_bookings (user_id);

-- ============================================================
-- hotel_bookings
-- ============================================================
create table if not exists public.hotel_bookings (
  id uuid primary key default gen_random_uuid(),
  trip_id uuid not null references public.trips(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  duffel_stay_id text not null,
  duffel_quote_id text,
  hotel_name text not null,
  hotel_rating numeric(2, 1) check (hotel_rating between 0 and 5),
  address text,
  lat numeric(9, 6),
  lng numeric(9, 6),
  distance_to_center_km numeric(6, 2),
  check_in date not null,
  check_out date not null,
  nights int not null check (nights > 0),
  room_type text,
  board_type text,
  amenities jsonb,
  guest_info jsonb,
  price_per_night numeric(12, 2),
  total_price numeric(12, 2) not null,
  currency text not null default 'USD',
  status booking_status not null default 'pending',
  created_at timestamptz not null default now()
);

create index if not exists hotel_bookings_trip_id_idx on public.hotel_bookings (trip_id);
create index if not exists hotel_bookings_user_id_idx on public.hotel_bookings (user_id);

-- ============================================================
-- car_bookings
-- ============================================================
create table if not exists public.car_bookings (
  id uuid primary key default gen_random_uuid(),
  trip_id uuid not null references public.trips(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  catalog_vehicle_id text not null,
  provider_name text not null,
  provider_logo_url text,
  vehicle_category vehicle_category not null,
  vehicle_example text,
  transmission text,
  air_conditioning boolean not null default true,
  seats int,
  doors int,
  pickup_location text not null,
  pickup_at timestamptz not null,
  dropoff_location text not null,
  dropoff_at timestamptz not null,
  daily_rate numeric(12, 2) not null,
  total_days int not null check (total_days > 0),
  total_price numeric(12, 2) not null,
  currency text not null default 'USD',
  driver_info jsonb,
  status booking_status not null default 'pending',
  created_at timestamptz not null default now()
);

create index if not exists car_bookings_trip_id_idx on public.car_bookings (trip_id);
create index if not exists car_bookings_user_id_idx on public.car_bookings (user_id);

-- ============================================================
-- payments (simulated)
-- ============================================================
create table if not exists public.payments (
  id uuid primary key default gen_random_uuid(),
  trip_id uuid not null references public.trips(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  amount numeric(12, 2) not null,
  currency text not null default 'USD',
  card_last4 text,
  card_brand text,
  cardholder_name text,
  billing_address jsonb,
  status payment_status not null default 'simulated_success',
  simulated boolean not null default true,
  created_at timestamptz not null default now()
);

create index if not exists payments_trip_id_idx on public.payments (trip_id);
create index if not exists payments_user_id_idx on public.payments (user_id);

-- ============================================================
-- geocode_cache (world-readable, service-role-writable)
-- ============================================================
create table if not exists public.geocode_cache (
  query_key text primary key,
  lat numeric(9, 6) not null,
  lng numeric(9, 6) not null,
  display_name text,
  fetched_at timestamptz not null default now()
);

-- ============================================================
-- Row Level Security
-- ============================================================
alter table public.profiles enable row level security;
alter table public.trips enable row level security;
alter table public.flight_bookings enable row level security;
alter table public.hotel_bookings enable row level security;
alter table public.car_bookings enable row level security;
alter table public.payments enable row level security;
alter table public.geocode_cache enable row level security;

-- profiles: user can read/update their own profile
drop policy if exists "profiles_select_own" on public.profiles;
create policy "profiles_select_own" on public.profiles
  for select using (auth.uid() = id);

drop policy if exists "profiles_insert_own" on public.profiles;
create policy "profiles_insert_own" on public.profiles
  for insert with check (auth.uid() = id);

drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own" on public.profiles
  for update using (auth.uid() = id) with check (auth.uid() = id);

-- trips
drop policy if exists "trips_all_own" on public.trips;
create policy "trips_all_own" on public.trips
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- flight_bookings
drop policy if exists "flight_bookings_all_own" on public.flight_bookings;
create policy "flight_bookings_all_own" on public.flight_bookings
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- hotel_bookings
drop policy if exists "hotel_bookings_all_own" on public.hotel_bookings;
create policy "hotel_bookings_all_own" on public.hotel_bookings
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- car_bookings
drop policy if exists "car_bookings_all_own" on public.car_bookings;
create policy "car_bookings_all_own" on public.car_bookings
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- payments
drop policy if exists "payments_all_own" on public.payments;
create policy "payments_all_own" on public.payments
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- geocode_cache: world-readable; writes only via service role
drop policy if exists "geocode_cache_read_all" on public.geocode_cache;
create policy "geocode_cache_read_all" on public.geocode_cache
  for select using (true);
