# Church card on the profile: open the church, show the code, share the link

Small changes to the church card that sits above Notifications on the profile.

## What changes

1. **Tapping the church opens its page.** The photo, name and address become a tap target that goes to that church's page on the site. The three-dot menu and the code button keep their own behaviour and don't trigger it.
2. **"Show my church code" keeps opening the popup** exactly as it does now — no extra step.
3. **Share in the three-dot menu.** A new "Share" item above "Remove from my profile". On phones it opens the phone's normal share sheet with the church's link; where that isn't available it copies the link to the clipboard and briefly confirms "Link copied". The link is the public church page address.

## Technical notes

- `src/components/profile/ChurchQrTab.tsx`: wrap the photo/name/address block in a `Link` to `/church/$id`; keep the menu trigger and the code button outside it so they don't navigate.
- Add a `Share2` dropdown item using `navigator.share({ title, url })` when available, otherwise `navigator.clipboard.writeText(url)` plus a short "Link copied" state. URL is `${window.location.origin}/church/${c.id}`, the same address already encoded in the QR code.
- All new copy goes through `t()` so the language switch covers it.
- Verify with a typecheck/build and a phone-sized run: tap the card to reach the church page, reopen the profile, confirm the code popup still opens on the button, and check the share/copy item in the menu.
