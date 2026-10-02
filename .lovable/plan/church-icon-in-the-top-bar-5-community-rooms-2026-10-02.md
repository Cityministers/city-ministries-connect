# Church icon in the top bar + 5 community rooms

Right now the top bar has no church icon. It has only the menu, the City Ministers name, the language globe and your profile picture. This plan adds one.

## What you'll see

**1. New church icon in the top bar** (next to the globe, for signed-in users)
Tapping it opens a small menu with these items:
- **Your home** at the top: your church's photo and name. Tapping it takes you back to your church page. If you haven't joined a church, it says "Find a church".
- **Explore rooms**: the 5 rooms listed below, each with its icon.
- **Search other churches & rooms**: opens a search page.
- **Leave this church/room**: shown only when you're on a church or room page you've joined. It asks you to confirm, then removes it from your profile. You stay signed in.

If you tap the icon while you're already on your church page, the menu opens with "Search other churches & rooms" and "Leave this church" at the top.

**2. Five community rooms**, open to everyone:
- Christian World News
- Bible & Theology Questions
- World Missions
- End Times Conversations
- Faith, Hope & Love

Each room has its own page with a title, a short description and a board. Members can post topics, reply, and like posts. Anyone can read a room. Posting needs an account. Rooms have no address and no map pin.

**3. Visiting a room doesn't change your church**
Opening a room does not take you out of your church. To go back, tap the church icon and then your church's name.

**4. Search page**
It searches churches and rooms by name in one list.

## Technical details
- New tables: `rooms` (slug, title, description, icon), seeded with the 5 rooms in the migration; `room_posts` (room_id, author_id, body, parent_id for replies, created_at), with GRANTs and RLS. Public read; authors can insert, update and delete their own posts.
- Likes reuse the existing social reactions, with a new `room_post` type.
- Your home church is read from your existing church membership. Leaving uses the existing `leaveChurch`. Room joins are not stored, so leaving a room just returns you to your home church.
- New pages: `/rooms/$slug` and `/explore` (search). New `ChurchMenu` component in the top bar of the homepage, map and church pages.
- Button text falls back to English in other languages for now.
