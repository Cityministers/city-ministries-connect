# Restore the map’s full size

## What I confirmed
- The Needs map and main map currently use the same height rule: 60% of the screen, with a 320px minimum.
- The Needs page has an additional search row and controls above the map, which can make the map appear compressed within a shorter desktop viewport.
- There are no current build or runtime errors causing the map container to collapse.

## Plan
1. Compare the rendered Needs map against the main ministry map at the current desktop size and the established phone size.
2. Restore the map’s previously approved visual proportions without shrinking its width or changing its pins, buttons, search, or needs list.
3. Keep every map view consistent so switching between Ministries, Needs, Churches, Prayers, and Videos does not resize the map.
4. Verify the full map and all surrounding buttons on desktop and phone before marking it fixed.

## Scope
- Map sizing and surrounding spacing only.
- No changes to map data, filters, posts, controls, or navigation.
