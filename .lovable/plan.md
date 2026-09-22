# City Ministers business card + download page

## What you get

A print-ready 3.5 x 2 in business card (front and back) and a new page where you can view and download them.

### Front
- Your gold City Ministers seal logo (the uploaded one, with its white background removed) on the left
- "CITYMINISTERS.COM", the tagline "FAITH • PEOPLE • NEEDS", and the headline "Faith. People. Needs. Together."
- Two buttons: **Post a Prayer** in the site's prayer blue with the praying-hands icon, and **Post a Need** in the site's needs purple
- Real QR code going to https://cityministers.com, labeled "Scan to visit"
- "Create a free account. Jesus loves you."
- Dark night-city background with a thin gold border, cleaner than the draft (no faded duplicate buttons or QR codes showing through the background)

### Back
- The current "CITY MINISTERS" text logo (tall capitals, sand-to-gold) at the top
- "A place to pray. A people to care. A city for Christ."
- Numbered steps: 1 Post a Prayer, 2 Post a Need, 3 Connect, each with its short line from your draft
- A larger QR code to cityministers.com with the site address underneath (sized so it fits, not cut off like the draft)

### Download page
- New page at cityministers.com/business-card
- Shows the front and back side by side (stacked on phones)
- Download buttons for each side:
  - PNG at 300 dpi (1050 x 600 px), for home printing or sharing
  - PNG with bleed (3.75 x 2.25 in, with safe margins), which most print shops ask for
  - One PDF with both sides, ready to send to a printer
- Not linked from the menus unless you want that — you reach it by the link

## Technical notes
- Cards built as fixed-size React/HTML components (1050x600 base) so text stays crisp and the QR is generated with a QR library pointing to `https://cityministers.com`.
- Seal logo: remove white background from the upload, store via lovable-assets; background skyline generated once as an image asset.
- Export in the browser with `html-to-image` (PNG at 300 dpi scale) and `jspdf` (2-page PDF at 3.5x2in and a bleed version).
- New route `src/routes/business-card.tsx` with its own head metadata; uses existing Bebas Neue wordmark style and prayer/needs color tokens.
- Verify with a screenshot of both sides and by scanning the generated QR.
