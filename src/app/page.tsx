import Link from "next/link";
import { RestaurantFeed } from "@/components/RestaurantFeed";
import { loadFilterControls } from "@/lib/load-filters";
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
  const [restaurantsResult, filters, settingsResult] = await Promise.all([
    supabase
      .from("restaurants")
      .select("*, restaurant_images(*), restaurant_help_choose_options(option_id)"),
    loadFilterControls(supabase),
    supabase
      .from("app_settings")
      .select("proximity_weight")
      .eq("id", 1)
      .maybeSingle(),
  ]);

  const restaurants = (restaurantsResult.data ?? []) as RestaurantWithImages[];
  const proximityWeight = Number(settingsResult.data?.proximity_weight ?? 0.7);

  return (
    <RestaurantFeed
      restaurants={restaurants}
      controls={filters.controls}
      proximityWeight={Number.isFinite(proximityWeight) ? proximityWeight : 0.7}
      loadError={restaurantsResult.error?.message ?? filters.error}
    />
  );
}
