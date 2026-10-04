# Homepage ministry tiles: icon + title on one row, tagline below

## What changes

On the homepage "Ways to minister" section:

1. **Tiles become full-width rows** — one down the page on a phone (two across on a larger screen), instead of a 2-across grid of stacked icon-over-title buttons.
2. **Icon and title share a row** — the colored icon square sits at the left, the ministry name reads beside it.
3. **A one-sentence tagline sits under the title** — a short line in the ministry's own spirit, e.g. Coffee Chat → "A cup of coffee and someone willing to listen."
4. **Tapping still opens the same popup** — description, reflection paragraphs, scriptures and the "Start this ministry" button are untouched.

Taglines are written in English only for now; other languages keep showing English for these new lines until translated later.

## How

- `src/data/ministries.ts`: add an optional `tagline` to the ministry type and write one short sentence for each of the 30 seed ministries. Optional, so user-created posts (which have no tagline) keep working.
- `src/routes/index.tsx`: rebuild the tile as a row — icon container at the left (unchanged size and color), then a text column with the title on top and the tagline beneath it in softer, smaller text. Grid switches to one column on a phone, two on wider screens.
- The popup, the map splash pins, and the "Create a Post" ministry list are not touched.

## The 30 taglines

| Ministry | Tagline |
| --- | --- |
| Coffee Chat | A cup of coffee and someone willing to listen. |
| Volunteer at Church | Lend your hands to the house of God. |
| Lend a Book | Pass on the book that changed you. |
| Dine-out in Public | Share a meal where life is visible. |
| Help Move or Labor | Show up with strong hands and no invoice. |
| Free Clothes | Good clothes, no price tag, no questions. |
| Dine-In Dinner Host | Set one more place at your table. |
| Clean or Organize | Give a tired home room to breathe. |
| A Local Ride | Be the way someone gets where they need to go. |
| Blind Date | Introduce two people who would click. |
| Babysit | Give exhausted parents a night to themselves. |
| Host Prayer & Praise Event | Open a room for neighbors to seek God together. |
| Game Nite or Play Date | Fun that makes room for faith. |
| Community Service | Love the block you live on. |
| Host Small Group Meeting | Open your door to a handful of neighbors. |
| Fishing or Camping | Talk with God on the water or by a fire. |
| Reach Out to Lost, Lonely, or Hurt People | Notice the neighbor nobody notices. |
| Buy or Give Food (not money) | Feed someone with your own hands. |
| Romantic Double Date | Pair two people you actually trust. |
| Pray With or For Someone | Say their name out loud before God. |
| Host a Homeless or Rehab Person | A bed, a meal, and no catch. |
| Intellectual Talks Over Wine or Beer | Ask the hard questions over a glass. |
| Artistic Abilities | Make something that lifts someone else. |
| Help Injured or Handicap | Meet a body's limits with practical help. |
| Write an Inmate | Letters to the people the world forgot. |
| Help With Handyman Services | Fix what's broken for someone who can't. |
| Open to Requests | Tell me what you need and I'll come. |
| Free Haircuts | A free haircut and a listening ear. |
| Walk Your Dog | Walk a dog, meet the neighbor on the porch. |
| Feed Chickens | Watch a backyard flock while its owner is away. |

## Technical details

- `Ministry` type gains `tagline?: string`; `toMinistry()` in `src/lib/user-ministries.ts` builds user posts without one, so the tile renders the tagline only when present.
- Tagline text is passed through the existing translator, so locale files can pick it up later with no code change; missing keys fall back to English.
- Layout follows the responsive row pattern: `grid` tile, `min-w-0` and `truncate`-safe text column, `shrink-0` icon container.
- Verify with a typecheck plus a phone-width browser pass: 30 tiles render one down, each showing icon, title and tagline without clipping, and tapping a tile still opens its popup.
