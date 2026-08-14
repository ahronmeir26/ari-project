"use server";

import { revalidatePath } from "next/cache";
import { normalizeConflictPair, parseChoiceLabels } from "@/lib/help-choose-controls";
import { loadFilterControls } from "@/lib/load-filters";
import { createServiceClient } from "@/lib/supabase/server";

function revalidateFilters() {
  revalidatePath("/");
  revalidatePath("/admin");
  revalidatePath("/admin/help-me-choose");
  revalidatePath("/admin/new");
}

export async function updateProximityWeight(formData: FormData) {
  const raw = Number(formData.get("proximity_weight"));
  if (!Number.isFinite(raw)) throw new Error("Proximity weight is required");
  const proximity_weight = Math.min(1, Math.max(0, raw / 100));

  const supabase = createServiceClient();
  const { error } = await supabase
    .from("app_settings")
    .upsert({ id: 1, proximity_weight, updated_at: new Date().toISOString() });

  if (error) throw new Error(error.message);
  revalidateFilters();
}

async function hasControlsSchema() {
  const supabase = createServiceClient();
  const { error } = await supabase
    .from("help_choose_controls")
    .select("id")
    .limit(1);
  return !error;
}

async function nextOptionSortOrder() {
  const supabase = createServiceClient();
  const { data } = await supabase
    .from("help_choose_options")
    .select("sort_order")
    .order("sort_order", { ascending: false })
    .limit(1);
  return (data?.[0]?.sort_order ?? -1) + 1;
}

async function insertConflictClique(ids: string[]) {
  const supabase = createServiceClient();
  const rows = [];
  for (let i = 0; i < ids.length; i++) {
    for (let j = i + 1; j < ids.length; j++) {
      const pair = normalizeConflictPair(ids[i], ids[j]);
      if (pair) rows.push(pair);
    }
  }
  if (!rows.length) return;
  const { error } = await supabase.from("help_choose_conflicts").insert(rows);
  if (error) throw new Error(error.message);
}

async function nextControlSortOrder() {
  const supabase = createServiceClient();
  const { data } = await supabase
    .from("help_choose_controls")
    .select("sort_order")
    .order("sort_order", { ascending: false })
    .limit(1);
  return (data?.[0]?.sort_order ?? -1) + 1;
}

async function syncControlKind(controlId: string) {
  const supabase = createServiceClient();
  const { data: options, error } = await supabase
    .from("help_choose_options")
    .select("id")
    .eq("control_id", controlId);

  if (error) throw new Error(error.message);

  if (!options?.length) {
    const { error: deleteError } = await supabase
      .from("help_choose_controls")
      .delete()
      .eq("id", controlId);
    if (deleteError) throw new Error(deleteError.message);
    return;
  }

  const kind = options.length > 1 ? "exclusive" : "toggle";
  const { error: updateError } = await supabase
    .from("help_choose_controls")
    .update({ kind })
    .eq("id", controlId);
  if (updateError) throw new Error(updateError.message);
}

export async function createToggleControl(formData: FormData) {
  const label = String(formData.get("label") ?? "").trim();
  if (!label) throw new Error("Label is required");

  const supabase = createServiceClient();

  if (!(await hasControlsSchema())) {
    const { error } = await supabase.from("help_choose_options").insert({
      label,
      sort_order: await nextOptionSortOrder(),
    });
    if (error) throw new Error(error.message);
    revalidateFilters();
    return;
  }
  const { data: control, error: controlError } = await supabase
    .from("help_choose_controls")
    .insert({
      kind: "toggle",
      sort_order: await nextControlSortOrder(),
    })
    .select("id")
    .single();

  if (controlError || !control) {
    throw new Error(controlError?.message ?? "Failed to create filter");
  }

  const { error } = await supabase.from("help_choose_options").insert({
    control_id: control.id,
    label,
    sort_order: 0,
  });

  if (error) throw new Error(error.message);
  revalidateFilters();
}

