import { notFound } from "next/navigation";
import { RestaurantForm } from "@/components/admin/RestaurantForm";
import { buildConflictMap } from "@/lib/help-choose-conflicts";
import { createServiceClient } from "@/lib/supabase/server";
import type {
  HelpChooseConflict,
  HelpChooseOption,
  RestaurantWithImages,
} from "@/lib/types";

export const dynamic = "force-dynamic";

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function EditRestaurantPage({ params }: PageProps) {
  const { id } = await params;
  const supabase = createServiceClient();

  const [restaurantResult, optionsResult, selectedResult, conflictsResult] =
    await Promise.all([
      supabase
        .from("restaurants")
        .select("*, restaurant_images(*)")
        .eq("id", id)
        .maybeSingle(),
      supabase
        .from("help_choose_options")
        .select("*")
        .order("sort_order", { ascending: true }),
      supabase
        .from("restaurant_help_choose_options")
        .select("option_id")
        .eq("restaurant_id", id),
      supabase.from("help_choose_conflicts").select("option_a_id, option_b_id"),
    ]);

  if (restaurantResult.error || !restaurantResult.data) {
    notFound();
  }

  const restaurant = restaurantResult.data as RestaurantWithImages;
  const helpChooseOptions = (optionsResult.data ?? []) as HelpChooseOption[];
  const selectedHelpChooseOptionIds =
    selectedResult.data?.map((row) => row.option_id) ?? [];
  const helpChooseConflictMap = buildConflictMap(
    (conflictsResult.data ?? []) as HelpChooseConflict[],
  );

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">
          {restaurant.name}
        </h1>
        <p className="mt-1 text-sm text-stone-600">Edit details and photos.</p>
      </div>
      <RestaurantForm
        restaurant={restaurant}
        helpChooseOptions={helpChooseOptions}
        selectedHelpChooseOptionIds={selectedHelpChooseOptionIds}
        helpChooseConflictMap={helpChooseConflictMap}
      />
    </div>
  );
}
