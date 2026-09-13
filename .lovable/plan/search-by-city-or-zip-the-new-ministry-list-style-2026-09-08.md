# Search by city or ZIP + the new ministry list style

## Search

The search bar accepts a city name or ZIP code. Typing one filters what's shown:

- On the map: only pins in that area, with a short "no ministries here yet" note when nothing matches.
- On the list page: the same filter, plus matching by ministry title, creator, or neighborhood.
- The searched place is remembered when moving between the map and the list, so the list opens showing the same area.

## The list (style you picked)

Tapping the list icon beside the search bar opens the list of ministry cards. Each collapsed card shows:

- The ministry's dark square icon, with the creator's round profile photo tucked into its lower-right corner
- The ministry title in the serif heading face
- The neighborhood, a thin accent rule, and a distance badge ("0.4 mi")
- A divider, then thumbs-up, favorite, and comment counts

Tapping a card expands it in place into the detail view: the ministry photo across the top fading into the card, the creator's avatar and name overlapping that photo, the full title and description, and the "Let's set a time" and "Message" buttons stacked full width. Tapping again collapses it; only one card is open at a time. The three-dot Report Abuse action stays available in the expanded card.

Each card's accent (rule, distance badge, glow) uses that ministry's own color, so the list keeps the varied jewel tones.

## Notes

- Distances are illustrative for now — real distances need each ministry's coordinates, which we can add when the ministries become real posts.
- Ministries without a photo show a large icon panel in place of the cover image, so the expanded card never looks broken.

## Technical details

- `src/data/ministries.ts`: add `city` and `zip` per ministry (Portland-area values) plus a `distanceMi` number for the badge.
- Shared `matchesPlace(ministry, query)` helper in `src/lib/` — matches ZIP exactly, city/neighborhood case-insensitively; empty query matches all.
- `src/routes/ministries.tsx`: rewrite rows as the selected card design; expansion is local `expandedId` state rendering the detail body inside the card (replacing the modal for the list page); keep `MinistryPost` for the map popup.
- Location shared via a `place` search param (`zodValidator` + `fallback`), set from the search bar on both routes and carried on the List link.
- New tokens if needed in `src/styles.css`; no hardcoded hex — use existing ink/sand/mist/tone tokens.
