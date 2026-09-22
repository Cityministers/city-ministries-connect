# Bigger meetup calendar, exact location pins, My Meetups page, and reminders

## What you'll see

1. **Bigger dark calendar** on "Let's set a time": full-width, dark cathedral-glow style, large day numbers (tap targets about 44px), bold month arrows, gold highlight on the chosen day, today ringed. Time picker becomes large hour/minute/AM-PM buttons instead of the small time box.
2. **Precise location (optional)** under day and time: a "Pin exact location" button opens a small dark map. Search an address or drag the pin; the chosen spot shows as a mini map preview. The "Where?" text box stays for a friendly name.
3. **Meetup card details**: tapping any meetup card (in the conversation or in My Meetups) opens a details sheet with day, time, place name, who it's with, status, and a pressable map. Tapping the map opens the exact spot in Google/Apple Maps for directions.
4. **My Meetups on the Account page**: a new "My meetups" card with a map link. It opens a page with an upcoming/past list and a map of all accepted meetups as pins. Tap a pin for the same details sheet.
5. **Reminders**: one day before an accepted meetup, both people get an inbox notification: "Reminder: meetup with Josh tomorrow at 2:30 PM, Test Cafe" that links to the meetup details.

## Technical details

- Database: add `lat`, `lng` (nullable), `reminder_sent_at` to `meetup_requests`.
- `createMeetupRequest` accepts optional `lat`/`lng`; geocode search through the existing Google Maps backend lookup (signed-in only, debounced).
- Map picker and pins use the existing Google Maps browser loader, `clickableIcons: false`, dark style.
- New server fn `listMyMeetups` (both sides, owner-scoped) and route `/_authenticated/meetups`; profile gets a "My meetups" entry above Notifications.
- Reminders: server route `/api/public/meetup-reminders` protected by a secret header, called hourly by a scheduled database job. It finds accepted meetups 23–25 hours out with no `reminder_sent_at`, notifies both people, and stamps the row.
- Shared `MeetupDetailsSheet` component used by the conversation card and the meetups page.
- New labels added in English; other languages fall back to English until a translation pass.

## Verification
Phone-sized run: send a request with a pinned location, accept it, open details and map from the conversation and My Meetups, and trigger the reminder endpoint once to confirm the inbox notice. Remove test data afterward.
