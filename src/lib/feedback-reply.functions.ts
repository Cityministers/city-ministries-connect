import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

/** Where replies come from, and where the person's answer lands. */
const FROM = "City Ministers <hello@notify.cityministers.com>";
const SENDER_DOMAIN = "notify.cityministers.com";
const REPLY_TO = "gospelofrome@gmail.com";

export type FeedbackReplyDTO = {
  id: string;
  feedbackId: string;
  toEmail: string;
  subject: string;
  body: string;
  delivered: boolean;
  error: string | null;
  createdAt: string;
};

async function assertAdmin(context: { supabase: any; userId: string }) {
  const { data, error } = await context.supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", context.userId)
    .eq("role", "admin")
    .maybeSingle();
  if (error || !data) throw new Error("You do not have access to this page.");
}

export const listFeedbackReplies = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<FeedbackReplyDTO[]> => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data, error } = await supabaseAdmin
      .from("feedback_replies")
      .select("id, feedback_id, to_email, subject, body, delivered, error, created_at")
      .order("created_at", { ascending: false })
      .limit(500);
    if (error) throw new Error(error.message);
    return (data ?? []).map((r: any) => ({
      id: r.id,
      feedbackId: r.feedback_id,
      toEmail: r.to_email,
      subject: r.subject,
      body: r.body,
      delivered: r.delivered,
      error: r.error,
      createdAt: r.created_at,
    }));
  });

export const replyToFeedback = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { feedbackId: string; subject: string; message: string }) =>
    z
      .object({
        feedbackId: z.string().uuid(),
        subject: z.string().trim().min(1).max(200),
        message: z.string().trim().min(1).max(5000),
      })
      .parse(input),
  )
  .handler(async ({ data, context }): Promise<{ sent: boolean; reason?: string }> => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { data: row, error } = await supabaseAdmin
      .from("app_feedback")
      .select("id, email, likes, changes, additions")
      .eq("id", data.feedbackId)
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!row) throw new Error("That feedback could not be found.");

    const to = (row.email ?? "").trim();
    if (!to) return { sent: false, reason: "no_email" };

    const theirFeedback = [row.likes, row.changes, row.additions]
      .filter((s: string | null) => s && s.trim())
      .join(" — ")
      .slice(0, 600);

    const { render } = await import("@react-email/render");
    const { FeedbackReplyEmail } = await import("./emails/FeedbackReplyEmail");
    const { sendLovableEmail, EmailAPIError } = await import("@lovable.dev/email-js");
    const element = FeedbackReplyEmail({
      message: data.message,
      theirFeedback,
      replyTo: REPLY_TO,
    });
    const html = await render(element);
    const text = await render(element, { plainText: true });

    let delivered = false;
    let failure: string | null = null;
    const idempotencyKey = `fb-${data.feedbackId}-${Date.now()}`;
    try {
      const res = await sendLovableEmail(
        {
          to,
          from: FROM,
          sender_domain: SENDER_DOMAIN,
          reply_to: REPLY_TO,
          subject: data.subject,
          html,
          text,
          purpose: "transactional",
          idempotency_key: idempotencyKey,
        } as any,
        { apiKey: process.env["LOVABLE_API_KEY"]!, idempotencyKey },
      );
      delivered = res.success !== false;
    } catch (e) {
      failure =
        e instanceof EmailAPIError
          ? `${e.code ?? e.status}: ${e.message}`
          : e instanceof Error
            ? e.message
            : "Unknown error";
    }

    await supabaseAdmin.from("feedback_replies").insert({
      feedback_id: data.feedbackId,
      sender_id: context.userId,
      to_email: to,
      subject: data.subject,
      body: data.message,
      delivered,
      error: failure,
    });

    if (!delivered) return { sent: false, reason: failure ?? "not_sent" };
    return { sent: true };
  });
