const EARTH_RADIUS_KM = 6371;

export function haversineDistance(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return EARTH_RADIUS_KM * c; // km
}

export interface DistrictBounds {
  id: string;
  centerLat: number;
  centerLng: number;
  boundingRadiusKm: number;
}

export function districtFromPoint(
  lat: number,
  lng: number,
  districts: DistrictBounds[]
): string | null {
  for (const d of districts) {
    const dist = haversineDistance(lat, lng, d.centerLat, d.centerLng);
    if (dist <= d.boundingRadiusKm) {
      return d.id;
    }
  }
  // Fallback: nearest district center
  let nearest: string | null = null;
  let minDist = Infinity;
  for (const d of districts) {
    const dist = haversineDistance(lat, lng, d.centerLat, d.centerLng);
    if (dist < minDist) {
      minDist = dist;
      nearest = d.id;
    }
  }
  return nearest;
}
