# Start the map in downtown Portland

## Goal
When someone lands on the map, needs map, or ministries list, the "City or ZIP" search box should default to downtown Portland (where the mock posts are) instead of the current suburban ZIP.

## Changes
1. Update the fallback location string in three route files:
   - `src/routes/map.tsx`
   - `src/routes/needs.tsx`
   - `src/routes/ministries.tsx`
   Change the default from `"Portland, OR 97006"` to `"Portland, OR 97209"`.
2. Keep `DEFAULT_CENTER` in `src/lib/use-map-view.ts` as-is (it already points to downtown Portland).
3. Verify the geocoded center for `"Portland, OR 97209"` lands near the mock posts and that the map list populates on first load.

## Acceptance
- Opening `/map` shows "Portland, OR 97209" in the search box.
- The map centers on downtown Portland / NW Portland.
- Mock ministry and need pins in the 97209 area appear without dragging.
- Same default applies to `/needs` and `/ministries`.
