import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { ArrowLeft, Loader2, Send } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { getConversation, sendMessage } from "@/lib/messages.functions";
import { MeetupCard } from "@/components/MeetupCard";
import { listMeetupsForConversation } from "@/lib/meetups.functions";

export const Route = createFileRoute("/_authenticated/messages/$conversationId")({
  head: () => ({
    meta: [
      { title: "Messages — City Ministers" },
      {
        name: "description",
        content: "Read and reply to messages from neighbors on City Ministers.",
      },
      { property: "og:title", content: "Messages — City Ministers" },
      {
        property: "og:description",
        content: "Read and reply to messages from neighbors on City Ministers.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: ThreadPage,
});

function ThreadPage() {
  const { t } = useTranslation();
  const { conversationId } = Route.useParams();
  const fetchThread = useServerFn(getConversation);
  const send = useServerFn(sendMessage);
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { data: thread, refetch, isLoading } = useQuery({
    queryKey: ["conversation", conversationId],
    queryFn: () => fetchThread({ data: { id: conversationId } }),
  });
  const fetchMeetups = useServerFn(listMeetupsForConversation);
  const { data: meetups, refetch: refetchMeetups } = useQuery({
    queryKey: ["meetups", conversationId],
    queryFn: () => fetchMeetups({ data: { conversationId } }),
  });
  const timeline = [
    ...(thread?.messages ?? []).map((m) => ({ kind: "msg" as const, at: m.createdAt, m })),
    ...(meetups ?? []).map((mu) => ({ kind: "meetup" as const, at: mu.createdAt, mu })),
  ].sort((a, b) => a.at.localeCompare(b.at));

  async function handleSend(e: React.FormEvent) {
    e.preventDefault();
    if (text.trim().length === 0) return;
    setBusy(true);
    setError(null);
    try {
      await send({ data: { conversationId, body: text.trim() } });
      setText("");
      await refetch();
    } catch (err) {
      setError(err instanceof Error ? err.message : t("Could not send that message."));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex min-h-dvh flex-col bg-ink font-body text-sand antialiased">
      <header className="border-b border-ink-soft bg-ink-soft/70">
        <div className="mx-auto flex w-full max-w-lg items-center gap-3 px-4 py-4">
          <Link
            to="/profile"
            search={{ tab: "mailbox" }}
            className="grid size-12 shrink-0 place-items-center rounded-full bg-ink text-lemon ring-1 ring-mist/20 transition hover:bg-ink-soft"
            aria-label={t("Back to mailbox")}
          >
            <ArrowLeft className="size-5" aria-hidden="true" />
          </Link>
          <div className="min-w-0">
            <h1 className="truncate font-display text-2xl font-semibold leading-tight sm:text-3xl">
              {thread?.otherName ?? t("Message")}
            </h1>
            {thread?.subject && (
              <p className="truncate text-sm uppercase tracking-[0.15em] text-lemon/80">
                {thread.subjectKind === "need"
                  ? t("About: {{subject}} (need)", { subject: thread.subject })
                  : t("About: {{subject}} (ministry)", { subject: thread.subject })}
              </p>
            )}
          </div>
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-lg flex-1 flex-col gap-3 px-4 py-6">
        {isLoading ? (
          <p className="py-10 text-center text-base text-mist/60">{t("Loading…")}</p>
        ) : (
          timeline.map((item) =>
            item.kind === "meetup" ? (
              <MeetupCard
                key={item.mu.id}
                meetup={item.mu}
                otherName={thread?.otherName ?? ""}
                onChanged={() => void refetchMeetups()}
              />
            ) : (
            <div
              key={item.m.id}
              className={`max-w-[85%] rounded-2xl px-4 py-3 text-base leading-relaxed ring-1 ${
                item.m.mine
                  ? "self-end bg-lemon/15 text-sand ring-lemon/30"
                  : "self-start bg-ink-soft text-mist/85 ring-mist/15"
              }`}
            >
              {item.m.body}
            </div>
            ),
          )
        )}

        {error && (
          <p className="rounded-lg bg-rose/15 px-3 py-2 text-base text-rose ring-1 ring-rose/30">
            {error}
          </p>
        )}
      </main>

      <form
        className="sticky bottom-0 border-t border-ink-soft bg-ink-soft/90 px-4 py-3"
        onSubmit={(e) => void handleSend(e)}
      >
        <div className="mx-auto flex w-full max-w-lg items-center gap-2">
          <input
            value={text}
            onChange={(e) => setText(e.target.value)}
            maxLength={1000}
            placeholder={t("Write a reply")}
            aria-label={t("Write a reply")}
            className="flex-1 rounded-full bg-ink px-4 py-3.5 text-lg text-sand ring-1 ring-mist/20 focus:outline-none focus:ring-lemon/50"
          />
          <button
            type="submit"
            disabled={busy}
            className="grid size-14 shrink-0 place-items-center rounded-full bg-lemon text-ink disabled:opacity-60"
            aria-label={t("Send message")}
          >
            {busy ? (
              <Loader2 className="size-6 animate-spin" aria-hidden="true" />
            ) : (
              <Send className="size-6" aria-hidden="true" />
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
