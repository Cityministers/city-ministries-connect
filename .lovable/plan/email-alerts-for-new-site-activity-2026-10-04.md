# Email alerts for new site activity

## What you get
- An email to gospelofrome@gmail.com every time a real person does something new on the site. That covers new accounts, ministry, need, and prayer posts, churches, room posts, videos, abuse reports, and feedback.
- Each email shows what happened, who did it, and where. It has one gold "Open admin page" button that goes straight to the Activity tab.
- The link opens the normal admin page. Your phone stays signed in, so you rarely see a login screen. If you do, it takes you back to the Activity tab after you sign in.
- The admin page's "Site activity" tab is renamed **Activity**, and the link opens it directly.
- Sample/demo accounts never trigger an email.

## Notes
- Emails come from hello@notify.cityministers.com, which is already set up.
- Every email has a small unsubscribe line at the bottom. That's required and can't be turned off.
- Alerts start once you publish. On a busy day you could get many emails. If that happens, I can switch it to an hourly summary.

## Technical details
- Scaffold app email templates and add an `admin-activity-alert` React Email template with a white body, gold button, and a link to `https://cityministers.com/admin?tab=activity`.
- Add a server route at `/api/public/activity-alert`. Database webhooks call it on INSERT for profiles, user_ministries, user_needs, prayers, churches, room_posts, neighborhood_videos, abuse_reports, and app_feedback. The route checks a shared secret header, skips demo owners, builds a short summary, and sends one email per event to the fixed admin address. The idempotency key is table + row id.
- Fire the webhooks through `pg_net` triggers that call the published stable URL with the secret. The secret comes from `generate_secret`, and the database reads it from vault.
- Admin page: read the `tab` search param so `?tab=activity` selects the Activity tab, and rename the label. `/auth` already returns users to the page they were on, so check that the redirect works.
- Verify by inserting one test row, checking the email logs, and then removing the row.
