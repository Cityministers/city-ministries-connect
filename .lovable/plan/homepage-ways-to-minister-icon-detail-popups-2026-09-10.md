# Homepage: "Ways to minister" + icon detail popups

## What changes

On the homepage (`/`):

1. **Rename the heading** "Ways to serve" → "Ways to minister".
2. **Icons become tappable popups.** Each ministry icon in the grid currently links to `/start`. Instead, tapping one opens a popup (dialog) showing:
   - The ministry's icon, title, and its short description
   - 1–2 Bible passages (ESV) that highlight that ministry, e.g. Coffee Chat → Hebrews 10:24–25 ("…encouraging one another…")
   - A small "Start this ministry" button at the bottom so people can still jump from a ministry idea into creating one (keeps the current navigation value)

## How

- `src/data/ministries.ts`: add a `scriptures: { text, reference }[]` field to each of the ~21 ministries, drafting fitting ESV passages for each type of service.
- `src/routes/index.tsx`: update the heading text; swap the `Link` grid items for buttons that open a shadcn `Dialog` styled in the cathedral-glow theme (ink surface, ring, Fraunces title, italic scripture quote + reference, matching the verse style already used at the top of the page).
- Mobile-friendly: dialog is bottom-anchored/centered and fully tappable; ESC/backdrop closes.

## Technical details

- Uses the existing shadcn dialog (same pattern as the map pin popups) — no new dependencies.
- Scripture text is authored content in the data file; no backend or database changes.
- Verify with a typecheck plus a Playwright pass: tap an icon on the preview, confirm the popup shows description + passages, and the "Start this ministry" button navigates to `/start`.
