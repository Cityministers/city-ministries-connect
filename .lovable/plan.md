# Join a church, and carry its QR code on your profile

Today only a church owner can add someone to their church. This adds a way for
regular members to say "I attend here", and once the church approves them, their
own profile carries the church's QR code so they can show it to anyone.

## What a member sees

1. On a church page, a signed-in visitor gets an **"I attend this church"** button.
   Tapping it sends a request and the button becomes "Waiting for approval".
   Signed-out visitors are sent to create an account and come back.
2. Once the church approves, they get a notification and a new **QR code tab**
   appears on their profile, sitting above Notifications.
3. The tab shows a card: the church photo, its name, and the QR code beneath it.
4. Tapping the card opens it full screen: large scannable QR code, church photo,
   full address, and a **"See it on the map"** link that opens the map with the
   church's pin glowing. A close button returns to the profile.
5. If they attend more than one church, the tab lists a card per church.

## What the church owner sees

On their church board, a new **"People who say they attend"** section lists
pending requests with Approve and Decline. Approving adds them to the same
trusted list that already exists, so their posts appear at the church right away
(as chosen). Owners can still remove someone later.

## Technical notes

- `church_members` gains a `status` column (`pending` | `approved`), defaulting to
  `approved` so every existing row keeps working, plus a nullable `added_by` path
  for self-requests. New RLS: a signed-in user may insert their own
  `pending` row (`user_id = auth.uid()`), and may read their own rows; owners keep
  full read/update/delete on their church's rows. Owner approval flips status to
  `approved`. Existing trusted-poster checks are narrowed to `status = 'approved'`.
- New server functions in `src/lib/churches.functions.ts`:
  `requestChurchMembership`, `myChurchMembershipStatus`, `listMyChurches` for
  members (approved memberships with church name, photo, address, city/zip),
  `approveChurchMember` / `declineChurchMember` for owners. All auth-gated; the
  approval path reuses `assertChurchOwner` and sends the existing
  `notifications` row to the member.
- `src/routes/church.$id.tsx`: attend button in the visitor panel, hidden for the
  owner, state-driven from `myChurchMembershipStatus`.
- `src/routes/_authenticated/church-board.$id.tsx`: pending attendee list wired to
  the approve/decline functions.
- `src/routes/_authenticated/profile.tsx`: a `qr` tab key added to the search
  validator and a QR entry placed above the Notifications link; new
  `src/components/profile/ChurchQrTab.tsx` renders the cards and the full-screen
  overlay, generating the code with the existing `qrcode` dynamic import used on
  the church page. The map link reuses the map's `place` + spotlight search params
  so the church pin glows on arrival.
- All new copy goes through `t()` so it follows the existing language switch.

## Verification

- Typecheck and build clean.
- Phone-sized run: request membership from a church page, approve it on the board
  as the owner, then confirm the QR tab, the enlarged view, and the map link.
