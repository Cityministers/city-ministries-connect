# Room posts: photo/video uploads, admin approval, congratulations popup

Applies to the five community rooms (Christian World News, Bible & Theology Questions, World Missions, End Times Conversations, Faith, Hope & Love).

## What users will see
- **Add a photo or video** button under the "write a post" box. One photo (with the existing square crop) or one short video per post, with a preview and a remove option before sending.
- After tapping Post, a **congratulations popup** in our signature style: "Your post was sent for approval. You'll get a notification when it's live." with an OK button.
- Their pending post shows only to them, marked "Waiting for approval".
- Replies still post right away (no approval), text only.

## What admins will see
- On each room post: a three-dot admin menu with **Approve**, **Hide**, and **Delete**.
- Pending posts appear at the top of the room for admins with Approve / Decline buttons.
- A new **Rooms** tab in the Review Center listing all pending room posts across the five rooms, with the photo/video, author, and Approve / Decline.
- The author gets a notification when their post is approved or declined.

## Rules
- Existing seeded posts stay live.
- Photos up to 10 MB, videos up to 50 MB.
- Only the author, or an admin, can delete a post. Only admins can approve or hide.

## Technical details
- Migration on `room_posts`: add `status` (`pending` | `approved` | `hidden`, default `approved` for existing rows, new top-level posts inserted as `pending` via trigger; replies forced `approved`), `media_url`, `media_type` (`image` | `video`).
- RLS: public read only `status = 'approved'`; author reads own; admins (`has_role(auth.uid(),'admin')`) read/update/delete all. Authors cannot change `status` (trigger blocks non-admin status changes).
- New private storage bucket `room-media`; uploads under `<user_id>/...`, owner-only write; reads through signed URLs from a server function.
- `src/lib/room-posts.functions.ts`: `approveRoomPost`, `hideRoomPost`, `deleteRoomPost`, `listPendingRoomPosts` (requireSupabaseAuth + admin check), and inserts a notification for the author.
- Update `src/routes/rooms.$slug.tsx` (upload picker, media rendering, pending badge, admin menu, popup); add a Rooms tab in the Review Center; reuse the existing image crop and congratulations components.
- New button text falls back to English in other languages.
