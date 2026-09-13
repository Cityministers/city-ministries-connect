# Fix sign-up: "Finish setup" does nothing

## What's wrong (confirmed)

New members have no member record created when they join. Signing in with Google (or email) creates the login account, but nothing creates the matching member profile.

So when you press "Finish setup", the app tries to save your name, city and photo onto a record that doesn't exist. Nothing is saved, no error is shown, and the app sends you straight back to the same setup page — which looks exactly like "nothing happened".

Evidence: the three real accounts created today (including the Google one) all have a login but no member profile and no completed setup. The ten demo accounts were created by hand, which is why they look fine.

## The fix

1. Create the member record automatically the moment someone joins, for both Google and email sign-ups, using their name and photo from Google when available.
2. Create the missing records for the three people who already signed up, so they can finish setup instead of being stuck.
3. Make "Finish setup" save-or-create the record rather than assuming it exists, so this can never silently do nothing again.
4. Show a clear message if saving genuinely fails, instead of the page appearing frozen.
5. After setup, send people to the map instead of back to the setup page.

## Testing the sign-up flow

- Create a brand-new account end to end and confirm the setup page saves and moves on.
- Repeat at phone size (393px wide) and confirm the photo, buttons and errors behave.
- Confirm an already-set-up member goes straight into the app and is never bounced to setup.
- Re-check the three existing stuck accounts can now complete setup.

Google sign-in itself can only be tested fully on the live site, so after this is published, please try joining once more from your phone and tell me what you see.

## Technical notes

- Add `public.handle_new_user()` (security definer) plus an `auth.users` AFTER INSERT trigger inserting into `public.profiles` (id, display_name from `raw_user_meta_data`, avatar_url) with `ON CONFLICT DO NOTHING`; backfill existing rows in the same migration.
- Change `completeOnboarding` in `src/lib/profile.functions.ts` from `update().eq(id)` to an `upsert` keyed on id, and return the affected row count so the client can surface a real failure.
- In `src/routes/_authenticated/welcome.tsx`, treat a no-op save as an error and default `next` to `/map` when it points back at `/welcome`.
