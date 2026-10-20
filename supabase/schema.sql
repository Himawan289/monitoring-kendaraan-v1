-- Skema Monitoring Kendaraan: satu baris JSON per pengguna + bucket foto privat.
create table if not exists public.app_state (
  user_id uuid primary key references auth.users (id) on delete cascade,
  data jsonb not null,
  version integer not null default 0,
  updated_at timestamptz not null default now()
);

alter table public.app_state enable row level security;

drop policy if exists "app_state select" on public.app_state;
drop policy if exists "app_state insert" on public.app_state;
drop policy if exists "app_state update" on public.app_state;
create policy "app_state select" on public.app_state for select using (user_id = auth.uid());
create policy "app_state insert" on public.app_state for insert with check (user_id = auth.uid());
create policy "app_state update" on public.app_state for update using (user_id = auth.uid()) with check (user_id = auth.uid());

do $$ begin
  alter publication supabase_realtime add table public.app_state;
exception when duplicate_object then null;
end $$;

insert into storage.buckets (id, name, public) values ('photos', 'photos', false) on conflict (id) do nothing;

drop policy if exists "photos select" on storage.objects;
drop policy if exists "photos insert" on storage.objects;
drop policy if exists "photos delete" on storage.objects;
create policy "photos select" on storage.objects for select
  using (bucket_id = 'photos' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "photos insert" on storage.objects for insert
  with check (bucket_id = 'photos' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "photos delete" on storage.objects for delete
  using (bucket_id = 'photos' and (storage.foldername(name))[1] = auth.uid()::text);
