# YouVersion reading plans on every room

## What you'll see
- Each room page gets a Bible-app red button, "YouVersion reading plans", near the room title.
- Tapping it opens a popup that lists 3–5 real YouVersion reading plans on that room's subject. Each one shows its bold title and a short line, and opens the plan on bible.com in a new tab.
- This covers all 37 rooms: the 5 original topic rooms, How to Get Started, Words of Wisdom, and the 30 Ways to Serve rooms (for example, Coffee Chat gets plans on hospitality and friendship, and Write an Inmate gets plans on prison ministry and mercy).

## How the plans are chosen
- I'll search bible.com for each room's subject and only use plans I can confirm exist. Titles and links are copied exactly from the site.
- If a room's subject is very narrow, like Feed Chickens or Walk Your Dog, it gets the closest fitting plans (serving, stewardship, kindness) instead of a made-up match.

## Not changed
- Room posts, layout, colors, and other buttons stay the same.
- The button words show in English in other languages for now.

## Technical details
- New `src/data/room-youversion.ts`: a map from room slug to `{ title, blurb, url }[]`, where every url is a verified `https://www.bible.com/reading-plans/<id>-<slug>`.
- New `YouVersionPlansButton` component (uses the `youversion` color token, a Dialog list, and external links with `rel="noopener"`). It is rendered in `src/routes/rooms.$slug.tsx` only when the slug has entries.
- Plans are fixed in the app (no database change), so they load instantly and cost nothing per view.
