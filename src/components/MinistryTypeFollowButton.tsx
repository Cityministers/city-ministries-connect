import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { Bell, BellRing, Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import {
  getMinistryTypeFollowState,
  toggleMinistryTypeFollow,
} from "@/lib/ministry-type-follows.functions";

type Props = {
  ministryType: string;
};

export function MinistryTypeFollowButton({ ministryType }: Props) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const getState = useServerFn(getMinistryTypeFollowState);
  const toggle = useServerFn(toggleMinistryTypeFollow);
  const [signedIn, setSignedIn] = useState<boolean | null>(null);
  const [busy, setBusy] = useState(false);
  const [askSignIn, setAskSignIn] = useState(false);
  const queryKey = ["ministry-type-follow", ministryType];

  useEffect(() => {
    void supabase.auth.getSession().then(({ data }) => setSignedIn(Boolean(data.session)));
  }, []);

  const { data } = useQuery({
    queryKey,
    queryFn: () => getState({ data: { ministryType } }),
    enabled: signedIn === true,
    retry: false,
  });
  const following = data?.following ?? false;

  const handleFollow = async () => {
    if (!signedIn) {
      setAskSignIn(true);
      return;
    }
    setBusy(true);
    try {
      const result = await toggle({ data: { ministryType } });
      queryClient.setQueryData(queryKey, result);
      toast.success(
        result.following
          ? t("Following — we'll notify you when this ministry is posted near you.")
          : t("You stopped following this ministry type."),
      );
    } catch {
      toast.error(t("Something went wrong. Please try again."));
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={() => void handleFollow()}
        disabled={busy}
        aria-pressed={following}
        className={`mt-1 inline-flex min-h-7 items-center justify-center gap-1.5 self-start rounded-full px-2.5 py-0.5 text-[11px] font-semibold tracking-wide ring-1 transition active:scale-95 disabled:opacity-60 ${
          following
            ? "bg-lemon/15 text-lemon ring-lemon/45"
            : "bg-ink-soft text-mist/85 ring-gold/35 hover:bg-ink"
        }`}
      >
        {busy ? (
          <Loader2 className="size-4 animate-spin" aria-hidden="true" />
        ) : following ? (
          <BellRing className="size-4" aria-hidden="true" />
        ) : (
          <Bell className="size-4" aria-hidden="true" />
        )}
        {following ? t("Following near you") : t("Follow near you")}
      </button>

      {askSignIn && (
        <div
          className="fixed inset-0 z-[70] flex items-center justify-center bg-ink/80 px-4 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          onClick={() => setAskSignIn(false)}
        >
          <div
            className="w-full max-w-md rounded-2xl bg-ink-soft/95 p-6 text-center ring-1 ring-mist/15 sm:p-8"
            onClick={(event) => event.stopPropagation()}
          >
            <h2 className="font-display text-2xl font-semibold text-sand sm:text-3xl">
              {t("One quick step first")}
            </h2>
            <p className="mt-3 text-base leading-relaxed text-mist/80 sm:text-lg">
              {t("Create a free account to follow ministry types in your neighborhood and receive updates.")}
            </p>
            <div className="mt-6 flex flex-col gap-3">
              <Link
                to="/auth"
                search={{ mode: "signup" }}
                className="rounded-full bg-lemon px-6 py-4 text-lg font-bold text-ink"
              >
                {t("Create Account")}
              </Link>
              <Link
                to="/auth"
                className="rounded-full bg-ink px-6 py-4 text-lg font-semibold text-sand ring-1 ring-mist/25"
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
    </>
  );
}