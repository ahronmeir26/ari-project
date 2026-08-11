# Restaurants (Vercel + Supabase)

Mobile-first web app with a **public restaurant list** and an open **admin** for creating/editing restaurants (photos, tags, hours, cuisine, price, lat/lng, etc.).

## Stack

- Next.js (App Router) on Vercel
- Supabase Postgres + Storage
- No auth in v1 (open admin) — add login later before production use

## Setup

### 1. Create a Supabase project

In the [Supabase dashboard](https://supabase.com/dashboard), create a project.

### 2. Run the migration

Open **SQL Editor**, paste and run the full contents of:

[`supabase/migrations/001_init.sql`](supabase/migrations/001_init.sql)

This creates:

- `restaurants` and `restaurant_images` tables
- Open RLS policies (read/write for everyone — v1 only)
- Public storage bucket `restaurant-photos`

### 3. Environment variables

Copy the example env file:

```bash
cp .env.example .env.local
```

Fill in from Supabase **Project Settings → API**:

```
NEXT_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=YOUR_ANON_KEY
```

### 4. Run locally

```bash
npm install
npm run dev
```

- Public list: [http://localhost:3000](http://localhost:3000)
- Admin: [http://localhost:3000/admin](http://localhost:3000/admin)

## Deploy on Vercel

1. Push this repo to GitHub
2. Import the project in Vercel
3. Add the same two env vars in Vercel project settings
4. Deploy

After deploy, use `/admin` on your phone to enter restaurants.

## Admin fields

- Name, description, cuisine, price (`$` / `$$` / `$$$`)
- Address, lat, lng (for future “near me”)
- Phone, website
- Freeform tags
- Hours per day (open / close / closed)
- Multiple photos; choose which is the main photo

## Project layout

```
src/app/                 # public / and admin routes
src/components/admin/    # form, tags, hours, image gallery
src/lib/actions/         # server actions (CRUD + uploads)
src/lib/supabase/        # Supabase clients
supabase/migrations/     # SQL schema
```

## Later

- Add auth and tighten RLS before sharing publicly
- Build “near me” using `lat` / `lng`
- Optional Expo / React Native app against the same Supabase project
