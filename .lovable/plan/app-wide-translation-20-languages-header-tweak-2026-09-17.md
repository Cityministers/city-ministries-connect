# App-wide translation (20 languages) + header tweak

## What we're building

A language switch on the home screen next to the "Start Your Ministry" button. Picking a language translates:

1. **All app wording** — every page, button, menu, form label, gift/ability option list, error message. Pre-translated files, so viewing costs nothing.
2. **Other people's posts** — ministry, need and church posts are auto-translated into the reader's language, translated once per post per language and cached in the database (small per-post AI cost, no per-visit cost). A "See original" toggle shows the post as written.
3. **Ministry recommendations** — the walkthrough's suggestions and the "people/posts you should meet" reasons are generated in the reader's language. Same AI prompt, negligible extra cost.

Users can write posts in any language — free-text already accepts it. Option buttons store one neutral value behind the scenes so matching still works across languages.

Languages: Spanish, Portuguese, French, Korean, Vietnamese, Russian, Simplified Chinese, Arabic, Tagalog, Haitian Creole, Amharic, Somali, Ukrainian, Hindi, Japanese, Swahili, German, Italian, Polish, Farsi. (Arabic/Farsi render right-to-left automatically.)

## Header change

The "City Ministers" logo moves right beside the hamburger menu (left cluster), with the account menu on the right. The globe icon sits next to "Start Your Ministry" on the home screen.

## Phases (this is a large build — done across several messages)

1. **Translation infrastructure** — i18next + react-i18next, English source strings, language stored per visitor (cookie + browser storage) so the server renders the right language on first load. Globe icon + language picker sheet; header logo repositioned.
2. **Extract every visible string** across all routes and data lists (home, map, needs, ministries, posting forms, church pages, gifts pages, walkthrough, profile, admin, auth) into translation keys; option lists become display keys over neutral stored values.
3. **Generate the 20 language files** with Lovable AI in one batch pass (one-time cost), review obvious issues, lazy-load each language only when chosen.
4. **Post auto-translation** — server function translates post title/description into the viewer's language, cached in a new `post_translations` table (unique per content + language), shown on map cards, lists, post pages and church pages with "See original".
5. **Recommendations in the reader's language** — pass the chosen language into the ministry-ideas prompt and the people/posts recommendation reasons.
6. **Verify** — switch languages in the preview on phone-sized viewport, check RTL for Arabic, confirm posts and recommendations appear translated.

## Technical notes

- i18next with cookie-based detection; SSR reads the cookie so there's no language flash or mismatch.
- Translation cache table has row-level security locked down; only the app's server code writes it.
- Static language files are bundled JSON, loaded on demand — no runtime cost to view.
- App AI calls keep using Lovable AI inside server functions; no new API keys needed.
