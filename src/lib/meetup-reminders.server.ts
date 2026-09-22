import { supabaseAdmin } from "@/integrations/supabase/client.server";

/** Sends a one-time "tomorrow" reminder for accepted meetups 20–26 hours out. */
export async function sendMeetupReminders(): Promise<number> {
  const now = Date.now();
  const from = new Date(now + 20 * 3600_000).toISOString();
  const to = new Date(now + 26 * 3600_000).toISOString();
  const { data: rows } = await supabaseAdmin
    .from("meetup_requests")
    .select("id, requester_id, recipient_id, meet_at, location, status")
    .in("status", ["accepted", "pending"])
    .is("reminder_sent_at", null)
    .gte("meet_at", from)
    .lte("meet_at", to)
    .limit(200);
  if (!rows?.length) return 0;
  const ids = [...new Set(rows.flatMap((r) => [r.requester_id, r.recipient_id]))];
  const { data: profs } = await supabaseAdmin.from("profiles").select("id, display_name").in("id", ids);
  const name = new Map((profs ?? []).map((p) => [p.id, p.display_name || "a neighbor"]));
  let sent = 0;
  for (const r of rows) {
    // Claim the row first so overlapping runs never double-send.
    const { data: claimed } = await supabaseAdmin
      .from("meetup_requests")
      .update({ reminder_sent_at: new Date().toISOString() })
      .eq("id", r.id)
      .is("reminder_sent_at", null)
      .select("id");
    if (!claimed?.length) continue;
    const time = new Date(r.meet_at).toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      timeZone: "America/Los_Angeles",
    });
    const pairs: [string, string][] = [
      [r.requester_id, r.recipient_id],
      [r.recipient_id, r.requester_id],
    ];
    await supabaseAdmin.from("notifications").insert(
      pairs.map(([me, other]) => ({
        user_id: me,
        kind: "reminder",
        title: `Reminder: meetup with ${name.get(other)} tomorrow at ${time}`,
        body: r.location.slice(0, 140),
        link: `/meetups?id=${r.id}`,
      })),
    );
    sent++;
  }
  return sent;
}
