"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createServiceClient } from "@/lib/supabase/server";
import {
  DAY_KEYS,
  defaultHours,
  type DayHours,
  type Hours,
  type PriceRange,
} from "@/lib/types";

const BUCKET = "restaurant-photos";

function parseTags(raw: string | null): string[] {
  if (!raw) return [];
  return raw
    .split(",")
    .map((t) => t.trim())
    .filter(Boolean);
}

function parseHours(formData: FormData): Hours {
  const hours = defaultHours();
  for (const day of DAY_KEYS) {
    const closed = formData.get(`hours_${day}_closed`) === "on";
    const open = String(formData.get(`hours_${day}_open`) ?? "09:00");
    const close = String(formData.get(`hours_${day}_close`) ?? "21:00");
    hours[day] = { open, close, closed } satisfies DayHours;
  }
  return hours;
}

function parseOptionalNumber(value: FormDataEntryValue | null): number | null {
  if (value == null || value === "") return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

function parsePriceRange(value: FormDataEntryValue | null): PriceRange | null {
  if (value === "$" || value === "$$" || value === "$$$") return value;
  return null;
}

function restaurantPayload(formData: FormData) {
  const name = String(formData.get("name") ?? "").trim();
  if (!name) {
    throw new Error("Name is required");
  }

  return {
    name,
    description: String(formData.get("description") ?? "").trim() || null,
    address: String(formData.get("address") ?? "").trim() || null,
    phone: String(formData.get("phone") ?? "").trim() || null,
    website: String(formData.get("website") ?? "").trim() || null,
    cuisine: String(formData.get("cuisine") ?? "").trim() || null,
    price_range: parsePriceRange(formData.get("price_range")),
    hours: parseHours(formData),
    lat: parseOptionalNumber(formData.get("lat")),
    lng: parseOptionalNumber(formData.get("lng")),
    tags: parseTags(String(formData.get("tags") ?? "")),
  };
}

async function uploadImages(
  restaurantId: string,
  files: File[],
  mainNewIndex: number | null,
  startingSort: number,
) {
  if (files.length === 0) return;

  const supabase = createServiceClient();
  const rows = [];

  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    if (!file || file.size === 0) continue;

    const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
    const path = `${restaurantId}/${crypto.randomUUID()}.${ext}`;

    const { error: uploadError } = await supabase.storage
      .from(BUCKET)
      .upload(path, file, {
        contentType: file.type || "image/jpeg",
        upsert: false,
      });

    if (uploadError) {
      throw new Error(`Upload failed: ${uploadError.message}`);
    }

    const {
      data: { publicUrl },
    } = supabase.storage.from(BUCKET).getPublicUrl(path);

    rows.push({
      restaurant_id: restaurantId,
      storage_path: path,
      public_url: publicUrl,
      is_main: mainNewIndex === i,
      sort_order: startingSort + i,
    });
  }

  if (rows.length === 0) return;

  if (rows.some((r) => r.is_main)) {
    await supabase
      .from("restaurant_images")
      .update({ is_main: false })
      .eq("restaurant_id", restaurantId);
  }

  const { error } = await supabase.from("restaurant_images").insert(rows);
  if (error) {
    throw new Error(`Failed to save images: ${error.message}`);
  }

  // If nothing is main yet, promote the first image
  const { data: mains } = await supabase
    .from("restaurant_images")
    .select("id")
    .eq("restaurant_id", restaurantId)
    .eq("is_main", true)
    .limit(1);

  if (!mains?.length) {
    const { data: first } = await supabase
      .from("restaurant_images")
      .select("id")
      .eq("restaurant_id", restaurantId)
      .order("sort_order", { ascending: true })
      .limit(1)
      .maybeSingle();

    if (first) {
      await supabase
        .from("restaurant_images")
        .update({ is_main: true })
        .eq("id", first.id);
    }
  }
}

