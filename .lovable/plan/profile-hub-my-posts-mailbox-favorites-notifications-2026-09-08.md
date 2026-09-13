# Profile hub: my posts, mailbox, favorites, notifications

Turn the profile page into a personal hub with four sections, plus the account settings already there.

## What people will see

**Your profile page** gets a simple set of tabs:

1. **My posts** — every ministry and need you posted, each card showing its short title, city/ZIP, photo and date.
   - Edit — opens a form pre-filled with your title, description, city/ZIP and photo.
   - Repost — bumps the post so it shows as recent again at the top of the map and list.
   - Delete — asks to confirm, then removes it from the map, list and everyone's favorites.
2. **Mailbox** — real two-way conversations. The "Message" button on any ministry or need starts a thread with that poster. Threads show the other person's name and photo, most recent first, with unread ones marked. Opening a thread shows the messages and a reply box.
3. **Favorites** — posts you saved with the heart on a ministry or need. Cards look like the list feed and can be opened or unsaved. Saving only applies to posts real people created (the built-in example ministries aren't savable).
4. **Notifications** — newest first, with an unread count badge on the profile avatar. You get one when:
   - someone sends you a message,
   - someone likes or comments on your post,
   - a new need is posted in your city or ZIP.
   Tapping a notification opens the thing it refers to; there is a "Mark all read" action.

Signing in is required for all four. Deleting your account also removes your messages, favorites and notifications.

## Technical notes

New tables (all with GRANTs, RLS and owner-scoped policies):

- `conversations` — pair of participants plus optional subject post reference (`post_type` ministry/need, `post_id`), `last_message_at`.
- `conversation_participants` — user_id, conversation_id, `last_read_at`.
- `messages` — conversation_id, sender_id, body, created_at.
- `favorites` — user_id, post_type, post_id, unique per user/post.
- `post_reactions` — user_id, post_type, post_id, kind (like), so likes are real and notifiable.
- `post_comments` — user_id, post_type, post_id, body.
- `notifications` — user_id, kind, title, body, link, read_at.

Schema additions: `user_ministries.updated_at` (needed for repost bump ordering; `user_needs` already has one). Repost sets `updated_at = now()` and map/list ordering switches to that column.

Notification writes happen inside the server functions that create the triggering row (message send, like, comment, need create), using a security-definer helper so a notification can be inserted for another user; the "new need near you" fan-out matches on normalized city/ZIP from the recipient's own posts/profile.

New server function modules under `src/lib/`: `messages.functions.ts`, `favorites.functions.ts`, `notifications.functions.ts`, plus edit/delete/repost additions to `ministries.functions.ts` and `needs.functions.ts` — all behind `requireSupabaseAuth`.

New routes: `_authenticated/profile` becomes tabbed (`?tab=posts|mailbox|favorites|notifications`), with `_authenticated/messages.$conversationId` for a thread and `_authenticated/edit-ministry.$id` / `_authenticated/edit-need.$id` for edits. `MinistryPost` and the list/needs cards get wired heart, like, comment and Message actions that call the new functions when signed in and prompt sign-in otherwise. Account deletion in `profile.functions.ts` extends to the new tables.
