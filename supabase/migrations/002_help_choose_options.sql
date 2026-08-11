-- Help Me Choose preference buttons

create table if not exists public.help_choose_options (
  id uuid primary key default gen_random_uuid(),
  label text not null,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);

create index if not exists help_choose_options_sort_idx
  on public.help_choose_options (sort_order);

alter table public.help_choose_options enable row level security;

drop policy if exists "help_choose_options_select_all" on public.help_choose_options;
create policy "help_choose_options_select_all"
  on public.help_choose_options for select
  using (true);

drop policy if exists "help_choose_options_insert_all" on public.help_choose_options;
create policy "help_choose_options_insert_all"
  on public.help_choose_options for insert
  with check (true);

drop policy if exists "help_choose_options_update_all" on public.help_choose_options;
create policy "help_choose_options_update_all"
  on public.help_choose_options for update
  using (true)
  with check (true);

drop policy if exists "help_choose_options_delete_all" on public.help_choose_options;
create policy "help_choose_options_delete_all"
  on public.help_choose_options for delete
  using (true);

insert into public.help_choose_options (label, sort_order)
select label, sort_order
from (values
  ('Fleishigs', 0),
  ('Milchigs', 1),
  ('Pareve', 2),
  ('Sit Down', 3),
  ('Fast Food / Take Out', 4),
  ('French Cuisine', 5)
) as seed(label, sort_order)
where not exists (select 1 from public.help_choose_options limit 1);
