# Poster Voice Styling in Ministry/Need Detail Popup

## Goal
Make the poster's personal bio feel like a direct quote, visually separated from the ministry/need description.

## What we'll change

1. In `src/components/MinistryPost.tsx`, wrap the poster bio text (the paragraph next to the thumbnail) in quotation marks and give it a distinct voice treatment.
2. Apply the same treatment to the bio shown inside the expanded profile panel.
3. Keep the ministry/need description as the plain "about this post" text so the two voices don't compete.

## Visual approach

- Add opening and closing quotation marks around the bio, using the project's accent color (`lemon`) or sand text for the quote glyphs.
- Use a subtle left border or background tint behind the bio to separate "poster voice" from "post description."
- Slightly italicize the bio text to reinforce that it's the poster speaking.
- Leave the description unquoted and in normal weight so it reads as site/post copy.

## Files to edit

- `src/components/MinistryPost.tsx` — the inline bio line and the expanded profile bio line.

## Outcome

Users tapping a ministry or need pin will immediately see which words come from the poster and which describe the ministry/need itself.
