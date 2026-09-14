# Re-arrange walkthrough actions and add Start over

Update the `/shape` question-page action bar so the primary and secondary actions are side by side, and add a destructive "Start over" option below them with a clear warning.

1. **Add a server function to delete saved progress**
   - In `src/lib/shape.functions.ts`, add `deleteShapeProfile` (authenticated) that deletes the current user's rows from `shape_profiles` and `shape_suggestions`.

2. **Rearrange Save & exit and Next into one row**
   - In `src/routes/shape.tsx`, place **Save & exit** on the left and **Next** on the right in a single flex row. Keep **Next** as the full-height lemon primary button. Make **Save & exit** a compact secondary button (outlined/underlined style) so it fits the narrow phone width.

3. **Add Start over below the row**
   - Where **Save & exit** currently sits, render a **Start over** text button.
   - Clicking it opens a confirmation dialog/warning that says all saved answers will be permanently deleted and the user will need to begin again from the first step.
   - On confirm: call `deleteShapeProfile`, reset local state (`answers` → `emptyAnswers`, `step` → 0, clear `ideas`/`posted`), and return to step 0.

4. **Typecheck and verify**
   - Run `bunx tsgo --noEmit` and check the build log.
   - Take a phone-sized preview screenshot of `/shape` to confirm the new button layout and the Start over warning.
