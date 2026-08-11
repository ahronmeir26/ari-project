"use client";

import { useState } from "react";
import { toggleWithConflicts } from "@/lib/help-choose-conflicts";

type Option = {
  id: string;
  label: string;
};

type FoodPreferencePickerProps = {
  options: Option[];
  conflictMap?: Record<string, string[]>;
};

export function FoodPreferencePicker({
  options,
  conflictMap = {},
}: FoodPreferencePickerProps) {
  const [selected, setSelected] = useState<Set<string>>(new Set());

  function toggle(id: string) {
    setSelected((prev) => toggleWithConflicts(prev, id, conflictMap));
  }

  if (options.length === 0) {
    return (
      <p className="mt-8 rounded-2xl border border-dashed border-border-beige bg-surface/80 px-4 py-8 text-center text-muted-beige">
        No options yet. Add buttons in admin.
      </p>
    );
  }

  return (
    <div className="mt-8 grid grid-cols-2 gap-3">
      {options.map((option) => {
        const isSelected = selected.has(option.id);
        return (
          <button
            key={option.id}
            type="button"
            onClick={() => toggle(option.id)}
            aria-pressed={isSelected}
            className={`flex h-24 items-center justify-center rounded-2xl border px-3 text-center text-lg font-medium leading-snug transition-colors ${
              isSelected
                ? "border-foreground bg-foreground text-surface"
                : "border-border-beige bg-surface text-foreground shadow-[0_1px_0_rgba(58,52,44,0.04)]"
            }`}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
