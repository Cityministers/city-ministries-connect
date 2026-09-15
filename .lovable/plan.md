# Clear the leftover "TestFriend" invites and let you remove invites yourself

## What's happening

Those two "TestFriend" entries are not built into the page. They are real invite links saved under your own account, created during testing earlier today (both at 10:26 UTC). Every account only ever sees its own invites, so a brand-new user starts with an empty list and their own names and links — this is only stale test data on your account.

The other issue: once an invite exists, there is no way to get rid of it from the page.

## The fix

1. Delete the two leftover "TestFriend" invite links so the page shows "No invites yet" for you.
2. Add a small "Remove" control on each invite card so you (and any user) can delete an invite you no longer want — with a short confirm step so it isn't deleted by accident.

Nothing else on the invite page changes: the sample text, the name box, "Create their link", and the copy buttons stay as they are.

## Technical notes

- Cleanup runs as a migration deleting the two `gift_references` rows by id (`d4b109dd-…`, `620a632e-…`); no schema change.
- `deleteGiftReference` already exists in `src/lib/gift-references.functions.ts` (auth-gated, scoped by `owner_id`) and is currently unused — wire it into `AskFriends.tsx` via `useServerFn`, with a per-row pending state and a refresh after success.
- Remove control styled as a quiet rose text button, matching the existing Start-over treatment; confirm inline on the card.
