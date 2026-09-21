ALTER TABLE public.prayers ADD COLUMN IF NOT EXISTS image_url text;

INSERT INTO public.prayers (owner_id, church_id, short_title, body, city, zip, lat, lng, anonymous, status, image_url)
VALUES
  ('7acb1ed9-f2ee-4ee0-8dc5-6131490addc7', NULL, 'My mom''s surgery Thursday',
   'My mother goes in for heart surgery Thursday morning at the hospital downtown. She is scared and so am I. Please pray the surgeons have steady hands, that her recovery is quick, and that our family stays patient and kind with each other in the waiting room.',
   'Portland, OR', '97205', 45.5215, -122.6819, false, 'active',
   '7acb1ed9-f2ee-4ee0-8dc5-6131490addc7/prayer-demo-hospital.jpg'),
  ('4649281b-d7a2-4877-ac66-cd8a1079bbf3', NULL, 'Starting over after a layoff',
   'I lost my job three weeks ago and rent is due soon. Please pray for an open door, for courage in interviews, and that I would not let worry crowd out my trust in God''s provision. I would also love prayer for my two kids, who can tell something is wrong.',
   'Portland, OR', '97204', 45.5190, -122.6750, false, 'active', NULL),
  ('8624d9bf-42c0-4eac-b433-af9b48b82e9f', NULL, 'For my marriage',
   'Things have been hard at home for a long while and I am not ready to put my name on this. Please pray that we would both soften, that we would listen instead of defend, and that we find the help we need before it is too late.',
   'Portland, OR', '97209', 45.5265, -122.6840, true, 'active', NULL);