export async function createExclusiveControl(formData: FormData) {
  const count = Number(formData.get("choice_count") ?? 2);
  if (count < 2 || count > 3) {
    throw new Error("Exclusive controls must have 2 or 3 choices");
  }

  const labels = parseChoiceLabels(formData, count);
  if (labels.length !== count) {
    throw new Error(`Enter ${count} choice labels`);
  }

  const supabase = createServiceClient();

  if (!(await hasControlsSchema())) {
    const start = await nextOptionSortOrder();
    const { data, error } = await supabase
      .from("help_choose_options")
      .insert(
        labels.map((label, index) => ({
          label,
          sort_order: start + index,
        })),
      )
      .select("id");
    if (error || !data) throw new Error(error?.message ?? "Failed to create control");
    await insertConflictClique(data.map((row) => row.id));
    revalidateFilters();
    return;
  }
  const { data: control, error: controlError } = await supabase
    .from("help_choose_controls")
    .insert({
      kind: "exclusive",
      name: labels.join(" / "),
      sort_order: await nextControlSortOrder(),
    })
    .select("id")
    .single();

  if (controlError || !control) {
    throw new Error(controlError?.message ?? "Failed to create control");
  }

  const { error } = await supabase.from("help_choose_options").insert(
    labels.map((label, index) => ({
      control_id: control.id,
      label,
      sort_order: index,
    })),
  );

  if (error) throw new Error(error.message);
  revalidateFilters();
}

export async function addOptionToControl(controlId: string, formData: FormData) {
  const label = String(formData.get("label") ?? "").trim();
  if (!label) throw new Error("Label is required");

  const supabase = createServiceClient();

  if (!(await hasControlsSchema())) {
    const { controls } = await loadFilterControls(supabase);
    const control = controls.find((item) => item.id === controlId);
    if (!control) throw new Error("Filter not found");
    const siblingIds = control.options.map((option) => option.id);
    const { data, error } = await supabase
      .from("help_choose_options")
      .insert({
        label,
        sort_order: await nextOptionSortOrder(),
      })
      .select("id")
      .single();
    if (error || !data) throw new Error(error?.message ?? "Failed to add choice");
    const rows = siblingIds
      .map((siblingId) => normalizeConflictPair(siblingId, data.id))
      .filter(
        (row): row is { option_a_id: string; option_b_id: string } => row != null,
      );
    if (rows.length) {
      const { error: conflictError } = await supabase
        .from("help_choose_conflicts")
        .insert(rows);
      if (conflictError) throw new Error(conflictError.message);
    }
    revalidateFilters();
    return;
  }
  const { data: last } = await supabase
    .from("help_choose_options")
    .select("sort_order")
    .eq("control_id", controlId)
    .order("sort_order", { ascending: false })
    .limit(1);

  const { error } = await supabase.from("help_choose_options").insert({
    control_id: controlId,
    label,
    sort_order: (last?.[0]?.sort_order ?? -1) + 1,
  });

  if (error) throw new Error(error.message);
  await syncControlKind(controlId);
  revalidateFilters();
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
  revalidateFilters();
}

export async function deleteHelpChooseOption(id: string) {
  const supabase = createServiceClient();

  if (!(await hasControlsSchema())) {
    const { error } = await supabase.from("help_choose_options").delete().eq("id", id);
    if (error) throw new Error(error.message);
    revalidateFilters();
    return;
  }
  const { data: option, error: fetchError } = await supabase
    .from("help_choose_options")
    .select("id, control_id")
    .eq("id", id)
    .single();

  if (fetchError || !option) {
    throw new Error(fetchError?.message ?? "Option not found");
  }

  const { error } = await supabase
    .from("help_choose_options")
    .delete()
    .eq("id", id);
  if (error) throw new Error(error.message);

  await syncControlKind(option.control_id);
  revalidateFilters();
}

export async function deleteHelpChooseControl(id: string) {
  const supabase = createServiceClient();

  if (!(await hasControlsSchema())) {
    const { controls } = await loadFilterControls(supabase);
    const control = controls.find((item) => item.id === id);
    if (!control) throw new Error("Filter not found");
    const { error } = await supabase
      .from("help_choose_options")
      .delete()
      .in(
        "id",
        control.options.map((option) => option.id),
      );
    if (error) throw new Error(error.message);
    revalidateFilters();
    return;
  }
  const { error } = await supabase
    .from("help_choose_controls")
    .delete()
    .eq("id", id);
  if (error) throw new Error(error.message);
  revalidateFilters();
}

