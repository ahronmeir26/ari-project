import {
  assembleControls,
  normalizeNestedControls,
} from "@/lib/help-choose-controls";
import type {
  HelpChooseControl,
  HelpChooseControlWithOptions,
  HelpChooseOption,
} from "@/lib/types";
import type { SupabaseClient } from "@supabase/supabase-js";

type ConflictRow = { option_a_id: string; option_b_id: string };
type OptionRow = {
  id: string;
  label: string;
  sort_order: number;
  created_at: string;
  control_id?: string;
};

function neighborsOf(conflicts: ConflictRow[]): Map<string, Set<string>> {
  const neighbors = new Map<string, Set<string>>();
  function add(from: string, to: string) {
    const set = neighbors.get(from) ?? new Set<string>();
    set.add(to);
    neighbors.set(from, set);
  }
  for (const conflict of conflicts) {
    add(conflict.option_a_id, conflict.option_b_id);
    add(conflict.option_b_id, conflict.option_a_id);
  }
  return neighbors;
}

/** Isolated 2-choice pairs, 3-choice cliques, plus Fleishigs/Milchigs by label. */
export function controlsFromLegacy(
  options: OptionRow[],
  conflicts: ConflictRow[],
): HelpChooseControlWithOptions[] {
  const byId = new Map(options.map((option) => [option.id, option]));
  const neighbors = neighborsOf(conflicts);
  const grouped = new Set<string>();
  const groups: string[][] = [];

  const fleishigs = options.find((option) => option.label === "Fleishigs");
  const milchigs = options.find((option) => option.label === "Milchigs");
  if (fleishigs && milchigs) {
    groups.push([fleishigs.id, milchigs.id]);
    grouped.add(fleishigs.id);
    grouped.add(milchigs.id);
  }

  for (const option of options) {
    if (grouped.has(option.id)) continue;
    const next = neighbors.get(option.id);
    if (!next || next.size !== 1) continue;
    const otherId = [...next][0];
    if (grouped.has(otherId)) continue;
    if ((neighbors.get(otherId)?.size ?? 0) !== 1) continue;
    groups.push([option.id, otherId]);
    grouped.add(option.id);
    grouped.add(otherId);
  }

  for (const option of options) {
    if (grouped.has(option.id)) continue;
    const next = neighbors.get(option.id);
    if (!next || next.size !== 2) continue;
    const [b, c] = [...next];
    if (grouped.has(b) || grouped.has(c)) continue;
    const nb = neighbors.get(b);
    const nc = neighbors.get(c);
    if (
      nb?.size === 2 &&
      nc?.size === 2 &&
      nb.has(option.id) &&
      nb.has(c) &&
      nc.has(option.id) &&
      nc.has(b)
    ) {
      groups.push([option.id, b, c]);
      grouped.add(option.id);
      grouped.add(b);
      grouped.add(c);
    }
  }

  const syntheticControls: HelpChooseControl[] = [];
  const syntheticOptions: HelpChooseOption[] = [];

  for (const memberIds of groups) {
    const members = memberIds
      .map((id) => byId.get(id))
      .filter((row): row is OptionRow => Boolean(row))
      .sort((a, b) => a.sort_order - b.sort_order);
    if (members.length < 2) continue;
    const controlId = members[0].id;
    syntheticControls.push({
      id: controlId,
      kind: "exclusive",
      name: members.map((member) => member.label).join(" / "),
      sort_order: members[0].sort_order,
      created_at: members[0].created_at,
    });
    for (const [index, member] of members.entries()) {
      syntheticOptions.push({
        id: member.id,
        control_id: controlId,
        label: member.label,
        sort_order: index,
        created_at: member.created_at,
      });
    }
  }

  for (const option of options) {
    if (grouped.has(option.id)) continue;
    syntheticControls.push({
      id: option.id,
      kind: "toggle",
      name: null,
      sort_order: option.sort_order,
      created_at: option.created_at,
    });
    syntheticOptions.push({
      id: option.id,
      control_id: option.id,
      label: option.label,
      sort_order: 0,
      created_at: option.created_at,
    });
  }

  return assembleControls(syntheticControls, syntheticOptions);
}

export async function loadFilterControls(
  supabase: SupabaseClient,
): Promise<{
  controls: HelpChooseControlWithOptions[];
  mode: "controls" | "legacy";
  error: string | null;
}> {
  const controlsResult = await supabase
    .from("help_choose_controls")
    .select("*, help_choose_options(*)")
    .order("sort_order", { ascending: true });

  if (!controlsResult.error) {
    return {
      controls: normalizeNestedControls(
        (controlsResult.data ?? []) as Array<
          HelpChooseControl & { help_choose_options?: HelpChooseOption[] }
        >,
      ),
      mode: "controls",
      error: null,
    };
  }

  const [optionsResult, conflictsResult] = await Promise.all([
    supabase
      .from("help_choose_options")
      .select("id, label, sort_order, created_at")
      .order("sort_order", { ascending: true }),
    supabase.from("help_choose_conflicts").select("option_a_id, option_b_id"),
  ]);

  if (optionsResult.error) {
    return {
      controls: [],
      mode: "legacy",
      error: optionsResult.error.message,
    };
  }

  return {
    controls: controlsFromLegacy(
      (optionsResult.data ?? []) as OptionRow[],
      (conflictsResult.data ?? []) as ConflictRow[],
    ),
    mode: "legacy",
    error: null,
  };
}
