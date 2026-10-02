# Make same-titled buttons identical in color

Two button titles currently appear in more than one color across the app. The homepage version of each becomes the standard, and every other button with the same title gets the exact same color scheme. Only colors change — shape, size, text, and behavior stay untouched.

## Canonical color schemes (from the homepage)

- **Post a Need** — purple: `bg-tone-indigo/15`, light sand text, `ring-1 ring-tone-indigo/45`, hover `bg-tone-indigo/25`
- **Post a Prayer** — deep slate blue: `bg-prayer-deep`, parchment text, `ring-1 ring-prayer/40`

## Changes

1. **`src/routes/ministry-mindset.tsx`** (~line 335) — the "Post a Need" button is green (`tone-emerald`). Change it to the homepage purple scheme.
2. **`src/routes/start.tsx`** (~line 109) — the "Post a Prayer" button uses the lighter outlined blue (`bg-prayer/20`, ring `prayer/55`). Change it to the homepage deep slate scheme.
3. **`src/routes/map.tsx`** (~line 476) — the "Post a Prayer" button uses the lighter outlined blue. Change it to the homepage deep slate scheme.
4. **`src/routes/church.$id.tsx`** (~line 946) — the lower "Post a prayer here" button uses the lighter outlined blue while the upper one (~line 490) already uses the deep slate. Change the lower one to the deep slate so both match.

Already matching (no change): homepage and Create a Post "Post a Need", the Needs page "Post a Need", the homepage "Post a Prayer", the upper church-page "Post a prayer here".

Not touched: buttons with different titles (e.g. "Post this prayer" on the prayer form, "View", message buttons) and the business-card graphic.

## Verification

Typecheck, then check each changed page in the browser to confirm the four buttons now match their homepage twins and nothing else shifted.
