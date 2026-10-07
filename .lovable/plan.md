# Spiritual Rant — voice-only reflection at /rant

A new page where a signed-in member speaks freely ("rants") into their microphone. The app turns the speech into text, pulls out the key themes, and responds with matching Bible verses (via YouVersion) plus matching ministries and needs from the app. **The audio is never uploaded or stored** — it is transcribed once in memory and discarded.

## What the member sees

1. **/rant page** (linked from the hamburger menu and a homepage tile): a big microphone button, a live recording indicator, and a 90-second soft cap with a gentle auto-stop.
2. After they stop: a short "Listening…" state, then three sections:
   - **What we heard** — 3–6 keywords/themes (e.g. "loneliness", "provision", "fear").
   - **Verses for you** — 2–4 Bible passages matched to those themes, shown as ScriptureCards with live text through the existing YouVersion connection (BSB now, NIV when approved), each linking to YouVersion.
   - **Ways to act on it** — ministries and needs already in the app whose text matches the themes (reusing the gift-skill/post matching style), each linking to its post.
3. A "Rant again" button to start over. Nothing is saved; leaving the page discards everything.

## How it works (technical)

- **Recording:** reuse the walkthrough's old voice pattern — `getUserMedia({ audio: true })` + MediaRecorder in the browser, producing a small audio blob.
- **Transcription:** reuse the existing `transcribeAnswer` server function (or a thin variant capped at ~90s): it sends the audio once to the speech-to-text endpoint and returns only text. Audio is never written to storage or the database — same guarantee as today.
- **Keyword extraction:** new authenticated server function `analyzeRant` — sends the transcript to the AI (default model) with a strict JSON schema: `{ themes: string[], verseRefs: string[], summary: string }`. The model picks themes and 2–4 fitting, well-known verse references.
- **Verse display:** verse refs render through the existing `ScriptureCard` / `useLiveVerseText`, so text comes live from YouVersion with stored fallback.
- **Ministry/need matching:** server-side text match of the themes against `user_ministries` titles/descriptions (reuse the `postGiftFit`-style word matching, no walkthrough profile required), returning up to 4 posts with links.
- **Auth:** page requires sign-in (redirects to /auth?next=/rant), matching the walkthrough pattern. No new tables, no storage, no moderation queue — nothing persists.

## Out of scope

- No saving/sharing of rants, no public feed, no video.
- English-only labels for now (consistent with other new features).
