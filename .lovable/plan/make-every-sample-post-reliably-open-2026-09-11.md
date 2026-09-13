# Make every sample post reliably open

## What I verified

- Eight mock neighbors exist with names, portraits, and biographies: Maria Salcedo, Pastor Sam Delgado, Ruth Abara, Marcus Okafor, Bethany Cole, Dee Whitfield, Grace Lin, and Andre Boone.
- They own 37 sample ministries and 19 sample needs.
- The post window already displays the neighbor’s name, biography, portrait, post description, and contact controls when it opens.
- Only three current posts contain an additional gallery/cover image; most use the neighbor portrait or ministry icon.
- A clean simulated tap can open a visible post, but the map can suppress real phone taps when normal finger movement is interpreted as dragging.
- The earlier reported test was invalid because it accidentally opened the hamburger menu instead of a ministry post.

## Changes

1. Replace the fragile tap-versus-drag handling so touching a pin opens it reliably, while dragging empty map space still pans the map.
2. Prevent a pin touch from starting map movement; preserve mouse, thumb, and pinch navigation outside pins.
3. Apply the same behavior to both ministry and need maps.
4. Confirm every sample post resolves to its assigned mock neighbor and that portraits, biographies, and available post photos appear in the opened details.
5. Test multiple visible ministry and need icons using true mobile touch events, including slight finger movement, repeated taps, map dragging, and opening/closing several posts.

## Acceptance checks

- Every visible ministry and need icon opens on one normal phone tap.
- A slight finger wobble still opens the post.
- Dragging the map background moves the map without opening a post.
- Opened sample posts visibly show the assigned neighbor profile and image.
- No page, console, or loading errors occur on the mobile view.

## Credit finding

Credits are charged for build/planning requests, not individually for each profile. For September 11, this project shows 69.81 credits: 58.70 build, 11 planning, and 0.11 hosting. No separate image-generation charge appears in that daily breakdown.
