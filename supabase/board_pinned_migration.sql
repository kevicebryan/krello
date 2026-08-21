-- Pin boards: pinned float to top of sidebar list
-- Jalankan di Supabase Dashboard → SQL Editor → Run

alter table public.boards
  add column if not exists pinned boolean not null default false;

create index if not exists boards_user_pinned_created_idx
  on public.boards (user_id, pinned desc, created_at desc);
