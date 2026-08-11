import Link from "next/link";
import { BottomNav } from "@/components/BottomNav";
import { FoodPreferencePicker } from "@/components/FoodPreferencePicker";
import { buildConflictMap } from "@/lib/help-choose-conflicts";
import { createServiceClient } from "@/lib/supabase/server";
import type { HelpChooseConflict, HelpChooseOption } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function HelpMeChoosePage() {
  const supabase = createServiceClient();
  const [optionsResult, conflictsResult] = await Promise.all([
    supabase
      .from("help_choose_options")
      .select("id, label")
      .order("sort_order", { ascending: true }),
    supabase.from("help_choose_conflicts").select("option_a_id, option_b_id"),
  ]);

  const options = (optionsResult.data ?? []) as Pick<
    HelpChooseOption,
    "id" | "label"
  >[];
  const conflictMap = buildConflictMap(
    (conflictsResult.data ?? []) as HelpChooseConflict[],
  );

  return (
    <div className="mx-auto flex min-h-full max-w-lg flex-col bg-background px-4 pb-24 pt-10 text-foreground">
      <Link href="/" className="text-sm font-medium text-muted-beige">
        ← Back
      </Link>

      <h1 className="mt-6 font-[family-name:var(--font-fraunces)] text-[2rem] leading-tight font-medium tracking-tight">
        What would you like to eat?
      </h1>

      <FoodPreferencePicker options={options} conflictMap={conflictMap} />

      <BottomNav />
    </div>
  );
}
