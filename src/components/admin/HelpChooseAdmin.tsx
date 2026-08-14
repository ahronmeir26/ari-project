"use client";

import { useState, useTransition } from "react";
import {
  addOptionToControl,
  createExclusiveControl,
  createToggleControl,
  deleteHelpChooseControl,
  deleteHelpChooseOption,
  moveHelpChooseControl,
  moveHelpChooseOption,
  updateHelpChooseOption,
  updateProximityWeight,
} from "@/lib/actions/help-choose";
import type { HelpChooseControlWithOptions } from "@/lib/types";

type HelpChooseAdminProps = {
  controls: HelpChooseControlWithOptions[];
  proximityWeight: number;
};

export function HelpChooseAdmin({
  controls,
  proximityWeight,
}: HelpChooseAdminProps) {
  const [isPending, startTransition] = useTransition();
  const [choiceCount, setChoiceCount] = useState<2 | 3>(2);
  const [weight, setWeight] = useState(Math.round(proximityWeight * 100));

  return (
    <div className="space-y-8">
      <section className="space-y-3 rounded-2xl border border-stone-200 bg-white p-4">
        <div>
          <h2 className="text-sm font-semibold uppercase tracking-wide text-stone-500">
            Proximity weight
          </h2>
          <p className="mt-1 text-sm text-stone-600">
            The list is shuffled, not strictly nearest-first. Nearby places are
            likelier near the top; a 60‑minute trip stays far down.
          </p>
        </div>
        <form
          action={(formData) => {
            startTransition(async () => {
              await updateProximityWeight(formData);
            });
          }}
          className="space-y-3"
        >
          <div className="flex items-center justify-between text-xs font-medium text-stone-500">
            <span>More random</span>
            <span>{weight}%</span>
            <span>More nearby</span>
          </div>
          <input
            type="range"
            name="proximity_weight"
            min={0}
            max={100}
            step={1}
            value={weight}
            onChange={(e) => setWeight(Number(e.target.value))}
            className="w-full accent-stone-900"
          />
          <button
            type="submit"
            disabled={isPending}
            className="rounded-xl bg-stone-900 px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
          >
            Save weight
          </button>
        </form>
      </section>

      <section className="space-y-3">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-stone-500">
          Add a filter
        </h2>
        <form
          action={(formData) => {
            startTransition(async () => {
              await createToggleControl(formData);
            });
          }}
          className="flex gap-2"
        >
          <input
            name="label"
            required
            placeholder="Single filter, e.g. Sit Down"
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
      </section>

      <section className="space-y-3">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-stone-500">
          Add a one-of-N control
        </h2>
        <div className="flex gap-2">
          {([2, 3] as const).map((count) => (
            <button
              key={count}
              type="button"
              onClick={() => setChoiceCount(count)}
              className={`rounded-full px-3 py-1.5 text-xs font-semibold ${
                choiceCount === count
                  ? "bg-stone-900 text-white"
                  : "bg-stone-100 text-stone-700"
              }`}
            >
              One of {count}
            </button>
          ))}
        </div>
        <form
          action={(formData) => {
            startTransition(async () => {
              await createExclusiveControl(formData);
            });
          }}
          className="space-y-2"
        >
          <input type="hidden" name="choice_count" value={choiceCount} />
          {Array.from({ length: choiceCount }, (_, index) => (
            <input
              key={`${choiceCount}-${index}`}
              name={`label_${index}`}
              required
              placeholder={
                index === 0
                  ? "Choice 1, e.g. Meat"
                  : index === 1
                    ? "Choice 2, e.g. Other"
                    : `Choice ${index + 1}`
              }
              className="w-full rounded-xl border border-stone-300 bg-white px-3 py-2.5 text-base outline-none focus:border-stone-500"
            />
          ))}
          <button
            type="submit"
            disabled={isPending}
            className="rounded-xl bg-stone-900 px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-60"
          >
            Add control
          </button>
        </form>
      </section>

      {controls.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-stone-300 bg-white p-6 text-center text-sm text-stone-600">
          No filters yet. Add a single filter or a one-of-N control above.
        </p>
      ) : (
        <ul className="space-y-3">
          {controls.map((control, index) => (
            <li
              key={control.id}
              className="space-y-3 rounded-2xl border border-stone-200 bg-white p-3"
            >
              <div className="flex items-center gap-2">
                <div className="flex shrink-0 flex-col gap-0.5">
                  <button
                    type="button"
                    disabled={isPending || index === 0}
                    onClick={() => {
                      startTransition(async () => {
                        await moveHelpChooseControl(control.id, "up");
                      });
                    }}
                    className="rounded-lg bg-stone-100 px-2 py-1 text-xs font-medium text-stone-700 disabled:opacity-30"
                    aria-label="Move up"
                  >
                    ↑
                  </button>
                  <button
                    type="button"
                    disabled={isPending || index === controls.length - 1}
                    onClick={() => {
                      startTransition(async () => {
                        await moveHelpChooseControl(control.id, "down");
                      });
                    }}
                    className="rounded-lg bg-stone-100 px-2 py-1 text-xs font-medium text-stone-700 disabled:opacity-30"
                    aria-label="Move down"
                  >
                    ↓
                  </button>
                </div>
                <p className="min-w-0 flex-1 text-sm font-semibold text-stone-800">
                  {control.kind === "exclusive"
                    ? `One of ${control.options.length}`
                    : "Filter"}
                </p>
                <button
                  type="button"
                  disabled={isPending}
                  onClick={() => {
                    const label =
                      control.options.map((option) => option.label).join(" / ") ||
                      "this filter";
                    if (!confirm(`Remove “${label}”?`)) return;
                    startTransition(async () => {
                      await deleteHelpChooseControl(control.id);
                    });
                  }}
                  className="shrink-0 rounded-lg bg-red-50 px-3 py-2 text-xs font-semibold text-red-700 disabled:opacity-60"
                >
                  Delete
                </button>
              </div>

              <ul className="space-y-2">
                {control.options.map((option, optionIndex) => (
                  <li key={option.id} className="flex items-center gap-2">
                    {control.kind === "exclusive" ? (
                      <div className="flex shrink-0 flex-col gap-0.5">
                        <button
                          type="button"
                          disabled={isPending || optionIndex === 0}
                          onClick={() => {
                            startTransition(async () => {
                              await moveHelpChooseOption(option.id, "up");
                            });
                          }}
                          className="rounded bg-stone-100 px-1.5 py-0.5 text-[10px] text-stone-700 disabled:opacity-30"
                          aria-label="Move choice up"
                        >
                          ↑
                        </button>
                        <button
                          type="button"
                          disabled={
                            isPending ||
                            optionIndex === control.options.length - 1
                          }
                          onClick={() => {
                            startTransition(async () => {
                              await moveHelpChooseOption(option.id, "down");
                            });
                          }}
                          className="rounded bg-stone-100 px-1.5 py-0.5 text-[10px] text-stone-700 disabled:opacity-30"
                          aria-label="Move choice down"
                        >
                          ↓
                        </button>
                      </div>
                    ) : null}
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
                    {control.kind === "exclusive" ? (
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
                        Remove
                      </button>
                    ) : null}
                  </li>
                ))}
              </ul>

              {control.kind === "exclusive" && control.options.length < 3 ? (
                <form
                  action={(formData) => {
                    startTransition(async () => {
                      await addOptionToControl(control.id, formData);
                    });
                  }}
                  className="flex gap-2"
                >
                  <input
                    name="label"
                    required
                    placeholder="Add another choice"
                    className="min-w-0 flex-1 rounded-lg border border-stone-200 px-3 py-2 text-sm outline-none focus:border-stone-500"
                  />
                  <button
                    type="submit"
                    disabled={isPending}
                    className="shrink-0 rounded-lg bg-stone-100 px-3 py-2 text-xs font-semibold text-stone-700 disabled:opacity-60"
                  >
                    Add choice
                  </button>
                </form>
              ) : null}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
