# City Ministers — Ministry Database, List Page & Mock Profiles

The ministry list didn't come through with your message, so this plan builds the structure and seeds it with a starter set of twelve ministries. When you send your list, adding them is a quick follow-up — the same fields, no rework.

## What you'll get

### 1. A real backend (Lovable Cloud)
Ministries and their creators move out of the page and into a database, so they can be edited, added to, and later posted by real users.

Stored for each ministry post: type (Coffee Chat, Ride Share, ...), icon name, title, full description, city/ZIP, map position, photo or video, likes, favorites, comment count, and a link to its creator.

Stored for each creator: name, profile photo, short bio, longer "about" text, neighborhood, and how long they've been serving.

### 2. Starter ministries (placeholder until your list arrives)
Coffee Chat, Ride Share, Free Clothes, Meal Drop-off, Grocery Run, Yard & Home Help, Prayer Walk, Tutoring & Homework Help, Baby & Kids Supplies, Moving Help, Bible Study, Job & Résumé Help.

Each gets a distinct dark-tinted icon container in the Cathedral glow palette, a written-out description with real depth, and a mock creator with a photo and a story.

### 3. List page
The list icon beside the search bar opens a full list page showing every ministry: photo thumbnail, icon, type, title, creator, distance-style location line, and reaction counts. It has its own search box and type filters, and tapping a row opens the same post popup you already have on the map. A back control returns to the map.

### 4. Media
Generated photos for every ministry post and every creator profile, plus short generated videos on three of the posts (Coffee Chat, Ride Share, Free Clothes) which play inside the popup. Media files are hosted on the CDN rather than bundled into the site.

### 5. Map stays as-is
The map keeps showing a handful of nearby pins, now read from the database instead of hardcoded.

## Technical details

- Enable Lovable Cloud. Migration creates `public.ministry_creators` and `public.ministry_posts` with GRANTs, RLS enabled, and a public `TO anon` SELECT policy (read-only public content). Seed rows are literal INSERTs in the migration.
- Media generated with the image/video tools, uploaded via `lovable-assets`, and stored as CDN URLs in the seed rows.
- Public reads through a `createServerFn` using the server publishable client (no admin client, no auth), consumed via `ensureQueryData` + `useSuspenseQuery`.
- New route `src/routes/ministries.tsx` for the list page, with search/type filter in URL search params, `errorComponent` and `notFoundComponent`, and its own title/description/OG tags.
- `src/routes/index.tsx` refactored to read posts from the loader; the post popup extracted into a shared component used by both map and list, with video support added.
- No accounts yet — Create Account / Sign in stay placeholders.
