-- Done list marker + award +3 points when a card moves into an is_done list
-- Jalankan di Supabase Dashboard → SQL Editor → Run

-- ---------------------------------------------------------------------------
-- lists.is_done: at most one Done column per board
-- ---------------------------------------------------------------------------
alter table public.lists
  add column if not exists is_done boolean not null default false;

-- Existing seeded "Done" columns (key = done)
update public.lists
set is_done = true
where key = 'done'
  and is_done = false;

-- Enforce one is_done list per board
create unique index if not exists lists_one_done_per_board_idx
  on public.lists (board_id)
  where is_done = true;

-- When marking a list as Done, clear any other Done list on the same board
create or replace function public.ensure_single_done_list()
returns trigger
language plpgsql
as $$
begin
  if new.is_done = true then
    update public.lists
    set is_done = false
    where board_id = new.board_id
      and id is distinct from new.id
      and is_done = true;
  end if;
  return new;
end;
$$;

drop trigger if exists lists_ensure_single_done on public.lists;
create trigger lists_ensure_single_done
  before insert or update of is_done on public.lists
  for each row
  when (new.is_done = true)
  execute function public.ensure_single_done_list();

-- Seed new boards with Done marked is_done
create or replace function private.seed_board(p_user_id uuid, p_title text)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  new_board_id uuid;
  todo_list_id uuid;
begin
  insert into public.boards (user_id, title)
  values (p_user_id, coalesce(nullif(trim(p_title), ''), 'My Board'))
  returning id into new_board_id;

  insert into public.lists (board_id, created_by, title, key, position, is_done)
  values
    (new_board_id, p_user_id, 'Todo', 'todo', 0, false),
    (new_board_id, p_user_id, 'In Progress', 'in_progress', 1, false),
    (new_board_id, p_user_id, 'Done', 'done', 2, true);

  select id into todo_list_id
  from public.lists
  where board_id = new_board_id
    and key = 'todo';

  insert into public.cards (list_id, created_by, title, position)
  values (todo_list_id, p_user_id, 'Get homework done', 0);

  return new_board_id;
end;
$$;

-- ---------------------------------------------------------------------------
-- Points: +3 when a card moves into an is_done list (from a non-done list)
-- ---------------------------------------------------------------------------
create or replace function public.award_points_on_card_done()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  from_is_done boolean;
  to_is_done boolean;
  points_delta integer := 3;
begin
  if tg_op <> 'UPDATE' then
    return new;
  end if;

  if new.list_id is not distinct from old.list_id then
    return new;
  end if;

  select coalesce(l.is_done, false) into from_is_done
  from public.lists l
  where l.id = old.list_id;

  select coalesce(l.is_done, false) into to_is_done
  from public.lists l
  where l.id = new.list_id;

  if coalesce(from_is_done, false) = false and coalesce(to_is_done, false) = true then
    insert into public.user_points (user_id, total_points, last_activity_at)
    values (new.created_by, points_delta, now())
    on conflict (user_id) do update
    set
      total_points = public.user_points.total_points + points_delta,
      last_activity_at = now(),
      updated_at = now();
  end if;

  return new;
end;
$$;

drop trigger if exists cards_award_points_on_done on public.cards;
create trigger cards_award_points_on_done
  after update of list_id on public.cards
  for each row
  execute function public.award_points_on_card_done();
