# Navigation plan: Donate visible, rest in hamburger menu

## What we'll build
- A **Donate** button sits in the top-left of the site header on every page.
- Next to it, a **hamburger menu** opens a drawer/panel containing:
  - Contact
  - About Us
  - Report Abuse
- Same arrangement on desktop and mobile: Donate always visible, the other three links live under the menu.

## Pages to create
- `/donate` — donation page with a clear CTA and explanation.
- `/contact` — simple contact page/form.
- `/about` — About Us page for City Ministers.
- `/report-abuse` — report form with reason and details fields.

## Header changes
- Update `src/routes/__root.tsx` (or the header pattern in `src/routes/index.tsx` if it is not yet a shared header) so the top-left region shows:
  - Hamburger icon/menu
  - Donate button
- Keep the centered "City Ministers" logo/title and the right-side search + List controls untouched.

## Out of scope
- No footer navigation changes.
- No new backend tables; Report Abuse can be a client-side form that opens a mailto or is stored later if needed.
