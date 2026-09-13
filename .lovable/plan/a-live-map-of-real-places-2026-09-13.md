# A live map of real places

The map becomes a real city map with real streets, styled to match the site. Every ministry and need sits at its true location, and the list beside the map follows wherever you look.

## What people will see

- A real, scrollable city map (Google Maps) in the site's dark palette, with the existing ministry icons as pins on top.
- Panning or zooming updates the list: it shows the posts currently in view, with a "Search this area" button so the list only refreshes when you ask for it.
- A toggle switches between "posts in this view" and "nearest to my place", sorted closest first.
- Searching a city or ZIP moves the map to that place instead of emptying the map.
- Each post shows how far it is from the ZIP saved on your profile (for example "2.4 mi"). Signed out, or with no ZIP saved, distance is measured from whatever place is in the search bar.
- Tapping a pin still opens the post exactly as it does now.

## How posts get their location

Posts only have a city and ZIP typed in text today, so each one is looked up once and its map coordinates saved. New posts are looked up as they are created. Accuracy is ZIP-level — the pin sits at the centre of the ZIP area, not at an exact street address. Posts sharing a ZIP are nudged slightly apart so they do not stack on one another.

If a city or ZIP cannot be found, the post stays in the list but is flagged as unplaced rather than dropped.

## Profile ZIP

The ZIP already collected on the profile becomes the "home" distances are measured from. If someone has none saved, a one-line prompt on the map invites them to add it.

## Steps

1. Connect Google Maps and store coordinates on ministries, needs, and a reusable ZIP lookup table.
2. Backfill coordinates for all existing posts.
3. Replace the drag-a-picture map with a real Google map, styled dark, showing the same pins.
4. Make the list follow the map view, add the view/nearest toggle and distance badges.
5. Apply the same to the needs map.

## Technical notes

- Google Maps Platform connector; Maps JavaScript API in the browser with the managed browser key, Geocoding through the connector gateway from a server function (never the browser key).
- Migration: add `lat double precision`, `lng double precision` to `user_ministries` and `user_needs`, plus a `geo_cache` table keyed by normalized `city|zip` holding lat/lng so repeat lookups cost nothing. Grants + RLS on `geo_cache` (public SELECT, service/server writes only).
- New `src/lib/geocode.functions.ts`: `geocodePlace({ city, zip })` — checks `geo_cache`, otherwise calls `…/maps/api/geocode/json` through the gateway, writes back to cache. Called on create/update in `ministries.functions.ts` / `needs.functions.ts`, and by a one-off backfill server function for existing rows.
- `listUserMinistries` / needs equivalent gain optional `bounds` (n/s/e/w) and `origin` (lat/lng) params; bounds filtering in SQL, distance computed with haversine in `src/lib/distance.ts` and returned per post.
- New `src/components/LiveMap.tsx` loads the Maps JS API with `loading=async` + callback, `clickableIcons: false`, no `mapId`, custom dark `styles` array built from the ink/mist/lemon tokens, `google.maps.Marker` with the existing square icon rendered to an SVG data URL. Debounced `idle` listener drives a "Search this area" affordance.
- `PanMap.tsx` and `src/lib/map-layout.ts` are retired from `map.tsx` and `needs.tsx` once LiveMap is in place.
- Duplicate-ZIP posts get a deterministic sub-100m offset derived from the post id hash.
- Map render only happens client-side (`ClientOnly` + dynamic import) to keep SSR clean.
