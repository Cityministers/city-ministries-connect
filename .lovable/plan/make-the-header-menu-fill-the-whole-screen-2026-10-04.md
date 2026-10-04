# Make the header menu fill the whole screen

## What we'll build
When you tap the menu icon in the top-left, the panel opens covering the entire screen — edge to edge, top to bottom — instead of the current narrow side column that stops about three-quarters of the way across and caps at a narrow width on larger screens.

Everything inside stays the same: the "Menu" heading, Back to home, the Donate button, About Us, Contact, Report Abuse and User & Privacy Agreement, plus the close button in the top-right. Only the panel size changes.

This one menu appears on the homepage, the map, and the ministry-mindset page, so all three get the full-screen treatment automatically.

```text
Before                       After
+----------------+----+      +----------------------+
| MENU           |    |      | MENU                 |
|                |map |      |                      |
| Donate         |    |      |  Donate              |
| About Us       |    |      |  About Us            |
| Contact        |    |      |  Contact             |
|                |    |      |  ...                 |
+----------------+----+      +----------------------+
 75% wide                      full width, full height
```

## Technical details
- `src/components/SiteNav.tsx`: the `SheetContent` currently carries `w-3/4` and `sm:max-w-sm`. Replace those with `w-full max-w-none sm:max-w-none h-full` so nothing caps the width at any screen size and the height is stated explicitly.
- The shared `sheetVariants` in `src/components/ui/sheet.tsx` already pins the left drawer with `inset-y-0 h-full`, so height is 100% today; it stays untouched so other drawers elsewhere on the site are unaffected.
- The panel's own padding and the close-button position are left alone.
- Verify with a phone-sized (393px) and a desktop-sized (1280px) screenshot that the panel reaches all four screen edges, then confirm the typecheck and build are clean.
