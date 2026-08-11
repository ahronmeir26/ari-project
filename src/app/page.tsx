import Link from "next/link";
import { BottomNav } from "@/components/BottomNav";
import { createServiceClient } from "@/lib/supabase/server";
import type { RestaurantWithImages } from "@/lib/types";

export const dynamic = "force-dynamic";

const CARD_HEIGHT = "h-28";

function HelpMeChooseCard() {
  return (
    <li>
      <Link
        href="/help-me-choose"
        className={`relative flex ${CARD_HEIGHT} items-center overflow-hidden rounded-3xl border border-border-beige bg-surface-muted px-5 shadow-[0_1px_0_rgba(58,52,44,0.04)]`}
      >
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,253,249,0.9),transparent_55%)]" />
        <div className="relative flex items-center gap-3">
          <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-surface text-lg">
            ✦
          </span>
          <span className="font-[family-name:var(--font-fraunces)] text-xl font-medium tracking-tight text-foreground">
            Help me choose
          </span>
        </div>
      </Link>
    </li>
  );
}

function RestaurantCard({ restaurant }: { restaurant: RestaurantWithImages }) {
  const main =
    restaurant.restaurant_images?.find((img) => img.is_main) ??
    restaurant.restaurant_images?.[0];
  const subtitle = [restaurant.cuisine, restaurant.price_range]
    .filter(Boolean)
    .join(" · ");

  return (
    <li>
      <Link
        href={`/restaurants/${restaurant.id}`}
        className={`relative block ${CARD_HEIGHT} overflow-hidden rounded-3xl border border-border-beige shadow-[0_1px_0_rgba(58,52,44,0.04)]`}
      >
        {main ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={main.public_url}
            alt=""
            className="absolute inset-0 h-full w-full object-cover"
          />
        ) : (
          <div className="absolute inset-0 bg-placeholder-beige" />
        )}

        <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/35 to-black/10" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />

        <div className="relative flex h-full flex-col justify-end px-4 pb-3.5 pt-3">
          <h2 className="line-clamp-1 font-[family-name:var(--font-fraunces)] text-[1.35rem] leading-tight font-medium tracking-tight text-white drop-shadow-sm">
            {restaurant.name}
          </h2>
          {subtitle && (
            <p className="mt-0.5 line-clamp-1 text-xs font-medium tracking-wide text-white/85">
              {subtitle}
            </p>
          )}
        </div>
      </Link>
    </li>
  );
}

export default async function HomePage() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !key) {
    return (
      <div className="mx-auto flex min-h-full max-w-lg flex-col px-4 py-8">
        <h1 className="text-3xl font-semibold tracking-tight">Restaurants</h1>
        <p className="mt-3 text-muted-beige">
          Add <code className="rounded bg-surface-muted px-1">.env.local</code> with
          your Supabase URL and anon key, then run the SQL migration.
        </p>
        <Link
          href="/admin"
          className="mt-6 inline-flex w-fit rounded-xl bg-foreground px-4 py-2.5 text-sm font-semibold text-surface"
        >
          Open admin
        </Link>
      </div>
    );
  }

  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from("restaurants")
    .select("*, restaurant_images(*)")
    .order("name", { ascending: true });

  const restaurants = (data ?? []) as RestaurantWithImages[];

  return (
    <div className="mx-auto min-h-full max-w-lg bg-background pb-24 text-foreground">
      <header className="sticky top-0 z-10 border-b border-border-beige bg-background/95 px-4 py-4 backdrop-blur">
        <div className="flex items-end justify-between gap-3">
          <div>
            <p className="text-xs font-medium uppercase tracking-[0.2em] text-muted-beige">
              Nearby
            </p>
            <h1 className="mt-1 text-3xl font-semibold tracking-tight">
              Restaurants
            </h1>
          </div>
          <Link href="/admin" className="text-sm font-medium text-muted-beige">
            Admin
          </Link>
        </div>
      </header>

      <main className="px-4 py-5">
        {error ? (
          <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
            <p className="font-medium">Could not load restaurants</p>
            <p className="mt-1">{error.message}</p>
          </div>
        ) : (
          <ul className="space-y-3">
            <HelpMeChooseCard />
            {restaurants.length === 0 ? (
              <li className="rounded-2xl border border-dashed border-border-beige bg-surface/80 px-4 py-6 text-center">
                <p className="text-sm text-muted-beige">No restaurants yet.</p>
                <Link
                  href="/admin/new"
                  className="mt-3 inline-flex rounded-xl bg-foreground px-4 py-2.5 text-sm font-semibold text-surface"
                >
                  Add one in admin
                </Link>
              </li>
            ) : (
              restaurants.map((restaurant) => (
                <RestaurantCard key={restaurant.id} restaurant={restaurant} />
              ))
            )}
          </ul>
        )}
      </main>

      <BottomNav />
    </div>
  );
}
