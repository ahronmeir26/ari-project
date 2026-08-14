import type {
  HelpChooseControl,
  HelpChooseControlWithOptions,
  HelpChooseOption,
} from "@/lib/types";

export function assembleControls(
  controls: HelpChooseControl[],
  options: HelpChooseOption[],
): HelpChooseControlWithOptions[] {
  const byControl = new Map<string, HelpChooseOption[]>();
  for (const option of options) {
    const list = byControl.get(option.control_id) ?? [];
    list.push(option);
    byControl.set(option.control_id, list);
  }

  return [...controls]
    .sort((a, b) => a.sort_order - b.sort_order)
    .map((control) => ({
      ...control,
      options: (byControl.get(control.id) ?? []).sort(
        (a, b) => a.sort_order - b.sort_order || a.label.localeCompare(b.label),
      ),
    }));
}

export function normalizeNestedControls(
  rows: Array<HelpChooseControl & { help_choose_options?: HelpChooseOption[] }>,
): HelpChooseControlWithOptions[] {
  return assembleControls(
    rows.map(({ help_choose_options: _options, ...control }) => control),
    rows.flatMap((row) => row.help_choose_options ?? []),
  );
}

/** Toggle a filter, keeping exclusive groups to one selected option. */
export function toggleFilterSelection(
  selected: Set<string>,
  optionId: string,
  controls: HelpChooseControlWithOptions[],
): Set<string> {
  const control = controls.find((item) =>
    item.options.some((option) => option.id === optionId),
  );
  if (!control) return selected;

  const next = new Set(selected);
  if (control.kind === "toggle") {
    if (next.has(optionId)) next.delete(optionId);
    else next.add(optionId);
    return next;
  }

  if (next.has(optionId)) {
    next.delete(optionId);
    return next;
  }

  for (const option of control.options) {
    next.delete(option.id);
  }
  next.add(optionId);
  return next;
}

export function restaurantMatchesFilters(
  restaurantOptionIds: string[],
  selected: Set<string>,
  controls: HelpChooseControlWithOptions[],
): boolean {
  if (selected.size === 0) return true;

  const tagged = new Set(restaurantOptionIds);
  for (const control of controls) {
    const selectedHere = control.options.filter((option) =>
      selected.has(option.id),
    );
    if (selectedHere.length === 0) continue;
    if (!selectedHere.every((option) => tagged.has(option.id))) return false;
  }
  return true;
}

export function parseChoiceLabels(formData: FormData, count: number): string[] {
  const labels: string[] = [];
  for (let i = 0; i < count; i++) {
    const label = String(formData.get(`label_${i}`) ?? "").trim();
    if (label) labels.push(label);
  }
  return labels;
}

export function normalizeConflictPair(
  a: string,
  b: string,
): { option_a_id: string; option_b_id: string } | null {
  if (a === b) return null;
  return a < b
    ? { option_a_id: a, option_b_id: b }
    : { option_a_id: b, option_b_id: a };
}
