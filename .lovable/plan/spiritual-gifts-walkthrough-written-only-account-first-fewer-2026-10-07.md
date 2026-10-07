# Spiritual gifts walkthrough: written-only, account first, fewer steps

## 1. Remove audio
- Remove the "Just talk, we do the rest" button, the pen/mic toggle and recording from every question page.
- Every question shows its written answer box and tappable choices directly.
- Answers people already gave by voice stay saved as text.

## 2. Require an account first
- Opening the walkthrough signed-out sends people to sign in / create an account, then returns them to the walkthrough.
- Everyone who reaches the walkthrough has finished profile setup (name, city, postal code, country, photo), so:
  - Remove the "Where will you serve?" step — city/postal code come from the profile.
  - Remove "First name" from "A little about you" — the name comes from the profile.
- Ideas, "Use this idea" prefills and recommendations keep using the profile's city and name.

## 3. Shorter walkthrough: 17 screens down to 9

Suggested new order (nothing is lost — questions are merged, and a few become optional):

| # | New step | Combines |
|---|---|---|
| 1 | About you | age, marital status, time per month, kids/household (family) |
| 2 | Spiritual gifts | gift picks + the "which feels more like you" pairs trimmed to the 3 most useful |
| 3 | Your heart | causes + "what breaks your heart" |
| 4 | Abilities & what you can share | skills + resources |
| 5 | Personality & setting | 4 key pairs (down from 6) + preferred settings |
| 6 | Experiences & past service | life chapters + where you've served (both optional) |
| 7 | Scope & serving together | travel, frequency, group size, availability, who joins you |
| 8 | Your dream (optional) | dream + what's in the way |
| 9 | Review → Show my ideas | |

Also: the intro screen is removed (start lands on step 1), and "Skip to my ideas" stays available on every step.

## Verification
- Signed-out visit to the walkthrough redirects to sign-in and returns afterward.
- No microphone controls anywhere in the flow; typed answers save and carry forward.
- Step counter reads "Step X of 9"; existing saved answers still appear in the merged steps; ideas generate with the profile's city.
- Phone-size check for clipping; build passes.

## Technical notes
- `src/routes/shape.tsx`: move to `src/routes/_authenticated/shape.tsx` (login + onboarding gate already handled there); drop `VoiceAnswer` import/render; render field inputs always; read city/zip/name from `profiles` when saving and generating.
- `src/data/shape.ts`: delete `place` step and `firstName` field; merge step definitions per the table; keep `ShapeAnswers` keys unchanged so saved data remains compatible.
- `src/lib/shape.functions.ts`: fall back to profile city/zip/display name when answers lack them.
- Update links pointing at `/shape` (start page, menus) — URL path stays `/shape`.
- `VoiceAnswer.tsx` and transcription remain in the codebase, unused.
