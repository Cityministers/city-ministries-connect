# Profile page: identity card + row tabs

Rework the profile screen so it reads like a familiar social profile instead of a settings form.

## What changes

**1. Identity card first**
- Your photo, name and email sit at the top in one card, above everything else.
- A single **Edit** button on that card. Nothing on the card is editable until you press it.
- Pressing Edit opens a small editor with your display name and a Change photo control, plus Save and Cancel. Saving closes it and the card shows the new name right away.
- The display name is no longer a permanently open text box.

**2. Tabs move below the card, in one row**
- Account, My posts, Mailbox, Favorites, Alerts become an evenly spread row of tabs directly under the identity card — no side-scrolling carousel.
- The active tab is marked with a colored underline and brighter text, the rest stay muted.
- Labels shorten so five fit a phone width without wrapping: Account, Posts, Inbox, Saved, Alerts.
- Tapping a tab still updates the address so the tab survives a refresh and back button.

**3. Account tab cleanup**
- With identity handled by the card, the Account tab holds only the actions: Review Center (admins only), Donate, Sign out, and the Delete account box at the bottom.

## Look and feel

Keeps the site's dark palette, but borrows the familiar social-app structure: a clear profile header block, a divider, then a flat tab strip with an underline indicator and generous tap targets. No new colors or fonts.

## Technical notes

- Single file: `src/routes/_authenticated/profile.tsx`.
- Extract a `ProfileHeaderCard` block in the same file with an `editing` state; move name input, photo upload trigger, Save/Cancel into it. Existing `updateMyProfile` / storage upload logic is reused unchanged.
- Tab strip: replace the `overflow-x-auto` pill nav with `grid grid-cols-5` `Link`s, active style via bottom border on a shared bottom rule.
- `TABS` labels updated; the `key` values stay the same so existing `?tab=` links keep working.
- No database, server function, or routing changes.
