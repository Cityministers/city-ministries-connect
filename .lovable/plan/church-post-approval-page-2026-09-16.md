# Church post approval page

Today a church owner approves posts in a small "Requests waiting on you" box inside the owner tools on their church page. This gives churches a proper approval page, plus the option to trust a member so their future posts appear right away.

## What the church owner gets

A new page, "Church board", reachable from a button on their church page (and from the notification they already receive when someone requests).

The page has two tabs:

1. **Waiting for you** — each request shows the poster's name, whether it's a ministry or a need, the title, a short description, and the town. Three actions:
   - Approve — the post appears on the church page.
   - Decline — it does not.
   - Always allow this person — approves this post and adds them to the trusted list, so anything they send in future is listed straight away.
2. **Who can post** — the trusted list. Each person shows their name, photo, and when they were trusted, with a Remove button (removing does not take down posts already approved). A note explains that everyone else's posts wait for approval.

Also on the page: a list of posts already on the board with a "Take off the board" button, so an owner can remove something later.

The small requests box on the church page stays, but becomes a short summary with a "Review requests" button that opens the new page, and shows a count when something is waiting.

## What the person posting sees

No change to how they ask — the church picker in the success dialog stays the same. The only difference: if the church already trusts them, the picker says "Listed at {church name}" instead of "Sent for approval", because it goes up right away.

## Notifications

- Owner still gets notified on a new request, and the link points at the new board page.
- The poster now gets a notification when their post is approved or declined, linking to the church page.

## Technical notes

Database migration:
- New table `public.church_members` (church_id, user_id, added_by, created_at) with unique (church_id, user_id). GRANTs for authenticated and service_role. RLS: church owner can read/insert/delete rows for their own church; a member can read their own row. Public read is not needed.

`src/lib/churches.functions.ts`:
- `requestChurchPost` checks `church_members` for the caller; if trusted, inserts the link with status `approved` and returns `{ status: "approved" }`, otherwise `pending` as today plus the owner notification.
- `setChurchPostStatus` (owner-only check added) also inserts a notification for `requested_by`.
- New owner-only functions: `listChurchBoard` (pending + approved links with poster names), `listChurchMembers`, `addChurchMember` (also approves the pending link when given one), `removeChurchMember`, and reuse of `setChurchPostStatus` for removal from the board (`declined`).

Routes/UI:
- New `src/routes/_authenticated/church-board.$id.tsx` — owner-gated (redirect to the public church page if not the owner), two tabs, dark cathedral-glow styling matching the Review Center cards.
- `src/routes/church.$id.tsx` — requests box becomes a count plus "Review requests" link to the new page.
- `src/components/ChurchPicker.tsx` — success copy branches on the returned status.
