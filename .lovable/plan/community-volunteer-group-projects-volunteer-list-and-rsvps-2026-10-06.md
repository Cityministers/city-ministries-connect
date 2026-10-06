# Community Volunteer: group projects, volunteer list and RSVPs

## What you'll see

1. **New "Community Volunteer" tile** at the top of "Ways to minister" on the homepage. Its icon is bigger than the others and spans the full row so it stands out.
2. **Tapping it opens a Community Volunteer page** for your city/ZIP (Portland to start) with 3 options:
   - **Join the volunteer list**: one tap signs you up. You then get an alert each time a group project is posted in your area.
   - **Volunteer list**: shows the profiles that signed up. Two tabs: **RSVP'd** (people attending a project) and **Not yet RSVP'd**.
   - **Upcoming group projects**: anyone can browse them. Signed-in members can tap "I'll attend" (RSVP). Signed-out visitors get the usual "One quick step first" sign-up prompt.
3. **Posting a project** (signed-in members, approved in the CMS like other posts): when it's approved, everyone on the volunteer list for that area gets a notification and an email invitation with an RSVP button.
4. **Map**: a large Community Volunteer pin on each Portland ZIP area that has projects. Tapping it opens that area's volunteer page.

## Sample content for testing
- 3 sample projects around Portland: a park cleanup, a food bank packing night and a neighborhood mural repaint, each with a date, place and short description.
- 7 sample profiles RSVP'd across those projects.
- 5 more sample profiles on the volunteer list who haven't RSVP'd.
- All marked as demo so they stay out of your activity stats and alerts.

## Technical details
- New tables: `volunteer_signups` (user, city, zip, country), `volunteer_projects` (owner, title, description, starts_at, location, city/zip/lat/lng, status pending/approved), `volunteer_rsvps` (project, user). GRANTs and RLS: public reads approved projects and list profiles, users can only change their own signup and RSVP rows, owners and admins manage projects.
- A trigger fires when a project is approved. It notifies people signed up in the matching ZIP/city and queues the RSVP email through the existing notify.cityministers.com sender.
- New public route `/volunteer` (search params for city/zip), with SSR-safe public reads and authenticated server functions for signing up and RSVPing.
- Add a `volunteer` entry to the ministries data with a `featured` flag, used for the larger icon and full-width tile.
- Sample rows go in via a migration with literal inserts. Add the CMS approval queue entry and English wording; other languages fall back to English for now.
- Verify end to end: sign in, join the list, RSVP to a project, check that the lists update, and approve a new project to confirm the notification arrives.

## Assumptions to confirm
- "Every zip code/city" means one volunteer page per city/ZIP and a map pin wherever projects exist, starting with Portland's sample data.
- Any signed-in member can post a project, but it needs admin approval first.
