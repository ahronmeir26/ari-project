-- Replace pairwise conflicts with bar controls:
--   toggle     = independent filter chip
--   exclusive  = one-of-N segmented control (2 or 3 choices)

create table if not exists public.help_choose_controls (
  id uuid primary key default gen_random_uuid(),
  kind text not null check (kind in ('toggle', 'exclusive')),
  name text,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);

create index if not exists help_choose_controls_sort_idx
  on public.help_choose_controls (sort_order);

alter table public.help_choose_controls enable row level security;

drop policy if exists "help_choose_controls_select_all" on public.help_choose_controls;
create policy "help_choose_controls_select_all"
  on public.help_choose_controls for select
  using (true);

drop policy if exists "help_choose_controls_insert_all" on public.help_choose_controls;
create policy "help_choose_controls_insert_all"
  on public.help_choose_controls for insert
  with check (true);

drop policy if exists "help_choose_controls_update_all" on public.help_choose_controls;
create policy "help_choose_controls_update_all"
  on public.help_choose_controls for update
  using (true)
  with check (true);

drop policy if exists "help_choose_controls_delete_all" on public.help_choose_controls;
create policy "help_choose_controls_delete_all"
  on public.help_choose_controls for delete
  using (true);

alter table public.help_choose_options
  add column if not exists control_id uuid references public.help_choose_controls (id) on delete cascade;

create index if not exists help_choose_options_control_idx
  on public.help_choose_options (control_id);

-- Backfill: one toggle per ungrouped option, then turn isolated conflict
-- pairs (A only conflicts with B and vice versa) into exclusive controls.
-- Messy multi-conflict graphs stay as independent toggles so admin can
-- recreate them as real one-of-N groups.
do $$
declare
  rec record;
  new_id uuid;
  control_a uuid;
  control_b uuid;
begin
  for rec in
    select id, sort_order
    from public.help_choose_options
    where control_id is null
  loop
    insert into public.help_choose_controls (kind, sort_order)
    values ('toggle', rec.sort_order)
    returning id into new_id;

    update public.help_choose_options
    set control_id = new_id
    where id = rec.id;
  end loop;

  if to_regclass('public.help_choose_conflicts') is not null then
    for rec in
      select c.option_a_id, c.option_b_id
      from public.help_choose_conflicts c
      where (
        select count(*)
        from public.help_choose_conflicts x
        where x.option_a_id in (c.option_a_id, c.option_b_id)
           or x.option_b_id in (c.option_a_id, c.option_b_id)
      ) = 1
    loop
      select control_id into control_a
      from public.help_choose_options
      where id = rec.option_a_id;

      select control_id into control_b
      from public.help_choose_options
      where id = rec.option_b_id;

      if control_a is null or control_b is null then
        continue;
      end if;

      if control_a = control_b then
        update public.help_choose_controls
        set kind = 'exclusive'
        where id = control_a;
      else
        update public.help_choose_options
        set control_id = control_a
        where control_id = control_b;

        update public.help_choose_controls
        set
          kind = 'exclusive',
          sort_order = least(
            (select sort_order from public.help_choose_controls where id = control_a),
            (select sort_order from public.help_choose_controls where id = control_b)
          )
        where id = control_a;

        delete from public.help_choose_controls where id = control_b;
      end if;
    end loop;
  end if;

  -- Known pair from the original seed, in case conflicts were never set.
  control_a := null;
  control_b := null;
  select a.control_id, b.control_id
  into control_a, control_b
  from public.help_choose_options a
  join public.help_choose_options b
    on a.label = 'Fleishigs' and b.label = 'Milchigs';

  if found and control_a is not null and control_b is not null and control_a <> control_b then
    update public.help_choose_options
    set control_id = control_a
    where control_id = control_b;

    update public.help_choose_controls
    set
      kind = 'exclusive',
      sort_order = least(
        (select sort_order from public.help_choose_controls where id = control_a),
        (select sort_order from public.help_choose_controls where id = control_b)
      )
    where id = control_a;

    delete from public.help_choose_controls where id = control_b;
  elsif found and control_a is not null and control_a = control_b then
    update public.help_choose_controls
    set kind = 'exclusive'
    where id = control_a;
  end if;
end $$;

do $$
begin
  if exists (
    select 1
    from public.help_choose_options
    where control_id is null
  ) then
    raise exception 'help_choose_options.control_id backfill left null rows';
  end if;
end $$;

alter table public.help_choose_options
  alter column control_id set not null;

drop table if exists public.help_choose_conflicts;

create table if not exists public.app_settings (
  id int primary key default 1 check (id = 1),
  proximity_weight numeric not null default 0.7
    check (proximity_weight >= 0 and proximity_weight <= 1),
  updated_at timestamptz not null default now()
);

alter table public.app_settings enable row level security;

drop policy if exists "app_settings_select_all" on public.app_settings;
create policy "app_settings_select_all"
  on public.app_settings for select
  using (true);

drop policy if exists "app_settings_insert_all" on public.app_settings;
create policy "app_settings_insert_all"
  on public.app_settings for insert
  with check (true);

drop policy if exists "app_settings_update_all" on public.app_settings;
create policy "app_settings_update_all"
  on public.app_settings for update
  using (true)
  with check (true);

insert into public.app_settings (id, proximity_weight)
values (1, 0.7)
on conflict (id) do nothing;
