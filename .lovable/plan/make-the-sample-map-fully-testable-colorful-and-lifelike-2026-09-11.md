# Make the sample map fully testable, colorful, and lifelike

Right now the sample coffee chats, rides and needs on the map are only half real. Some are built into the code, so tapping them opens a card where Like, Save, Comment and Message do nothing. The people behind them have no photos or names of their own, and every need shows up in the same grey box, which makes the whole board look flat.

## What you'll be able to do after this

- Tap any sample ministry or need on the map or in the list and use every button: like, save, comment, and send a message.
- Get a friendly reply back from that neighbor a few moments later, so you can see a real back-and-forth in your inbox.
- See a real face and short bio for each poster when you open a post.
- See colored icons and buttons across the map, the lists and the needs pages instead of black and white.

## 1. Fake neighbors with real faces

- Create about eight demo neighbor accounts (confirmed, with names like Maria S., Pastor Sam D., Bethany & Cole, Ruth A.) so their posts behave exactly like a real member's post.
- Generate portrait photos for each and set them as their profile photos.
- Give each a short bio and a home city/ZIP around the Portland area.

## 2. Turn every sample post into a real post

- Move the built-in sample ministries out of the code and into the database, owned by the demo neighbors, keeping their titles, descriptions, cities and icons.
- Reassign the existing sample ministries and needs (the ones seeded for testing) to the demo neighbors, so your own account isn't the author of dozens of posts. Posts you created yourself stay yours.
- Generate cover photos for a handful of the most visible posts (coffee chat, ride, free clothes, meals, moving help, prayer walk).
- Sprinkle believable likes, saves and a few comments from other demo neighbors on the busiest posts.

## 3. Automatic friendly replies

- When you message a demo neighbor's post, a short, warm reply from that neighbor lands in the conversation shortly after, plus a notification so you can see the inbox flow end to end.
- Only demo accounts reply; real members are never auto-answered.

## 4. Color everywhere

- Needs pick up the color of their category (rides blue, food orange, clothes rose, prayer purple, and so on) instead of the current grey, with a small "Need" tag so they still read differently from ministries.
- Ministry and need icons on the map, in the lists, and in the popup cards use those same colors.
- Post a Need / View Needs, the list-view toggle and the count chips get colored treatments in the existing palette instead of plain dark grey.

## Technical notes

- Demo accounts are created once through an admin-only server function using the Auth Admin API, with matching `profiles` rows (display name, avatar, city, ZIP).
- Portraits and post photos are generated, then uploaded to a public storage bucket; `profiles.avatar_url` and `user_ministries.gallery` / `user_needs` photos point at them.
- Built-in catalog entries in `src/data/ministries.ts` stay for the ministry board and the `/start` picker, but map and list feeds read only from `user_ministries` / `user_needs`, so every pin has a `postType` + `postId` and the full engagement toolbar works.
- `toNeed` in `src/lib/user-needs.ts` maps the need's category to the preset icon *and* tone; the `need` tone is replaced by a category tone plus a badge. `toneStyles` gains slightly stronger fills for legibility on the map.
- Auto-reply lives in `startConversation` (`src/lib/messages.functions.ts`): if the post owner is a flagged demo account, insert a canned reply from that owner and a notification for the sender, using the admin client.
- Demo accounts are flagged so they can all be removed with one query before launch.
- No schema changes beyond a small flag column for demo profiles.
