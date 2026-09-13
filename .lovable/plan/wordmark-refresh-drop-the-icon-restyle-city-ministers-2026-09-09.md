# Wordmark refresh: drop the icon, restyle "City Ministers"

## What changes

- Remove the small logo image next to the title everywhere it appears.
- "City Ministers" becomes the whole logo: tall condensed capitals (Bebas Neue) with wide letter spacing.
- The letters get a warm sand-to-gold gradient (#F3D9A4 to #C9973F).
- Applied consistently on the homepage, the map page, sign in / create account, and the welcome setup page.

## Where you'll see it

- Homepage header
- Map page header
- Sign in and Create Account pages
- Welcome / first-time profile setup

The browser tab icon stays as-is; only the on-page wordmark changes.

## Technical notes

- `src/components/BrandLogo.tsx`: drop `BrandMark` usage from `BrandLogo`, keep a no-op-free export path so no page breaks; remove the logo asset import.
- Add a `.brand-wordmark` utility in `src/styles.css` using Bebas Neue with tracking plus a `background-clip: text` gradient, with a solid sand fallback color.
- Load Bebas Neue via a `<link>` tag in `src/routes/__root.tsx` head alongside existing fonts.
- Update `src/routes/index.tsx`, `src/routes/map.tsx`, `src/routes/auth.tsx`, and `src/routes/_authenticated/welcome.tsx` to use the icon-free wordmark; remove now-unused `BrandMark` imports.
- Verify with a typecheck and mobile/desktop screenshots.
