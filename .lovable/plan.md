# Remove the white iPhone screen edges

## Changes
- Set the outer page (`html` and `body`) to City Ministers’ near-black ink background so overscroll and safe-area gaps never reveal white.
- Declare the site as dark-themed and add a matching browser theme color so supported iPhone Safari controls use a dark appearance instead of the white top and bottom treatment.
- Keep the existing page layout and colors unchanged; this only affects the browser-edge and behind-page areas.

## Verification
- Check the map page at an iPhone-sized viewport, including the top status/address area and bottom Safari toolbar area.
- Confirm normal scrolling and overscroll do not expose a white strip.
- Confirm the current desktop appearance remains unchanged.
