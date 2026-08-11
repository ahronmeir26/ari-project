import type { HelpChooseConflict } from "@/lib/types";

/** Map each option id → ids that cannot be selected with it. */
export function buildConflictMap(
  conflicts: HelpChooseConflict[],
): Record<string, string[]> {
  const map: Record<string, string[]> = {};

  function add(from: string, to: string) {
    if (!map[from]) map[from] = [];
    if (!map[from].includes(to)) map[from].push(to);
  }

  for (const conflict of conflicts) {
    add(conflict.option_a_id, conflict.option_b_id);
    add(conflict.option_b_id, conflict.option_a_id);
  }

  return map;
}

/** Toggle an option, clearing any conflicting selections when turning on. */
export function toggleWithConflicts(
  selected: Set<string>,
  id: string,
  conflictMap: Record<string, string[]>,
): Set<string> {
  const next = new Set(selected);
  if (next.has(id)) {
    next.delete(id);
    return next;
  }

  next.add(id);
  for (const conflictId of conflictMap[id] ?? []) {
    next.delete(conflictId);
  }
  return next;
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
