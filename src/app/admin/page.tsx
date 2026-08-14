import Link from "next/link";
import { createServiceClient } from "@/lib/supabase/server";
import type { RestaurantWithImages } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function AdminListPage() {
  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from("restaurants")
    .select("*, restaurant_images(*)")
    .order("created_at", { ascending: false });

  if (error) {
    return (
      <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
        <p className="font-medium">Could not load restaurants</p>
        <p className="mt-1">{error.message}</p>
        <p className="mt-3 text-amber-800">
          Check that Supabase env vars are set and you ran{" "}
          <code className="rounded bg-amber-100 px-1">001_init.sql</code>.
        </p>
      </div>
    );
  }

  const restaurants = (data ?? []) as RestaurantWithImages[];

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Restaurants</h1>
        <p className="mt-1 text-sm text-stone-600">
          Add and edit places. Photos, tags, hours, and location live here.
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          <Link
            href="/admin/new"
            className="inline-flex rounded-xl bg-stone-900 px-3 py-2 text-sm font-semibold text-white"
          >
            Add restaurant
          </Link>
          <Link
            href="/admin/help-me-choose"
            className="inline-flex rounded-xl border border-stone-300 bg-white px-3 py-2 text-sm font-medium text-stone-800"
          >
            Manage filters →
          </Link>
        </div>
      </div>

      {restaurants.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-stone-300 bg-white p-8 text-center">
          <p className="text-stone-700">No restaurants yet.</p>
          <Link
            href="/admin/new"
            className="mt-4 inline-flex rounded-xl bg-stone-900 px-4 py-2.5 text-sm font-semibold text-white"
          >
            Add your first
          </Link>
        </div>
      ) : (
        <ul className="space-y-3">
          {restaurants.map((restaurant) => {
            const main =
              restaurant.restaurant_images?.find((img) => img.is_main) ??
              restaurant.restaurant_images?.[0];
            return (
              <li key={restaurant.id}>
                <Link
                  href={`/admin/${restaurant.id}`}
                  className="flex gap-3 overflow-hidden rounded-2xl border border-stone-200 bg-white"
                >
                  <div className="h-24 w-24 shrink-0 bg-stone-200">
                    {main ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={main.public_url}
                        alt=""
                        className="h-full w-full object-cover"
                      />
                    ) : null}
                  </div>
                  <div className="min-w-0 flex-1 py-3 pr-3">
                    <p className="truncate font-semibold">{restaurant.name}</p>
                    <p className="mt-0.5 truncate text-sm text-stone-600">
                      {[restaurant.cuisine, restaurant.price_range]
                        .filter(Boolean)
                        .join(" · ") || "No cuisine set"}
                    </p>
                    {restaurant.address && (
                      <p className="mt-1 truncate text-xs text-stone-500">
                        {restaurant.address}
                      </p>
                    )}
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
