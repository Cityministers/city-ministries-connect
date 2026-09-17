"use client";

import { useQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { UserRound } from "lucide-react";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useSession } from "@/hooks/useSession";
import { getUnreadCount } from "@/lib/notifications.functions";
import { supabase } from "@/integrations/supabase/client";

type HeaderProfile = { displayName: string; avatarUrl: string | null };

function useHeaderProfile(userId: string | undefined) {
  const [profile, setProfile] = useState<HeaderProfile | null>(null);

  useEffect(() => {
    if (!userId) {
      setProfile(null);
      return;
    }
    let active = true;
    void (async () => {
      const { data } = await supabase
        .from("profiles")
        .select("display_name, avatar_url")
        .eq("id", userId)
        .maybeSingle();
      let avatarUrl: string | null = null;
      if (data?.avatar_url) {
        const { data: signed } = await supabase.storage
          .from("ministry-avatars")
          .createSignedUrl(data.avatar_url, 60 * 60 * 24 * 7);
        avatarUrl = signed?.signedUrl ?? null;
      }
      if (active)
        setProfile({ displayName: data?.display_name ?? "", avatarUrl });
    })();
    return () => {
      active = false;
    };
  }, [userId]);

  return profile;
}

export function AccountMenu() {
  const { t } = useTranslation();
  const session = useSession();
  const profile = useHeaderProfile(session?.user?.id);
  const fetchUnread = useServerFn(getUnreadCount);
  const { data: unread } = useQuery({
    queryKey: ["unread-notifications", session?.user?.id ?? "none"],
    queryFn: () => fetchUnread(),
    enabled: Boolean(session?.user?.id),
    refetchInterval: 60_000,
  });
  const unreadCount = unread?.unread ?? 0;

  if (session === undefined) {
    return <div className="size-10" aria-hidden="true" />;
  }

  if (!session) {
    return (
      <Link
        to="/auth"
        className="inline-flex min-h-10 items-center gap-1.5 rounded-full border border-slate-lighter bg-slate px-4 py-2 text-sm font-bold text-sand transition hover:bg-slate-light"
      >
        <UserRound className="size-4" aria-hidden="true" />
        {t("Start")}
      </Link>
    );
  }

  const initial = (
    profile?.displayName?.trim()?.[0] ??
    session.user.email?.[0] ??
    "?"
  ).toUpperCase();

  return (
    <Link
      to="/profile"
      search={{ tab: "notifications" }}
      className="relative grid size-10 place-items-center text-sm font-semibold text-lemon"
      aria-label={
        unreadCount > 0
          ? t("Your profile, {{count}} unread notifications", { count: unreadCount })
          : t("Your profile")
      }
    >
      <span className="relative grid size-10 place-items-center overflow-hidden rounded-full bg-ink ring-1 ring-mist/25 transition hover:ring-lemon/50">
        {profile?.avatarUrl ? (
          <img
            src={profile.avatarUrl}
            alt={t("Your profile")}
            className="size-full object-cover"
          />
        ) : (
          <span className="grid size-full place-items-center">{initial}</span>
        )}
      </span>
      {unreadCount > 0 && (
        <span className="absolute -left-0.5 -bottom-0.5 z-10 grid min-w-[18px] place-items-center rounded-full border border-ink bg-rose px-1 text-[10px] font-bold text-sand shadow-sm">
          {unreadCount > 9 ? "9+" : unreadCount}
        </span>
      )}
    </Link>
  );
}
