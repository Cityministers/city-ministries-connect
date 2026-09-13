# Simplify "Start Your Ministry" — account first, one clear path

The current /start page stacks three unrelated actions at once (Create Account / Sign in buttons, an agreement checkbox, the two creation buttons, and a 27-item type picker), which makes it hard to tell what to do first. This redesign gives signed-out visitors one job — create an account — and gives signed-in users one job — pick how to start their ministry.

## Signed-out view: account prompt only

When someone who isn't signed in visits /start, they see:

- The same header ("Start Your Ministry") so the page still feels familiar.
- A single centered card: a short line like "Create a free account to post your ministry on the map," with two large buttons — **Create Account** (gold) and **Sign in** (outline). These carry a `next=/start` return so after signup/sign-in they land right back here.
- Nothing else: no agreement checkbox, no creation buttons, no type list, no sticky Continue bar.

## Signed-in view: one decision

Once signed in, the page shows only the ministry-starting choices:

1. **Create a unique ministry** — goes to the custom form (unchanged behavior).
2. **Help me create a Ministry** — goes to the SHAPE walkthrough (unchanged).
3. **Or choose a pre-made ministry** — the existing single-column list of 27 types, with selection highlight and the sticky **Continue** bar (unchanged behavior).

## What gets removed

- The User & Privacy Agreement checkbox block on /start is deleted. The identical checkbox already lives on the signup form (`/auth`), where it gates account creation — so agreement is still collected exactly once, at the moment it matters.
- The duplicated Create Account / Sign in buttons on /start are replaced by the single prompt card above.

## Why this is less confusing

- One page = one decision. Signed out: "make an account." Signed in: "how do you want to start?"
- No dead/grayed-out buttons or mystery checkboxes blocking things.
- Returning signed-in users skip the account clutter entirely.

## Technical notes

- Edit `src/routes/start.tsx` only. Use the existing `useSession()` hook (`src/hooks/useSession.ts`) to branch: while the session is still loading, show the header with a subtle loading state (avoids flashing the wrong view).
- Signed-out branch: prompt card with `Link to="/auth" search={{ mode: "signup", next: "/start" }}` and `Link to="/auth" search={{ next: "/start" }}`. The auth page already honors `next`.
- Signed-in branch: existing two-button grid + pre-made list + sticky Continue; drop the `agreed` state and the agreement/`Create Account`/`Sign in` block entirely.
- After finishing the welcome profile setup, users already land back on their intended page, so the flow /start → /auth → /welcome → /start works with the existing `next` handling.
- No database, route, or backend changes. Styling follows existing cathedral-glow tokens.
