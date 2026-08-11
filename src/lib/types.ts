export type PriceRange = "$" | "$$" | "$$$";

export type DayKey = "mon" | "tue" | "wed" | "thu" | "fri" | "sat" | "sun";

export type DayHours = {
  open: string;
  close: string;
  closed: boolean;
};

export type Hours = Record<DayKey, DayHours>;

export type Restaurant = {
  id: string;
  name: string;
  description: string | null;
  address: string | null;
  phone: string | null;
  website: string | null;
  cuisine: string | null;
  price_range: PriceRange | null;
  hours: Hours;
  lat: number | null;
  lng: number | null;
  tags: string[];
  created_at: string;
  updated_at: string;
};

export type RestaurantImage = {
  id: string;
  restaurant_id: string;
  storage_path: string;
  public_url: string;
  is_main: boolean;
  sort_order: number;
  created_at: string;
};

export type RestaurantWithImages = Restaurant & {
  restaurant_images: RestaurantImage[];
};

export type HelpChooseOption = {
  id: string;
  label: string;
  sort_order: number;
  created_at: string;
};

export type HelpChooseConflict = {
  option_a_id: string;
  option_b_id: string;
};

export const DAY_KEYS: DayKey[] = [
  "mon",
  "tue",
  "wed",
  "thu",
  "fri",
  "sat",
  "sun",
];

export const DAY_LABELS: Record<DayKey, string> = {
  mon: "Monday",
  tue: "Tuesday",
  wed: "Wednesday",
  thu: "Thursday",
  fri: "Friday",
  sat: "Saturday",
  sun: "Sunday",
};

export const PRICE_RANGES: PriceRange[] = ["$", "$$", "$$$"];

export function defaultHours(): Hours {
  return {
    mon: { open: "09:00", close: "21:00", closed: false },
    tue: { open: "09:00", close: "21:00", closed: false },
    wed: { open: "09:00", close: "21:00", closed: false },
    thu: { open: "09:00", close: "21:00", closed: false },
    fri: { open: "09:00", close: "22:00", closed: false },
    sat: { open: "10:00", close: "22:00", closed: false },
    sun: { open: "10:00", close: "20:00", closed: false },
  };
}
