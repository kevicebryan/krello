-- Krello Fase 2: Database schema
-- Jalankan seluruh file ini di Supabase Dashboard → SQL Editor → Run
-- Model: Supabase Auth + profiles (name, email)
-- RLS: board owner mengontrol board; list/card hanya dikontrol oleh pembuatnya (created_by)

-- ---------------------------------------------------------------------------
-- Extensions
-- ---------------------------------------------------------------------------
create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------------------
-- Tables
-- ---------------------------------------------------------------------------

-- Profil app (1:1 dengan auth.users). Login tetap lewat Supabase Auth.
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  name text not null,
  email text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint profiles_email_unique unique (email)
);

create table public.boards (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  title text not null default 'My Board',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index boards_user_id_idx on public.boards (user_id);

-- Status columns di kanban (Todo, On Progress, Under Review, Done)
-- created_by = siapa yang buat list → hanya dia yang boleh control list tsb
create table public.lists (
  id uuid primary key default gen_random_uuid(),
  board_id uuid not null references public.boards (id) on delete cascade,
  created_by uuid not null references public.profiles (id) on delete cascade,
  title text not null,
  -- Stabil untuk logic poin nanti: todo | on_progress | under_review | done
  key text not null,
  position integer not null default 0,
  created_at timestamptz not null default now(),
  constraint lists_board_key_unique unique (board_id, key)
);

create index lists_board_id_idx on public.lists (board_id);
create index lists_created_by_idx on public.lists (created_by);

create table public.categories (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  name text not null,
  color_code text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint categories_user_name_unique unique (user_id, name)
);

create index categories_user_id_idx on public.categories (user_id);

-- created_by = siapa yang buat card → hanya dia yang boleh control card tsb
create table public.cards (
  id uuid primary key default gen_random_uuid(),
  list_id uuid not null references public.lists (id) on delete cascade,
  created_by uuid not null references public.profiles (id) on delete cascade,
  category_id uuid references public.categories (id) on delete set null,
  title text not null,
  description text,
  position integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index cards_list_id_idx on public.cards (list_id);
create index cards_created_by_idx on public.cards (created_by);
create index cards_category_id_idx on public.cards (category_id);

create table public.user_points (
  user_id uuid primary key references public.profiles (id) on delete cascade,
  total_points integer not null default 0 check (total_points >= 0),
  current_streak integer not null default 0 check (current_streak >= 0),
  last_activity_at timestamptz,
  updated_at timestamptz not null default now()
);

-- Katalog redeem global (source of truth untuk semua user)
create table public.rewards (
  id uuid primary key default gen_random_uuid(),
  key text not null unique,
  name text not null,
  description text not null,
  cost_points integer not null check (cost_points > 0),
  is_active boolean not null default true,
  position integer not null default 0,
  created_at timestamptz not null default now()
);

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
  );

-- ---------------------------------------------------------------------------
-- Helpers (security definer, private schema)
-- ---------------------------------------------------------------------------
create schema if not exists private;

create or replace function private.is_board_owner(p_board_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.boards b
    where b.id = p_board_id
      and b.user_id = auth.uid()
  );
$$;

-- List dikontrol oleh pembuatnya, bukan sekadar owner board
create or replace function private.is_list_creator(p_list_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.lists l
    where l.id = p_list_id
      and l.created_by = auth.uid()
  );
$$;

create or replace function private.is_category_owner(p_category_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.categories c
    where c.id = p_category_id
      and c.user_id = auth.uid()
  );
$$;

-- ---------------------------------------------------------------------------
-- Triggers: updated_at + kunci created_by agar tidak diganti
-- ---------------------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create or replace function public.lock_created_by()
returns trigger
language plpgsql
as $$
begin
  if tg_op = 'UPDATE' and new.created_by is distinct from old.created_by then
    raise exception 'created_by cannot be changed';
  end if;
  return new;
end;
$$;

create trigger profiles_set_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

create trigger boards_set_updated_at
  before update on public.boards
  for each row execute function public.set_updated_at();

create trigger categories_set_updated_at
  before update on public.categories
  for each row execute function public.set_updated_at();

create trigger cards_set_updated_at
  before update on public.cards
  for each row execute function public.set_updated_at();

create trigger user_points_set_updated_at
  before update on public.user_points
  for each row execute function public.set_updated_at();

create trigger lists_lock_created_by
  before update on public.lists
  for each row execute function public.lock_created_by();

create trigger cards_lock_created_by
  before update on public.cards
  for each row execute function public.lock_created_by();

-- ---------------------------------------------------------------------------
-- On signup: profile + points + default board + 4 lists (created_by = user)
-- ---------------------------------------------------------------------------
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  new_board_id uuid;
begin
  insert into public.profiles (id, name, email)
  values (
    new.id,
    coalesce(
      nullif(trim(new.raw_user_meta_data ->> 'name'), ''),
      split_part(new.email, '@', 1)
    ),
    new.email
  );

  insert into public.user_points (user_id)
  values (new.id);

  insert into public.boards (user_id, title)
  values (new.id, 'My Board')
  returning id into new_board_id;

  insert into public.lists (board_id, created_by, title, key, position) values
    (new_board_id, new.id, 'Todo', 'todo', 0),
    (new_board_id, new.id, 'On Progress', 'on_progress', 1),
    (new_board_id, new.id, 'Under Review', 'under_review', 2),
    (new_board_id, new.id, 'Done', 'done', 3);

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------------
alter table public.profiles enable row level security;
alter table public.boards enable row level security;
alter table public.lists enable row level security;
alter table public.categories enable row level security;
alter table public.cards enable row level security;
alter table public.user_points enable row level security;
alter table public.rewards enable row level security;

-- profiles
create policy "profiles_select_own"
  on public.profiles for select
  to authenticated
  using (id = auth.uid());

create policy "profiles_update_own"
  on public.profiles for update
  to authenticated
  using (id = auth.uid())
  with check (id = auth.uid());

-- boards: owner board
create policy "boards_select_own"
  on public.boards for select
  to authenticated
  using (user_id = auth.uid());

create policy "boards_insert_own"
  on public.boards for insert
  to authenticated
  with check (user_id = auth.uid());

create policy "boards_update_own"
  on public.boards for update
  to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

create policy "boards_delete_own"
  on public.boards for delete
  to authenticated
  using (user_id = auth.uid());

-- lists: hanya pembuat (created_by) yang control;
-- insert hanya di board milik sendiri + created_by wajib = auth.uid()
create policy "lists_select_creator"
  on public.lists for select
  to authenticated
  using (created_by = auth.uid());

create policy "lists_insert_creator"
  on public.lists for insert
  to authenticated
  with check (
    created_by = auth.uid()
    and private.is_board_owner(board_id)
  );

create policy "lists_update_creator"
  on public.lists for update
  to authenticated
  using (created_by = auth.uid())
  with check (
    created_by = auth.uid()
    and private.is_board_owner(board_id)
  );

create policy "lists_delete_creator"
  on public.lists for delete
  to authenticated
  using (created_by = auth.uid());

-- categories: owner kategori
create policy "categories_select_own"
  on public.categories for select
  to authenticated
  using (user_id = auth.uid());

create policy "categories_insert_own"
  on public.categories for insert
  to authenticated
  with check (user_id = auth.uid());

create policy "categories_update_own"
  on public.categories for update
  to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

create policy "categories_delete_own"
  on public.categories for delete
  to authenticated
  using (user_id = auth.uid());

-- cards: hanya pembuat card yang control;
-- harus ditaruh di list yang dia buat juga; category (jika ada) harus miliknya
create policy "cards_select_creator"
  on public.cards for select
  to authenticated
  using (created_by = auth.uid());

create policy "cards_insert_creator"
  on public.cards for insert
  to authenticated
  with check (
    created_by = auth.uid()
    and private.is_list_creator(list_id)
    and (category_id is null or private.is_category_owner(category_id))
  );

create policy "cards_update_creator"
  on public.cards for update
  to authenticated
  using (created_by = auth.uid())
  with check (
    created_by = auth.uid()
    and private.is_list_creator(list_id)
    and (category_id is null or private.is_category_owner(category_id))
  );

create policy "cards_delete_creator"
  on public.cards for delete
  to authenticated
  using (created_by = auth.uid());

-- user_points
create policy "user_points_select_own"
  on public.user_points for select
  to authenticated
  using (user_id = auth.uid());

create policy "user_points_update_own"
  on public.user_points for update
  to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- rewards: katalog global — semua authenticated user bisa CRUD
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

-- Insert user_points hanya lewat trigger signup (security definer), bukan client.
-- ---------------------------------------------------------------------------
-- Done. Setelah run:
-- 1. Buat user di Authentication (atau sign up dari app)
-- 2. Cek: profiles, boards, lists (4 default), user_points, rewards (2 items)
-- 3. Client wajib set created_by = auth.uid() saat insert list/card
-- ---------------------------------------------------------------------------
