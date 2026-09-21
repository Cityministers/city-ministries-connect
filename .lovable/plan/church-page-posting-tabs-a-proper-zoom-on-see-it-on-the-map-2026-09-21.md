# Church page posting tabs + a proper zoom on "See it on the map"

Two fixes, both about a church's page.

## 1. Posting tabs visible on every church profile

Today the "Post your ministry here" / "Post your need here" buttons sit in a "Serving at this church" panel far down the page, and they are hidden entirely from the church owner's own view.

Change:
- Move the two buttons into a clear pair of tabs near the top of the church profile, right under the church name and address, so visitors see them immediately.
- Show them to everyone, including the church owner (a pastor should be able to post too).
- Keep the existing links: ministry goes to the ministry form, need goes to the need form, both pre-filled with this church so the post lands on the church's board.
- Keep the church's own styling: gold for ministry, ember-orange for need.
- Leave the attend button and approval notes where they are.

## 2. "See it on the map" should zoom in on the glowing church

Two problems today:

- The link from the church scan-code popup sends the church's plain ID, but the map expects church IDs to be marked as churches. The map treats it as a post ID, finds nothing, and so nothing glows and nothing is centered — you land on a wide, jumbled city view.
- Even when a pin is spotlighted, the map always opens at the same wide zoom level.

Change:
- Send the ID in the form the map understands, so the church's own pin is the one that glows.
- When arriving with a spotlighted church or post, open the map zoomed in close (street level) and centered on that pin, instead of the wide default. Panning or searching afterwards behaves as it does now.
- Apply the same close zoom to the church page's "See it on the map" links and to the profile scan-code popup link.

## Technical notes

- `src/routes/church.$id.tsx`: lift the two posting links out of the `!isOwner` block into a tab row below the church header; keep `search={{ city, zip, church: church.id }}` for `/create-ministry` and `search={{ church: church.id }}` for `/post-need`. Reuse existing `t()` keys so translations keep working.
- `src/components/profile/ChurchQrTab.tsx`: the map link must pass `new: \`church-${open.id}\`` — `map.tsx` only keeps the prefix when it already starts with `church-`, otherwise it rewrites it to `user-<id>`.
- `src/components/LiveMap.tsx`: accept and honour a zoom change after mount (`map.setZoom`) alongside the existing `panTo`, so a spotlight can zoom in.
- `src/routes/map.tsx` (and `needs.tsx`, which uses the same spotlight logic): pass `zoom={spotlight ? 16 : 12}` when a highlight is active.
- Verification: typecheck/build clean, then a phone-sized Playwright pass — open a church page, confirm both posting tabs render for owner and visitor, then follow the profile "See it on the map" link and confirm the church pin is centered, glowing, and zoomed in.
