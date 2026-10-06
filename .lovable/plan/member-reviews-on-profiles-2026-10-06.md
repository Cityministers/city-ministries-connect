# Member Reviews on Profiles

## What members will see
- On every public profile: an overall score like **4.8 ★ (12 reviews)**, four category bars, and the latest written notes.
- Four categories, each rated 1–5 stars:
  1. **Punctuality** — showed up on time
  2. **Communication** — clear, responsive messages
  3. **Kindness** — warm, respectful, Christlike
  4. **Reliability** — followed through on what they offered
- Plus an optional written note (up to 500 characters).
- Overall score = average of the four categories, shown to one decimal (5.0 scale).

## Who can leave a review (keeps it honest)
- Only signed-in members, and only about someone they actually met: after an **accepted meetup whose date has passed**, both people get a "Leave a review" button on the meetup card and a notification.
- One review per person per meetup; you can edit your review for 14 days.
- You can't review yourself.
- Reviews show the reviewer's name and photo (no anonymous reviews).

## Safety and moderation
- The reviewed member can **report** a review; it goes to the CMS Reports tab.
- Admins can hide or delete any review from the CMS.
- Profiles with fewer than 3 reviews show "New member" instead of a score, so one review doesn't define someone.

## Other ideas (optional, not included unless you want them)
- Badges instead of numbers ("Always on time", "Great communicator") earned after 5 high ratings in a category.
- Hide numeric scores entirely and show only kind notes — gentler for a ministry community.

## Technical details
- New `member_reviews` table: reviewer_id, reviewee_id, meetup_id (unique with reviewer_id), four smallint ratings 1–5, note, status (visible/hidden), timestamps. GRANTs + RLS: public read of visible rows; insert only by reviewer when a validation trigger confirms an accepted, past meetup between the two; update by reviewer within 14 days; admin hide/delete via existing role check.
- Trigger notifies reviewee on new review; meetup reminder flow adds a "leave a review" notification after the meetup time.
- Profile page gets a ReviewsSummary + list; meetup card gets a ReviewDialog (star inputs + note); CMS gets a Reviews panel; report reuses abuse_reports with target_type "review".
- Activity alerts include new reviews.
