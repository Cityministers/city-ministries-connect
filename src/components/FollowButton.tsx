import { useServerFn } from "@tanstack/react-start";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { Bell, BellRing, Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { getFollowState, toggleFollow } from "@/lib/follows.functions";

type Props = {
  targetType: "church" | "ministry" | "need" | "user";
  targetId: string;
  size?: "sm" | "md";
  className?: string;
};

export function FollowButton({ targetType, targetId, size = "md", className = "" }: Props) {
  const { t } = useTranslation();
  const qc = useQueryClient();
  const fetchState = useServerFn(getFollowState);
  const toggle = useServerFn(toggleFollow);
  const [signedIn, setSignedIn] = useState<boolean | null>(null);
  const [busy, setBusy] = useState(false);
  const [askSignIn, setAskSignIn] = useState(false);

  useEffect(() => {
    void supabase.auth.getSession().then(({ data }) => setSignedIn(Boolean(data.session)));
  }, []);

  const key = ["follow", targetType, targetId];
  const { data } = useQuery({
    queryKey: key,
    queryFn: () => fetchState({ data: { targetType, targetId } }),
    enabled: signedIn === true,
    retry: false,
  });

  if (data?.self) return null;
  const following = data?.following ?? false;

  const onClick = async (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    if (!signedIn) {
      setAskSignIn(true);
      return;
    }
    setBusy(true);
    try {
      const res = await toggle({ data: { targetType, targetId } });
      qc.setQueryData(key, { following: res.following, self: false });
      void qc.invalidateQueries({ queryKey: ["my-follows"] });
      toast.success(res.following ? t("Following — updates will show in your notifications.") : t("Unfollowed."));
    } catch {
      toast.error(t("Something went wrong. Please try again."));
    } finally {
      setBusy(false);
    }
  };

  const pad = size === "sm" ? "px-3 py-1.5 text-xs" : "px-4 py-2.5 text-sm";
  return (
    <span className={`inline-flex flex-col items-start gap-1 ${className}`}>
      <button
        type="button"
        onClick={onClick}
        disabled={busy}
        aria-pressed={following}
        className={`inline-flex items-center gap-1.5 rounded-full font-bold ring-2 transition active:scale-95 ${pad} ${
          following ? "bg-lemon/20 text-lemon ring-lemon/60" : "bg-ink text-sand ring-lemon/45 hover:bg-ink-soft"
        }`}
      >
        {busy ? (
          <Loader2 className="size-4 animate-spin" aria-hidden="true" />
        ) : following ? (
          <BellRing className="size-4" aria-hidden="true" />
        ) : (
          <Bell className="size-4" aria-hidden="true" />
        )}
        {following ? t("Following") : t("Follow")}
      </button>
      {askSignIn && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-ink/80 px-4 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          onClick={() => setAskSignIn(false)}
        >
          <div
            className="w-full max-w-md rounded-2xl bg-ink-soft/95 p-6 text-center ring-1 ring-mist/15 sm:p-8"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="font-display text-2xl font-semibold sm:text-3xl">
              {t("One quick step first")}
            </h2>
            <p className="mt-3 text-base leading-relaxed text-mist/80 sm:text-lg">
              {t("Create a free account to follow churches, ministries, and people — and get their updates in your notifications.")}
            </p>
            <div className="mt-6 flex flex-col gap-3">
              <Link
                to="/auth"
                search={{ mode: "signup" }}
                className="rounded-full bg-lemon px-6 py-4 text-lg font-bold text-ink transition-transform hover:-translate-y-0.5"
              >
                {t("Create Account")}
              </Link>
              <Link
                to="/auth"
                className="rounded-full bg-ink px-6 py-4 text-lg font-semibold text-sand ring-1 ring-mist/25 transition hover:bg-ink-soft"
              >
                {t("Sign in")}
              </Link>
              <button
                type="button"
                onClick={() => setAskSignIn(false)}
                className="text-sm font-semibold text-mist/70 underline underline-offset-2 hover:text-mist"
              >
                {t("Not now")}
              </button>
            </div>
          </div>
        </div>
      )}
    </span>
  );
}
