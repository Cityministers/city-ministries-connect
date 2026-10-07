# Gift-skill map powers the ministry suggestions

Use the uploaded Spiritual Gifts + Practical Skills Matcher workbook to make the SHAPE walkthrough's ministry ideas smarter and better explained — without making the walkthrough longer.

## What changes for members

- The walkthrough's gift step grows from 12 gifts to 22: the workbook's 20 (adding Healing, Knowledge, Wisdom, Prophecy, Tongues, Interpretation of Tongues, Miracles, Apostolic/Pioneering, Pastoral Care) plus the app's existing Hospitality and Intercession.
- The abilities step stays exactly as it is — members still pick broad abilities like cooking, driving, or music. No 136-item list, no 0–5 ratings.
- The ministry-ideas results screen gets noticeably better: each idea card's "why this fits you" can name the specific gift + skill pairing behind it (e.g. "Your gift of Mercy and your caregiving experience fit hospital visitation"), and ideas that match strong gift-skill combinations rank higher.
- A short responsible-use note appears on the results screen: suggestions are starting points for discernment, not proof of calling or qualification (mirroring the workbook's own caution).
- **"Fits your gifts" hints on post pages** — yes, worth including, and cheap once the map exists. On ministry and need detail popups, a signed-in member with a completed walkthrough sees a small line like "Fits your gifts: Mercy + caregiving" when the post's wording matches their top affinities. No hint shows for signed-out visitors or members without a profile, and nothing changes for the post's owner.

## How it works behind the scenes

1. **New data file `src/data/gift-skill-map.ts`** — the workbook's gift→skill weights (1–5) and example ministry expressions, transcribed into typed data. Hospitality maps to Helps/Service entries; Intercession maps to Healing's prayer-related entries.
2. **Ability bridging** — each of the app's ~14 broad abilities gets a mapping to the relevant catalog skills (e.g. Cooking → meal preparation, food service; Driving → transportation, delivery). This lives in the same data file.
3. **Richer AI prompt** — `generateMinistrySuggestions` in `src/lib/shape.functions.ts` now includes the member's top gift-skill affinities (computed from the weighted map, not raw keyword overlap) in the prompt, and asks the AI to cite the gift + skill pairing in each idea's "why it fits." The strict structured schema gains an optional `fitBasis` field for that explanation.
4. **Deterministic pre-scoring** — before the AI call, a small scoring function ranks the member's gift-skill clusters so the prompt leads with their strongest combinations; the AI still writes the ideas, but anchored to the map instead of free-associating.
5. **Fallback path** — when the AI is unavailable, the existing pre-made-ministry fallback uses the same affinity ranking to pick the closest matches instead of the current simpler matching.

## Out of scope (for now)

- No changes to the People-you-should-meet / posts-you-should-view scoring in `recommend.functions.ts`.
- No "fits your gifts" hints on post pages.
- No 0–5 skill self-rating step in the walkthrough.

## Technical notes

- `src/data/shape.ts`: gift option list extended to the 22 gifts; existing saved profiles keep working (old gift values remain valid).
- `src/data/gift-skill-map.ts` (new): typed gift→skill weight table + ability→skill bridges, derived from the uploaded workbook.
- `src/lib/shape.functions.ts`: `generateMinistrySuggestions` prompt and schema updated; new helper computes top affinities from the member's answers. Still `createServerFn` behind `requireSupabaseAuth`, streamed via the Lovable AI gateway (`openai/gpt-6-astra`, Responses API), with gateway errors surfaced per status as today.
- Results screen in `src/routes/shape.tsx`: renders the `fitBasis` line on each idea card and the responsible-use note; no layout overhaul.
- English-only labels for the new gifts initially, matching how the ministry reflections shipped.
