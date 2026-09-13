# Welcome page layout and photo-upload fixes

## What changes

On `/_authenticated/welcome` ("Welcome — let's set you up"):

1. **Bigger intro text** — increase the "Just three quick things..." subtitle from `text-sm sm:text-base` to `text-base sm:text-lg` so it is easier to read on mobile.

2. **Bigger form labels** — increase the label text size for "Your name", "City", "ZIP", and "Photo (optional)" from `text-sm` to `text-base`.

3. **Replace the tiny file input with a clear photo-upload button** — hide the default `<input type="file">` and show a single, larger button labeled "Choose photo" (or similar) that triggers the file picker. Remove the duplicate inline preview next to the file input.

4. **Keep one clean preview** — after a photo is chosen, show it as a centered, larger circular avatar preview above or beside the upload button, not as a second small thumbnail next to the native input.

5. **Add a remove-photo option** — when a preview is shown, include a small "Remove" link so users can undo their choice without re-opening the picker.

## Files to edit

- `src/routes/_authenticated/welcome.tsx` — adjust text sizes and rebuild the photo upload area.

## Verification

- Run `bunx tsgo --noEmit`.
- Take Playwright screenshots of `/welcome` at mobile (393 px) and desktop widths to confirm the subtitle, labels, and upload button are clearly readable and the preview appears once.
