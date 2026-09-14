# Answer by talking or by writing

Remove the read-aloud feature from the question page and let people switch between speaking and typing their answer.

## What changes

- Remove the "Read this and following questions" control from the question page. Nothing reads questions out loud anymore.
- Keep the talking answer exactly as it is: the big **Just talk, we do the rest** button, the live recording animation while speaking, and the written-out answer afterwards.
- Add a pen button right next to **Just talk, we do the rest**.
  - Tapping the pen switches that area to a writing box where the answer can be typed. What is typed is saved as the answer, the same as a spoken one.
  - Once in writing mode, the pen button becomes a microphone button. Tapping it returns to the **Just talk, we do the rest** option.
  - Switching modes keeps whatever answer is already there, so nothing is lost.
- If a recording is in progress, switching to writing stops it first.
- Everything else stays: Next, Save & exit, Skip this one, Skip to my ideas, progress, and the tappable answer choices.

## Verification

- On a phone-size view, confirm no read-aloud control remains, the pen sits beside the talk button, tapping it shows a writing box with a mic button, and tapping the mic returns to the talk button.
- Confirm a typed answer and a spoken answer both carry forward with Next and Save & exit.
- Confirm the project builds without errors.

## Technical notes

- `src/components/VoiceAnswer.tsx`: add a `mode` state ("voice" | "write"); render a pen/mic toggle button next to the record button; in write mode render a textarea bound to `value` calling `onText` (debounced or on blur/change). Stop any active recording when switching to write.
- `src/routes/shape.tsx`: remove the `ReadAloud` import and its render block (~lines 782-784).
- `src/components/ReadAloud.tsx` and `src/lib/speak.functions.ts` stay in the codebase, unused, in case reading aloud returns later.
- No database, saved-answer format, or navigation changes.
