# Spotlight a just-created post on the map

When someone finishes creating a post (for example the Coffee Chat ministry), the map should celebrate it: center it, make it glow, and keep it on top of every other pin until the person taps a different post.

## What will change

1. **Centered** — arriving on the map with a freshly created post recenters the map on that post instead of on the searched place, so it sits in the middle of the screen.
2. **Glowing** — the new pin gets a soft gold halo that gently pulses, so it clearly reads as "accepted and live".
3. **Always on top** — while it glows, no nearby pin can overlap or hide it.
4. **Stops on interaction** — the moment the person taps any other post (on the map or in the list below), the glow stops, the pin returns to normal, and it can be overlapped like any other. It no longer disappears on a timer.

## Technical notes

- `src/routes/map.tsx`: keep `highlightId` until the user selects a different post; remove the 20s timeout. Pass the highlighted post's coordinates as the map center when present (falling back to the searched place), and clear the highlight in the pin/list select handlers.
- `src/components/LiveMap.tsx`: extend `pinIcon` to draw a gold glow ring (SVG blurred halo) for highlighted pins; set `zIndex` to a high value for highlighted markers and a normal, position-based value otherwise. Add a lightweight pulse by alternating two icon variants on an interval while a highlight is active, cleared on unmount and when the highlight ends.
- Same treatment applies to `src/routes/needs.tsx`, which already shares `useMapPosts` and `LiveMap`, so a new need behaves identically.
