# Split the church page: visitor view vs church owner view

Right now every visitor sees the same church page, including the scan code and the download button. This separates the two views.

## What a visitor sees

- The church photo, name, description, address, service times and contact links (unchanged).
- A new "Serving at this church" panel right under the details, with two buttons:
  - **Post your ministry here** — starts a new ministry post and asks this church to list it.
  - **Post your need here** — same for a need.
  A short line explains the church reviews each post before it appears on their page. Visitors who are not signed in get sent to create an account first and land back here.
- The list of posts at the church and nearby posts (unchanged).
- No scan code, no download button. A plain "Copy link" button stays so anyone can share the page.

## What the church owner sees

Everything above, plus their Church tools panel, and the scan code moves inside that panel: the code image, the page link, "Download QR code" and "Copy link" — for their own overhead, bulletin or screen.

## Technical notes

- `src/routes/church.$id.tsx`: the public "Scan to open this page" section moves inside the existing `isOwner` Church tools block; the QR image generation stays gated by `isOwner` so visitors never build it.
- New visitor panel above the posts list, styled with the existing dark cathedral-glow tokens; buttons link to `/create-ministry` and `/post-need`, carrying the church id in search so the post flow can pre-select this church after the post is created.
- `create-ministry.tsx` and `post-need.tsx`: read that optional church id from search and pass it to the existing `ChurchPicker` in the success dialog so the right church is pre-selected (the picker still asks, and the church still approves unless the poster is on their trusted list).
- A "Copy link" button remains in the public details section.
