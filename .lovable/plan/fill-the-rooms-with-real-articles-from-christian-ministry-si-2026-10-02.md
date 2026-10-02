# Fill the rooms with real articles from Christian ministry sites

## What you'll get
- About 4–6 new posts in each of the 5 rooms, taken from recent articles on The Gospel Coalition, Desiring God (John Piper), Gospel for Asia, YouVersion, Gloo, and similar sites (Christianity Today, Mission Network News, Ligonier, The Bible Project).
- Each post shows:
  - a **header image** at the top
  - a **bold story title**
  - a short summary of 2–3 sentences, written in our own words
  - a "Read the full story at [site]" link and the source's name
- Which rooms get which sites:
  - Christian World News: Christianity Today, Mission Network News, Gospel for Asia news
  - Bible & Theology Questions: Desiring God, The Gospel Coalition, Ligonier
  - World Missions: Gospel for Asia, IMB, Mission Network News
  - End Times Conversations: articles about Revelation and Bible prophecy from The Gospel Coalition, Desiring God, and Ligonier
  - Faith, Hope & Love: YouVersion devotionals, Gloo, and Desiring God articles on encouragement
- New posts show up at the top of each room, posted under a "City Ministers News" name. The replies already in the rooms stay.

## Copyright safeguard
We won't copy whole articles. Each post uses only the title, our own short summary, and a link to the original. Header images use the article's own sharing image, shown from the source site and credited to it. If a source image is missing or won't load, we use a matching picture we create ourselves.

## Technical details
- Add `title`, `source_url`, `source_name`, and `image_url` (all optional) to `room_posts`. Members' posts keep working without them.
- `rooms.$slug.tsx`: show the header image, then the bold `font-display` title, then the body, then the source link. Opens in a new tab with `rel="noopener noreferrer"`.
- Research: web search for each site, keeping articles from the last few months. Read each page's `og:image` and title, and save the links that work.
- Add the data with a seed migration as approved posts by a "City Ministers News" profile.
- Check on a phone-sized preview that every image loads.
