# Back button on the map page

## What I found

Since the map moved to `/map`, every inner page (Needs, Ministries list, Start, Donate, Contact, About, Report Abuse, Profile, Post a Need, etc.) already has a back arrow that returns to `/map`. But the **map page itself has no way back to the homepage** — its header only has the hamburger menu, logo, and account icon.

## Change

- **Add a back arrow to the map page header** (`src/routes/map.tsx`), placed at the far left before/next to the hamburger menu, linking to the homepage `/`. Same round dark style used by the back buttons on other pages (ArrowLeft icon, aria-label "Back to home").

## Navigation check (no changes needed)

- All other pages' back arrows correctly point to `/map` — that still makes sense now that the map is the main browsing hub.
- Homepage links (See the map, Start Your Ministry, Post a Need, View Needs) all resolve to real routes.
- `/ministries` and `/needs` back buttons preserve the current city/ZIP search.

## Verify

- Typecheck, then screenshot the map page on mobile and desktop to confirm the back arrow appears and fits the header row.
