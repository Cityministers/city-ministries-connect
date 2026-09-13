# Pick a ministry icon when posting a need

Right now every posted need shows the same generic helping-hands icon unless the person uploads a photo. This adds a second option: choose one of the existing ministry types (Coffee Chat, Ride Share, Free Clothes, and the rest) and use its icon and title.

## What changes on the Post a Need form

Above the short title field, two choices:

1. **Choose from the ministry list** — opens a single-column list of the pre-made ministry types, same look as the Start Your Ministry page: square icon tile, title, one-line description. Tapping one selects it and fills the short title with that ministry's name (still editable).
2. **Customize my own** — the current behavior: type your own short title and optionally upload a photo used as the icon.

Switching between the two is reversible; picking a ministry clears an uploaded photo choice, and uploading a photo clears the picked ministry, so there is never a conflict about which icon shows.

A small preview near the top shows exactly what the pin will look like — icon tile plus short title.

## Where the chosen icon shows up

- The map pin on the home screen uses the chosen ministry icon instead of the generic one.
- The View Needs list and the expanded card use the same icon.
- Needs keep their distinct rose "need" color so they stay visually separate from ministries.
- Existing needs already posted keep the current generic icon; nothing breaks.

## Technical details

- Migration: add a nullable `category` text column to `public.user_needs` (stores a ministry id from `src/data/ministries.ts`). No new grants or policy changes needed since the table already has them.
- `src/lib/needs.functions.ts`: accept an optional `category` in the create input (validated as a non-empty short string), persist it, select it in `listUserNeeds`, and return it on `UserNeedDTO`.
- `src/lib/user-needs.ts`: in `toNeed`, resolve `dto.category` against the `ministries` array and use that entry's `icon`; fall back to `HandHeart`. Keep `tone: "rose"` and `isNeed: true`.
- `src/routes/_authenticated/post-need.tsx`: add mode state (`pick` | `custom`), the category list UI reusing `toneStyles` and the same list markup pattern as `src/routes/start.tsx`, the pin preview, mutual clearing of photo/category, and pass `category` to `createUserNeed`.
- Verify with a typecheck and a browser pass over `/post-need`, `/needs`, and the home map.
