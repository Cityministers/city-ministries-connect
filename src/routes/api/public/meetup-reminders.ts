import { createFileRoute } from "@tanstack/react-router";

/** Hourly job: sends day-before meetup reminders. Caller must send the project key. */
export const Route = createFileRoute("/api/public/meetup-reminders")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const key = process.env["SUPABASE_PUBLISHABLE_KEY"];
        if (!key || request.headers.get("apikey") !== key) {
          return new Response("Unauthorized", { status: 401 });
        }
        const { sendMeetupReminders } = await import("@/lib/meetup-reminders.server");
        const sent = await sendMeetupReminders();
        return Response.json({ sent });
      },
    },
  },
});
