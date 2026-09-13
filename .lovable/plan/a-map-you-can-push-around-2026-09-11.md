# A map you can push around

Right now the map is a fixed picture with a handful of icons pinned to it. Anything without a hand-placed spot never shows up, and the view can't move. This makes the map a real, draggable neighborhood board — for ministries and for needs.

## What changes for people using the site

- Drag the map with a thumb or mouse to travel to nearby areas. Trackpad and mouse-wheel scrolling pan too, and pinch works on phones.
- Every posted ministry and every posted need appears on the map — no more invisible posts.
- Posts cluster by ZIP code. Each ZIP occupies its own patch of the map, so moving your thumb sideways carries you into the next ZIP's cluster.
- Titles sit under each icon and never overlap: icons are placed on a spaced grid inside their ZIP patch, and a long title wraps to two lines instead of running into a neighbor.
- Searching a city or ZIP glides the map to that cluster instead of filtering everything else away, so surrounding areas stay explorable.
- A small "Recenter" button snaps back to the searched area, plus + / − buttons to pull back for the wide view or move in close.
- Your own ministries keep their glow and "Yours" badge; a freshly posted one still pulses.
- Needs keep their own dark-and-white look on their own map.

## Where it applies

- The ministry map page
- The needs map view (same behavior, same controls)

## Technical notes

- New shared component `src/components/PanMap.tsx`: a viewport `div` with a large inner canvas transformed by `translate(x, y) scale(z)` with `transform-origin: 0 0`, and the city map image tiled via `background-repeat` so the surface never runs out.
- Interaction via Pointer Events (`pointerdown/move/up`, `setPointerCapture`) for drag, plus a native non-passive `wheel` listener for pan and ctrl-key pinch-zoom, anchored at the cursor: `next = clamp(z * Math.exp(-dy * 0.0015), 0.5, 2)` with the standard offset correction. `touch-action: none` on the viewport; two-pointer pinch handled with the same anchor math. Offsets held in a ref plus rAF-driven state so drag stays smooth.
- New `src/lib/map-layout.ts`: groups posts by normalized ZIP (falling back to city), assigns each ZIP a district cell on a spiral grid keyed by a stable hash of the ZIP, then places posts inside the district on a jittered grid with a fixed cell size wide enough for icon + two-line title. Deterministic — the same post lands in the same spot every render.
- `mapMinistries` (the `position`-filtered export) and the hardcoded `position` strings in `src/data/ministries.ts` / `src/lib/user-ministries.ts` are retired in favor of computed coordinates; pins render with absolute `left`/`top` pixel values on the canvas.
- `src/routes/map.tsx` and `src/routes/needs.tsx` render `PanMap` with their pin content as children; place search sets the target district and animates the offset there rather than filtering the pin list. Existing dialog/highlight/owned-pin logic is preserved.
- Map area grows to fill available height (`flex-1`, `min-h-[70dvh]`) for maximum visibility.
