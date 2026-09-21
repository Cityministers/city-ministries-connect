# Add Hausa to the language menu

Hausa is a single left-to-right language, so no layout work like Arabic's is needed. The full 830-phrase list (including the gifts, abilities, causes and other button lists) is already extracted; only the new language file and menu entry are missing.

## Steps

1. Add Hausa (`ha`, name "Hausa") to the language list in `src/lib/i18n.ts` so it appears in the picker.
2. Translate the 830 English phrases into Hausa with the app's existing AI translation pipeline, in small batches with automatic retries — one-time cost, written to `src/locales/ha.json`. The file is lazy-loaded only when someone picks Hausa, so no cost for visitors.
3. Verify the Hausa file contains every key in the English file — no partial file ships (if any phrase can't be completed, Hausa stays out of the menu rather than showing half-English).
4. Check in the phone-sized preview: switch to Hausa and walk the homepage, map, needs list, and the gifts walkthrough button lists; confirm nothing falls back to English.
5. Confirm the eleven existing languages and English are untouched.

## Guardrail on credits

If the translation batches run hotter than the "a few credits" estimate given before starting, stop mid-way and check in before continuing.

## Technical notes

- Reuses the same tooling that generated the other language files; `src/locales/ha.json` follows the same flat key format, and `ensureLanguageBundle` picks it up automatically.
- No database or schema changes; post auto-translation already supports any language code.
