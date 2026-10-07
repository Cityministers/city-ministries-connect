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
- Complete and reopen needs through authenticated owner-checked database functions; this keeps closure and selected conversation thank-you messages atomic and prevents unauthorized recipients.
- Keep neighborhood video files private and expose approved videos through short-lived signed URLs; this prevents pending uploads from becoming public before review.
- Lock document scrolling through the global aria-modal selector while a popup is open; this leaves only the popup scrollable and restores page scrolling when it closes.
- Scope each map layer's pins and its accompanying feed to live visible bounds, preserving a newly highlighted post; this keeps every map view uncluttered on entry and after navigation.
- The owner CMS lives at /cms behind an admin-role check in every server function (privileged client loaded only after the check); /admin redirects there, and editable page wording is read from site_content with translated fallbacks.
- Store ministry-category subscriptions separately from individual post follows and match category alerts to the member's city or postal code; this preserves neighborhood relevance without conflating a ministry type with one post.
- The homepage verse-of-the-day popup opens automatically once per day for signed-in members only, picks from a local verse list by day of year, and fetches live text through the YouVersion SDK, falling back to the stored text; this way the verse never shows up blank.
