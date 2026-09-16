# Churches on the map

Churches can claim a spot on the map, pick an icon, upload a photo, and get their own page listing every ministry and need happening at that church — plus a QR code for the overhead projector.

## What people will see

**Add your Church** — a new button in the footer. Tapping it asks visitors to create an account or sign in first, then opens the church form.

**The church form**
- Church name (shows under the icon on the map, like a ministry or need)
- A short description and a photo
- City, street address and ZIP so the pin lands in the right place
- A choice of 3 church icons
- A checkout step: $49 per month. This is a pretend checkout for now — a card form that always succeeds, so you can test the whole flow without real money.

**On the map** — church pins appear on both the Ministries map and the Needs map, in a distinct church colour so they read differently from ordinary posts. Tapping the icon or the title opens the church's page (it does not open the small post popup).

**The church page** — photo, name, description, address, and a list of posts. No second map inside. The list has two parts:
- Posts at this church — ministries and needs the church has approved
- Public posts nearby — posts from the same city/ZIP that aren't tied to any church, so a visitor always sees something

Each row taps through to the full post.

**Joining a church** — when someone posts a ministry or a need, they can pick a church from a short list of nearby churches. The post goes to that church as a request. The church owner sees the requests on their own page (only they see this) and taps Approve or Decline. Only approved posts show in the church's list.

**QR code** — every church page has a "Your QR code" panel for the owner: the code plus a download button, pointing straight at the church's page. Generated in the browser, nothing to set up.

**If the subscription lapses** — the pin comes off the map, but the page still works for anyone with the link or the QR code, and the owner sees a "Reactivate" button.

## What your plan was missing — worth deciding

- **Editing** — churches need to change their photo, description or icon later. Included: an Edit button for the owner.
- **Service times / contact** — most visitors want to know when the church meets and how to reach them. Included as optional fields: service times, phone, website.
- **Duplicates** — two people could both claim the same church. Included: a light guard that warns if a church with the same name and ZIP already exists.
- **Removal** — the owner can take their church down; only they and an admin can.
- **Review Center** — churches show in your admin area alongside ministries and needs so you can remove a bad one.

## Technical notes

Database (one migration, with grants and row-level security):
- `churches` — owner_id, name, description, icon_id (3 fixed options), photo path, address/city/zip, lat/lng, service_times, phone, website, status (`active` | `inactive`), plan fields (`plan_status`, `current_period_end`). Public SELECT for `status='active'`; owner full access; admin via `has_role`.
- `church_posts` — church_id, post_type (`ministry` | `need`), post_id, requested_by, status (`pending` | `approved` | `declined`). Public SELECT for approved; church owner may update status; poster may insert/delete their own request.
- `church_payments` — mock charge log (church_id, amount_cents 4900, status, created_at) so the flow is testable and swappable for real payments later.

Server functions in `src/lib/churches.functions.ts`:
- `listChurches` (public, publishable client) — active churches with lat/lng, backfilled through the existing `geocodePlaces` fallback exactly like ministries.
- `getChurch` (public) — church detail, approved posts, and public nearby posts by city/ZIP.
- `createChurch`, `updateChurch`, `deactivateChurch` (auth) — owner-scoped.
- `requestChurchPost`, `setChurchPostStatus` (auth) — join requests and owner approval.
- `mockSubscribe` (auth) — records a `church_payments` row and sets `plan_status='active'` with a period end one month out.

Routes:
- `src/routes/_authenticated/add-church.tsx` — the form plus the mock checkout step
- `src/routes/church.$id.tsx` — public church page with its own `head()` metadata; owner-only panels for approvals, QR and Edit
- Footer link in `src/components/SiteFooter.tsx`

Map: `map.tsx` and `needs.tsx` merge church points into the existing `points` array; `LiveMap` gains an `href`-style select path so a church id routes to `/church/$id` instead of opening `MinistryPost`. Church icons reuse `iconMarkup` with three Lucide church-style glyphs and a dedicated tone colour added to `map-tones.ts`.

QR code: add the `qrcode` package, render to a canvas client-side, download as PNG.

Styling stays on the existing tokens (ink, ink-soft, sand, mist, lemon, ember, rose, tone-*).
