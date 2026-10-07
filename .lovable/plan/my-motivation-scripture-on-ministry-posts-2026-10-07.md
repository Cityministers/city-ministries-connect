# "My motivation" scripture on ministry posts

## What users will see
- **Create-a-ministry form**: a new optional "My motivation" section below the description.
  - A passage box (e.g. "Micah 6:8") and an optional box to paste the verse text.
  - A "Look it up on YouVersion" button that opens bible.com in a new tab (searching what they typed), so they can copy and paste the verse back.
  - If they type only the reference, the app fills in the NIV text automatically from YouVersion (when available).
- **Edit post** (My Posts on the profile): the same two fields so it can be added or changed later.
- **Ministry post card**: below the last line of the description, a "My motivation" block showing the verse in the same style as the scripture cards elsewhere, with the reference, "NIV" and a "Read in context" link to YouVersion. Hidden when empty.

## Technical details
- Migration: add nullable `motivation_ref` (text, max ~60) and `motivation_text` (text, max ~600) to the user ministries table.
- Extend create/update server functions, `UserMinistryDTO`, `toMinistry` and `MyPostDTO` with the two fields; validate lengths.
- Post card renders `ScriptureCard` with `reference` + stored text as fallback (live NIV via existing `useLiveVerseText` when the key allows; user-pasted text wins if provided).
- Lookup link: `youVersionUrl(ref)` (falls back to bible.com search for unparsed input).
- Add English strings; other languages fall back to English for now.
