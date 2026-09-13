# Speak your answers, then post the ministries we write for you

Replace the typed S.H.A.P.E. questionnaire with a spoken one, and turn the results into ready-to-post ministries and needs.

## Recording the answers

Each step of the walkthrough shows its question and a single large Record button.

- Tap to record, tap to stop. A timer runs while recording, and a small waveform shows it's hearing you.
- When you stop, the words appear on screen within a few seconds so you can confirm we heard you right. Re-record replaces the answer.
- Multi-choice steps (gifts, heart, abilities, experiences) keep their tappable buttons, and anything you say is matched against that list and highlighted automatically — you can still tap to correct it.
- No typing anywhere in the walkthrough. If the microphone is blocked or unavailable, the step explains how to allow it and offers the tap-to-choose lists.
- A final "Just tell me about yourself" step lets you talk freely for up to a few minutes with the prompts listed on screen; whatever you cover there fills any gaps.
- Recordings are never kept. The audio is used to produce the text, then discarded.

## The results: 3-10 posts, ready to publish

After the last step we write 3 to 10 suggested posts from everything you said. Each card shows:

- The short title that appears under the map pin, the fuller title, the description, and one line on why it fits you.
- A tag saying whether it's a **Ministry** (something you're offering) or a **Need** (something you're asking for), plus a family tag when your children can join.
- **Edit** — opens the card in place so you can change the short title, title, description, city and ZIP before it goes anywhere.
- **Post** on each card, and **Post all** at the top.

Posted cards show a "Posted" check and a link to see them on the map. "Give me different ideas" regenerates; "Start over" clears the walkthrough. If the AI is unavailable or credits run out, the screen says so plainly and keeps your answers.

## Editing after posting

Your profile's Posts tab already lets you edit, repost and delete each ministry or need. Posts created here land in that same list, so nothing new is needed there — this plan only adds the edit step before posting.

## Technical notes

- New `src/lib/transcribe.functions.ts`: `transcribeAnswer` server fn behind `requireSupabaseAuth`, taking base64 audio plus its MIME type and posting multipart to `https://ai.gateway.lovable.dev/v1/audio/transcriptions` with `google/gemini-3.5-transcribe`. Non-streaming, returns the text only; gateway status errors surface per `ai-gateway-error-semantics`. Nothing is written to storage.
- New `src/components/VoiceAnswer.tsx`: Web Audio capture (`getUserMedia` + `ScriptProcessor`/worklet) encoded to 16 kHz mono WAV so Safari and Chrome both produce a complete file; guards empty/silent clips; posts base64 to the server fn. Browser-only, loaded behind `ClientOnly`.
- `src/data/shape.ts`: each step gains a spoken prompt string and, for multi steps, keyword hints used to auto-select options from the transcript. `ShapeAnswers` gains a `freeTalk` field.
- `src/routes/_authenticated/shape.tsx`: fields render as voice answers instead of inputs; adds the free-talk step; results screen gains per-card edit state, Post, Post all, and posted state.
- `src/lib/shape.functions.ts`: `generateMinistrySuggestions` prompt now consumes transcripts and free talk, returns 3-10 items, and the strict schema gains `kind: enum["ministry","need"]`. `MinistryIdea` gains `kind`.
- New `postSuggestion` server fn (auth required) inserting into `user_ministries` or `user_needs` from an edited idea, reusing the same validation as the manual create forms.
- Migration: add `free_talk` text and `transcripts` JSONB to `shape_profiles`; widen `shape_suggestions.ideas` usage (no schema change needed, JSONB). Owner-only RLS and GRANTs unchanged.
- Styling follows the existing cathedral-glow tokens and the larger mobile text sizes already used in the walkthrough.
