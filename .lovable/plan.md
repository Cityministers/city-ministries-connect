# Prayer walls and prayers on the map

Two places a prayer can live:

- **At a church** — shows only on that church's page prayer wall. Never on the map, never in city lists.
- **Public** — shows as its own pin on the map, behind a new "Prayers" filter, and opens like a ministry or need card.

Posting always requires an account. Reading is open to everyone.

## What people will see

**Homepage** — a new "Post a Prayer" button in the row with "See the map". Signed-out visitors are sent to sign in first, then straight back to the prayer form.

**Post a Prayer page** — short title, the prayer itself, city and ZIP, and a choice of where it goes: "Anywhere on the map" or "At my church" (only churches the person attends). A "Post anonymously" checkbox hides their name and photo; otherwise the card shows their profile picture and name like other posts.

**Map page** — a "Prayers" button beside "Churches" under the map. Prayers-only mode shows just prayer pins; "In this view" and "Nearest to me" keep showing ministries, needs and churches as they do today. Tapping a prayer pin opens the same card layout used for ministries and needs, with the poster's description, their profile (or "Anonymous"), and city/ZIP.

**Church page** — a "Prayer wall" section under the church details listing that church's prayers, newest first, with a "Post a prayer here" button that prefills the church. Prayers appear immediately; the church owner sees a remove control on each one, and posters can delete their own.

**After posting** — the existing congratulations flow, then the map centered on the glowing new prayer pin (public prayers) or the church's prayer wall (church prayers).

## Technical notes

- New table `public.prayers`: `owner_id`, `church_id` (nullable), `short_title`, `body`, `city`, `zip`, `lat`, `lng`, `anonymous`, `status`, timestamps. GRANTs for `anon` (select), `authenticated`, `service_role`.
- RLS: anyone may read active prayers; inserts restricted to `auth.uid() = owner_id`; update/delete by the owner or by the owner of the linked church.
- `src/lib/prayers.functions.ts`: `listPublicPrayers` (public, publishable-key client), `listChurchPrayers` (public, by church id), `createPrayer` / `deletePrayer` (`requireSupabaseAuth`). Geocoding reuses the existing `geocode.server.ts` path used by needs, including the ZIP fallback.
- Map wiring in `src/routes/map.tsx` and `src/lib/use-map-view.ts`: add a `"prayer"` mode alongside `view | near | church`, a prayer pin colour/glyph, and reuse the existing `highlight` glow and spotlight centering.
- Prayer detail reuses `MinistryPost`-style card rendering so spacing, gallery-less layout and the poster block match existing posts.
- New route `src/routes/_authenticated/post-prayer.tsx` with `church` and `place` search params; church page section in `src/routes/church.$id.tsx`.
- All new copy goes through `t()` so the translated languages pick it up.

## Verification

Typecheck and build, then a phone-sized run: post a public prayer and confirm the glowing pin and the Prayers filter; post a church prayer and confirm it shows on that church's wall and does **not** appear on the map; confirm a signed-out visitor can read both walls but is sent to sign in when posting.
