# "Start this ministry" jumps straight to the details form

## What changes

Pressing **Start this ministry** in a homepage popup takes the user directly to the ministry details form — no more landing on the Start page and scrolling to re-find the ministry type.

- **Signed in:** they land on the details form with the title and description of the ministry they picked already filled in (e.g. Coffee Chat's title and description). They just adjust details and post.
- **Not signed in:** they're sent to create an account / sign in first, then returned to that same pre-filled form automatically.

## How

- `src/routes/index.tsx`: the popup's "Start this ministry" button links to `/create-ministry?short=<label>&desc=<description>` for that ministry, instead of `/start`.
- `src/routes/_authenticated/create-ministry.tsx`: already accepts `short`/`title`/`desc` prefill parameters — just confirm the incoming values prefill the fields as-is (no code change expected here).
- The `/start` page and its Continue flow stay untouched for anyone who browses there directly; this change only affects the homepage popups.
- Note: this path skips the short "how it works" tutorial slides, since the user already chose a concrete ministry. First-time posters can still reach the tutorial from `/start`.

## Technical details

- `/create-ministry` sits behind the existing sign-in gate, so the account requirement and post-signup return trip are already handled.
- No backend or database changes. Verify with a typecheck plus a Playwright pass: signed-in click on a homepage icon → lands on the form with that ministry's title/description filled in.
