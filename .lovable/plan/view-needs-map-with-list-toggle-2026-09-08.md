# View Needs map with list toggle

Make `/needs` open on a map of need pins, like the homepage. A List icon button beside the search bar switches to the current list view; switching back shows the map again.

## Changes

**`src/routes/needs.tsx` (rework)**
- Default view is a map: same dark city-map background image, need pins rendered as square rounded tiles (poster photo if uploaded, otherwise the ministry icon), with the rose "Need" label chip under each pin.
- Need pins reuse the existing rose tone styling so they read differently from ministries.
- Tapping a pin opens the existing `MinistryPost` detail popup (unchanged).
- Header keeps the place (city/ZIP) and text search fields; add a List icon button beside the search bar, matching the homepage's List button style.
- Tapping the List icon swaps the map for the current expandable list rows; in list mode the icon becomes a Map icon to toggle back. View state is kept in the URL (`view=map|list`) so back/forward and shared links work.
- List mode keeps the existing cards, count, "Post a Need" button, and empty-state message. Map mode shows a "No needs in {place} yet" message when empty.
- Pin positions: needs have no stored coordinates, so spread pins across the map with a stable pseudo-random position derived from the need's ID (same approach as `mapMinistries`).

## Notes
- No database or backend changes; reuses `listUserNeeds`, `toNeed`, `matchesPlace`/`matchesText`.
- `/needs?place=...` links from the homepage continue to work; `view` defaults to `map`.

## Technical details
- Files touched: `src/routes/needs.tsx` only (imports `city-map.jpg`, `toneStyles`, `List`/`Map` icons from lucide).
- Update the route head/title if needed; keep existing SEO meta.
