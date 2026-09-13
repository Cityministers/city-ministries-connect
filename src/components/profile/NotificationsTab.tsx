import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { Bell, CheckCheck } from "lucide-react";
import {
  listMyNotifications,
  markAllNotificationsRead,
} from "@/lib/notifications.functions";

export function NotificationsTab() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const fetchNotifications = useServerFn(listMyNotifications);
  const markRead = useServerFn(markAllNotificationsRead);

  const { data: items, isLoading } = useQuery({
    queryKey: ["my-notifications"],
    queryFn: () => fetchNotifications(),
  });

  if (isLoading) return <p className="py-10 text-center text-lg text-mist/60">Loading…</p>;

  if (!items || items.length === 0) {
    return (
      <p className="rounded-2xl bg-ink-soft/60 p-6 text-center text-lg text-mist/70 ring-1 ring-mist/15">
        No notifications yet. You&rsquo;ll hear about messages, likes, comments, and new
        needs near you.
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      <button
        type="button"
        onClick={async () => {
          await markRead({});
          await queryClient.invalidateQueries({ queryKey: ["my-notifications"] });
          await queryClient.invalidateQueries({ queryKey: ["unread-count"] });
          await queryClient.invalidateQueries({ queryKey: ["unread-notifications"] });
        }}
        className="inline-flex w-fit items-center gap-1.5 self-end rounded-full bg-ink px-4 py-2.5 text-lg font-medium text-lemon ring-1 ring-lemon/30 transition hover:bg-lemon/10"
      >
        <CheckCheck className="size-5" aria-hidden="true" />
        Mark all read
      </button>

      {items.map((n) => (
        <button
          key={n.id}
          type="button"
          onClick={() => {
            if (n.link) void navigate({ href: n.link });
          }}
          className={`flex items-start gap-3 rounded-2xl p-4 text-left ring-1 transition hover:bg-ink-soft ${
            n.read ? "bg-ink-soft/40 ring-mist/15" : "bg-lemon/10 ring-lemon/30"
          }`}
        >
          <span className="grid size-12 shrink-0 place-items-center rounded-full bg-ink text-lemon ring-1 ring-mist/20">
            <Bell className="size-6" aria-hidden="true" />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block text-lg font-semibold text-sand">{n.title}</span>
            {n.body && <span className="block text-lg text-mist/70">{n.body}</span>}
            <span className="mt-1 block text-base text-mist/50">
              {new Date(n.createdAt).toLocaleString()}
            </span>
          </span>
        </button>
      ))}
    </div>
  );
}
