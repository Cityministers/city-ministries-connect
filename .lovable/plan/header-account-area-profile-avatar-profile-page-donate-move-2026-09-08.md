# Header account area: profile avatar, profile page, Donate move

## Goal
Reorganize the splash header: hamburger menu stays top-left (site pages + Donate), account actions move to a top-right avatar area, and the search bar moves to its own row below the "City Ministers" title so the header never crowds on mobile.

## Layout changes (homepage header)

- **Top-left:** hamburger menu only. Menu links become About Us, Contact, Report Abuse, and **Donate** (moved out of the header, per your direction). Donate stays in the menu with its heart icon so it's easy to spot.
- **Center:** City Ministers icon + title, unchanged.
- **Top-right:** account area —
  - Signed out: a **Sign in** link (goes to `/auth`).
  - Signed in: the user's **profile photo** (falls back to initial/icon if none). Tapping it opens a small dropdown with **Profile** and **Sign out**.
- **Search bar:** moves to a full-width row directly under the title row, with the List button beside it — works the same on mobile and desktop.

## New profile page (`/profile`, sign-in required)

Signed-in users get a profile page containing:

- Profile photo with **Change photo** upload (reuses the existing avatar storage used by ministries/needs).
- **Edit profile:** name/display name field, saved to the existing `profiles` table.
- **Donate** button/link.
- **Sign out** button (uses proper sign-out hygiene: cancel/clear cached queries, sign out, redirect to `/auth` with history replace).
- **Delete account** section at the bottom: clearly labeled, requires typing a confirmation (or a confirm dialog), then permanently deletes the account and signs out.

The avatar dropdown's "Profile" item links here; "Sign out" signs out directly from the menu.

## Technical details

- `src/components/SiteNav.tsx`: remove header Donate button; add Donate to `menuLinks`; add top-right account area (session-aware: Sign in link vs avatar dropdown). Avatar reads the user's `profiles` row (name, avatar URL) client-side via the browser Supabase client; no protected loader on the public homepage.
- New route `src/routes/_authenticated/profile.tsx` (protected by the existing auth gate, `ssr: false`).
- New server functions in `src/lib/profile.functions.ts` (all behind `requireSupabaseAuth`):
  - `updateMyProfile` — update display name / avatar path on `profiles` (RLS already owner-scoped).
  - `deleteMyAccount` — deletes the user's data rows, then deletes the auth user via the admin client loaded inside the handler. Client then signs out and lands on the homepage.
- Avatar upload reuses the existing private avatar bucket + signed-URL pattern already used for ministry/need photos.
- `src/routes/index.tsx`: header grid becomes [menu | title | account] on one row; search + List button move to a second row below the title.
- No database schema changes needed (existing `profiles` table already holds name/avatar).

## Verification

- `bun run build` passes.
- Playwright check on the preview: signed-out header shows Sign in link; search sits below the title; hamburger contains Donate. (Signed-in avatar/profile/delete flows verified with an injected session if available.)
