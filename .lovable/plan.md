# Restore the live map on cityministers.com

## What I confirmed
- The live map opens, but Google returns `RefererNotAllowedMapError` for `https://cityministers.com/map`.
- **Joe's Google Maps Platform** is the connection currently linked to this project; the old Lovable-managed connection is no longer linked.
- The original setup worked on Lovable preview addresses because Lovable's shared key allows those addresses. Google does not allow that shared key on custom domains, which is why moving to `cityministers.com` required a site-owned key.
- Connecting a site-owned key does not affect project collaboration.

## Plan
1. Update the map loader so the live browser map explicitly uses the key from **Joe's Google Maps Platform**, rather than depending on the old managed browser-key setting.
2. Keep geocoding and location search on the existing protected server connection.
3. Confirm the Google key allows these website entries:
   - `https://cityministers.com/*`
   - `https://www.cityministers.com/*`
   - `https://*.cityministers.com/*`
4. Publish the corrected configuration and test both `cityministers.com/map` and `www.cityministers.com/map` at phone and iPad sizes.
5. Verify that map tiles, custom ministry icons, labels, movement, search, and the nearby list all work without Google authorization errors.

## What you will need to do
Google's website allowlist can only be changed in your Google Cloud account. I will give you one short, exact screen-by-screen instruction when that step is reached; you will not need to create another key or connection.

## Technical note
The Google browser key is designed to be visible to browsers and secured by the website allowlist. Private server credentials remain server-only.
