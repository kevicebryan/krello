-- Seed: Matcha Break reward (2 poin)
-- Jalankan di Supabase SQL Editor. Aman di-run ulang (on conflict do nothing).

insert into public.rewards (key, name, description, cost_points, position)
values (
  'matcha_break',
  'Matcha Break',
  'Tukar poin untuk keluar beli matcha — istirahat singkat dengan minum favoritmu.',
  2,
  2
)
on conflict (key) do nothing;
