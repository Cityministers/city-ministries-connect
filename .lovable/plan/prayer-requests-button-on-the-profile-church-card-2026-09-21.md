# Prayer Requests button on the profile church card

Add a "Prayer Requests" button with a new-since-your-last-visit counter to each church card on the profile, and give pastors approval control over prayers posted to their church wall.

## What people will see

**On your profile (church card)**
- Just below the church name and address: a "Prayer Requests" button with the praying-hands icon in the blue prayer color.
- A small badge on it shows how many approved prayers have been added since you last opened that church's wall. No badge when there is nothing new.
- Tapping it opens that church's page scrolled to the prayer wall, and the badge clears.
- The "Show my church code" button and three-dot menu stay exactly as they are.

**On the church page**
- Prayers posted to a church now wait for the pastor. The person posting sees a short "sent to the church for approval" confirmation instead of the prayer appearing right away.
- Visitors only ever see approved prayers on the wall.

**For the church owner (church board page)**
- A "Prayer requests" section listing prayers waiting for review, each with Approve and Decline.
- Approving puts the prayer on the wall and notifies the person who posted it; declining removes it from the queue.

## Notes

- Public prayers posted from "Post a Prayer" on the homepage (not tied to a church) are unaffected — they still go live immediately and appear on the map.
- Existing church prayers stay visible; they are treated as already approved.

## Technical outline

Database migration:
- `prayers.status` gains a `pending` value for church prayers; existing rows keep `active`. Church prayers insert as `pending`, map prayers as `active`.
- Public read policy narrowed to `status = 'active'`; owner and church-owner policies allow reading and updating their pending rows.
- New table `public.church_prayer_views (id, user_id, church_id, last_seen_at, timestamps)` with unique `(user_id, church_id)`, GRANTs for `authenticated` and `service_role`, RLS limiting rows to `auth.uid()`.

Server functions (`src/lib/prayers.functions.ts`):
- `createPrayer` sets `status` by whether `churchId` is present.
- `listChurchPrayers` filters to `active`.
- `listPendingChurchPrayers`, `approveChurchPrayer`, `declineChurchPrayer` — church-owner gated; approve writes a notification to the poster.
- `churchPrayerCounts({ churchIds })` returns, per church, the approved-prayer count newer than that user's `last_seen_at`.
- `markChurchPrayersSeen({ churchId })` upserts `last_seen_at = now()`.

UI:
- `src/components/profile/ChurchQrTab.tsx` — counter query, new button below the address linking to `/church/$id` with a `#prayer-wall` hash, marking seen on tap.
- `src/routes/church.$id.tsx` — `id="prayer-wall"` anchor with scroll-on-hash, updated post-confirmation copy.
- `src/routes/_authenticated/church-board.$id.tsx` — pending prayer requests section.
- All new copy goes through `t()`.

Verification: phone-sized run — post a prayer to a church, confirm it is hidden until approved, approve it from the board, confirm the profile card badge appears and clears after tapping through.
