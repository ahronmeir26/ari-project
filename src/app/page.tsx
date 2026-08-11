import Link from "next/link";
import { createServiceClient } from "@/lib/supabase/server";
import type { RestaurantWithImages } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !key) {
    return (
      <div className="mx-auto flex min-h-full max-w-lg flex-col px-4 py-8">
        <h1 className="text-3xl font-semibold tracking-tight">Restaurants</h1>
        <p className="mt-3 text-stone-600">
          Add <code className="rounded bg-stone-200 px-1">.env.local</code> with
          your Supabase URL and anon key, then run the SQL migration.
        </p>
        <Link
          href="/admin"
          className="mt-6 inline-flex w-fit rounded-xl bg-stone-900 px-4 py-2.5 text-sm font-semibold text-white"
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
    <div className="mx-auto min-h-full max-w-lg bg-stone-50 text-stone-900">
      <header className="sticky top-0 z-10 border-b border-stone-200 bg-stone-50/95 px-4 py-4 backdrop-blur">
        <div className="flex items-end justify-between gap-3">
          <div>
            <p className="text-xs font-medium uppercase tracking-[0.2em] text-stone-500">
              Nearby
            </p>
            <h1 className="mt-1 text-3xl font-semibold tracking-tight">
              Restaurants
            </h1>
          </div>
          <Link href="/admin" className="text-sm font-medium text-stone-600">
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
        ) : restaurants.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-stone-300 bg-white p-8 text-center">
            <p className="text-stone-700">No restaurants yet.</p>
            <Link
              href="/admin/new"
              className="mt-4 inline-flex rounded-xl bg-stone-900 px-4 py-2.5 text-sm font-semibold text-white"
            >
              Add one in admin
            </Link>
          </div>
        ) : (
          <ul className="space-y-4">
            {restaurants.map((restaurant) => {
              const main =
                restaurant.restaurant_images?.find((img) => img.is_main) ??
                restaurant.restaurant_images?.[0];
              return (
                <li
                  key={restaurant.id}
                  className="overflow-hidden rounded-3xl border border-stone-200 bg-white"
                >
                  <div className="aspect-[16/10] bg-stone-200">
                    {main ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={main.public_url}
                        alt={restaurant.name}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center text-sm text-stone-500">
                        No photo
                      </div>
                    )}
                  </div>
                  <div className="px-4 py-3">
                    <h2 className="text-lg font-semibold tracking-tight">
                      {restaurant.name}
                    </h2>
                    <p className="mt-0.5 text-sm text-stone-600">
                      {[restaurant.cuisine, restaurant.price_range]
                        .filter(Boolean)
                        .join(" · ")}
                    </p>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </main>
    </div>
  );
}
