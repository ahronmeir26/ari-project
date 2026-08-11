import Link from "next/link";
import { HelpChooseAdmin } from "@/components/admin/HelpChooseAdmin";
import { createServiceClient } from "@/lib/supabase/server";
import type { HelpChooseConflict, HelpChooseOption } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function AdminHelpChoosePage() {
  const supabase = createServiceClient();
  const [optionsResult, conflictsResult] = await Promise.all([
    supabase
      .from("help_choose_options")
      .select("*")
      .order("sort_order", { ascending: true }),
    supabase.from("help_choose_conflicts").select("option_a_id, option_b_id"),
  ]);

  if (optionsResult.error) {
    return (
      <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
        <p className="font-medium">Could not load buttons</p>
        <p className="mt-1">{optionsResult.error.message}</p>
      </div>
    );
  }

  const options = (optionsResult.data ?? []) as HelpChooseOption[];
  const conflicts = (conflictsResult.data ?? []) as HelpChooseConflict[];

  return (
    <div className="space-y-4">
      <div>
        <Link href="/admin" className="text-sm text-stone-600">
          ← Restaurants
        </Link>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight">
          Help me choose
        </h1>
        <p className="mt-1 text-sm text-stone-600">
          Add, remove, reorder buttons, and set which ones conflict (selecting
          one turns the other off).
        </p>
      </div>

      <HelpChooseAdmin options={options} conflicts={conflicts} />
    </div>
  );
}
