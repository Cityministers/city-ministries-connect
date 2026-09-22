# Meetup cards and popup tidy-up

## What changes
1. **"Awaiting reply" on one line** — the status label on meetup cards (My meetups list and the chat card) never wraps onto two lines.
2. **Accept / Maybe later / Decline in the popup** — the same three buttons from the cards appear in the meetup details popup, under the day/time/place, with the current answer outlined. Answering refreshes the list.
3. **Person's photo and name** — the popup header shows the other person's profile picture (or their initial if none) next to "Meetup with {name}". The meetup cards also show a small profile picture beside the name.
4. **Remove the map picture from the popup** — replace it with a single tappable gold "Open in Maps" button under the place.

## Technical details
- `meetups.tsx`: add `whitespace-nowrap shrink-0` to status chip; add avatar next to `otherName` (data already has `otherAvatar`); extract `RespondRow` so it can be reused and pass it into the sheet.
- `MeetupCard.tsx`: `whitespace-nowrap` on chips.
- `MeetupDetailsSheet.tsx`: add optional `otherAvatar` and optional `actions` slot; remove static map image/`staticMap`; replace with a button link using `directionsUrl`.
- In the chat, pass the other person's avatar if available; otherwise show their initial.
