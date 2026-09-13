# Plan: Remove broken map zoom buttons and enlarge posts

## Goal
Make the map easier to use for elderly visitors by removing the non-working +/- zoom buttons and making ministry/need pins and list cards larger by default.

## What we will change

1. Remove the broken zoom controls from the map
   - In `src/components/PanMap.tsx`, remove the "Zoom in" (+) and "Zoom out" (-) buttons from the bottom-right control stack.
   - Keep the "Recenter map" button and all drag/pinch/Ctrl+scroll behavior.

2. Enlarge map pins on both `/map` and `/needs`
   - Increase the pin avatar/icon container from `size-14` to `size-16` on mobile and `sm:size-16` to `sm:size-18` on larger screens.
   - Increase the icon inside from `size-6` to `size-7` (mobile) and `sm:size-7` to `sm:size-8`.
   - Increase the label text below pins from `text-sm` to `text-base` and widen the label box slightly so longer titles remain readable.
   - Keep owned-ministry "Yours" badge and pulse highlight behavior.

3. Enlarge list-card text on `/ministries` and `/needs`
   - Increase ministry/need title from `text-2xl sm:text-3xl` to `text-3xl sm:text-4xl`.
   - Increase description/snippet text from `text-base sm:text-lg` to `text-lg sm:text-xl`.
   - Increase metadata (city/ZIP, category, engagement counts) from `text-sm sm:text-base` to `text-base sm:text-lg`.
   - Keep card padding, images, and layout unchanged.

## Out of scope
- No changes to pinch-to-zoom, Ctrl+scroll zoom, or drag panning.
- No changes to the popup/detail view (`MinistryPost.tsx`) or the homepage.
- No database or server changes.

## Verification
- Run `bunx tsgo && bun run build` after edits.
- Open `/map` and `/needs` to confirm the +/- buttons are gone, pins are larger, and text is readable.
- Toggle to list view on `/ministries` and `/needs` to confirm larger card text.