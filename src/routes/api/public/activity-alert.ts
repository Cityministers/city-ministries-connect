import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";

/**
 * Called by database triggers when a new row lands. The payload only names the
 * table and row id; we re-read the row ourselves and only alert for rows created
 * in the last 15 minutes, deduped per row, so callers can't spoof content.
 */
const TABLES = {
  profiles: { label: "New account", owner: "id", title: "display_name", link: "/people/" },
  user_ministries: { label: "New ministry post", owner: "owner_id", title: "short_title" },
  user_needs: { label: "New need post", owner: "owner_id", title: "short_title" },
  prayers: { label: "New prayer", owner: "owner_id", title: "short_title" },
  churches: { label: "New church", owner: "owner_id", title: "name" },
  room_posts: { label: "New room post", owner: "author_id", title: "body" },
  neighborhood_videos: { label: "New video", owner: "owner_id", title: "title" },
  abuse_reports: { label: "New abuse report", owner: "reporter_id", title: "reason" },
  app_feedback: { label: "New feedback", owner: "user_id", title: "likes" },
} as const;

const ADMIN_EMAIL = "gospelofrome@gmail.com";
const ADMIN_LINK = "https://cityministers.com/admin?tab=activity";
const schema = z.object({
  table: z.enum(Object.keys(TABLES) as [keyof typeof TABLES, ...(keyof typeof TABLES)[]]),
  id: z.string().uuid(),
});

export const Route = createFileRoute("/api/public/activity-alert")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const parsed = schema.safeParse(await request.json().catch(() => null));
        if (!parsed.success) return new Response("Bad request", { status: 400 });
        const { table, id } = parsed.data;
        const cfg = TABLES[table];
        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

        const { data: row } = await (supabaseAdmin.from(table) as any).select("*").eq("id", id).maybeSingle();
        if (!row) return new Response("ignored");
        if (Date.now() - new Date(row.created_at).getTime() > 15 * 60 * 1000) return new Response("ignored");

        const ownerId = row[cfg.owner] as string | null;
        let who = "A visitor";
        if (ownerId) {
          const { data: p } = await supabaseAdmin.from("profiles").select("display_name, is_demo").eq("id", ownerId).maybeSingle();
          if (p?.is_demo) return new Response("ignored");
          who = p?.display_name || "A new member";
        }
        const title = String(row[cfg.title] ?? "").slice(0, 140) || "(no title)";
        const where = [row.city, row.zip].filter(Boolean).join(" ");

        const { render } = await import("@react-email/render");
        const { ActivityAlertEmail } = await import("@/lib/emails/ActivityAlertEmail");
        const { sendLovableEmail } = await import("@lovable.dev/email-js");
        const el = ActivityAlertEmail({ label: cfg.label, title, who, where, link: ADMIN_LINK });
        const idempotencyKey = `activity-${table}-${id}`;
        try {
          await sendLovableEmail(
            {
              to: ADMIN_EMAIL,
              from: "City Ministers <hello@notify.cityministers.com>",
              sender_domain: "notify.cityministers.com",
              subject: `${cfg.label}: ${title.slice(0, 60)}`,
              html: await render(el),
              text: await render(el, { plainText: true }),
              purpose: "transactional",
              idempotency_key: idempotencyKey,
            } as any,
            { apiKey: process.env["LOVABLE_API_KEY"]!, idempotencyKey },
          );
        } catch (e) {
          console.error("activity alert failed", e);
          return new Response("send failed", { status: 502 });
        }
        return new Response("ok");
      },
    },
  },
});
