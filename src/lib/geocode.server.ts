import { supabaseAdmin } from "@/integrations/supabase/client.server";

export type LatLng = { lat: number; lng: number };

const GATEWAY = "https://connector-gateway.lovable.dev/google_maps";

/** Normalized cache key for a city + ZIP pair. */
export function placeKey(city: string, zip: string): string {
  return `${(city ?? "").trim().toLowerCase()}|${(zip ?? "").trim()}`;
}

function addressOf(city: string, zip: string): string {
  return [city?.trim(), zip?.trim()].filter(Boolean).join(" ").trim();
}

/** Free, keyless fallbacks so a post always lands on the map. */
async function callFallback(city: string, zip: string): Promise<LatLng | null> {
  const clean = (zip ?? "").trim().match(/\b\d{5}\b/)?.[0] ?? "";
  if (clean) {
    try {
      const res = await fetch(`https://api.zippopotam.us/us/${clean}`);
      if (res.ok) {
        const body = (await res.json()) as { places?: { latitude: string; longitude: string }[] };
        const p = body.places?.[0];
        if (p) {
          const lat = Number(p.latitude);
          const lng = Number(p.longitude);
          if (Number.isFinite(lat) && Number.isFinite(lng)) return { lat, lng };
        }
      }
    } catch (err) {
      console.error("ZIP lookup failed", err);
    }
  }

  const text = addressOf(city, zip);
  if (!text) return null;
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&limit=1&countrycodes=us&q=${encodeURIComponent(text)}`,
      { headers: { "User-Agent": "CityMinisters/1.0 (map geocoding)" } },
    );
    if (!res.ok) return null;
    const body = (await res.json()) as { lat?: string; lon?: string }[];
    const hit = body[0];
    if (!hit?.lat || !hit?.lon) return null;
    const lat = Number(hit.lat);
    const lng = Number(hit.lon);
    return Number.isFinite(lat) && Number.isFinite(lng) ? { lat, lng } : null;
  } catch (err) {
    console.error("Place lookup failed", err);
    return null;
  }
}

async function callGoogle(address: string): Promise<LatLng | null> {
  const lovableKey = process.env["LOVABLE_API_KEY"];
  const connectionKey = process.env["GOOGLE_MAPS_API_KEY"];
  if (!lovableKey || !connectionKey) return null;

  const res = await fetch(
    `${GATEWAY}/maps/api/geocode/json?address=${encodeURIComponent(address)}&components=country:US`,
    {
      headers: {
        Authorization: `Bearer ${lovableKey}`,
        "X-Connection-Api-Key": connectionKey,
      },
    },
  );
  if (!res.ok) {
    console.error(`Geocoding failed [${res.status}]: ${await res.text()}`);
    return null;
  }
  const body = (await res.json()) as {
    status?: string;
    results?: { geometry?: { location?: { lat: number; lng: number } } }[];
  };
  const loc = body.results?.[0]?.geometry?.location;
  if (!loc || typeof loc.lat !== "number") return null;
  return { lat: loc.lat, lng: loc.lng };
}

/** Looks up coordinates for city/ZIP pairs, using the shared cache so Google is called once per place. */
export async function geocodePlaces(
  places: { city: string; zip: string }[],
): Promise<Map<string, LatLng>> {
  const out = new Map<string, LatLng>();
  const wanted = new Map<string, { city: string; zip: string }>();
  for (const p of places) {
    const address = addressOf(p.city, p.zip);
    if (!address) continue;
    wanted.set(placeKey(p.city, p.zip), p);
  }
  if (wanted.size === 0) return out;

  const keys = [...wanted.keys()];
  const { data: cached } = await supabaseAdmin
    .from("geo_cache")
    .select("place_key, lat, lng")
    .in("place_key", keys);
  // Only a cached hit counts — a blank row means an earlier lookup failed, so we retry it.
  const seen = new Set<string>();
  for (const row of cached ?? []) {
    if (typeof row.lat === "number" && typeof row.lng === "number") {
      seen.add(row.place_key);
      out.set(row.place_key, { lat: row.lat, lng: row.lng });
    }
  }

  const missing = keys.filter((k) => !seen.has(k)).slice(0, 25);
  for (const key of missing) {
    const place = wanted.get(key)!;
    const found =
      (await callGoogle(addressOf(place.city, place.zip))) ??
      (await callFallback(place.city ?? "", place.zip ?? ""));
    if (!found) continue;
    await supabaseAdmin.from("geo_cache").upsert(
      {
        place_key: key,
        city: place.city ?? "",
        zip: place.zip ?? "",
        lat: found.lat,
        lng: found.lng,
      },
      { onConflict: "place_key" },
    );
    out.set(key, found);
  }

  return out;
}

/**
 * Exact street-address lookup for fixed places like churches.
 * No ZIP-code fallback: if the building can't be found we return null so the
 * owner is asked to correct the address rather than being dropped in the
 * middle of a ZIP code.
 */
export async function geocodeAddress(
  address: string,
  city: string,
  zip: string,
): Promise<LatLng | null> {
  const street = (address ?? "").trim();
  if (street.length < 4) return null;
  const full = [street, (city ?? "").trim(), (zip ?? "").trim()].filter(Boolean).join(", ");
  const key = `addr|${full.toLowerCase()}`;

  const { data: cached } = await supabaseAdmin
    .from("geo_cache")
    .select("lat, lng")
    .eq("place_key", key)
    .maybeSingle();
  if (cached && typeof cached.lat === "number" && typeof cached.lng === "number") {
    return { lat: cached.lat, lng: cached.lng };
  }

  let found = await callGoogle(full);
  if (!found) {
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&limit=1&countrycodes=us&q=${encodeURIComponent(full)}`,
        { headers: { "User-Agent": "CityMinisters/1.0 (map geocoding)" } },
      );
      if (res.ok) {
        const body = (await res.json()) as { lat?: string; lon?: string }[];
        const hit = body[0];
        const lat = Number(hit?.lat);
        const lng = Number(hit?.lon);
        if (Number.isFinite(lat) && Number.isFinite(lng)) found = { lat, lng };
      }
    } catch (err) {
      console.error("Address lookup failed", err);
    }
  }
  if (!found) return null;

  await supabaseAdmin.from("geo_cache").upsert(
    {
      place_key: key,
      city: (city ?? "").trim(),
      zip: (zip ?? "").trim(),
      lat: found.lat,
      lng: found.lng,
    },
    { onConflict: "place_key" },
  );
  return found;
}

/** Free-text place lookup ("Beaverton, OR" or "97006"), cached the same way. */
export async function geocodeQuery(query: string): Promise<LatLng | null> {
  const q = String(query ?? "").trim().slice(0, 120);
  if (q.length < 2) return null;
  const zip = q.match(/\b\d{5}\b/)?.[0] ?? "";
  const city = zip && q.replace(zip, "").trim().length < 2 ? "" : q;
  const found = await geocodePlaces([{ city, zip }]);
  return found.get(placeKey(city, zip)) ?? null;
}

/**
 * Church placement: try the exact street address first; if it can't be found,
 * fall back to the ZIP/city so the church still lands in the right area.
 */
export async function geocodeChurch(
  address: string,
  city: string,
  zip: string,
): Promise<LatLng | null> {
  const exact = await geocodeAddress(address, city, zip);
  if (exact) return exact;
  const found = await geocodePlaces([{ city: zip ? "" : city, zip }]);
  return found.get(placeKey(zip ? "" : city, zip)) ?? null;
}
