# Move Needs count into the title and make it clickable

## Goal
On the Needs screen (`/needs`), move the current needs count from its standalone top-left position so it appears immediately after the "Needs near you" title text. Style it to match the title size, and make it clickable so it leads to the list view.

## Current state
- `src/routes/needs.tsx` renders the count as a small `ml-auto` span to the right of the `<h1>`.
- The title currently reads "Needs near you" with no count inline.

## Changes
1. In `src/routes/needs.tsx`, remove the standalone `{results.length}` span.
2. Append the count to the `<h1>` title, wrapped in a clickable element (Link or button) that navigates to `/needs?view=list` while preserving the current `place` search param.
3. Apply the same title typography (`font-display text-lg font-semibold sm:text-xl`) to the count so it visually matches the title.
4. Add an accessible label such as "View list of N needs".

## Verification
- Run TypeScript typecheck.
- Confirm build succeeds.
- Visually verify the count sits inline after "Needs near you" and matches title size; clicking it switches to list view.
