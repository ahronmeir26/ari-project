"use client";

import { useTransition } from "react";
import {
  createHelpChooseOption,
  deleteHelpChooseOption,
  moveHelpChooseOption,
  setHelpChooseConflicts,
  updateHelpChooseOption,
} from "@/lib/actions/help-choose";
import { buildConflictMap } from "@/lib/help-choose-conflicts";
import type { HelpChooseConflict, HelpChooseOption } from "@/lib/types";

type HelpChooseAdminProps = {
  options: HelpChooseOption[];
  conflicts: HelpChooseConflict[];
};

export function HelpChooseAdmin({ options, conflicts }: HelpChooseAdminProps) {
  const [isPending, startTransition] = useTransition();
  const conflictMap = buildConflictMap(conflicts);

  return (
    <div className="space-y-8">
      <form
        action={(formData) => {
          startTransition(async () => {
            await createHelpChooseOption(formData);
          });
        }}
        className="flex gap-2"
      >
        <input
          name="label"
          required
          placeholder="New button label"
          className="min-w-0 flex-1 rounded-xl border border-stone-300 bg-white px-3 py-2.5 text-base outline-none focus:border-stone-500"
        />
        <button
          type="submit"
          disabled={isPending}
          className="shrink-0 rounded-xl bg-stone-900 px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-60"
        >
          Add
        </button>
      </form>

      {options.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-stone-300 bg-white p-6 text-center text-sm text-stone-600">
          No buttons yet. Add one above.
        </p>
      ) : (
        <ul className="space-y-3">
          {options.map((option, index) => {
            const currentConflicts = conflictMap[option.id] ?? [];
            return (
              <li
                key={option.id}
                className="space-y-3 rounded-2xl border border-stone-200 bg-white p-3"
              >
                <div className="flex items-center gap-2">
                  <div className="flex shrink-0 flex-col gap-0.5">
                    <button
                      type="button"
                      disabled={isPending || index === 0}
                      onClick={() => {
                        startTransition(async () => {
                          await moveHelpChooseOption(option.id, "up");
                        });
                      }}
                      className="rounded-lg bg-stone-100 px-2 py-1 text-xs font-medium text-stone-700 disabled:opacity-30"
                      aria-label="Move up"
                    >
                      ↑
                    </button>
                    <button
                      type="button"
                      disabled={isPending || index === options.length - 1}
                      onClick={() => {
                        startTransition(async () => {
                          await moveHelpChooseOption(option.id, "down");
                        });
                      }}
                      className="rounded-lg bg-stone-100 px-2 py-1 text-xs font-medium text-stone-700 disabled:opacity-30"
                      aria-label="Move down"
                    >
                      ↓
                    </button>
                  </div>

                  <form
                    action={(formData) => {
                      startTransition(async () => {
                        await updateHelpChooseOption(option.id, formData);
                      });
                    }}
                    className="flex min-w-0 flex-1 gap-2"
                  >
                    <input
                      name="label"
                      defaultValue={option.label}
                      required
                      className="min-w-0 flex-1 rounded-lg border border-stone-200 px-3 py-2 text-base outline-none focus:border-stone-500"
                    />
                    <button
                      type="submit"
                      disabled={isPending}
                      className="shrink-0 rounded-lg bg-stone-100 px-3 py-2 text-xs font-semibold text-stone-700 disabled:opacity-60"
                    >
                      Save
                    </button>
                  </form>

                  <button
                    type="button"
                    disabled={isPending}
                    onClick={() => {
                      if (!confirm(`Remove “${option.label}”?`)) return;
                      startTransition(async () => {
                        await deleteHelpChooseOption(option.id);
                      });
                    }}
                    className="shrink-0 rounded-lg bg-red-50 px-3 py-2 text-xs font-semibold text-red-700 disabled:opacity-60"
                  >
                    Delete
                  </button>
                </div>

                <div>
                  <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-stone-500">
                    Conflicts with (selecting this turns those off)
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {options
                      .filter((other) => other.id !== option.id)
                      .map((other) => {
                        const active = currentConflicts.includes(other.id);
                        return (
                          <button
                            key={other.id}
                            type="button"
                            disabled={isPending}
                            onClick={() => {
                              const next = active
                                ? currentConflicts.filter((id) => id !== other.id)
                                : [...currentConflicts, other.id];
                              startTransition(async () => {
                                await setHelpChooseConflicts(option.id, next);
                              });
                            }}
                            className={`rounded-full px-3 py-1.5 text-xs font-medium ${
                              active
                                ? "bg-stone-900 text-white"
                                : "bg-stone-100 text-stone-700"
                            }`}
                          >
                            {other.label}
                          </button>
                        );
                      })}
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
