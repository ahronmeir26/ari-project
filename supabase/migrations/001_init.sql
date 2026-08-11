-- Restaurants + images schema (open RLS for v1 — add auth later)

create extension if not exists "pgcrypto";

create table if not exists public.restaurants (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  address text,
  phone text,
  website text,
  cuisine text,
  price_range text check (price_range is null or price_range in ('$', '$$', '$$$')),
  hours jsonb not null default '{}'::jsonb,
  lat double precision,
  lng double precision,
  tags text[] not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists restaurants_name_idx on public.restaurants (name);
create index if not exists restaurants_cuisine_idx on public.restaurants (cuisine);
create index if not exists restaurants_tags_idx on public.restaurants using gin (tags);

create table if not exists public.restaurant_images (
  id uuid primary key default gen_random_uuid(),
  restaurant_id uuid not null references public.restaurants (id) on delete cascade,
  storage_path text not null,
  public_url text not null,
  is_main boolean not null default false,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);

create index if not exists restaurant_images_restaurant_id_idx
  on public.restaurant_images (restaurant_id);

create index if not exists restaurant_images_main_idx
  on public.restaurant_images (restaurant_id)
  where is_main = true;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists restaurants_set_updated_at on public.restaurants;
create trigger restaurants_set_updated_at
  before update on public.restaurants
  for each row
  execute function public.set_updated_at();

-- Ensure at most one main image per restaurant
create unique index if not exists restaurant_images_one_main_per_restaurant
  on public.restaurant_images (restaurant_id)
  where is_main = true;

alter table public.restaurants enable row level security;
alter table public.restaurant_images enable row level security;

-- Open policies for v1 (no auth). Tighten when login is added.
drop policy if exists "restaurants_select_all" on public.restaurants;
create policy "restaurants_select_all"
  on public.restaurants for select
  using (true);

drop policy if exists "restaurants_insert_all" on public.restaurants;
create policy "restaurants_insert_all"
  on public.restaurants for insert
  with check (true);

drop policy if exists "restaurants_update_all" on public.restaurants;
create policy "restaurants_update_all"
  on public.restaurants for update
  using (true)
  with check (true);

drop policy if exists "restaurants_delete_all" on public.restaurants;
create policy "restaurants_delete_all"
  on public.restaurants for delete
  using (true);

drop policy if exists "restaurant_images_select_all" on public.restaurant_images;
create policy "restaurant_images_select_all"
  on public.restaurant_images for select
  using (true);

drop policy if exists "restaurant_images_insert_all" on public.restaurant_images;
create policy "restaurant_images_insert_all"
  on public.restaurant_images for insert
  with check (true);

drop policy if exists "restaurant_images_update_all" on public.restaurant_images;
create policy "restaurant_images_update_all"
  on public.restaurant_images for update
  using (true)
  with check (true);

drop policy if exists "restaurant_images_delete_all" on public.restaurant_images;
create policy "restaurant_images_delete_all"
  on public.restaurant_images for delete
  using (true);

-- Storage bucket for restaurant photos
insert into storage.buckets (id, name, public)
values ('restaurant-photos', 'restaurant-photos', true)
on conflict (id) do update set public = true;

drop policy if exists "restaurant_photos_public_read" on storage.objects;
create policy "restaurant_photos_public_read"
  on storage.objects for select
  using (bucket_id = 'restaurant-photos');

drop policy if exists "restaurant_photos_public_insert" on storage.objects;
create policy "restaurant_photos_public_insert"
  on storage.objects for insert
  with check (bucket_id = 'restaurant-photos');

drop policy if exists "restaurant_photos_public_update" on storage.objects;
create policy "restaurant_photos_public_update"
  on storage.objects for update
  using (bucket_id = 'restaurant-photos')
  with check (bucket_id = 'restaurant-photos');

drop policy if exists "restaurant_photos_public_delete" on storage.objects;
create policy "restaurant_photos_public_delete"
  on storage.objects for delete
  using (bucket_id = 'restaurant-photos');
