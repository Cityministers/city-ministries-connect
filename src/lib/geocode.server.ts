import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { countryName } from "./country";

export type LatLng = { lat: number; lng: number };
const GATEWAY = "https://connector-gateway.lovable.dev/google_maps";
export function placeKey(city: string, zip: string, country = "US"): string {
  const base = `${(city ?? "").trim().toLowerCase()}|${(zip ?? "").trim().toLowerCase()}`;
  return country === "US" ? base : `${country.toLowerCase()}|${base}`;
}
function addressOf(city: string, zip: string, country = "US") {
  return [city?.trim(), zip?.trim(), countryName(country)].filter(Boolean).join(", ");
}
async function nominatim(query: string, country: string): Promise<LatLng | null> {
  try {
    const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&limit=1&countrycodes=${encodeURIComponent(country.toLowerCase())}&q=${encodeURIComponent(query)}`, { headers: { "User-Agent": "CityMinisters/1.0 (map geocoding)" } });
    if (!res.ok) return null;
    const body = await res.json() as { lat?: string; lon?: string }[];
    const lat = Number(body[0]?.lat), lng = Number(body[0]?.lon);
    return Number.isFinite(lat) && Number.isFinite(lng) ? { lat, lng } : null;
  } catch { return null; }
}
async function callFallback(city: string, zip: string, country: string): Promise<LatLng | null> {
  const clean = zip.trim();
  if (city.trim() && country !== "US") {
    const byCity = await nominatim(addressOf(city, "", country), country);
    if (byCity) return byCity;
  }
  if (clean && /^[\p{L}\p{N} -]{3,20}$/u.test(clean)) {
    try {
      const res = await fetch(`https://api.zippopotam.us/${encodeURIComponent(country.toLowerCase())}/${encodeURIComponent(clean)}`);
      if (res.ok) {
        const body = await res.json() as { places?: { latitude: string; longitude: string }[] };
        const p = body.places?.[0];
        if (p) {
          const lat = Number(p.latitude), lng = Number(p.longitude);
          if (Number.isFinite(lat) && Number.isFinite(lng)) return { lat, lng };
        }
      }
    } catch { /* Try a country-restricted place search next. */ }
  }
  if (city.trim() && zip.trim()) {
    const byCity = await nominatim(addressOf(city, "", country), country);
    if (byCity) return byCity;
  }
  return nominatim(addressOf(city, zip, country), country);
}
async function callGoogle(address: string, country: string): Promise<LatLng | null> {
  const lovableKey = process.env["LOVABLE_API_KEY"];
  const connectionKey = process.env["GOOGLE_MAPS_API_KEY"];
  if (!lovableKey || !connectionKey) return null;
  try {
    const res = await fetch(`${GATEWAY}/maps/api/geocode/json?address=${encodeURIComponent(address)}&components=country:${encodeURIComponent(country)}`, {
      headers: { Authorization: `Bearer ${lovableKey}`, "X-Connection-Api-Key": connectionKey },
    });
    if (!res.ok) return null;
    const body = await res.json() as { results?: { geometry?: { location?: LatLng } }[] };
    const loc = body.results?.[0]?.geometry?.location;
    return loc && Number.isFinite(loc.lat) && Number.isFinite(loc.lng) ? loc : null;
  } catch { return null; }
}
/** A country is always part of lookup; a short code can never accidentally resolve to a US ZIP. */
export async function geocodePlaces(places: { city: string; zip: string; country?: string }[]): Promise<Map<string, LatLng>> {
  const out = new Map<string, LatLng>();
  const wanted = new Map<string, { city: string; zip: string; country: string }>();
  for (const p of places) {
    if (!p.city?.trim() && !p.zip?.trim()) continue;
    const country = p.country ?? "US";
    wanted.set(placeKey(p.city, p.zip, country), { ...p, country });
  }
  if (!wanted.size) return out;
  const keys = [...wanted.keys()];
  const { data: cached } = await supabaseAdmin.from("geo_cache").select("place_key,lat,lng").in("place_key", keys);
  for (const row of cached ?? []) if (typeof row.lat === "number" && typeof row.lng === "number") out.set(row.place_key, { lat: row.lat, lng: row.lng });
  for (const key of keys.filter((k) => !out.has(k)).slice(0, 25)) {
    const place = wanted.get(key);
    if (!place) continue;
    const found = await callFallback(place.city, place.zip, place.country) ?? await callGoogle(addressOf(place.city, place.zip, place.country), place.country);
    if (!found) continue;
    await supabaseAdmin.from("geo_cache").upsert({ place_key: key, city: place.city, zip: place.zip, country_code: place.country, lat: found.lat, lng: found.lng }, { onConflict: "place_key" });
    out.set(key, found);
  }
  return out;
}
export async function geocodeAddress(address: string, city: string, zip: string, country = "US"): Promise<LatLng | null> {
  const street = address.trim();
  if (street.length < 4) return null;
  const full = [street, city, zip, countryName(country)].filter(Boolean).join(", ");
  const key = `addr|${country.toLowerCase()}|${full.toLowerCase()}`;
  const { data: cached } = await supabaseAdmin.from("geo_cache").select("lat,lng").eq("place_key", key).maybeSingle();
  if (cached && typeof cached.lat === "number" && typeof cached.lng === "number") return { lat: cached.lat, lng: cached.lng };
  const found = await callGoogle(full, country) ?? await nominatim(full, country);
  if (!found) return null;
  await supabaseAdmin.from("geo_cache").upsert({ place_key: key, city, zip, country_code: country, lat: found.lat, lng: found.lng }, { onConflict: "place_key" });
  return found;
}
/** Free text city or postal search; country comes from the selector, or a trailing country name. */
export async function geocodeQuery(query: string, country = "US"): Promise<LatLng | null> {
  const raw = query.trim().slice(0, 120);
  if (raw.length < 2) return null;
  const names = [countryName(country), country].map((s) => s.toLowerCase());
  const q = raw.split(",").filter((part) => !names.includes(part.trim().toLowerCase())).join(",").trim() || raw;
  const trailing = q.match(/^(.*?)[,\s]+(\d{4,6}|[A-Za-z]\d[A-Za-z][ -]?\d[A-Za-z]\d)$/);
  if (trailing && trailing[1]?.trim()) {
    const city = trailing[1].trim();
    const zip = trailing[2]!;
    const found = await geocodePlaces([{ city, zip, country }]);
    return found.get(placeKey(city, zip, country)) ?? null;
  }
  // Country-scoped city or postal lookups stay separate in the geo cache.
  const zip = /^[\p{L}\p{N} -]{3,20}$/u.test(q) && /\d/.test(q) && !/[a-z]{4,}/i.test(q) && !q.includes(",") ? q : "";
  const city = zip ? "" : q;
  const found = await geocodePlaces([{ city, zip, country }]);
  return found.get(placeKey(city, zip, country)) ?? null;
}
export async function geocodeChurch(address: string, city: string, zip: string, country = "US"): Promise<LatLng | null> {
  const exact = await geocodeAddress(address, city, zip, country);
  if (exact) return exact;
  const found = await geocodePlaces([{ city, zip, country }]);
  return found.get(placeKey(city, zip, country)) ?? null;
}
