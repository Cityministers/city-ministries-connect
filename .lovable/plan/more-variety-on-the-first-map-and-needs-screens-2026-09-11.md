# More variety on the first map and needs screens

## What's wrong

Both screens open on Beaverton 97006, and that area is thin and repetitive. Right now 97006 holds:

- Ministries: four Coffee Chats plus "Open to Requests" — that's it.
- Needs: only three (Webapp startup team, Crib for our baby, Prayer for my son).

Everything else in the samples sits in other ZIP codes, so the opening view looks empty and duplicated no matter which phone opens it.

## The fix

Rebalance the sample content so the opening area is full and varied.

**Map (ministries near 97006):** at least 8 different types, no repeats. Keep one Coffee Chat; change the three duplicates into distinct offerings and add a few more, for example:

Coffee Chat · Free Haircuts · A Local Ride · Babysitting · Handyman Help · Lend a Book · Dinner Table Host · Prayer & Praise Night · Walk Your Dog

**Needs near 97006:** at least 8 different kinds, spread across the same area, for example:

Crib for our baby · Prayer for my son · Winter coats for the kids · Ride to a doctor visit · Meals after surgery · Help moving a couch · Yard cleanup · Tutoring for my 5th grader · Someone to sit with Mom

Each sample gets its own short title, its own longer description and its own poster name, so tapping different pins shows genuinely different stories.

**Nearby ZIPs stay stocked too.** A few of the new samples go in 97005, 97007 and 97008 so panning the map shows more clusters rather than empty space.

**Keeping duplicates out.** The one true duplicate group (three identical "Coffee Chat" ministries) gets rewritten rather than added to, so the total stays sensible.

## Technical notes

- All changes are to the sample rows in the database tables `user_ministries` and `user_needs` (updates to the duplicate rows, inserts for the new ones) — no schema change.
- Each new ministry row sets `icon_id` to the matching catalogue icon so pins render with the right symbol and tone instead of a blank avatar.
- The built-in catalogue in `src/data/ministries.ts` already covers other neighborhoods; it stays as is except that "Open to Requests" ("Anywhere nearby") keeps its 97006 placement.
- These remain clearly fictional test records to be cleared before launch.
