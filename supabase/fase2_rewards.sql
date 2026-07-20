-- Krello Fase 2 (addon): rewards catalog
-- Jalankan di SQL Editor setelah fase2_schema.sql
-- Semua authenticated user bisa CRUD; ini source of truth katalog redeem

create table if not exists public.rewards (
  id uuid primary key default gen_random_uuid(),
  key text not null unique,
  name text not null,
  description text not null,
  cost_points integer not null check (cost_points > 0),
  is_active boolean not null default true,
  position integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Seed default rewards (aman di-run ulang)
insert into public.rewards (key, name, description, cost_points, position) values
  (
    'free_time',
    'Free Time (1 hour)',
    'Tukar poin untuk 1 jam istirahat — main game, scroll, atau apa saja.',
    50,
    0
  ),
  (
    'coffee',
    'Coffee',
    'Tukar poin untuk secangkir specialty coffee atau matcha favorit.',
    100,
    1
  )
on conflict (key) do nothing;

-- updated_at (reuse helper dari fase2_schema jika sudah ada)
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists rewards_set_updated_at on public.rewards;
create trigger rewards_set_updated_at
  before update on public.rewards
  for each row execute function public.set_updated_at();

alter table public.rewards enable row level security;

-- Drop old select-only policy if you previously added a read-only version
drop policy if exists "rewards_select_active" on public.rewards;
drop policy if exists "rewards_select_all" on public.rewards;
drop policy if exists "rewards_insert_authenticated" on public.rewards;
drop policy if exists "rewards_update_authenticated" on public.rewards;
drop policy if exists "rewards_delete_authenticated" on public.rewards;

-- CRUD untuk semua authenticated users
create policy "rewards_select_all"
  on public.rewards for select
  to authenticated
  using (true);

create policy "rewards_insert_authenticated"
  on public.rewards for insert
  to authenticated
  with check (true);

create policy "rewards_update_authenticated"
  on public.rewards for update
  to authenticated
  using (true)
  with check (true);

create policy "rewards_delete_authenticated"
  on public.rewards for delete
  to authenticated
  using (true);
