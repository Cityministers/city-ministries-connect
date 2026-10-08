<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

- Keep post-follow actions on post details and person-follow actions on authenticated member profile pages; this distinguishes content updates from author updates without duplicating follow controls.
- Use the shared ScriptureTextarea for scripture-enabled posting descriptions; it keeps insertion controls inside the writing field and restores editing focus after insertion.
- Fetch writing-box insertions through the YouVersion SDK using its accessible license-free version and retain the translation label in inserted text and motivation references; this avoids blocked licensed content and mislabelled quotations.
- Complete and reopen needs through authenticated owner-checked database functions; this keeps closure and selected conversation thank-you messages atomic and prevents unauthorized recipients.
- Keep neighborhood video files private and expose approved videos through short-lived signed URLs; this prevents pending uploads from becoming public before review.
- Lock document scrolling through the global aria-modal selector while a popup is open; this leaves only the popup scrollable and restores page scrolling when it closes.
- Scope each map layer's pins and its accompanying feed to live visible bounds, preserving a newly highlighted post; this keeps every map view uncluttered on entry and after navigation.
- The owner CMS lives at /cms behind an admin-role check in every server function (privileged client loaded only after the check); /admin redirects there, and editable page wording is read from site_content with translated fallbacks.
- Store ministry-category subscriptions separately from individual post follows and match category alerts to the member's city or postal code; this preserves neighborhood relevance without conflating a ministry type with one post.
- The homepage verse-of-the-day popup opens automatically once per day for signed-in members only, picks from a local verse list by day of year, and fetches live text through the YouVersion SDK, falling back to the stored text; this way the verse never shows up blank.
- Never call preventDefault on vite:preloadError; a prevented preload error makes the lazy page import resolve to nothing and blanks the screen. Stale-chunk recovery reloads the page via a sessionStorage counter (max 5 reloads per path, ≥3s apart) so a reload landing mid-rebuild can retry again; the counter is cleared once the app mounts, so a path that has loaded successfully keeps a fresh recovery budget for later failures.

## Gift-skill affinity map
- Spiritual-gift → practical-skill weights live in `src/data/gift-skill-map.ts` (transcribed from the matcher workbook); `topAffinities()` ranks a member profile, `postGiftFit()` matches post text. App-only gifts map via `GIFT_ALIASES` (Hospitality → Service/Helps, Intercession → Healing/Miracles); broad abilities bridge via `ABILITY_BRIDGES`. Ministry suggestions cite the pairing as `fitBasis`; post cards show the "Fits your gifts" hint via `getPostGiftFit` only for signed-in non-owners with a walkthrough profile.
- Spiritual gifts render through GiftGroupPicker using GIFT_GROUPS (src/data/gift-groups.ts); merged cards map to multiple stored gift names so saved answers and the gift-skill matcher keep working.
