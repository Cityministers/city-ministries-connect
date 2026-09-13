# Post a Need / View Needs

Anyone in the city can post a need — a ride, groceries, help moving — the mirror side of posting a ministry.

## Splash screen

Two new buttons sit just above "Start Your Ministry", side by side on wide screens and stacked on phones:

- **Post a Need** — opens the need form (sign-in + confirmed email required first)
- **View Needs** — opens the needs list

"Start Your Ministry" stays the main highlighted button; the new pair uses the quieter dark style so the page keeps one clear focus.

## Posting a need

A short form, styled and sized like the create-ministry form:

- Short title (what shows on the map/list, e.g. "Ride to clinic")
- Full title (optional, one line)
- Description of the need
- City and ZIP — one of them required, no Portland default
- Profile photo — used as the need's icon on the map

Before the form opens:

1. The person must be signed in. If not, they land on the sign-in / create-account page and come back after.
2. Their email must be confirmed. If it isn't, they see a friendly panel: "Confirm your email to post a need", with a Resend confirmation button, instead of the form.

New accounts get a confirmation email on sign-up (auto-confirm stays off).

## Viewing needs

A **Needs** page at the same city/ZIP search as ministries, reusing the existing list row design:

- Profile photo as the icon, short title, city, and a short line of the description
- Tap a row to expand full details, same as the ministry list
- Search by city or ZIP at the top, carried through from the splash screen

Needs also drop as pins on the splash map, marked visually so they read as a request rather than an offer (a distinct accent and a small "Need" tag under the label). Tapping one opens the same detail popup used for ministries.

## Technical notes

- New table `public.user_needs`: owner_id, short_title, title, description, city, zip, avatar_url, timestamps. Grants for authenticated + service_role; RLS: everyone can read, owners can create/update/delete their own. Photos reuse the existing private avatar bucket with signed URLs.
- New `src/lib/needs.functions.ts` mirroring `ministries.functions.ts`: public `listUserNeeds` via the publishable-key server client, `createUserNeed` behind `requireSupabaseAuth`, which also rejects unconfirmed emails server-side.
- New routes: `src/routes/_authenticated/post-need.tsx` (form + email-confirmation gate) and `src/routes/needs.tsx` (public list with `place` search param).
- `src/routes/index.tsx`: add the two buttons in the footer CTA block above the Start link, and merge needs into the map pins with a `kind: "need"` marker so styling can differ.
- Shared mapper `src/lib/user-needs.ts` converting a need row into the `Ministry` shape the map/list components already render.
