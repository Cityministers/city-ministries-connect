import { useQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { ChevronRight, Mail } from "lucide-react";
import { listMyConversations } from "@/lib/messages.functions";
import { useTranslation } from "react-i18next";

export function MailboxTab() {
  const { t } = useTranslation();
  const fetchConversations = useServerFn(listMyConversations);
  const { data: conversations, isLoading } = useQuery({
    queryKey: ["my-conversations"],
    queryFn: () => fetchConversations(),
  });

  if (isLoading) return <p className="py-10 text-center text-base text-mist/60">{t("Loading…")}</p>;

  if (!conversations || conversations.length === 0) {
    return (
      <p className="rounded-2xl bg-ink-soft/60 p-6 text-center text-base text-mist/70 ring-1 ring-mist/15">
        {t("No messages yet. Tap Message on any ministry or need to start a conversation.")}
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      {conversations.map((c) => (
        <Link
          key={c.id}
          to="/messages/$conversationId"
          params={{ conversationId: c.id }}
          className="flex items-center gap-3 rounded-2xl bg-ink-soft/60 p-4 ring-1 ring-mist/35 transition hover:bg-ink-soft active:scale-[0.99]"
        >
          {c.otherPhotoUrl ? (
            <img
              src={c.otherPhotoUrl}
              alt=""
              className="size-12 shrink-0 rounded-full object-cover ring-1 ring-mist/25"
            />
          ) : (
            <span className="grid size-12 shrink-0 place-items-center rounded-full bg-ink text-mist/60 ring-1 ring-mist/25">
              <Mail className="size-6" aria-hidden="true" />
            </span>
          )}
          <div className="min-w-0 flex-1">
            <p className="flex items-center gap-2 truncate text-lg font-semibold text-sand">
              {c.otherName}
              {c.unread && (
                <span className="size-2.5 shrink-0 rounded-full bg-lemon" aria-label={t("Unread")} />
              )}
            </p>
            <p className="truncate text-xs uppercase tracking-[0.15em] text-lemon/80">
              {t("About: {{subject}}", { subject: c.subject || t("General message") })}
            </p>
            <p className="truncate text-base text-mist/65">{c.lastMessage}</p>
          </div>
          <ChevronRight className="size-5 shrink-0 text-mist/50" aria-hidden="true" />
        </Link>
      ))}
    </div>
  );
}