export async function moveHelpChooseControl(
  id: string,
  direction: "up" | "down",
) {
  const supabase = createServiceClient();

  if (!(await hasControlsSchema())) {
    const { controls } = await loadFilterControls(supabase);
    const index = controls.findIndex((control) => control.id === id);
    const swapIndex = direction === "up" ? index - 1 : index + 1;
    if (index === -1 || swapIndex < 0 || swapIndex >= controls.length) return;
    const next = [...controls];
    const [moved] = next.splice(index, 1);
    next.splice(swapIndex, 0, moved);
    let sort = 0;
    for (const control of next) {
      for (const option of control.options) {
        const { error } = await supabase
          .from("help_choose_options")
          .update({ sort_order: sort })
          .eq("id", option.id);
        if (error) throw new Error(error.message);
        sort += 1;
      }
    }
    revalidateFilters();
    return;
  }
  const { data: controls, error: fetchError } = await supabase
    .from("help_choose_controls")
    .select("id, sort_order")
    .order("sort_order", { ascending: true });

  if (fetchError || !controls) {
    throw new Error(fetchError?.message ?? "Failed to load filters");
  }

  const index = controls.findIndex((control) => control.id === id);
  if (index === -1) throw new Error("Filter not found");

  const swapIndex = direction === "up" ? index - 1 : index + 1;
  if (swapIndex < 0 || swapIndex >= controls.length) return;

  const current = controls[index];
  const swap = controls[swapIndex];

  const { error: firstError } = await supabase
    .from("help_choose_controls")
    .update({ sort_order: swap.sort_order })
    .eq("id", current.id);
  if (firstError) throw new Error(firstError.message);

  const { error: secondError } = await supabase
    .from("help_choose_controls")
    .update({ sort_order: current.sort_order })
    .eq("id", swap.id);
  if (secondError) throw new Error(secondError.message);

  revalidateFilters();
}

export async function moveHelpChooseOption(
  id: string,
  direction: "up" | "down",
) {
  const supabase = createServiceClient();

  if (!(await hasControlsSchema())) {
    const { controls } = await loadFilterControls(supabase);
    const control = controls.find((item) =>
      item.options.some((option) => option.id === id),
    );
    if (!control) throw new Error("Option not found");
    const options = control.options;
    const index = options.findIndex((item) => item.id === id);
    const swapIndex = direction === "up" ? index - 1 : index + 1;
    if (swapIndex < 0 || swapIndex >= options.length) return;
    const current = options[index];
    const swap = options[swapIndex];
    const { error: firstError } = await supabase
      .from("help_choose_options")
      .update({ sort_order: swap.sort_order })
      .eq("id", current.id);
    if (firstError) throw new Error(firstError.message);
    const { error: secondError } = await supabase
      .from("help_choose_options")
      .update({ sort_order: current.sort_order })
      .eq("id", swap.id);
    if (secondError) throw new Error(secondError.message);
    revalidateFilters();
    return;
  }
  const { data: option, error: fetchError } = await supabase
    .from("help_choose_options")
    .select("id, control_id")
    .eq("id", id)
    .single();

  if (fetchError || !option) {
    throw new Error(fetchError?.message ?? "Option not found");
  }

  const { data: options, error: listError } = await supabase
    .from("help_choose_options")
    .select("id, sort_order")
    .eq("control_id", option.control_id)
    .order("sort_order", { ascending: true });

  if (listError || !options) {
    throw new Error(listError?.message ?? "Failed to load choices");
  }

  const index = options.findIndex((item) => item.id === id);
  const swapIndex = direction === "up" ? index - 1 : index + 1;
  if (swapIndex < 0 || swapIndex >= options.length) return;

  const current = options[index];
  const swap = options[swapIndex];

  const { error: firstError } = await supabase
    .from("help_choose_options")
    .update({ sort_order: swap.sort_order })
    .eq("id", current.id);
  if (firstError) throw new Error(firstError.message);

  const { error: secondError } = await supabase
    .from("help_choose_options")
    .update({ sort_order: current.sort_order })
    .eq("id", swap.id);
  if (secondError) throw new Error(secondError.message);

  revalidateFilters();
}
