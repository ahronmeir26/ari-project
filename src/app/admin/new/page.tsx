import { RestaurantForm } from "@/components/admin/RestaurantForm";
import { buildConflictMap } from "@/lib/help-choose-conflicts";
import { createServiceClient } from "@/lib/supabase/server";
import type { HelpChooseConflict, HelpChooseOption } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function NewRestaurantPage() {
  const supabase = createServiceClient();
  const [optionsResult, conflictsResult] = await Promise.all([
    supabase
      .from("help_choose_options")
      .select("*")
      .order("sort_order", { ascending: true }),
    supabase.from("help_choose_conflicts").select("option_a_id, option_b_id"),
  ]);

  const helpChooseOptions = (optionsResult.data ?? []) as HelpChooseOption[];
  const helpChooseConflictMap = buildConflictMap(
    (conflictsResult.data ?? []) as HelpChooseConflict[],
  );

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">
          New restaurant
        </h1>
        <p className="mt-1 text-sm text-stone-600">
          Fill in what you know — you can edit anything later.
        </p>
      </div>
      <RestaurantForm
        helpChooseOptions={helpChooseOptions}
        helpChooseConflictMap={helpChooseConflictMap}
      />
    </div>
  );
}
