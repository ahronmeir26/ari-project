"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { FilterBar } from "@/components/FilterBar";
import {
  restaurantMatchesFilters,
  toggleFilterSelection,
} from "@/lib/help-choose-controls";
import { minutesAway, weightedShuffle, type LatLng } from "@/lib/proximity";
import type {
  HelpChooseControlWithOptions,
  RestaurantWithImages,
} from "@/lib/types";

const CARD_HEIGHT = "h-28";

type RestaurantFeedProps = {
  restaurants: RestaurantWithImages[];
  controls: HelpChooseControlWithOptions[];
  proximityWeight: number;
  loadError?: string | null;
};

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

export function RestaurantFeed({
  restaurants,
  controls,
  proximityWeight,
  loadError,
}: RestaurantFeedProps) {
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [here, setHere] = useState<LatLng | null>(null);

  useEffect(() => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setHere({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        });
      },
      () => {
        setHere(null);
      },
      { enableHighAccuracy: false, maximumAge: 60_000, timeout: 8_000 },
    );
  }, []);

  const ordered = useMemo(
    () =>
      weightedShuffle(
        restaurants,
        (restaurant) =>
          minutesAway(
            here,
            restaurant.lat != null && restaurant.lng != null
              ? { lat: restaurant.lat, lng: restaurant.lng }
              : null,
          ),
        proximityWeight,
      ),
    [restaurants, here, proximityWeight],
  );

  const visible = ordered.filter((restaurant) =>
    restaurantMatchesFilters(
      (restaurant.restaurant_help_choose_options ?? []).map(
        (row) => row.option_id,
      ),
      selected,
      controls,
    ),
  );

  return (
    <div className="mx-auto min-h-full max-w-lg bg-background px-4 pb-6 text-foreground">
      <header className="sticky top-0 z-10 bg-background/95 pt-4 backdrop-blur">
        <div className="flex items-end justify-between gap-3">
          <div>
            <p className="text-xs font-medium uppercase tracking-[0.2em] text-muted-beige">
              Nearby
            </p>
            <h1 className="mt-1 text-3xl font-semibold tracking-tight">
              Restaurants
            </h1>
          </div>
          <Link href="/admin" className="pb-1 text-sm font-medium text-muted-beige">
            Admin
          </Link>
        </div>
        <FilterBar
          controls={controls}
          selected={selected}
          onToggle={(id) =>
            setSelected((prev) => toggleFilterSelection(prev, id, controls))
          }
        />
      </header>

      <main className="py-5">
        {loadError ? (
          <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
            <p className="font-medium">Could not load restaurants</p>
            <p className="mt-1">{loadError}</p>
          </div>
        ) : (
          <ul className="space-y-3">
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
            ) : visible.length === 0 ? (
              <li className="rounded-2xl border border-dashed border-border-beige bg-surface/80 px-4 py-6 text-center">
                <p className="text-sm text-muted-beige">
                  No places match these filters.
                </p>
                <button
                  type="button"
                  onClick={() => setSelected(new Set())}
                  className="mt-3 inline-flex rounded-xl bg-foreground px-4 py-2.5 text-sm font-semibold text-surface"
                >
                  Clear filters
                </button>
              </li>
            ) : (
              visible.map((restaurant) => (
                <RestaurantCard key={restaurant.id} restaurant={restaurant} />
              ))
            )}
          </ul>
        )}
      </main>
    </div>
  );
}
