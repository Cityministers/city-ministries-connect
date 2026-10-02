# Post history on member profiles, with privacy switches

## What members will see
- A member's profile page gets three sections under their bio: **Ministries**, **Needs**, and **Prayers**. Each lists that person's posts, newest first, with title, short timestamp (5m / 2h / 3d), and a tap to open the post.
- Needs that are closed show a small "Need met" label.
- Prayers posted as **anonymous** never appear. Church-wall prayers only appear if they're approved. Hidden, removed, or declined posts never appear.
- If a section is empty or set to private, it doesn't show at all. Visitors don't see a "this is private" label.

## Privacy switches
- On your own account page, a new "Profile privacy" card has three switches: **Show my ministries**, **Show my needs**, **Show my prayers**. All are on by default.
- Turning one off hides that section from everyone else right away. Your own posts still show under My Posts.

## Technical details
- Migration: add `show_ministries`, `show_needs`, `show_prayers` (boolean, default true) to `profiles`.
- New authenticated server function `getMemberPosts({ id })` in `src/lib/profile.functions.ts`: reads the profile's switches, then queries `user_ministries` (active), `user_needs` (active or met), and `prayers` (`anonymous = false`, status active/approved). Each list is skipped when its switch is off. It returns small summaries only.
- `getMyProfile` / `updateMyProfile` extended with the three switches; switch card added to `src/routes/_authenticated/profile.tsx`.
- `src/routes/_authenticated/people.$id.tsx` renders the sections, using existing type colors (turquoise ministry, purple need, prayer blue) and existing post-opening links.
- Person-follow stays on this page, unchanged.
