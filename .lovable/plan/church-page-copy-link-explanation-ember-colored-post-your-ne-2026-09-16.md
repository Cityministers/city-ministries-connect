# Church page: Copy link explanation + ember-colored "Post your need here" button

## What the Copy Link button does

It copies the church page's own web address (for example `https://cityministers.com/church/<id>`) to the visitor's clipboard, so they can text or email the church's page to someone. It does not copy a QR code or any post — just the link to this page.

## Changes

1. **"Post your need here" button** in the public "Serving at this church" panel (`src/routes/church.$id.tsx`, ~line 388–394):
   - Change from the dark outlined style to the ember (burnished amber) style used on the Spiritual Gifts walkthrough Next button: `bg-ember` fill with ink text and the ember glow shadow, matching the "Post your ministry here" button shape (`rounded-full px-5 py-2.5 font-semibold`).
   - Result: both post buttons are warm filled pills — ministry in lemon-gold, need in ember-orange — and Copy link stays quiet and outlined.

## Verification

- Typecheck (`bunx tsgo --noEmit`) and build log clean.
- Screenshot the public church page to confirm the ember button.
