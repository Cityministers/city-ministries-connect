# City Ministers — Splash Page + 3 Tutorial Pages

Build the "City Ministers" site in the selected **Cathedral glow** direction: deep indigo-ink background, jewel-toned panes (amethyst, teal, lemon, rose), Fraunces headings and Karla body text.

## Pages

### 1. Splash page (`/`) — minimal, three things only
- **Banner bar** with the City Ministers mark and a rounded search field pre-filled with "Portland, OR 97006", with a magnifying-glass icon so users can type a new city or ZIP code.
- **Map** with at least 3 ministry pins in **square containers**:
  - Coffee Chat (cup icon)
  - Ride Share (car icon)
  - Free Clothes (shirt icon)
  Pins drop in with a gentle animation and carry a small label beneath each.
- **Bottom call-to-action**: a "Start Your Ministry" button, with small print underneath reading "Create Account" and "Sign in" (placeholders until accounts are added later). The button leads into the tutorial.

No headline copy or how-it-works strip on the splash page — the tutorial covers that.

### 2. Tutorial pages (`/how-it-works/1`, `/2`, `/3`)
Three simple click-through instruction pages, one per step:
1. **Post your gift** — share what you offer and where you are.
2. **See who's nearby** — browse ministries on the map by distance and type.
3. **Send a note** — message the person and start a conversation.

Each page has its icon, a short explanation, a Next/Back click-through flow, and a "Skip" exit back to the splash page. Page 3 ends with the "Start Your Ministry" call-to-action.

## Technical details
- Rewrite `src/routes/index.tsx` as the splash page; add `src/routes/how-it-works.$step.tsx` for the 3 tutorial steps.
- Extend `src/styles.css` with the Cathedral glow palette (ink, ink-soft, amethyst, teal, lemon, rose, sand, mist) as semantic tokens in oklch; load Fraunces + Karla fonts via a `<link>` in the root route.
- Ministry icons in square containers using Lucide icons (Coffee, Car, Shirt).
- Unique page titles and descriptions for each route.
- No backend/accounts yet — Create Account and Sign in are visual placeholders until you're ready to add logins.
