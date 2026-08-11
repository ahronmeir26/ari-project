-- Mutual exclusion pairs for Help Me Choose buttons.
-- Selecting one option unselects its conflicting partners (and vice versa).

create table if not exists public.help_choose_conflicts (
  option_a_id uuid not null references public.help_choose_options (id) on delete cascade,
  option_b_id uuid not null references public.help_choose_options (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (option_a_id, option_b_id),
  check (option_a_id < option_b_id)
);

create index if not exists help_choose_conflicts_b_idx
  on public.help_choose_conflicts (option_b_id);

alter table public.help_choose_conflicts enable row level security;

drop policy if exists "help_choose_conflicts_select_all" on public.help_choose_conflicts;
create policy "help_choose_conflicts_select_all"
  on public.help_choose_conflicts for select
  using (true);

drop policy if exists "help_choose_conflicts_insert_all" on public.help_choose_conflicts;
create policy "help_choose_conflicts_insert_all"
  on public.help_choose_conflicts for insert
  with check (true);

drop policy if exists "help_choose_conflicts_delete_all" on public.help_choose_conflicts;
create policy "help_choose_conflicts_delete_all"
  on public.help_choose_conflicts for delete
  using (true);

-- Seed Fleishigs ↔ Milchigs if both exist and no conflicts yet
insert into public.help_choose_conflicts (option_a_id, option_b_id)
select
  least(a.id, b.id),
  greatest(a.id, b.id)
from public.help_choose_options a
join public.help_choose_options b
  on a.label = 'Fleishigs' and b.label = 'Milchigs'
where not exists (select 1 from public.help_choose_conflicts limit 1)
on conflict do nothing;
