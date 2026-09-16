# Mock churches in downtown Portland

Add about six real downtown Portland churches to the map as test listings, so the church pins, church pages and board can be examined with realistic data. They are demo listings owned by the existing demo accounts, not by your account, and you can delete any of them from the Churches tab in the Review Center.

## What gets added

Six well-known downtown Portland churches, looked up through Google so the name, street address, ZIP, phone and website are real, and the map pin sits on the actual building. Each one gets:

- One of the six icons, spread across the set (chapel, cross, meeting hall, Orthodox cross, dome, cathedral) so every pin style shows on the map.
- A short one-or-two sentence description and plausible service times.
- Paid status: active, with the paid month running a year out, so they all show on the Ministries and Needs maps.
- A different demo member as the owner, so the church pages look like they belong to different people.

Churches without a real website or phone in Google's data simply leave those fields blank.

## How it is done

- Look up each church through the Google Places search, pulling name, formatted address, coordinates, phone and website.
- Write the rows into the database as a migration with the real values written out, including latitude and longitude, so no address lookup is needed at run time.
- Owners are picked from the existing demo profiles (Maria Delgado, Andre Whitfield, Kim Park, Josh Rivera, Bethany Cole and one more), one church each.
- No code changes — the map, church pages, QR codes, board and admin payments already read these rows.

## Checking it

Open the map centred on Portland and confirm six gold church badges appear at their real addresses with different icons, open one church page, and confirm the Churches tab in the Review Center lists all six with their paid-through date.

## Cleanup

These are ordinary church rows. Deleting them later is one tap each from the Review Center's Churches tab.