export async function createRestaurant(formData: FormData) {
  const supabase = createServiceClient();
  const payload = restaurantPayload(formData);

  const { data, error } = await supabase
    .from("restaurants")
    .insert(payload)
    .select("id")
    .single();

  if (error || !data) {
    throw new Error(error?.message ?? "Failed to create restaurant");
  }

  const files = formData
    .getAll("photos")
    .filter((f): f is File => f instanceof File && f.size > 0);
  const mainNewRaw = formData.get("main_new_index");
  const mainNewIndex =
    mainNewRaw != null && mainNewRaw !== ""
      ? Number(mainNewRaw)
      : files.length
        ? 0
        : null;

  await uploadImages(data.id, files, mainNewIndex, 0);

  revalidatePath("/");
  revalidatePath("/admin");
  redirect("/admin");
}

export async function updateRestaurant(id: string, formData: FormData) {
  const supabase = createServiceClient();
  const payload = restaurantPayload(formData);

  const { error } = await supabase
    .from("restaurants")
    .update(payload)
    .eq("id", id);

  if (error) {
    throw new Error(error.message);
  }

  const files = formData
    .getAll("photos")
    .filter((f): f is File => f instanceof File && f.size > 0);

  if (files.length) {
    const { data: existing } = await supabase
      .from("restaurant_images")
      .select("sort_order")
      .eq("restaurant_id", id)
      .order("sort_order", { ascending: false })
      .limit(1);

    const startingSort = (existing?.[0]?.sort_order ?? -1) + 1;
    const mainNewRaw = formData.get("main_new_index");
    const mainNewIndex =
      mainNewRaw != null && mainNewRaw !== "" ? Number(mainNewRaw) : null;

    await uploadImages(id, files, mainNewIndex, startingSort);
  }

  const mainExistingId = String(formData.get("main_existing_id") ?? "");
  if (mainExistingId) {
    await setMainImage(id, mainExistingId);
  }

  revalidatePath("/");
  revalidatePath("/admin");
  revalidatePath(`/admin/${id}`);
  redirect(`/admin/${id}`);
}

export async function deleteRestaurant(id: string) {
  const supabase = createServiceClient();

  const { data: images } = await supabase
    .from("restaurant_images")
    .select("storage_path")
    .eq("restaurant_id", id);

  if (images?.length) {
    await supabase.storage
      .from(BUCKET)
      .remove(images.map((img) => img.storage_path));
  }

  const { error } = await supabase.from("restaurants").delete().eq("id", id);
  if (error) {
    throw new Error(error.message);
  }

  revalidatePath("/");
  revalidatePath("/admin");
  redirect("/admin");
}

export async function setMainImage(restaurantId: string, imageId: string) {
  const supabase = createServiceClient();

  await supabase
    .from("restaurant_images")
    .update({ is_main: false })
    .eq("restaurant_id", restaurantId);

  const { error } = await supabase
    .from("restaurant_images")
    .update({ is_main: true })
    .eq("id", imageId)
    .eq("restaurant_id", restaurantId);

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath("/");
  revalidatePath("/admin");
  revalidatePath(`/admin/${restaurantId}`);
}

export async function deleteImage(restaurantId: string, imageId: string) {
  const supabase = createServiceClient();

  const { data: image, error: fetchError } = await supabase
    .from("restaurant_images")
    .select("*")
    .eq("id", imageId)
    .eq("restaurant_id", restaurantId)
    .single();

  if (fetchError || !image) {
    throw new Error(fetchError?.message ?? "Image not found");
  }

  await supabase.storage.from(BUCKET).remove([image.storage_path]);

  const { error } = await supabase
    .from("restaurant_images")
    .delete()
    .eq("id", imageId);

  if (error) {
    throw new Error(error.message);
  }

  if (image.is_main) {
    const { data: next } = await supabase
      .from("restaurant_images")
      .select("id")
      .eq("restaurant_id", restaurantId)
      .order("sort_order", { ascending: true })
      .limit(1)
      .maybeSingle();

    if (next) {
      await supabase
        .from("restaurant_images")
        .update({ is_main: true })
        .eq("id", next.id);
    }
  }

  revalidatePath("/");
  revalidatePath("/admin");
  revalidatePath(`/admin/${restaurantId}`);
}
