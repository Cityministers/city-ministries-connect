# Map attribution styling

The map already uses a dark basemap and has `disableDefaultUI: true`, so the zoom control is the only built-in UI left. The "extra info" at the bottom is Google's required attribution: logo, Terms of Use, and report-a-map link. Google's Terms of Service require that these stay visible and clickable, so we cannot remove them entirely.

What we can do is make them much less bright so they blend into the dark map instead of looking like a bright footer strip.

## Proposed change

Add a small CSS rule scoped to the `LiveMap` container that:

1. Applies a subtle dark gradient overlay across the bottom ~56 px of the map to visually merge the attribution strip with the map background.
2. Uses `filter: brightness(0.7) contrast(0.9)` on the Google attribution container so the white text and logo dim to the same low-contrast level as our `mist/40` text tokens.
3. Leaves the attribution clickable and readable; it only becomes quieter.

## Scope

- Only touches `src/components/LiveMap.tsx` and/or `src/styles.css`.
- No change to map controls, pins, list, or search behaviour.
- Applies to every place `LiveMap` is used (`/map` and `/needs`).

## Out of scope

- Removing the Google logo or Terms link entirely (not allowed by Google Maps Platform Terms of Service).
- Adding a custom "dark mode" toggle for the map (the map is already dark).
