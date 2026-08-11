"use client";

import { useState } from "react";
import { toggleWithConflicts } from "@/lib/help-choose-conflicts";
import type { HelpChooseOption } from "@/lib/types";

type HelpChooseApplicabilityProps = {
  options: HelpChooseOption[];
  defaultSelectedIds?: string[];
  conflictMap?: Record<string, string[]>;
};

export function HelpChooseApplicability({
  options,
  defaultSelectedIds = [],
  conflictMap = {},
}: HelpChooseApplicabilityProps) {
  const [selected, setSelected] = useState<Set<string>>(
    new Set(defaultSelectedIds),
  );

  function toggle(id: string) {
    setSelected((prev) => toggleWithConflicts(prev, id, conflictMap));
  }

  if (options.length === 0) {
    return (
      <p className="text-sm text-stone-600">
        No picker buttons yet.{" "}
        <a href="/admin/help-me-choose" className="font-medium underline">
          Add some in admin
        </a>
        .
      </p>
    );
  }

  return (
    <div className="space-y-3">
      <p className="text-sm text-stone-600">
        Tap which Help me choose buttons apply to this restaurant.
      </p>
      <div className="grid grid-cols-2 gap-3">
        {options.map((option) => {
          const isSelected = selected.has(option.id);
          return (
            <button
              key={option.id}
              type="button"
              onClick={() => toggle(option.id)}
              aria-pressed={isSelected}
              className={`flex h-20 items-center justify-center rounded-2xl border px-3 text-center text-base font-medium leading-snug transition-colors ${
                isSelected
                  ? "border-stone-900 bg-stone-900 text-white"
                  : "border-stone-300 bg-white text-stone-800"
              }`}
            >
              {option.label}
            </button>
          );
        })}
      </div>
      {Array.from(selected).map((id) => (
        <input key={id} type="hidden" name="help_choose_options" value={id} />
      ))}
    </div>
  );
}
