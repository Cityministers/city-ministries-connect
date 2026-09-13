# Move action buttons above the map and tighten mobile layout

## Problem
On mobile the homepage map expands and pushes the "Post a Need" / "View Needs" buttons down below the map. There is also too much vertical space between the search bar and the map.

## Changes

**`src/routes/index.tsx`**
- Move the "Post a Need" / "View Needs" button row out of the footer and place it directly beneath the search/List row in the header area.
- Remove or reduce the vertical padding/gap between the search row and the map so the map sits directly under the buttons.
- Keep the map container from expanding infinitely on mobile: give it a fixed mobile height (e.g. `h-[360px]` or similar) instead of relying on `flex-1`, while preserving the existing `sm:h-[460px]` desktop height.
- Leave the "Start Your Ministry" button and sign-in/create-account links in the footer below the map.
- Ensure the layout still works on desktop (buttons can remain in the same relative order, just relocated above the map).

## Verification
- Run `bunx tsgo --noEmit`.
- Capture a mobile Playwright screenshot of `/` to confirm the buttons are visible under the search bar and the map starts immediately below them.
- Capture a desktop screenshot to confirm no regression.

## Files touched
- `src/routes/index.tsx` only.
