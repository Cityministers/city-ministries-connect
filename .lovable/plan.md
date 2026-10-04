# Owner CMS — run City Ministers from one page

## How you sign in
There's no separate admin password. Sign in with your own City Ministers account (the one with admin rights). The CMS opens only for that account. Church owners and church moderators can't see it.

## What you'll get
A new **CMS** page with these sections:

1. **Dashboard**: today/week/month activity counts and a "waiting for you" summary (churches, rooms, videos, room posts and reports waiting for approval).
2. **Approvals**: one queue for pending churches, rooms, neighborhood videos, room posts and church posts. Each item has Approve / Decline.
3. **Users & roles**: search members by name or email. You can view their posts, make someone a moderator or admin (or remove the role), suspend or unsuspend them, and delete their account (with a confirm step).
4. **All posts**: ministries, needs, prayers, videos and room posts, with filters by type and status. You can edit the title and text, hide or show a post, and delete it.
5. **Churches & rooms**: edit church name, address, description and status, and remove a church. For rooms: approve, edit, pin to the top, add to or remove from the default feed, and delete.
6. **Site text**: edit the wording on the About, Contact and Donate pages and the homepage tagline. The live pages read this text, and English stays as the fallback.
7. **Reports & feedback**: the existing abuse reports and feedback replies, moved in here.

## The CMS button
A gold **CMS** button at the top of your profile. Only your admin account sees it. The current Review Center button goes away, because the CMS replaces it.

## Technical details
- New route `/_authenticated/cms` with tabs selected by a search param. It reuses the existing admin tab components (approvals, stats, feedback, reports) and adds new ones.
- Every server function uses `requireSupabaseAuth` and checks `has_role(admin)` first. Privileged actions (role changes, suspend, delete user, editing other people's posts) load `supabaseAdmin` inside the handler, after that check.
- Migration:
  - add `profiles.suspended_at`
  - create a `site_content` table (key, value, updated_by), readable by everyone, writable by admins only, with grants and RLS
  - add `rooms.pinned`
- Suspended users can't create posts or messages. This is enforced in the existing create server functions.
- `/admin` redirects to `/cms` so old links keep working.
- About, Contact, Donate and the homepage read `site_content` through a public server function, falling back to the current text.
- Record the CMS module rule in AGENTS.md.
