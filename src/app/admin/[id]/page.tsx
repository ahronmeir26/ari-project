import { notFound } from "next/navigation";
import { RestaurantForm } from "@/components/admin/RestaurantForm";
import { loadFilterControls } from "@/lib/load-filters";
import { createServiceClient } from "@/lib/supabase/server";
import type { RestaurantWithImages } from "@/lib/types";

export const dynamic = "force-dynamic";

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function EditRestaurantPage({ params }: PageProps) {
  const { id } = await params;
  const supabase = createServiceClient();

  const [restaurantResult, filters, selectedResult] = await Promise.all([
    supabase
      .from("restaurants")
      .select("*, restaurant_images(*)")
      .eq("id", id)
      .maybeSingle(),
    loadFilterControls(supabase),
    supabase
      .from("restaurant_help_choose_options")
      .select("option_id")
      .eq("restaurant_id", id),
  ]);

  if (restaurantResult.error || !restaurantResult.data) {
    notFound();
  }

  const restaurant = restaurantResult.data as RestaurantWithImages;
  const selectedHelpChooseOptionIds =
    selectedResult.data?.map((row) => row.option_id) ?? [];

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
        helpChooseControls={filters.controls}
        selectedHelpChooseOptionIds={selectedHelpChooseOptionIds}
      />
    </div>
  );
}
