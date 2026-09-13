# Plan: Hide SHAPE page behind "Coming Soon" for everyone except admins

## Goal
Visitors who open `/shape` see a friendly "Coming Soon" screen while the existing SHAPE Spiritual Gift walkthrough stays fully intact and accessible to admin accounts for continued work and testing.

## What will change

1. **Move the SHAPE route out of the authenticated layout**
   - Rename `src/routes/_authenticated/shape.tsx` → `src/routes/shape.tsx`.
   - Change `createFileRoute("/_authenticated/shape")` to `createFileRoute("/shape")`.
   - Set `ssr: false` on the new public route so the audio/SSR-sensitive pieces keep working.
   - Delete the old `_authenticated/shape.tsx` so the route tree regenerates cleanly.

2. **Add an admin-only access check**
   - Create a public server function `getShapeAccess` (in `src/lib/shape.functions.ts`) that inspects the request's bearer token.
   - If there is no valid session, or the user is not an admin, return `{ access: "soon" }`.
   - If the user is signed in and has the `admin` role via `has_role('admin')`, return `{ access: "full", userId }`.
   - This function never throws; it simply tells the page which view to render.

3. **Render "Coming Soon" by default, full SHAPE for admins**
   - In the new `/shape` route, fetch `getShapeAccess` with React Query.
   - While loading, show a centered spinner.
   - If `access === "soon"`, render a "Coming Soon" page with:
     - Page title and meta updated to mention "Coming Soon".
     - A short explanation that the SHAPE Spiritual Gift test is being refined.
     - Buttons/links back to Home, Start Your Ministry, and Post a Need.
   - If `access === "full"`, render the existing 1,200+ line `ShapePage` component unchanged.

4. **Keep all existing SHAPE functionality intact**
   - The full component keeps using `saveShapeProfile`, `getShapeProfile`, `generateMinistrySuggestions`, `postSuggestion`, gift-reference functions, `VoiceAnswer`, `ReadAloud`, and all state logic.
   - No changes to the SHAPE data file, steps, AI prompts, or database tables.

5. **How you (Holly) will access the unfinished work**
   - Sign in with the admin account (`nwtimberkings@gmail.com`).
   - Navigate to `/shape`.
   - Because that account has the `admin` role, the page will show the full SHAPE walkthrough instead of "Coming Soon".

6. **Verification**
   - Run TypeScript typecheck.
   - Run the build.
   - Open `/shape` while signed out to confirm "Coming Soon" appears.
   - Open `/shape` while signed in as the admin account to confirm the full SHAPE flow still loads.
