"use client";

import { useState, useTransition, type FormEvent } from "react";
import {
  createRestaurant,
  deleteRestaurant,
  updateRestaurant,
} from "@/lib/actions/restaurants";
import { HelpChooseApplicability } from "@/components/admin/HelpChooseApplicability";
import { HoursEditor } from "@/components/admin/HoursEditor";
import { ImageGallery } from "@/components/admin/ImageGallery";
import { TagInput } from "@/components/admin/TagInput";
import {
  PRICE_RANGES,
  defaultHours,
  type HelpChooseControlWithOptions,
  type RestaurantWithImages,
} from "@/lib/types";

type RestaurantFormProps = {
  restaurant?: RestaurantWithImages;
  helpChooseControls?: HelpChooseControlWithOptions[];
  selectedHelpChooseOptionIds?: string[];
};

export function RestaurantForm({
  restaurant,
  helpChooseControls = [],
  selectedHelpChooseOptionIds = [],
}: RestaurantFormProps) {
  const [isPending, startTransition] = useTransition();
  const [pendingFiles, setPendingFiles] = useState<File[]>([]);
  const [mainExistingId, setMainExistingId] = useState(
    restaurant?.restaurant_images?.find((img) => img.is_main)?.id ?? "",
  );
  const [mainNewIndex, setMainNewIndex] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const isEdit = Boolean(restaurant);

  function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const formData = new FormData(e.currentTarget);

    for (const file of pendingFiles) {
      formData.append("photos", file);
    }

    if (mainExistingId) {
      formData.set("main_existing_id", mainExistingId);
    } else {
      formData.delete("main_existing_id");
    }

    if (mainNewIndex != null) {
      formData.set("main_new_index", String(mainNewIndex));
    } else {
      formData.delete("main_new_index");
    }

    startTransition(async () => {
      try {
        if (restaurant) {
          await updateRestaurant(restaurant.id, formData);
        } else {
          await createRestaurant(formData);
        }
      } catch (err) {
        // Next.js redirect() throws; ignore redirect errors
        if (
          err &&
          typeof err === "object" &&
          "digest" in err &&
          String((err as { digest?: string }).digest).startsWith("NEXT_REDIRECT")
        ) {
          return;
        }
        setError(err instanceof Error ? err.message : "Something went wrong");
      }
    });
  }

  return (
    <form onSubmit={onSubmit} className="space-y-6 pb-28">
      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
          {error}
        </div>
      )}

      <section className="space-y-3">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-stone-500">
          Basics
        </h2>
        <label className="block space-y-1.5">
          <span className="text-sm font-medium text-stone-800">Name *</span>
          <input
            required
            name="name"
            defaultValue={restaurant?.name ?? ""}
            className="w-full rounded-xl border border-stone-300 bg-white px-3 py-2.5 text-base outline-none focus:border-stone-500"
          />
        </label>
        <label className="block space-y-1.5">
          <span className="text-sm font-medium text-stone-800">
            Description
          </span>
          <textarea
            name="description"
            rows={4}
            defaultValue={restaurant?.description ?? ""}
            className="w-full rounded-xl border border-stone-300 bg-white px-3 py-2.5 text-base outline-none focus:border-stone-500"
          />
        </label>
        <label className="block space-y-1.5">
          <span className="text-sm font-medium text-stone-800">Cuisine</span>
          <input
            name="cuisine"
            placeholder="Italian, Mexican, …"
            defaultValue={restaurant?.cuisine ?? ""}
            className="w-full rounded-xl border border-stone-300 bg-white px-3 py-2.5 text-base outline-none focus:border-stone-500"
          />
        </label>
        <fieldset className="space-y-2">
          <legend className="text-sm font-medium text-stone-800">
            Price range
          </legend>
          <div className="flex gap-2">
            {PRICE_RANGES.map((price) => (
              <label
                key={price}
                className="flex-1 cursor-pointer rounded-xl border border-stone-300 bg-white px-3 py-2.5 text-center has-[:checked]:border-stone-900 has-[:checked]:bg-stone-900 has-[:checked]:text-white"
              >
                <input
                  type="radio"
                  name="price_range"
                  value={price}
                  defaultChecked={restaurant?.price_range === price}
                  className="sr-only"
                />
                {price}
              </label>
            ))}
          </div>
        </fieldset>
      </section>

      <section className="space-y-3">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-stone-500">
          Contact & location
        </h2>
        <label className="block space-y-1.5">
          <span className="text-sm font-medium text-stone-800">Address</span>
          <input
            name="address"
            defaultValue={restaurant?.address ?? ""}
            className="w-full rounded-xl border border-stone-300 bg-white px-3 py-2.5 text-base outline-none focus:border-stone-500"
          />
        </label>
        <div className="grid grid-cols-2 gap-3">
          <label className="block space-y-1.5">
            <span className="text-sm font-medium text-stone-800">Lat</span>
            <input
              name="lat"
              type="number"
              step="any"
              defaultValue={restaurant?.lat ?? ""}
              className="w-full rounded-xl border border-stone-300 bg-white px-3 py-2.5 text-base outline-none focus:border-stone-500"
            />
          </label>
          <label className="block space-y-1.5">
            <span className="text-sm font-medium text-stone-800">Lng</span>
            <input
              name="lng"
              type="number"
              step="any"
              defaultValue={restaurant?.lng ?? ""}
              className="w-full rounded-xl border border-stone-300 bg-white px-3 py-2.5 text-base outline-none focus:border-stone-500"
            />
          </label>
        </div>
        <label className="block space-y-1.5">
          <span className="text-sm font-medium text-stone-800">Phone</span>
          <input
            name="phone"
            type="tel"
            defaultValue={restaurant?.phone ?? ""}
            className="w-full rounded-xl border border-stone-300 bg-white px-3 py-2.5 text-base outline-none focus:border-stone-500"
          />
        </label>
        <label className="block space-y-1.5">
          <span className="text-sm font-medium text-stone-800">Website</span>
          <input
            name="website"
            type="text"
            inputMode="url"
            placeholder="https://"
            defaultValue={restaurant?.website ?? ""}
            className="w-full rounded-xl border border-stone-300 bg-white px-3 py-2.5 text-base outline-none focus:border-stone-500"
          />
        </label>
      </section>

      <section className="space-y-3">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-stone-500">
          Filters
        </h2>
        <HelpChooseApplicability
          controls={helpChooseControls}
          defaultSelectedIds={selectedHelpChooseOptionIds}
        />
      </section>

      <section className="space-y-3">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-stone-500">
          Tags
        </h2>
        <TagInput defaultTags={restaurant?.tags ?? []} />
      </section>

      <section className="space-y-3">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-stone-500">
          Hours
        </h2>
        <HoursEditor
          defaultHoursValue={restaurant?.hours ?? defaultHours()}
        />
      </section>

      <section className="space-y-3">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-stone-500">
          Photos
        </h2>
        <ImageGallery
          restaurantId={restaurant?.id}
          images={restaurant?.restaurant_images ?? []}
          pendingFiles={pendingFiles}
          onPendingFilesChange={setPendingFiles}
          mainExistingId={mainExistingId}
          onMainExistingIdChange={setMainExistingId}
          mainNewIndex={mainNewIndex}
          onMainNewIndexChange={setMainNewIndex}
        />
      </section>

      <div className="fixed inset-x-0 bottom-0 z-10 border-t border-stone-200 bg-stone-50/95 px-4 py-3 backdrop-blur">
        <div className="mx-auto flex max-w-lg gap-2">
          <button
            type="submit"
            disabled={isPending}
            className="flex-1 rounded-xl bg-stone-900 px-4 py-3 text-sm font-semibold text-white disabled:opacity-60"
          >
            {isPending
              ? "Saving…"
              : isEdit
                ? "Save changes"
                : "Create restaurant"}
          </button>
          {restaurant && (
            <button
              type="button"
              disabled={isPending}
              onClick={() => {
                if (
                  !confirm(
                    `Delete “${restaurant.name}”? This cannot be undone.`,
                  )
                ) {
                  return;
                }
                startTransition(async () => {
                  await deleteRestaurant(restaurant.id);
                });
              }}
              className="rounded-xl bg-red-600 px-4 py-3 text-sm font-semibold text-white disabled:opacity-60"
            >
              Delete
            </button>
          )}
        </div>
      </div>
    </form>
  );
}
