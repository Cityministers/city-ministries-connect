# Focused buttons + personal recommendations at the end of the walkthrough

## What changes on the last page

Today the end of the walkthrough has overlapping buttons ("View saved ideas", "Skip to my ideas"). They get replaced by one clear stack, in this order, using the button styles already on the page:

1. **Your potential ministry posts** — ministries you could start, drawn from your answers
2. **Your potential needs posts** — needs you could post for yourself
3. **People you should meet** — neighbors whose gifts, heart, or city line up with yours
4. **Posts you should view** — existing ministry and need posts nearby that fit you
5. **Save & exit** (left) and **Show my ministry ideas** (right) — the amber pair you like, unchanged
6. **Start over** — the small red link below, unchanged

Buttons 1–4 use the same dark outlined pill style already used by the current bottom buttons. Each opens its own results view in place, with a Back arrow to return to the last page.

## What each button shows

**Your potential ministry posts / Your potential needs posts**
These come from the ideas already generated from your answers, now split by type: ministries you could offer versus needs you could ask for. Each card keeps the existing edit and post controls, so nothing about posting changes.

**People you should meet**
A short list (up to 8) of other members, ranked by how much you share: overlapping spiritual gifts, the same people or causes that stir you, matching abilities and resources, and nearness by city or ZIP. Each card shows their name, photo, and one line on why you match ("You both chose Mercy and Hospitality, and you're both in Beaverton"), plus a link to message them.

**Posts you should view**
A short list (up to 8) of existing ministry and need posts from other members, ranked the same way — your gifts, causes, abilities, and place against each post's words — with a line on why it fits and a tap-through to the post.

Both lists only ever include members who have posted publicly or finished their own walkthrough. If nothing scores well enough yet, the page says so plainly and points you to the map instead of showing weak matches.

## Technical notes

- `src/routes/shape.tsx`: rebuild the review-step action stack in the order above; remove "View saved ideas" and "Skip to my ideas". Add local view state (`"ministry" | "need" | "people" | "posts" | null`) rendered inside the existing `Shell` with a Back handler. Split saved/generated `MinistryIdea[]` by `kind` for buttons 1 and 2 — the generator already tags each idea `ministry` or `need`.
- New server function `recommendConnections` in `src/lib/recommend.functions.ts` (`POST`, `requireSupabaseAuth`), returning `{ people: PersonMatch[]; posts: PostMatch[] }`.
  - People: `shape_profiles` is owner-only under RLS, so read candidate rows with the admin client inside the handler (after the middleware has established the caller), join `profiles` for `display_name`/`avatar_url`, and return only name, photo, city, match score, and reason — never another member's raw answers.
  - Posts: read `user_ministries` and `user_needs` through the publishable client (both have public `status = 'active'` SELECT policies), excluding the caller's own rows.
  - Scoring is deterministic and server-side: weighted overlap of `gifts` + `customGifts`, `heart`, `abilities`, `resources`, plus a place bonus for equal ZIP or city; text fields matched against post title/description via the existing `OPTION_SYNONYMS` keyword map. Return the top 8 per list with a generated reason string. No AI call needed.
- Reuse `MinistryPost` for post cards so styling matches `/ministries` and `/needs`; message links reuse the existing conversation route.
- Colors stay on the existing semantic tokens (`ink-soft`, `sand`, `mist`, `ember`, `lemon`).
