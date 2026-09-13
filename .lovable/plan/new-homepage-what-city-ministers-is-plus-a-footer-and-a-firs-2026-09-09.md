# New homepage: what City Ministers is, plus a footer and a first-time setup step

## What changes for visitors

**The main page becomes a real homepage.** Instead of opening straight onto the map, `/` explains what City Ministers is and what people can do here:

- A short headline and one-paragraph intro.
- Three or four sections describing the main things the site does: find ministries near you on a map, start your own ministry (pre-made types or your own), post a need and browse needs from neighbors, and message people directly with saved favorites, an inbox and alerts.
- Buttons into the app: See the map, Start Your Ministry, Post a Need, View Needs.
- The "New here? Create Account · Sign in" line moves here from the old splash and sits under the main buttons (hidden once signed in).

**The map moves to its own page** at `/map`, keeping everything it has today: search by city or ZIP, ministry pins, the list button, Post a Need / View Needs and Start Your Ministry. Anything currently linking back to the map points to `/map`.

**A footer on every page** with: About Us, Contact, Report Abuse, User Agreement, Donate. The hamburger menu stays as it is so nothing breaks for people used to it.

## First-time setup and where people land

- After someone confirms their account, they go to a short setup page asking for their display name, a photo (optional) and their city or ZIP.
- Once they save it, they land on the new homepage — this happens once.
- Every sign-in after that takes them to the map, as before.
- If someone skips setup and goes elsewhere, they will be sent back to setup until it's saved.

## Content

I'll write the descriptive copy from what the site already does. Placeholder-free, but you can hand me your own wording later and I'll swap it in.

## Technical notes

- New route `src/routes/map.tsx` receives the current body of `src/routes/index.tsx` (search params, pins, popup and CTAs unchanged). `src/routes/index.tsx` becomes the marketing/overview page with its own `head()` metadata; `/map` gets distinct metadata too.
- New `src/components/SiteFooter.tsx` rendered in `src/routes/__root.tsx` around `<Outlet />`, linking to the existing `/about`, `/contact`, `/report-abuse`, `/terms`, `/donate` routes.
- Migration on `public.profiles`: add `city text`, `zip text`, `onboarded_at timestamptz`. Existing owner-scoped policies already cover these; no new table, no new grants.
- New route `src/routes/_authenticated/welcome.tsx` for the setup step, writing through a new server function in `src/lib/profile.functions.ts` that sets the fields and stamps `onboarded_at`.
- `src/routes/auth.tsx`: after signup/confirmation, default destination becomes `/welcome`; existing `next` search param still wins. Welcome save navigates to `/`. Sign-in for an already-onboarded account keeps landing on `/map`.
- Onboarding check reads `profiles.onboarded_at` in the `_authenticated` layout's data path; redirect to `/welcome` when null, excluding `/welcome` itself to avoid a loop.
- Verify with a typecheck, a build, and Playwright screenshots of `/`, `/map` and `/welcome` on mobile and desktop.
