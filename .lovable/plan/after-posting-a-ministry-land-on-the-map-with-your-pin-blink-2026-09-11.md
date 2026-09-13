# After posting a ministry, land on the map with your pin blinking

Right now pressing "Post my ministry" sends people to the homepage. Instead, take them to the ministry map, centered on the city or ZIP they typed, with their new pin blinking so they can spot it — plus a red alert so they have a record of what they posted and when.

## What changes

**Land on the map**
- After a successful post, go to the ministry map instead of the homepage.
- The search bar at the top is pre-filled with the city and ZIP they entered on the form (for example "Portland, OR 97006"), so their area is what's shown.

**Blinking pin**
- The map highlights the freshly posted pin with a gentle pulsing glow ring so it stands out among the others.
- The blink keeps going until they tap the pin (which opens the post) or roughly 20 seconds pass, so the map doesn't stay busy forever.
- A short line under the map reads "Your ministry is live here" while the highlight is showing.

**Red notification**
- Posting a ministry now creates a notification for the poster: "Your ministry is live" with the short title, city/ZIP and the time it was posted, linking to the map.
- Because it's unread, the red dot appears on the profile picture right away, and the item shows in the Notifications list on the profile page with its timestamp.

## Technical details

- `src/routes/_authenticated/create-ministry.tsx`: on success, navigate to `/map` with `place` (city + ZIP) and a new `new=<ministry id>` search param.
- `src/routes/map.tsx`: extend `validateSearch` with optional `new`; match it against `user-<id>` pins, add a pulsing ring class, auto-clear the highlight after ~20s or on pin tap, and seed the search field from `place` as it already does.
- `src/styles.css`: add a `pin-pulse` keyframe/utility (soft lemon glow) alongside the existing `pin-drop`.
- `src/lib/ministries.functions.ts`: in `createUserMinistry`, after the insert, write a self-notification via the privileged client (the notifications table blocks direct inserts, and the existing `notifyUser` helper deliberately skips the actor, so this uses a direct admin insert loaded inside the handler). Kind `post_live`, link to the map with `place` and `new`.
- No database schema or policy changes needed.
