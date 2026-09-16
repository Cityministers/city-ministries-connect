# Churches sit on their exact address

Churches are real buildings, so they should appear at the precise street address they
enter — not at the middle of a ZIP code like ministry and need posts do.

## How a church looks on the map

The icon the church picks during sign-up (chapel, cross, or meeting hall) is what shows
on the map, placed directly on the building's spot:

- A gold icon on a dark round badge, with a small pointed tip touching the exact
  address, so it reads as a fixed building rather than a floating post.
- The church name sits under the badge in gold, matching how ministry and need names
  appear.
- Church badges draw above post pins, so they stay readable in a busy neighborhood.

```text
        (chapel icon)
             |
        Grace Fellowship
```

## Choosing the icon while adding a church

The "Add your church" form keeps its three icon buttons, and gains a live preview
underneath showing exactly how that icon and the church name will look on the map, so
the church can see their choice before paying.

## Exact-address placement

- Street address becomes required on the form (city and ZIP stay, for search).
- When the church is saved, we look up the full address — street, city, ZIP — and store
  those precise coordinates.
- The form confirms what was found ("Found: 1420 SW Oak St, Beaverton") or says it
  couldn't locate the address and asks them to correct it before continuing.

## When an address can't be found

- The church is not placed on the map (no ZIP-center fallback).
- Their church page still works, along with their link and QR code.
- The owner sees a clear notice on their page: we couldn't find that address, please
  correct it — with the edit form right there and a "Try again" that re-runs the lookup.
- Editing the address always re-runs the lookup.

## Technical notes

- `src/lib/geocode.server.ts` gains `geocodeAddress(address, city, zip)`: Google
  Geocoding through the connector gateway first, then Nominatim with the full street
  address (the Google key currently rejects geocoding, so Nominatim is the working
  path). Results cache under a key that includes the street line. No ZIP-center
  fallback for churches; failure returns null.
- `churches.functions.ts`: `createChurch` and `updateChurch` resolve coordinates at save
  time and return `{ id, located: boolean }`. `listChurches` stops back-filling churches
  from city/ZIP and only returns rows that have coordinates. A new `relocateChurch`
  (owner-only) re-runs the lookup on demand.
- `LiveMap` gains an optional `kind: "post" | "place"` on each point; `place` renders the
  building badge with a pointed tip, larger hit area, and a higher stacking order.
  Existing post pins are untouched.
- `add-church.tsx`: address required, icon preview using the same badge markup, and the
  lookup result shown before checkout.
- `church.$id.tsx`: owner notice plus "Try again" when the church has no coordinates.
