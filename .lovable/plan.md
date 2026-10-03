# Neighborhood videos on the map

## What people will see
- Add a **video-camera** tab beside Prayers below the map. It shows only approved videos as map pins and a vertical, thumbnail-led feed below the map; tapping a pin or feed item opens the video with its title, description, place, author, and type.
- In Video mode, place **Post a video** immediately above that feed. Signed-out visitors may watch, but posting prompts them to create an account or sign in.
- Signed-in members can post either **Neighborhood tour** (a minister describing the city or terrain) or **Community concern** (a local problem and ways churches could help). The label is self-selected, not a verified clergy credential.
- The form accepts a 1–3 minute video, title, brief description, and city or ZIP. Show a video preview and removable selection before submission; place a pin around the chosen area rather than exposing a precise home location.
- Submitted videos wait for admin approval. The poster sees a confirmation and a private “Waiting for approval” entry; public viewers see it only after approval. Admins can approve, decline, hide, or delete; authors receive a notification when approved or declined.

## Technical details
- Add a `public.neighborhood_videos` table with owner, type, title, description, city/ZIP, approximate coordinates, private video/thumbnail paths, duration, status, and timestamps. Add grants and RLS for public approved reads, owner reads/inserts/deletes, and admin moderation; prevent authors from publishing or altering status through direct writes.
- Create a private video storage bucket with owner-folder upload policies. Check MIME/size and duration before upload; use the existing 50 MB video ceiling, and validate duration again when saving metadata. Generate a poster frame when supported, with a graceful video-preview fallback. Serve approved media with time-limited links; pending media only to its author or admins.
- Add public listing and authenticated posting/moderation functions. Geocode city/ZIP using the existing place lookup, and refuse to submit without a usable location. Add a Videos queue to the Review Center, reusing its approval patterns.
- Extend `/map` mode selection, video-camera pin glyph, video feed, and post form while keeping ministry, church, prayer, and needs views unchanged. Verify posting, pending visibility, approval, playback, and mobile layout.
