# Fix: tapping a ministry icon on the map does nothing

## What's happening

The map ignores a tap when your finger moves even slightly. The map is drag-to-explore, so it tries to tell "drag" apart from "tap" — but the current rule counts any movement over about 2 pixels as a drag and cancels the tap. On a phone, a real finger almost always wobbles more than that, so the post never opens. With a desktop mouse the pointer holds perfectly still, which is why it works there and fails every time on mobile.

Confirmed by reading the map's drag handling: movement is accumulated from the very first pixel and any tap that follows movement is blocked, and the flag is only cleared on the next touch.

## The fix

1. Measure movement from where the finger first landed (not a running total of jitter), and only treat it as a drag past a comfortable threshold (about 10 pixels).
2. Also require the gesture to be a real drag before cancelling a tap, so a quick press-and-release always opens the post.
3. Clear the drag flag as soon as the finger lifts, so one wobbly drag can't swallow the next tap.
4. Give the icons a slightly more generous tap area so small pins are easier to hit with a thumb.

## Verify

Tap several icons on the map on a phone-sized screen — including a small wobble during the tap — and confirm the post opens each time, and that dragging the map still does not open a post. Same check on the Needs map, which uses the same map component.

## Technical notes

- `src/components/PanMap.tsx`: replace the incremental `moved.current` accumulation in `onPointerMove` with a distance-from-origin check against a ~10px threshold; record the pointer-down origin; reset `moved` in `endPointer` after the click-capture guard runs (use a short timeout or a `wasDrag` flag consumed by `onClickCapture`).
- `src/routes/map.tsx` and `src/routes/needs.tsx`: minor padding/hit-area tweak on the pin buttons only; no data or logic changes.
