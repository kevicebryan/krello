-- Optional deadline on cards (date only, for DatePicker)
-- Run in Supabase Dashboard → SQL Editor → Run

alter table public.cards
  add column if not exists deadline date;

comment on column public.cards.deadline is
  'Optional due date (calendar day). Null = no deadline.';
