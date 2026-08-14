import Link from "next/link";
import { HelpChooseAdmin } from "@/components/admin/HelpChooseAdmin";
import { loadFilterControls } from "@/lib/load-filters";
import { createServiceClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function AdminFiltersPage() {
  const supabase = createServiceClient();
  const [filters, settingsResult] = await Promise.all([
    loadFilterControls(supabase),
    supabase
      .from("app_settings")
      .select("proximity_weight")
      .eq("id", 1)
      .maybeSingle(),
  ]);

  if (filters.error) {
    return (
      <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
        <p className="font-medium">Could not load filters</p>
        <p className="mt-1">{filters.error}</p>
        <p className="mt-3 text-amber-800">
          Run{" "}
          <code className="rounded bg-amber-100 px-1">
            supabase/migrations/005_help_choose_controls.sql
          </code>{" "}
          in the Supabase SQL editor if this persists.
        </p>
      </div>
    );
  }

  const proximityWeight = Number(settingsResult.data?.proximity_weight ?? 0.7);

  return (
    <div className="space-y-4">
      <div>
        <Link href="/admin" className="text-sm text-stone-600">
          ← Restaurants
        </Link>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight">
          Manage filters
        </h1>
        <p className="mt-1 text-sm text-stone-600">
          Single filters can be combined. One-of-N controls (meat / other, etc.)
          let people pick exactly one choice in the sliding bar.
        </p>
      </div>

      <HelpChooseAdmin
        controls={filters.controls}
        proximityWeight={Number.isFinite(proximityWeight) ? proximityWeight : 0.7}
      />
    </div>
  );
}
