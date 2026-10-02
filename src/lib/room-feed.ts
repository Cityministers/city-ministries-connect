export type RoomRow = {
  id: string;
  slug: string;
  title: string;
  icon: string;
  status: string;
  created_by: string | null;
  category: string;
  in_default_feed: boolean;
};

/** A room is in a member's list if they chose it, or it's a starter room they haven't removed. */
export function isInFeed(r: RoomRow, memberships: Record<string, boolean>): boolean {
  if (r.id in memberships) return !memberships[r.id];
  return r.in_default_feed;
}
