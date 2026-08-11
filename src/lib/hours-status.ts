import {
  DAY_KEYS,
  type DayKey,
  type Hours,
} from "@/lib/types";

function todayKey(date = new Date()): DayKey {
  return DAY_KEYS[(date.getDay() + 6) % 7];
}

function parseTimeToMinutes(time: string): number | null {
  const match = /^(\d{1,2}):(\d{2})$/.exec(time);
  if (!match) return null;
  const hours = Number(match[1]);
  const minutes = Number(match[2]);
  if (!Number.isFinite(hours) || !Number.isFinite(minutes)) return null;
  return hours * 60 + minutes;
}

function formatCloseLabel(time: string): string {
  const minutes = parseTimeToMinutes(time);
  if (minutes == null) return time;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  const period = h >= 12 ? "PM" : "AM";
  const hour12 = h % 12 === 0 ? 12 : h % 12;
  return m === 0 ? `${hour12} ${period}` : `${hour12}:${String(m).padStart(2, "0")} ${period}`;
}

export function getHoursStatus(hours: Hours | null | undefined): string {
  if (!hours) return "Hours unavailable";

  const now = new Date();
  const day = todayKey(now);
  const today = hours[day];
  if (!today) return "Hours unavailable";
  if (today.closed) return "Closed today";

  const openMins = parseTimeToMinutes(today.open);
  const closeMins = parseTimeToMinutes(today.close);
  if (openMins == null || closeMins == null) {
    return `Hours • ${today.open} – ${today.close}`;
  }

  const nowMins = now.getHours() * 60 + now.getMinutes();
  const isOpen =
    openMins <= closeMins
      ? nowMins >= openMins && nowMins < closeMins
      : nowMins >= openMins || nowMins < closeMins;

  if (isOpen) {
    return `Hours • Open Now, Closes ${formatCloseLabel(today.close)}`;
  }

  if (nowMins < openMins) {
    return `Hours • Opens ${formatCloseLabel(today.open)}`;
  }

  return "Hours • Closed";
}

export function metaLine(parts: Array<string | null | undefined>): string {
  return parts.map((p) => p?.trim()).filter(Boolean).join(" • ");
}
