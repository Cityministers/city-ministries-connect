# Fix the profile photo step and "Finish setup"

## What's happening

The page you're describing is the setup page you land on right after creating an account — the one with the "Finish setup" button. The photo improvements I made are already in the preview, but they have not been published yet, so your phone is still showing the older version. That's why the upload area looked unchanged.

Separately, "Finish setup" can fail silently-ish on a phone: if the photo is rejected (too large, or an unsupported type like a HEIC photo straight from an iPhone), the page shows a raw technical message or nothing useful, so it just looks broken.

## What I'll change

1. **Bigger photo preview** — the circular preview grows to a large, clearly visible size with a prominent "Change photo" / "Remove photo" pair underneath.
2. **Allow bigger photos** — raise the allowed image size to 10 MB (currently the storage limit is lower), so normal phone photos go through.
3. **Shrink large photos automatically** — before uploading, resize very large images down in the browser so they upload fast on mobile data and rarely hit any limit at all.
4. **Plain-language errors** — replace technical failures with clear messages shown right above the button, in a visible red box:
   - "That photo is too large. Please pick one under 10 MB."
   - "That file type isn't supported. Please use a JPG or PNG photo."
   - "Your photo couldn't upload — check your connection and try again."
   - "Please add your name." / "Add your city or ZIP."
5. **Never block finishing** — if only the photo fails, offer "Finish without a photo" so you're never stuck on that screen.
6. **Publish** so the fixes are live on cityministers.com.

## Technical notes

- File: `src/routes/_authenticated/welcome.tsx` — enlarge preview, add client-side validation (size/type), canvas-based downscale before upload, and map Supabase storage errors to friendly copy.
- Raise the `ministry-avatars` bucket `file_size_limit` to 10MB via the storage tool (project-wide limit raised if needed).
- Same photo-error handling applied to the post pages (`create-ministry.tsx`, `post-need.tsx`) since they upload to the same bucket.
