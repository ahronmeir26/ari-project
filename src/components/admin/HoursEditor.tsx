"use client";

import {
  DAY_KEYS,
  DAY_LABELS,
  defaultHours,
  type Hours,
} from "@/lib/types";

type HoursEditorProps = {
  defaultHoursValue?: Hours;
};

export function HoursEditor({
  defaultHoursValue = defaultHours(),
}: HoursEditorProps) {
  return (
    <div className="space-y-3">
      {DAY_KEYS.map((day) => {
        const value = defaultHoursValue[day] ?? defaultHours()[day];
        return (
          <div
            key={day}
            className="grid grid-cols-[1fr_auto] gap-2 rounded-xl border border-stone-200 bg-white p-3 sm:grid-cols-[7rem_1fr_1fr_auto] sm:items-center"
          >
            <div className="text-sm font-medium text-stone-800">
              {DAY_LABELS[day]}
            </div>
            <label className="col-span-2 flex items-center gap-2 text-sm text-stone-600 sm:col-span-1 sm:order-last">
              <input
                type="checkbox"
                name={`hours_${day}_closed`}
                defaultChecked={value.closed}
                className="size-4"
              />
              Closed
            </label>
            <input
              type="time"
              name={`hours_${day}_open`}
              defaultValue={value.open}
              className="rounded-lg border border-stone-300 px-2 py-2 text-sm"
            />
            <input
              type="time"
              name={`hours_${day}_close`}
              defaultValue={value.close}
              className="rounded-lg border border-stone-300 px-2 py-2 text-sm"
            />
          </div>
        );
      })}
    </div>
  );
}
