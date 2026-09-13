# Is the site missing anything?

City Ministers already has: splash map with tappable ministry pins, list view with city/ZIP search, 3-page tutorial, custom ministry creation, the S.H.A.P.E. walkthrough with AI suggestions, Post/View Needs, profiles with posts, inbox, favorites, notifications, admin Review Center, report-abuse tracking, terms page, real signup/login with password reset, and the hamburger + account menu.

What's still missing or placeholder — grouped so you can pick what to build next:

## 1. Pages that exist but aren't "real" yet
- **About Us** — still draft copy; waiting on your real mission, vision, and history text.
- **Contact** — form is a placeholder; it doesn't actually send anything to you yet.
- **Donate** — page exists but no real payment link (Stripe/PayPal/etc.).

## 2. Features you already asked for that are blocked
- **Weekly new-needs email digest** — needs a City Ministers-owned sending domain configured first.

## 3. Trust & safety gaps
- **Report Abuse response tracker** — exists, but tracking codes should be private to the reporter before launch.
- **Email confirmation enforcement** — need-posting requires it, but consider requiring it site-wide for messaging too.

## 4. Nice-to-haves
- Push/email notifications for new messages (currently in-app Alerts only).
- Search/filter on the Needs list by category.
- Mobile install icon / favicon polish for sharing.

## Suggested next step
Send me your real **Mission / Vision / History** copy and choose which placeholder to wire up first: **Contact form delivery** or **Donate payments** (Stripe). Those two make the hamburger menu fully real.

## Technical notes
- Contact delivery would use a public API route + email via your sending domain (same requirement as the digest).
- Donations would use the built-in Stripe/Paddle connector — no backend keys to manage.
