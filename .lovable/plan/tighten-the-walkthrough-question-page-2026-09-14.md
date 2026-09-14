# Tighten the walkthrough question page

Three small layout edits to the `/shape` question page (dark cathedral-glow theme, phone-first):

1. **Remove the redundant place-step blurb**
   - In `src/data/shape.ts`, make `Step.blurb` optional (`blurb?: string`) and delete the blurb line from the `place` step ("This helps us suggest ministries and needs in your area.").
   - In `src/routes/shape.tsx`, only render the blurb paragraph when `current.blurb` exists.

2. **Move Save & exit below Next**
   - Remove the "Save & exit" text button from `src/components/VoiceAnswer.tsx`.
   - Render it in `src/routes/shape.tsx` directly below the main "Next" button, using the existing `saveAndExit` handler. Keep the same underlined text style.

3. **Shrink the voice button so the pen toggle sits neatly on the same row**
   - In `src/components/VoiceAnswer.tsx`, reduce the "Just talk, we do the rest" / recording button to a compact rounded-full size (e.g. `px-5 py-3 text-base`) and shrink the adjacent pen/mic icon button to match (`size-12`). Keep all states (record, stop, record-again, busy) readable and tappable.

After the edits, run `bunx tsgo --noEmit` and verify the build.
