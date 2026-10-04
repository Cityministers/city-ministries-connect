# International locations for search and posts

## What will change
- Add a **Country** selector wherever people enter a location to create a profile, ministry, need, prayer, church, or neighborhood video post. Keep city and postal code as separate fields, and label the latter **Postal code / ZIP**. Include location entry in the ministry walkthrough and post editing. Existing US records keep working as US locations.
- Accept four-digit Philippine postal codes (including leading zeroes) and other countries' alphanumeric postal codes without forcing a US five-digit format. Require a selected country plus a usable city or postal code for map posts; show a clear message when a place cannot be located rather than silently placing it in Portland or the US.
- Make map and list search accept international city names and postal codes with country context; carry the chosen country when switching between Ministries, Needs, Churches, Prayers, and Videos. Keep map dimensions, button colors, and visible-area filtering unchanged.
- Test the complete flow with a Philippine city and four-digit postal code, another international postal-code format, and an existing US location: create a post, confirm its map position and listing, search for it, and switch map views.

## Technical details
- Add a country code to location-bearing records through an additive database migration, defaulting existing records to `US`; update the associated server-function validation, form controls, and map/list location models together. Keep postal codes as strings.
- Remove US-only geocoding restrictions in the shared geocoder and use the selected country when resolving and caching a place. Avoid an ambiguous country-free lookup for short numeric codes; retain a US-specific fallback only for US locations. Update text matching so a four-digit or alphanumeric postal code can match exactly.
- Validate country, city, and postal code lengths/formats in the browser and server. Check church address lookup, profile-based home location, post editing, walkthrough-generated posts, and the video upload form for the same behavior.
