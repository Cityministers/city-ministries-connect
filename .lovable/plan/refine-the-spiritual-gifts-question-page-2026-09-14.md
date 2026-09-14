# Refine the Spiritual Gifts question page

Use the selected **Compact and grouped** dark-mode direction while keeping the existing questionnaire and saved progress intact.

## Page layout

- Simplify the top bar to the Back control and current question title; remove the step count and **Save & exit** from the header.
- Place **Step X of 13** with the progress bar at the top of the page content.
- Keep the current cathedral-glow palette, Fraunces headings, Karla text, and warm gold primary actions.
- Tighten spacing and group each question with its related controls so more of the choices remain visible on a phone.

## Voice and exit controls

- Replace the two visible reading choices with one clear read-aloud control that can play or stop the current question without changing the existing silent-by-default behavior.
- Keep **Just talk, we do the rest** as the prominent recording action.
- Move **Save & exit** immediately below the recording action, styled as a quieter secondary action.
- Preserve recording, transcription, manual choices, Next, Skip, and Skip to my ideas.

## Copy cleanup

- Remove the first-step paragraph beginning **“This is optional help…”**.
- Keep each step’s existing short description and question wording.

## Verification

- Check the page at the current phone size to confirm the title, progress, audio control, recording action, Save & exit, and answer choices do not overlap or clip.
- Confirm there is only one read-aloud control.
- Confirm Save & exit still saves answers and leaves the flow, and Next still advances through the existing questions.
- Confirm the project builds without errors.

## Technical notes

- Update the shared question-page layout in `src/routes/shape.tsx` and the read-aloud presentation in `src/components/ReadAloud.tsx`.
- No database, saved-answer format, question order, or navigation-flow changes.
