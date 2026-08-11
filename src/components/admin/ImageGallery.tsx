"use client";

import { useMemo, useState, useTransition } from "react";
import {
  deleteImage,
  setMainImage,
} from "@/lib/actions/restaurants";
import type { RestaurantImage } from "@/lib/types";

type ImageGalleryProps = {
  restaurantId?: string;
  images?: RestaurantImage[];
  pendingFiles: File[];
  onPendingFilesChange: (files: File[]) => void;
  mainExistingId: string;
  onMainExistingIdChange: (id: string) => void;
  mainNewIndex: number | null;
  onMainNewIndexChange: (index: number | null) => void;
};

export function ImageGallery({
  restaurantId,
  images = [],
  pendingFiles,
  onPendingFilesChange,
  mainExistingId,
  onMainExistingIdChange,
  mainNewIndex,
  onMainNewIndexChange,
}: ImageGalleryProps) {
  const [previews, setPreviews] = useState<string[]>([]);
  const [isPending, startTransition] = useTransition();

  const sortedImages = useMemo(
    () => [...images].sort((a, b) => a.sort_order - b.sort_order),
    [images],
  );

  function onFilesSelected(fileList: FileList | null) {
    if (!fileList?.length) return;
    const next = Array.from(fileList);
    const startIndex = pendingFiles.length;
    onPendingFilesChange([...pendingFiles, ...next]);
    setPreviews((prev) => [
      ...prev,
      ...next.map((file) => URL.createObjectURL(file)),
    ]);
    if (!mainExistingId && mainNewIndex == null) {
      onMainNewIndexChange(startIndex);
    }
  }

  function removePending(index: number) {
    onPendingFilesChange(pendingFiles.filter((_, i) => i !== index));
    setPreviews((prev) => {
      URL.revokeObjectURL(prev[index]);
      return prev.filter((_, i) => i !== index);
    });
    if (mainNewIndex == null) return;
    if (mainNewIndex === index) onMainNewIndexChange(null);
    else if (mainNewIndex > index) onMainNewIndexChange(mainNewIndex - 1);
  }

  return (
    <div className="space-y-4">
      {sortedImages.length > 0 && (
        <div className="grid grid-cols-2 gap-3">
          {sortedImages.map((image) => (
            <div
              key={image.id}
              className="overflow-hidden rounded-2xl border border-stone-200 bg-white"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={image.public_url}
                alt=""
                className="aspect-square w-full object-cover"
              />
              <div className="flex flex-col gap-2 p-2">
                <button
                  type="button"
                  disabled={isPending}
                  onClick={() => {
                    onMainExistingIdChange(image.id);
                    onMainNewIndexChange(null);
                    if (restaurantId) {
                      startTransition(async () => {
                        await setMainImage(restaurantId, image.id);
                      });
                    }
                  }}
                  className={`rounded-lg px-2 py-1.5 text-xs font-medium ${
                    mainExistingId === image.id && mainNewIndex == null
                      ? "bg-stone-900 text-white"
                      : "bg-stone-100 text-stone-700"
                  }`}
                >
                  {mainExistingId === image.id && mainNewIndex == null
                    ? "Main photo"
                    : "Set as main"}
                </button>
                {restaurantId && (
                  <button
                    type="button"
                    disabled={isPending}
                    onClick={() => {
                      startTransition(async () => {
                        await deleteImage(restaurantId, image.id);
                      });
                    }}
                    className="rounded-lg bg-red-50 px-2 py-1.5 text-xs font-medium text-red-700"
                  >
                    Delete
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {previews.length > 0 && (
        <div className="grid grid-cols-2 gap-3">
          {previews.map((src, index) => (
            <div
              key={`${src}-${index}`}
              className="overflow-hidden rounded-2xl border border-dashed border-stone-300 bg-stone-50"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={src}
                alt=""
                className="aspect-square w-full object-cover"
              />
              <div className="flex flex-col gap-2 p-2">
                <button
                  type="button"
                  onClick={() => {
                    onMainNewIndexChange(index);
                    onMainExistingIdChange("");
                  }}
                  className={`rounded-lg px-2 py-1.5 text-xs font-medium ${
                    mainNewIndex === index
                      ? "bg-stone-900 text-white"
                      : "bg-stone-100 text-stone-700"
                  }`}
                >
                  {mainNewIndex === index ? "Main (new)" : "Set as main"}
                </button>
                <button
                  type="button"
                  onClick={() => removePending(index)}
                  className="rounded-lg bg-stone-100 px-2 py-1.5 text-xs font-medium text-stone-700"
                >
                  Remove
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <label className="flex cursor-pointer flex-col items-center justify-center rounded-2xl border border-dashed border-stone-300 bg-white px-4 py-8 text-center">
        <span className="text-sm font-medium text-stone-800">Add photos</span>
        <span className="mt-1 text-xs text-stone-500">
          JPG, PNG, WebP — pick a main photo below
        </span>
        <input
          type="file"
          accept="image/*"
          multiple
          className="sr-only"
          onChange={(e) => {
            onFilesSelected(e.target.files);
            e.target.value = "";
          }}
        />
      </label>
    </div>
  );
}
