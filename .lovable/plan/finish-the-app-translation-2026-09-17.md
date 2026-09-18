# Finish the app translation

## What I found

I checked the language files that ship with the app. Only 6 of the 21 languages are actually filled in:

- Complete (581 phrases): Spanish, Portuguese, French, Korean, Vietnamese
- Partly filled: Russian, Chinese, Arabic
- Still empty: Tagalog, Haitian Creole, Amharic, Somali, Ukrainian, Hindi, Japanese, Swahili, German, Italian, Polish, Farsi

Any phrase that has no translation falls back to English. So if you picked one of the empty languages, you'd see almost everything in English — which matches what you described. The background job that writes these files is still running but has not finished, and it was never re-run after new wording was added.

Second gap: the long option lists (spiritual gifts, causes, abilities, resources, hard times, ministry categories, church icon names) live in data files that were never included in the translation pass, so those buttons stay English in every language.

You are not charged for me finishing this.

## What I'll do

1. Re-collect every phrase in the app, including the newly edited splash wording and the "See original / See translation" labels.
2. Add the option lists (gifts, causes, abilities, resources, hard times, ministry categories, church icons) to the translated set so every button label switches languages.
3. Run the translation generation to completion for all 20 languages, then verify each file has the full phrase count — no partial files.
4. Check in the preview at phone size: switch to Spanish, German (previously empty) and Arabic, and walk the homepage, map, needs, church page and the gifts walkthrough to confirm text switches and Arabic lays out right-to-left.
5. Report anything that still shows English and why.

## Technical notes

- Option labels in `src/data/ministries.ts`, `src/data/shape.ts` and `src/lib/church-icons.ts` stay as stable English keys in the data; components render them through `t()` so the stored values never change and existing saved answers keep working.
- Locale JSON files under `src/locales/` are regenerated from the extracted key list; generation runs in batches and is verified by key count per file before finishing.
- No schema changes; post auto-translation and reader-language recommendations stay as they are.
