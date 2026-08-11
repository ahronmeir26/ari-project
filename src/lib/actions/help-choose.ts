"use server";

import { revalidatePath } from "next/cache";
import { normalizeConflictPair } from "@/lib/help-choose-conflicts";
import { createServiceClient } from "@/lib/supabase/server";

export async function createHelpChooseOption(formData: FormData) {
  const label = String(formData.get("label") ?? "").trim();
  if (!label) throw new Error("Label is required");

  const supabase = createServiceClient();
  const { data: last } = await supabase
    .from("help_choose_options")
    .select("sort_order")
    .order("sort_order", { ascending: false })
    .limit(1);

  const sortOrder = (last?.[0]?.sort_order ?? -1) + 1;

  const { error } = await supabase
    .from("help_choose_options")
    .insert({ label, sort_order: sortOrder });

  if (error) throw new Error(error.message);

  revalidatePath("/help-me-choose");
  revalidatePath("/admin/help-me-choose");
  revalidatePath("/admin/new");
}

export async function deleteHelpChooseOption(id: string) {
  const supabase = createServiceClient();
  const { error } = await supabase
    .from("help_choose_options")
    .delete()
    .eq("id", id);

  if (error) throw new Error(error.message);

  revalidatePath("/help-me-choose");
  revalidatePath("/admin/help-me-choose");
  revalidatePath("/admin/new");
}

export async function moveHelpChooseOption(id: string, direction: "up" | "down") {
  const supabase = createServiceClient();
  const { data: options, error: fetchError } = await supabase
    .from("help_choose_options")
    .select("id, sort_order")
    .order("sort_order", { ascending: true });

  if (fetchError || !options) throw new Error(fetchError?.message ?? "Failed to load options");

  const index = options.findIndex((o) => o.id === id);
  if (index === -1) throw new Error("Option not found");

  const swapIndex = direction === "up" ? index - 1 : index + 1;
  if (swapIndex < 0 || swapIndex >= options.length) return;

  const current = options[index];
  const swap = options[swapIndex];

  const { error: e1 } = await supabase
    .from("help_choose_options")
    .update({ sort_order: swap.sort_order })
    .eq("id", current.id);

  if (e1) throw new Error(e1.message);

  const { error: e2 } = await supabase
    .from("help_choose_options")
    .update({ sort_order: current.sort_order })
    .eq("id", swap.id);

  if (e2) throw new Error(e2.message);

  revalidatePath("/help-me-choose");
  revalidatePath("/admin/help-me-choose");
}

export async function updateHelpChooseOption(id: string, formData: FormData) {
  const label = String(formData.get("label") ?? "").trim();
  if (!label) throw new Error("Label is required");

  const supabase = createServiceClient();
  const { error } = await supabase
    .from("help_choose_options")
    .update({ label })
    .eq("id", id);

  if (error) throw new Error(error.message);

  revalidatePath("/help-me-choose");
  revalidatePath("/admin/help-me-choose");
  revalidatePath("/admin/new");
}

export async function setHelpChooseConflicts(
  optionId: string,
  conflictIds: string[],
) {
  const supabase = createServiceClient();

  const { error: deleteA } = await supabase
    .from("help_choose_conflicts")
    .delete()
    .eq("option_a_id", optionId);
  if (deleteA) throw new Error(deleteA.message);

  const { error: deleteB } = await supabase
    .from("help_choose_conflicts")
    .delete()
    .eq("option_b_id", optionId);
  if (deleteB) throw new Error(deleteB.message);

  const rows = conflictIds
    .map((otherId) => normalizeConflictPair(optionId, otherId))
    .filter((row): row is { option_a_id: string; option_b_id: string } => row != null);

  if (rows.length) {
    const { error } = await supabase.from("help_choose_conflicts").insert(rows);
    if (error) throw new Error(error.message);
  }

  revalidatePath("/help-me-choose");
  revalidatePath("/admin/help-me-choose");
  revalidatePath("/admin/new");
}
