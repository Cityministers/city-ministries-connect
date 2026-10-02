# Plus button for Rooms

## What members will see
- A **+** button next to the "Rooms" heading on the Explore page (signed-in only).
- Tapping it opens a popup with two parts:
  - **My rooms** — every room in their list, each with a Remove button.
  - **Add rooms** — approved rooms they removed or haven't added, each with an Add button.
  - **Create a new room** — title, short description and an icon choice. After sending, a Congratulations popup says it was sent for approval.
- The Rooms list shows only the rooms the member picked. New members start with all 5 current rooms.
- Signed-out visitors still see all approved rooms.

## Admin
- New rooms wait for approval. The Review Center Rooms tab gets a "New rooms" section with Approve / Decline.
- The creator gets a notification when their room is approved or declined. Approved rooms become available for everyone to add.

## Technical details
- Migration: add `status` (pending/approved/declined) and `created_by` to `rooms`; existing rows set approved. Policies: anyone reads approved rooms, creators read their own pending ones, signed-in users create pending rooms only, admins update/delete.
- New `room_memberships` (user_id, room_id, hidden boolean) with GRANTs + owner-only RLS; "my feed" = approved rooms minus ones the user hid.
- Explore page reads rooms from the database instead of the fixed list; room pages accept any approved slug (slug generated from title).
- Server functions for create / add / remove / approve, with an admin role check.
