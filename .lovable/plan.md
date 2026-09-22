# Darker prayer blue (Muted Denim Blue)

User picked **Muted Denim Blue (#4A6FA5)** from three darker-blue options to replace the current prayer color (deep sky blue #5AA9FF). The color is defined in one token, so changing it updates every prayer-blue element at once: homepage "Post a Prayer" button, map prayer pins, church page buttons, prayer wall rows, prayer cards, and badges.

## Changes

1. **Color token** — `src/styles.css`: change `--color-prayer` from `oklch(0.72 0.13 250)` to `oklch(0.538 0.095 258)` (Muted Denim Blue #4A6FA5).
2. **Map pin color** — `src/lib/map-tones.ts`: change `PRAYER_PIN_COLOR` from `#5aa9ff` to `#4a6fa5`.
3. **Solid prayer-blue buttons read on the darker blue** — everywhere a button uses solid `bg-prayer` with dark `text-ink`, switch the text to parchment for contrast:
   - `src/routes/church.$id.tsx` — "Post a prayer here" button.
   - `src/routes/index.tsx` — homepage "Post a Prayer" button.
   - `src/routes/_authenticated/post-prayer.tsx` — selected map-option state.
   - `src/components/PrayerPost.tsx` — its action button.
   - `src/components/profile/ChurchQrTab.tsx` — prayer badge.
4. **View button matches "Post a prayer here"** — `src/routes/church.$id.tsx`: the "View" button (next to Post a prayer here) changes from the dark/outline style to solid `bg-prayer text-parchment` with the same size, rounding, and glow shadow as "Post a prayer here".

## Verification

- Typecheck/build clean.
- Playwright (phone size) on the church page: View and Post a prayer here match, homepage button and map pins show the new denim blue.
