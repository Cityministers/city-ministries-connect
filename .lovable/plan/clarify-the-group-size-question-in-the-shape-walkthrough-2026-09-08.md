# Clarify the "group size" question in the SHAPE walkthrough

The "How many people at a time?" question in the scope step is being misread as "how many people are traveling with you." Reword it so users understand it refers to how many people they are comfortable serving or gathering with in a single ministry moment.

## Changes

1. Update the `groupSize` field label in `src/data/shape.ts`.
   - Current label: "How many people at a time?"
   - New label: "How many people would you serve or gather with at once?"
   - Keep the existing options: "One person", "2-4 people", "A small group", "A crowd".

2. Build check to confirm no type or compilation regressions.
