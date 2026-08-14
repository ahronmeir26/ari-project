"use client";

import { useState } from "react";
import { toggleFilterSelection } from "@/lib/help-choose-controls";
import type { HelpChooseControlWithOptions } from "@/lib/types";

type HelpChooseApplicabilityProps = {
  controls: HelpChooseControlWithOptions[];
  defaultSelectedIds?: string[];
};

export function HelpChooseApplicability({
  controls,
  defaultSelectedIds = [],
}: HelpChooseApplicabilityProps) {
  const [selected, setSelected] = useState<Set<string>>(
    new Set(defaultSelectedIds),
  );

  function toggle(id: string) {
    setSelected((prev) => toggleFilterSelection(prev, id, controls));
  }

  if (controls.length === 0) {
    return (
      <p className="text-sm text-stone-600">
        No filters yet.{" "}
        <a href="/admin/help-me-choose" className="font-medium underline">
          Manage filters
        </a>
        .
      </p>
    );
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-stone-600">
        Tap which filters apply to this restaurant. One-of-N groups can only
        have one choice.
      </p>
      {controls.map((control) => (
        <div key={control.id} className="space-y-2">
          {control.kind === "exclusive" ? (
            <p className="text-xs font-semibold uppercase tracking-wide text-stone-500">
              One of {control.options.length}
            </p>
          ) : null}
          <div
            className={
              control.kind === "exclusive"
                ? "flex overflow-hidden rounded-2xl border border-stone-300"
                : "grid grid-cols-2 gap-3"
            }
          >
            {control.options.map((option, index) => {
              const isSelected = selected.has(option.id);
              return (
                <button
                  key={option.id}
                  type="button"
                  onClick={() => toggle(option.id)}
                  aria-pressed={isSelected}
                  className={
                    control.kind === "exclusive"
                      ? `flex h-14 min-w-0 flex-1 items-center justify-center px-3 text-center text-sm font-medium leading-snug transition-colors ${
                          isSelected
                            ? "bg-stone-900 text-white"
                            : "bg-white text-stone-600"
                        } ${index > 0 ? "border-l border-stone-300" : ""}`
                      : `flex h-16 items-center justify-center rounded-2xl border px-3 text-center text-base font-medium leading-snug transition-colors ${
                          isSelected
                            ? "border-stone-900 bg-stone-900 text-white"
                            : "border-stone-300 bg-white text-stone-500"
                        }`
                  }
                >
                  {option.label}
                </button>
              );
            })}
          </div>
        </div>
      ))}
      {Array.from(selected).map((id) => (
        <input key={id} type="hidden" name="help_choose_options" value={id} />
      ))}
    </div>
  );
}
