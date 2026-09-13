# "Help me create a Ministry" — guided SHAPE walkthrough

A step-by-step questionnaire that learns who someone is, then suggests personalized ministry ideas they can post to the map.

## The flow

Tapping "Help me create a Ministry" on the start screen opens a guided walkthrough with a progress bar, Back/Next buttons, and answers saved to their account as they go (sign-in required, same as posting a ministry).

Steps:

1. **Where you serve** — city and/or ZIP (required; carries into the posted ministry).
2. **About you** — first name, age range, marital status, and how much time per month they can give.
3. **Your family** — optional. Add children by name and age (add/remove rows), plus anyone else at home. Used for family-friendly suggestions.
4. **S — Spiritual gifts** — pick from a list (teaching, hospitality, mercy, encouragement, giving, leadership, service, faith, evangelism, administration, intercession, discernment) plus an optional note.
5. **S continued** — "Which of these feels most like you?" a few short either/or questions to narrow the top gifts.
6. **H — Heart** — the causes they care about (kids, elderly, homeless, addiction recovery, single parents, immigrants, prisoners, grief, marriage, students, disability, neighbors nearby) plus "what breaks your heart?" free text.
7. **A — Abilities** — practical skills (cooking, driving, repairs, music, tech, teaching, hair/beauty, medical, finance, languages, gardening, writing, sports, childcare) plus a free-text line.
8. **P — Personality** — a short DISC-style set: energized by crowds vs. one-on-one, planner vs. spontaneous, leading vs. supporting, steady routine vs. variety.
9. **P continued** — preferred setting: home, public place, church, outdoors, online, on the move.
10. **E — Experiences** — life chapters they've walked through (loss, illness, divorce, addiction, immigration, military, poverty, foster care, career change, raising kids) plus an optional story field. Clearly marked private and optional.
11. **Scope** — how far they'll travel, how often, group size, and whether kids are welcome.
12. **Review** — a plain-language summary of their SHAPE, then "Show my ministry ideas."

## The results screen

Lovable AI reads the whole profile — location, family, gifts, heart, abilities, personality, experiences, and scope — and returns 4–6 personalized ministry ideas. Each idea card shows a short title (what appears under the map pin), a fuller title, a description, why it fits them (referencing their own answers), and a family-friendly tag when children are included. At least one suggestion is a family ministry when children were entered.

Each card has "Use this idea," which opens the existing create-ministry form pre-filled with that title, description, and city/ZIP — they can edit anything before posting. A "Show me different ideas" button regenerates, and a "Start over" link resets the questionnaire.

Where the AI is unavailable or credits run out, the screen says so plainly and still offers the closest matching pre-made ministries plus the manual create option.

## Technical notes

- New route `src/routes/_authenticated/shape.tsx` (multi-step state in one component, step in the URL search param so Back works), plus a shared question definition file `src/data/shape.ts`.
- New table `public.shape_profiles`: one row per user (`owner_id` unique), JSONB `answers`, `children` (name/age array), `city`, `zip`, timestamps. RLS owner-only for select/insert/update/delete, with GRANTs for `authenticated` and `service_role`. Answers autosave via an upsert server function.
- New table `public.shape_suggestions` storing the generated ideas per user so results survive a refresh; same owner-only RLS and GRANTs.
- New `src/lib/shape.functions.ts` with `saveShapeProfile`, `getShapeProfile`, and `generateMinistrySuggestions` — all `createServerFn` behind `requireSupabaseAuth`, Zod-validated.
- Suggestion generation calls Lovable AI (`openai/gpt-6-astra` via the gateway Responses API, streamed server-side) with a strict structured schema for the idea cards; gateway errors surface in the UI per status.
- `src/routes/start.tsx`: replace the "coming soon" note with a link to the new walkthrough.
- `src/routes/_authenticated/create-ministry.tsx`: accept optional prefill values from search params; no change to its posting logic.
- Styling follows the existing cathedral-glow tokens, square icon containers, and the larger mobile text sizes already used on the create form.
