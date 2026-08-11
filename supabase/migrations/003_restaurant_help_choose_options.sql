-- Which Help Me Choose buttons apply to each restaurant

create table if not exists public.restaurant_help_choose_options (
  restaurant_id uuid not null references public.restaurants (id) on delete cascade,
  option_id uuid not null references public.help_choose_options (id) on delete cascade,
  primary key (restaurant_id, option_id)
);

create index if not exists restaurant_help_choose_options_option_idx
  on public.restaurant_help_choose_options (option_id);

alter table public.restaurant_help_choose_options enable row level security;

drop policy if exists "restaurant_help_choose_options_select_all" on public.restaurant_help_choose_options;
create policy "restaurant_help_choose_options_select_all"
  on public.restaurant_help_choose_options for select
  using (true);

drop policy if exists "restaurant_help_choose_options_insert_all" on public.restaurant_help_choose_options;
create policy "restaurant_help_choose_options_insert_all"
  on public.restaurant_help_choose_options for insert
  with check (true);

drop policy if exists "restaurant_help_choose_options_delete_all" on public.restaurant_help_choose_options;
create policy "restaurant_help_choose_options_delete_all"
  on public.restaurant_help_choose_options for delete
  using (true);
