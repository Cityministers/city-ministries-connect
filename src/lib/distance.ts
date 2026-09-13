export type LatLng = { lat: number; lng: number };

/** Great-circle distance in miles. */
export function milesBetween(a: LatLng, b: LatLng): number {
  const R = 3958.8;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const s =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(s));
}

/** Short, friendly distance label. */
export function formatMiles(mi: number): string {
  if (mi < 0.1) return "right here";
  if (mi < 10) return `${mi.toFixed(1)} mi`;
  return `${Math.round(mi)} mi`;
}

/** Stable tiny offset so posts sharing a ZIP centre don't stack on one pin. */
export function spread(id: string, point: LatLng): LatLng {
  let h = 0x811c9dc5;
  for (let i = 0; i < id.length; i += 1) {
    h ^= id.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  const a = (Math.abs(h) % 360) * (Math.PI / 180);
  const r = 0.0012 + ((Math.abs(h) >> 9) % 100) / 100 * 0.0025;
  return { lat: point.lat + Math.sin(a) * r, lng: point.lng + Math.cos(a) * r * 1.3 };
}
