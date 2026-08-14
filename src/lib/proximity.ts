export type LatLng = {
  lat: number;
  lng: number;
};

const EARTH_KM = 6371;
const KM_PER_MINUTE = 0.5;
const UNKNOWN_MINUTES = 90;

function toRad(degrees: number) {
  return (degrees * Math.PI) / 180;
}

export function haversineKm(from: LatLng, to: LatLng): number {
  const dLat = toRad(to.lat - from.lat);
  const dLng = toRad(to.lng - from.lng);
  const sinLat = Math.sin(dLat / 2);
  const sinLng = Math.sin(dLng / 2);
  const a =
    sinLat * sinLat +
    Math.cos(toRad(from.lat)) * Math.cos(toRad(to.lat)) * sinLng * sinLng;
  return 2 * EARTH_KM * Math.asin(Math.min(1, Math.sqrt(a)));
}

export function minutesAway(from: LatLng | null, to: LatLng | null): number {
  if (!from || to == null || !Number.isFinite(to.lat) || !Number.isFinite(to.lng)) {
    return UNKNOWN_MINUTES;
  }
  return haversineKm(from, to) / KM_PER_MINUTE;
}

/**
 * Weighted random order: nearby places are likelier near the top, without a
 * strict distance sort. Similar times (3 vs 3.5 min) can swap; 60 min stays
 * far down. `proximityWeight` is 0 (more random) to 1 (stronger nearby bias).
 */
export function weightedShuffle<T>(
  items: T[],
  minutesFor: (item: T) => number,
  proximityWeight: number,
): T[] {
  const weight = Math.min(1, Math.max(0, proximityWeight));
  const temperature = 40 * (1 - weight) + 4 * weight;

  return items
    .map((item) => {
      const minutes = Math.max(0, minutesFor(item));
      const w = Math.exp(-minutes / temperature);
      const key = Math.pow(Math.random(), 1 / Math.max(w, 1e-9));
      return { item, key };
    })
    .sort((a, b) => b.key - a.key)
    .map((entry) => entry.item);
}
