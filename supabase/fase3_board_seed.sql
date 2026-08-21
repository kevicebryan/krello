-- Krello Fase 3: Shared board seed template
-- Jalankan di Supabase Dashboard → SQL Editor → Run
-- Template: 3 lists (Todo, In Progress, Done) + 1 starter card di Todo
-- Dipakai oleh signup (handle_new_user) dan RPC create_board_with_defaults

create schema if not exists private;

-- Satu sumber kebenaran untuk seed board baru
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

  insert into public.lists (board_id, created_by, title, key, position)
  values
    (new_board_id, p_user_id, 'Todo', 'todo', 0),
    (new_board_id, p_user_id, 'In Progress', 'in_progress', 1),
    (new_board_id, p_user_id, 'Done', 'done', 2);

  select id into todo_list_id
  from public.lists
  where board_id = new_board_id
    and key = 'todo';

  insert into public.cards (list_id, created_by, title, position)
  values (todo_list_id, p_user_id, 'Get homework done', 0);

  return new_board_id;
end;
$$;

revoke all on function private.seed_board(uuid, text) from public;
grant execute on function private.seed_board(uuid, text) to postgres, service_role;

-- Client-callable: buat board + seed lists/card untuk user yang login
-- security definer supaya bisa memanggil private.seed_board; user_id selalu = auth.uid()
create or replace function public.create_board_with_defaults(p_title text default 'My Board')
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  uid uuid := auth.uid();
begin
  if uid is null then
    raise exception 'Not authenticated';
  end if;

  return private.seed_board(uid, p_title);
end;
$$;

revoke all on function public.create_board_with_defaults(text) from public;
grant execute on function public.create_board_with_defaults(text) to authenticated;

-- Signup: pakai template yang sama (3 list + starter card)
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
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

  perform private.seed_board(new.id, 'My Board');

  return new;
end;
$$;
