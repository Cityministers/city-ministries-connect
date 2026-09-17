import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { ArrowLeft, ArrowRight, HeartHandshake, Link2, Users } from "lucide-react";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import AskFriends from "@/components/AskFriends";
import { emptyAnswers, type ShapeAnswers } from "@/data/shape";
import { getShapeProfile, saveShapeProfile } from "@/lib/shape.functions";

export const Route = createFileRoute("/_authenticated/gifts/invite")({
  head: () => ({
    meta: [
      { title: "Ask Others About Your Gifts — City Ministers" },
      {
        name: "description",
        content:
          "Invite friends, family and church leaders to share the spiritual gifts they see in you.",
      },
      { property: "og:title", content: "Ask Others About Your Gifts — City Ministers" },
      {
        property: "og:description",
        content: "Create a personal link and learn which spiritual gifts others see in you.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: GiftsInvitePage,
});

function GiftsInvitePage() {
  const { t } = useTranslation();
  const load = useServerFn(getShapeProfile);
  const save = useServerFn(saveShapeProfile);
  const [answers, setAnswers] = useState<ShapeAnswers | null>(null);
  const [addedGifts, setAddedGifts] = useState<string[]>([]);

  useEffect(() => {
    let alive = true;
    void load()
      .then((result) => {
        if (alive) setAnswers({ ...emptyAnswers, ...(result.answers ?? {}) });
      })
      .catch(() => {
        if (alive) setAnswers({ ...emptyAnswers });
      });
    return () => {
      alive = false;
    };
  }, [load]);

  function addReplyGifts(gifts: string[]) {
    if (!answers) return;
    const mergedGifts = Array.from(new Set([...answers.gifts, ...gifts]));
    const nextAnswers = { ...answers, gifts: mergedGifts };
    setAnswers(nextAnswers);
    setAddedGifts((current) => Array.from(new Set([...current, ...gifts])));
    void save({ data: nextAnswers });
  }

  return (
    <div className="flex min-h-dvh flex-col bg-ink font-body text-sand antialiased">
      <header className="border-b border-ink-soft bg-ink-soft/70">
        <div className="mx-auto flex w-full max-w-lg items-center gap-3 px-4 py-4">
          <Link
            to="/gifts"
            className="grid size-10 shrink-0 place-items-center rounded-full bg-ink text-lemon ring-1 ring-mist/20 transition hover:bg-ink-soft"
            aria-label={t("Back")}
          >
            <ArrowLeft className="size-4" aria-hidden="true" />
          </Link>
          <h1 className="font-display text-xl font-semibold leading-tight sm:text-2xl">
            {t("What's your spiritual gift?")}
          </h1>
        </div>
      </header>

      <main className="mx-auto w-full max-w-lg flex-1 px-4 py-8">
        <p className="font-display text-2xl font-semibold leading-snug text-sand">
          {t("Ask friends, family and church leaders.")}
        </p>
        <p className="mt-3 text-lg leading-relaxed text-mist/85">
          {t("People who know you well may recognize gifts you have not noticed yet. Create a separate link for each person and send it to them privately.")}
        </p>

        <div className="mt-6 grid gap-3 sm:grid-cols-2">
          <div className="flex gap-3 rounded-2xl bg-ink-soft/45 p-4 ring-1 ring-mist/15">
            <Link2 className="mt-0.5 size-5 shrink-0 text-lemon" aria-hidden="true" />
            <p className="text-base leading-relaxed text-mist/85">
              {t("They open the link and choose the gifts they see in you.")}
            </p>
          </div>
          <div className="flex gap-3 rounded-2xl bg-ink-soft/45 p-4 ring-1 ring-mist/15">
            <HeartHandshake className="mt-0.5 size-5 shrink-0 text-lemon" aria-hidden="true" />
            <p className="text-base leading-relaxed text-mist/85">
              {t("Their answers appear here, where you can add them to your own list.")}
            </p>
          </div>
        </div>

        <div className="mt-6">
          <AskFriends
            showHeading={false}
            onAddGifts={addReplyGifts}
          />
        </div>

        {addedGifts.length > 0 && (
          <p className="mt-4 flex items-center gap-2 text-base text-lemon">
            <Users className="size-5" aria-hidden="true" />
            {t("Added {{count}} {{word}} from your replies.", { count: addedGifts.length, word: addedGifts.length === 1 ? t("gift") : t("gifts") })}
          </p>
        )}

        <Link
          to="/gifts"
          className="mt-8 inline-flex w-full items-center justify-center gap-2 rounded-full bg-lemon px-6 py-4 text-lg font-semibold text-ink transition active:translate-y-0.5"
        >
          {t("Return to the gifts plan")}
          <ArrowRight className="size-5" aria-hidden="true" />
        </Link>
      </main>
    </div>
  );
}