# "Ask friends about my gifts" — SHAPE gift references

## What you'll see

On the **Spiritual gifts** step of the SHAPE walkthrough, a new **"Ask friends or family"** button sits below the gift list and above the "Anything else about how God uses you?" box.

Tapping it opens a small panel where you:

1. Type a contact's first name (e.g. "Maria").
2. Get a personal link to copy and send by text or email yourself.
3. See each invite listed as **Waiting** or **Answered**.

The contact opens the link — no account needed — and sees:

> **How is Joseph spiritually gifted or talented?**

- The same 12 tappable gift chips from the SHAPE test (Teaching, Hospitality, Mercy, etc.)
- A free-text box: "Tell Joseph in your own words (optional)"
- A **Send to Joseph** button, then a thank-you screen

Back on your SHAPE page, each answered invite appears with the friend's name, the gifts they picked, and their note in quotes — plus an **"Add these gifts"** button that merges their picks into your own gift list. Nothing is added automatically; you review every response.

## Technical details

- **New table `gift_references`**: contact name, a unique unguessable share code, the picked gifts, the note, and when they answered. Only you can view or create your invites; responses are written through a validated server path.
- **Server functions** (`src/lib/gift-references.functions.ts`):
  - `createGiftReference` (signed in) — makes the invite + code
  - `listGiftReferences` (signed in) — your invites and responses
  - `getGiftReference` (public, by code) — returns only your first name + contact name for the form
  - `submitGiftReference` (public, by code) — validated with zod (gift list capped, note ≤600 chars), one response per code
- **New public route `/gift-reference/$code`** — the contact's form, with its own page title/description.
- **SHAPE page** (`src/routes/_authenticated/shape.tsx` + `src/data/shape.ts`) — the gifts list moves to an exported constant shared by both pages; the button/panel/responses render only on the "gifts" step.
- Uses the existing cathedral-glow theme, large mobile-friendly text and tap targets.

## Not included

- Automatic email/text sending — you share the link yourself (site email would need a sending domain first).
- Auto-adding friend picks to your answers — you approve each one.
