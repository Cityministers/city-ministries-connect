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
  const seen = new Set<string>();
  for (const row of cached ?? []) {
    seen.add(row.place_key);
    if (typeof row.lat === "number" && typeof row.lng === "number") {
      out.set(row.place_key, { lat: row.lat, lng: row.lng });
    }
  }

  const missing = keys.filter((k) => !seen.has(k)).slice(0, 25);
  for (const key of missing) {
    const place = wanted.get(key)!;
    const found = await callGoogle(addressOf(place.city, place.zip));
    await supabaseAdmin.from("geo_cache").upsert(
      {
        place_key: key,
        city: place.city ?? "",
        zip: place.zip ?? "",
        lat: found?.lat ?? null,
        lng: found?.lng ?? null,
      },
      { onConflict: "place_key" },
    );
    if (found) out.set(key, found);
  }

  return out;
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
