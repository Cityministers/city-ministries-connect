# Simpler church menu, "My churches & ministries" on the account page, and Follow

## 1. Church menu cleanup
- Remove the "Search other churches & rooms" line and the "Leave this room / Leave this church" button from the top of the church icon menu.
- The menu keeps "Your home", the rooms list, and the other churches below. People leave a page by tapping back or tapping elsewhere.
- Leaving a church moves to the account page (see below).

## 2. "My churches & ministries" on the account page
A new section on the profile, above Notifications, next to the existing church code cards:
- **Add a church:** opens a search of churches (name, city or ZIP) with an "I attend this church" button. It uses the same approval as today.
- **Add a ministry:** search ministry posts and tap Follow.
- Each item shows its photo and name, and has a three-dot menu with **Remove**. For churches, Remove leaves the church. For ministries and people, Remove unfollows.
- People you follow appear in the same list under "People".

## 3. Follow button
- A **Follow / Following** button on:
  - church pages, next to "I attend this church"
  - ministry and need post cards and pages
  - people's profile popups (where tapping their picture opens it larger)
- Signed-out visitors who tap Follow get a "Sign in to follow" prompt.
- **Updates you'll get in Notifications:**
  - A church you follow posts, approves a board post, or gets a new approved prayer request.
  - A ministry you follow gets a new comment or is updated.
  - A person you follow creates a new ministry, need, public prayer, or room post (once it's approved).
- Following is private. Only you see what you follow. Owners see a follower count, not names.

## Technical details
- New table `follows` (`user_id`, `target_type` = church | ministry | user, `target_id`, unique per user+target). Grants for authenticated and service_role. RLS lets a user read, add and delete only their own rows. A security-definer count function returns follower counts.
- Database triggers notify followers by inserting into `notifications`:
  - new `user_ministries`, `user_needs`, `prayers` and approved `room_posts` notify followers of the author
  - approved `church_posts` and approved church `prayers` notify the church's followers
  - updates to `user_ministries` and new `post_comments` on a ministry notify its followers
  - Each notification links to the item. The person who caused it is never notified.
- `src/lib/follows.functions.ts`: `toggleFollow`, `listMyFollows`, `getFollowState` (requireSupabaseAuth).
- Shared `FollowButton` component. New `MyConnections` profile section reusing `ChurchCodeCards` and `leaveChurch`.
- Edit `ChurchMenu.tsx` to remove the search/leave block.
- New words fall back to English in other languages.
