# Two ways to start a ministry

## What changes on the "Start Your Ministry" screen

Just under the header, above the grid of ministry icons, two buttons appear side by side:

1. **Create a unique ministry** — opens a form to make your own.
2. **Help me create a ministry** — placeholder for now: it shows a short "coming soon" note. Details get added later.

The existing grid of 27 pre-made ministry types stays below, unchanged.

## The "Create a unique ministry" form

Fields:
- **Short title** (limited to about 24 characters) — this is what shows under the icon on the map and in the list.
- **Full title** (optional, longer) — used at the top of the popup.
- **Description** — what you're offering.
- **City or ZIP** — where it belongs; the pin lands in that area.
- **Profile photo** — uploaded from the phone. This photo becomes the round icon on the map and in the list, instead of a drawn symbol.

A live preview shows how the pin will look while they type. Posting saves it and sends them to the map, where their ministry appears among the others and opens the same detail popup as the rest.

## Accounts and saving

Posts are saved for real so they show up for everyone, which means turning on Lovable Cloud (built-in database, photo storage, and logins). Creating a ministry requires being signed in, so this also adds:
- Sign in / create account with email and password, plus Google sign-in.
- The existing "Create Account" and "Sign in" links on the splash become real.
- Anyone, signed in or not, can browse the map and list.
- Only the creator can edit or delete their own ministry.

## Technical notes

- Enable Lovable Cloud. Migration creates `profiles` (id, display name, avatar path) and `ministries` (id, owner_id, short_title, title, description, city, zip, type_id nullable, avatar_url, created_at), each with GRANTs, RLS on, public SELECT for `anon`/`authenticated`, and insert/update/delete scoped to `auth.uid() = owner_id`.
- Public storage bucket `ministry-avatars`; upload path prefixed by user id, with an owner-scoped write policy.
- Reads through a public server function using the publishable client; writes through `createServerFn` with `requireSupabaseAuth`. Map and list merge the seeded demo data in `src/data/ministries.ts` with rows from the database.
- New routes: `src/routes/_authenticated/create-ministry.tsx` (the form) and `src/routes/auth.tsx` (sign in / sign up). `src/routes/start.tsx` gains the two buttons; "Help me create a ministry" points at a stub panel.
- `MinistryPost` and the list card render a circular photo when a ministry carries `avatar_url`, falling back to the existing square Lucide icon for the pre-made types.
