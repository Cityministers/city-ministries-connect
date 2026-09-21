# Prayer requests: photo, longer text, own color, and demo prayers

## What changes

1. **Prayer pins get their own look** — prayer requests keep the same praying-hands icon used by the "Pray With or For Someone" ministry, but switch from violet to deep sky blue (#5AA9FF), so prayer requests and prayer ministry posts are instantly tellable apart on the map.

2. **Longer prayers** — the prayer box accepts up to 1,000 characters (currently 800), with the counter updated to match.

3. **One photo per prayer** — the Post a Prayer form gains an optional single image picker with a preview and remove button. The photo shows at the top of the prayer card on the map and on church prayer walls.

4. **"Nearest to me" becomes "Nearest"** on the map filter row.

5. **Three demo prayers near downtown Portland** — realistic short prayers placed a few blocks apart:
   - one posted anonymously (shows "Anonymous", no photo or name)
   - two showing the poster's name and profile picture, one of them with a photo attached

   These are added as real rows owned by demo profiles so the cards behave exactly like live ones. Tell me when you're done reviewing and I'll delete them.

## Technical notes

- Migration: add `image_url text` to `public.prayers`; existing RLS and grants stay as-is. Seed rows inserted in the same migration with literal values, `owner_id` set to existing demo profiles, `church_id` null, real downtown lat/lng so no geocoding is needed.
- `PRAYER_PIN_COLOR` in `src/lib/map-tones.ts` → `#5aa9ff`; map prayer pins switch from `HandHeart` to `HandHelping` (the icon `pray-with-or-for-someone` uses in `src/data/ministries.ts`), matching `src/routes/map.tsx` pins and the Prayers filter button.
- `src/lib/prayers.functions.ts`: body max 800 → 1000; `imagePath` added to the create validator and `PrayerDTO` gains `imageUrl`, signed from the `ministry-avatars` bucket alongside the avatar signing already in `decorate()`.
- `src/routes/_authenticated/post-prayer.tsx`: single-image picker reusing `toPreviews`/`uploadMedia` from `src/lib/media-upload.ts` with prefix `prayer`, plus the 1,000-character counter.
- `src/components/PrayerPost.tsx`: renders the image above the title when present.
- All new copy routed through `t()`.

## Verification

Phone-sized run: map Prayers filter shows blue praying-hands pins distinct from green prayer ministry pins, the three demo prayers open correctly (anonymous vs named), and posting a new prayer with a photo and a long body saves and displays.
