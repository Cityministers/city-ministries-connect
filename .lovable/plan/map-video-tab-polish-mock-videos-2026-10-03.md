# Map video tab polish + mock videos

## What you'll see

1. **One-line filter bar** — the "In this view" label is removed so the video camera icon sits on the same line as Nearest, Churches, and Prayers. The first tab becomes a compact "All" label (or icon) so nothing wraps on a phone.

2. **Stroked video camera icon** — the camera icon gets a visible outline/ring treatment (matching the other tab buttons' active ring style) so it reads clearly as a tappable tab.

3. **4 location tabs on the video screen** — when the video camera tab is active, a second row of tabs appears above the feed:
   - **All** — every approved video
   - **Near me** — videos near your profile ZIP
   - **Downtown** — videos in the downtown Portland area
   - **By ZIP** — type a ZIP to filter
   The map pins and the thumbnail feed below both follow the selected tab.

4. **4 mock videos** — four generated sample clips (2 neighborhood tours, 2 community concerns) around downtown Portland, each with a title, description, and thumbnail, uploaded to storage and marked approved so they appear publicly on the map and in the feed immediately.

## Technical details

- Edit the tab row in `src/routes/map.tsx` (lines ~339–373): drop the "In this view" text, add ring/stroke styling to the video tab button.
- Add a `videoTab` state ("all" | "near" | "downtown" | "zip") in `map.tsx`; filter `visibleVideos`/`videoPoints` by distance from profile location, downtown bounding area, or entered ZIP before rendering pins and `NeighborhoodVideoFeed`.
- Generate 4 short clips with the video generator, upload to the `neighborhood-videos` storage bucket, and insert 4 approved rows in `public.neighborhood_videos` (downtown Portland coordinates, duration within the 60–180s rule relaxed for mocks if clips are shorter — will adjust the check constraint if needed).
- Verify in the browser: tab bar fits one line on a 393px phone, icon stroke visible, all 4 tabs filter correctly, mock videos play.
