# Save posts with a heart

## What already exists
- Ministry, need and prayer posts already have a "Save" heart button, and Your Profile already has a "Saved" tab listing them.
- Room stories (Christian World News, Bible & Theology, etc.) use a heart for "like" and cannot be saved.

## What changes
1. **Heart sits right next to Comments** on every post card (ministry, need, prayer): order becomes Like, Comment, Heart. The heart fills in solid rose when saved; tapping again removes it. Signed-out tap opens the big "One quick step first" sign-up prompt.
2. **Room stories can be saved too.** Their current heart "like" becomes a thumbs-up (same count), and a new heart next to Comments saves the story.
3. **Saved on Your Profile** is grouped into sections: Ministries, Needs, Prayers, Room stories. Each row shows thumbnail/title, a remove (unsave) button, and opens the post. The tab also shows a count badge, e.g. "Saved (6)".
4. Empty state: "Tap the heart on any post to save it here."

## Technical details
- Add `room_post` to the `post_kind` enum so `favorites` stores room-story saves (existing RLS: user manages own rows).
- Update `favorites.functions.ts` (toggle + list) to accept/return room posts, joining `room_posts` (title, image_url, room slug).
- `MinistryPost.tsx` / `PrayerPost.tsx`: reorder buttons, filled heart state, use the full-screen auth prompt.
- `rooms.$slug.tsx`: like icon → ThumbsUp; add save heart.
- `FavoritesTab.tsx`: grouped sections, unsave, links; profile tab label with count.
