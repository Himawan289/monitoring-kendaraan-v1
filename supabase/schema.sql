-- Skema Postgres/Supabase untuk migrasi dari localStorage (MVP saat ini).
create table vehicles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users not null,
  name text not null,
  plate text,
  tax_annual_due date,
  tax_stnk_due date,
  oil_interval_km int default 2000,
  oil_interval_months int default 6,
  service_interval_km int default 10000,
  service_interval_months int default 12,
  tire_interval_days int default 14
);
create table odometer_logs (
  id uuid primary key default gen_random_uuid(),
  vehicle_id uuid references vehicles on delete cascade,
  logged_at date not null,
  km int not null,
  photo_path text,
  source text check (source in ('ocr','manual'))
);
create table service_logs (
  id uuid primary key default gen_random_uuid(),
  vehicle_id uuid references vehicles on delete cascade,
  serviced_at date not null,
  km int not null,
  type text check (type in ('oli','servis')),
  cost int default 0,
  workshop text,
  notes text
);
create table tire_logs (
  id uuid primary key default gen_random_uuid(),
  vehicle_id uuid references vehicles on delete cascade,
  checked_at date not null,
  front_psi numeric,
  rear_psi numeric,
  notes text
);
alter table vehicles enable row level security;
create policy "own vehicles" on vehicles using (user_id = auth.uid());
