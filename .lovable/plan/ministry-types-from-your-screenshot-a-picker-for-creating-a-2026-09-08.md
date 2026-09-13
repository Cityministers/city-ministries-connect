# Ministry types from your screenshot + a picker for creating a ministry

## The 27 ministry types

The list becomes the official set, replacing the current placeholder names:

Coffee Chat · Volunteer at Church · Lend a Book · Dine-out in Public · Help Move or Labor · Used Clothes for Free · Dine-In Dinner Host · Clean or Organize · A Local Ride · Blind Date · Babysit · Host Prayer & Praise Event · Game Nite or Play Date · Community Service · Host Small Group Meeting · Fishing or Camping · Reach Out to Lost, Lonely, or Hurt People · Buy or Give Food (not money) · Romantic Double Date · Pray With or For Someone · Host a Homeless or Rehab Person · Intellectual Talks Over Wine or Beer · Use Your Artistic Abilities · Help Injured or Handicap · Write a Christian in Jail · Help With Handyman Services · Open to Requests

Each keeps the same look you already have: a dark square container with a white line icon, matched as closely as possible to the symbol in your screenshot (cup, church, book, crossed fork and knife, moving truck, shirt, house, sparkles, car, heart, smiley, music note, controller, hands, group, fish, speech bubble, shopping bag, calendar, praying hand, building, wine glass, palette, activity line, envelope, wrench, question mark).

## Where they show up

1. **Map** — pins keep using types from this list.
2. **List page** (the list icon by the search bar) — shows all 27, searchable.
3. **New: choose a ministry type** — tapping "Start Your Ministry" opens a page with all 27 as a tidy grid of the same square icon buttons. Tapping one selects it (a thin highlight outline, no checkmark), then a Continue button carries the choice into the next step.

## Details to confirm as we build

- Each type still gets a short description, a location, and a mock creator so the popup stays full. Names and stories are placeholders until you send real ones.
- Existing types not on your list (Rooftop Cinema, Karaoke Alley, etc.) are removed so the app matches your screenshot exactly.

## Technical notes

- Rewrite `src/data/ministries.ts` with the 27 entries, each with id, label, Lucide icon, tone, description, neighborhood, mock poster, counts; keep `position` on ~7 for map pins so the splash stays uncluttered.
- New route `src/routes/start.tsx`: grid picker, selection state, ring highlight on selected, Continue button; "Start Your Ministry" on the splash links here.
- List page and map read from the same data file, so no duplicate lists.
- No backend yet; selection is client-side until accounts/posting are added.
