# Explore Your Spiritual Gifts — new Gifts pages

Two new signed-in pages that come before the existing walkthrough. Nothing currently on the site is removed.

## Page 1 — "How to discover your spiritual gifts" (`/gifts`)

A calm, readable page in the existing dark style with a numbered list of five steps:

1. Understand what spiritual gifts are.
2. Ask your church community, or those who know you best, what they think your gifts are.
3. Ask your church community and leaders to pray for you to receive gifts, or confirmation of them.
4. Pray to God for wisdom.
5. Use your gifts — and your guesses — in a variety of ways. Find ministries to serve in to confirm your calling.

Each step gets a short sentence of plain-language explanation and its own icon. At the bottom: a large **Next** button.

The "Explore Your Spiritual Gifts" button on the home page will now open this page instead of the walkthrough.

## Page 2 — "Which of these sound like you?" (`/gifts/list`)

- The full list of Biblical gifts as tappable buttons; tapping turns one on or off. No voice on this page — buttons only.
- List: Helping, Faith, Discernment of Spirits, Mercy, Prayer, Giving, Administration, Leading, Word of Knowledge, Encouragement, Exhortation, Music, Dance, Artistic Skills, Craftsmanship, Apostleship, Service, Teaching, Preaching, Leadership, Evangelism, Prophecy, Miracles, Tongues, Interpretation of Tongues, Healing.
- Below the list, the existing **"Ask friends and family"** invite panel — create a personal link per contact, copy it, see Waiting / Answered, and add a friend's picks to your own list.
- A **Next** button saves the picks and continues into the existing walkthrough at its first question. Answers made here appear filled in there.

## Notes

- Both pages require signing in (the invite links and saved picks need an account). Visitors are sent to the sign-in screen and returned afterwards.
- The walkthrough's own gift step keeps working as it does today; the picks made on page 2 carry into it.
- The existing "coming soon" restriction on the walkthrough still applies to the walkthrough itself — tell me if the new Gifts pages should be limited the same way or open to everyone signed in.

## Technical details

- New routes `src/routes/_authenticated/gifts.tsx` (intro) and `src/routes/_authenticated/gifts.list.tsx` (selection), each with its own `head()` title/description.
- New exported constant `BIBLICAL_GIFTS` in `src/data/shape.ts`; the existing `SPIRITUAL_GIFTS` and `steps` are left untouched.
- Selection page reuses `saveShapeProfile` / `getShapeProfile` from `src/lib/shape.functions.ts`, writing to `answers.gifts`, then navigates to `/shape`.
- The invite panel is lifted out of `src/routes/shape.tsx` into `src/components/AskFriends.tsx` and imported by both pages — same server functions (`createGiftReference`, `listGiftReferences`), no behaviour change.
- Home page link in `src/routes/index.tsx` changes from `/shape` to `/gifts`.
