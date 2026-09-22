# Smart Accept / Maybe later / Decline with a confirm popup

## What people will see
Tapping Accept, Maybe later or Decline on any meetup card, or in the meetup popup, no longer answers right away. A **"Confirm your answer" popup** opens instead. It shows:
- The person's photo and name, the day, time, place, the meetup photo, and the current status
- A ready-made message that fits the situation. People can edit it before sending.
- **Send** (saves the answer and posts the message in the conversation) and **Back**
- A **Suggest a new time** button. It opens the big calendar, time and pin-location picker, so they can propose a new date instead of simply saying no.

## Ready-made messages by situation
| Current state | Pressed | Message (editable) |
|---|---|---|
| Waiting for an answer | Accept | "Sounds great! See you on {day} at {time} at {place}." |
| Waiting for an answer | Maybe later | "Thanks for the invite! I'm not sure yet. I'll get back to you soon." |
| Waiting for an answer | Decline | "Thank you so much for the invite. Unfortunately I can't make it this time." |
| Accepted | Decline | "I'm so sorry, but I need to cancel our meetup on {day}. I apologize for the change of plans." |
| Accepted | Maybe later | "I'm sorry, something came up and I'm not sure I can make {day} anymore. I'll confirm soon." |
| Declined | Accept | "Good news! It turns out I can make it after all. See you on {day} at {time}." |
| Same as current | same | Button is outlined and does nothing (already your answer) |
| Sender of the request | Decline | "I'm sorry, I need to cancel the meetup I requested for {day}." |

## Suggesting a new time
- The old meetup is marked declined and a new meetup request goes to the other person with the new day, time and place. The same photo carries over.
- The message box fills in automatically: "Could we move our meetup to {new day} at {new time} at {place}?"
- The other person gets a notification and sees the new card with its own buttons.

## Other details
- After sending, the list and calendar dots refresh, and a short "Sent" confirmation shows.
- This works the same way on the My meetups page, in the meetup popup, and on meetup cards in a chat.
- New wording shows in English in other languages for now.

## Technical details
- New `src/components/meetup/MeetupRespondDialog.tsx` with props `{ meetup, otherName, otherAvatar, intent: "accept"|"later"|"decline", onClose, onDone }`. It picks the template from `(status, mine, intent)` and embeds `MeetupScheduler` for rescheduling.
- `respondToMeetup`: add an optional `message` field and insert it as a chat message in the conversation from the responder. "later" keeps the status pending but still posts the message.
- New `rescheduleMeetup` server function (auth): checks the caller is a participant, declines the old row, inserts a new request (with the new time, location, lat/lng and the old photo_path), posts the message, and notifies the other person.
- `RespondRow` in `meetups.tsx` and the buttons in `MeetupCard.tsx` open the dialog instead of calling the server directly.
- Check on a phone-sized screen with Josh's meetup.
