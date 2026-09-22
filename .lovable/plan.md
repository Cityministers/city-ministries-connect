# Meetup requests: calendar, time, place + accept/decline

## What visitors will see
- Tapping **Let's set a time** on a ministry post still opens the note box with "Hi! When works for you to meet up?" prefilled, and now also shows:
  - A **calendar** to pick the day (past days disabled)
  - A **time** picker (hour/minute, AM/PM)
  - A **location** field (e.g. "Coffee shop on Main St")
- **Send request** sends the note plus a meetup card into the conversation.
- **Inbox:** the sender sees the card marked **Awaiting reply**; the conversation shows as a sent message waiting for an answer.
- The poster sees the card with **Accept** and **Decline** buttons. Choosing one updates the card for both people ("Accepted" in green / "Declined") and sends a notification to the requester. Declining can include an optional "suggest another time" note.
- Works in all 13 languages; dates/times display in each viewer's local format.

## Technical details
- Migration: `meetup_requests` table (conversation_id, message_id, requester_id, recipient_id, post_id/post_type, meet_at timestamptz, location text ≤200, status pending|accepted|declined, response_note, timestamps) with GRANTs, RLS limited to the two participants (recipient may change status only), updated_at trigger.
- `src/lib/meetups.functions.ts` (auth middleware): `createMeetupRequest` (starts/reuses conversation via existing messaging logic, inserts message + request), `respondToMeetup` (recipient only, pending only, inserts notification), `listMeetupsForConversation`.
- `MinistryPost.tsx`: add shadcn Calendar in popover, time select, location input to the "Let's set a time" panel; plain Message button unchanged.
- Conversation view: render meetup card inline with status and Accept/Decline; inbox list shows "Meetup request · Awaiting reply" preview.
- New strings added to locale files.
- Verify end to end with two accounts on phone size, then clean up test data.
