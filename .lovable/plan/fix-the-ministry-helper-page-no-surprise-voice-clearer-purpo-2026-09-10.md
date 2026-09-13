# Fix the ministry helper page: no surprise voice, clearer purpose, easy exit

Three fixes to the "Help me create a ministry" walkthrough.

## 1. Nothing talks until you ask it to

Right now the voice is ON by default (it only stays off if you previously chose "I'll just read it myself"), so the page starts reading questions out loud the moment it loads — and again on every new question.

- Change the default to OFF. The page is silent when it opens.
- The "Hear this question" button still reads the current question aloud when tapped.
- A "Read the questions to me" toggle turns the voice on for the rest of the walkthrough (remembered for next time); "I'll just read it myself" turns it back off.

## 2. Reframe the page — it's optional help, not a test

The page leans on the S.H.A.P.E. acronym (step titles like "S — Spiritual gifts"), which reads like an assessment. Reframe it as an optional helper that writes ministry posts for you:

- Page title and browser tab: "Ministry ideas made for you" instead of S.H.A.P.E. language.
- Step headings drop the "S —", "H —" letter prefixes; they just say "Spiritual gifts", "What you care about", etc.
- Intro line on step one: one sentence saying this is optional — answer a few questions by talking, and we'll write ready-to-post ministry ideas for your city; you can skip it and post your own anytime.

## 3. A way out on every step

Today the only exit mid-walkthrough is a small back arrow, and the "See form results" / "Start over" buttons only exist on the final results screen. Add escapes everywhere:

- A clearly labeled "Exit" link in the header of every step, next to the back arrow, that leaves the walkthrough and returns to the Start page.
- On the last question step, a "Skip to my ideas" button so nobody has to finish every question to see results.
- The results screen keeps its existing buttons: See them on the map, Show me different ideas, See form results, Start over.

## Technical notes

- `src/components/ReadAloud.tsx`: default state becomes off unless localStorage explicitly says "on"; auto-play effect unchanged but now inert until the user opts in. Toggle labels stay the same.
- `src/routes/_authenticated/shape.tsx`: update `head()` meta title/description, drop the `${current.letter} — ` prefix from the Shell title, add an intro sentence on step 0, extend `Shell` with a right-side "Exit" link to `/start` on all steps, and add a "Skip to my ideas" action on the final question that jumps to generation with whatever answers exist.
- No database or server-function changes. Styling follows existing cathedral-glow tokens.
