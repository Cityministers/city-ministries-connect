import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { ArrowLeft, ArrowRight, Check, Loader2, Plus, X } from "lucide-react";
import { useEffect, useState } from "react";
import { BIBLICAL_GIFTS, emptyAnswers, type ShapeAnswers } from "@/data/shape";
import { getShapeProfile, saveShapeProfile } from "@/lib/shape.functions";

export const Route = createFileRoute("/_authenticated/gifts/list")({
  head: () => ({
    meta: [
      { title: "Which gifts sound like you? — City Ministers" },
      {
        name: "description",
        content:
          "Tap the Biblical spiritual gifts that sound like you and save your choices.",
      },
      { property: "og:title", content: "Which gifts sound like you? — City Ministers" },
      {
        property: "og:description",
        content: "Choose the spiritual gifts that sound like you and continue your discovery.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: GiftsListPage,
});

function GiftsListPage() {
  const navigate = useNavigate();
  const load = useServerFn(getShapeProfile);
  const save = useServerFn(saveShapeProfile);

  const [answers, setAnswers] = useState<ShapeAnswers | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    void load()
      .then((res) => {
        if (alive) setAnswers({ ...emptyAnswers, ...(res.answers ?? {}) });
      })
      .catch(() => {
        if (alive) setAnswers({ ...emptyAnswers });
      });
    return () => {
      alive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const gifts = answers?.gifts ?? [];

  function setGifts(next: string[]) {
    setAnswers((prev) => (prev ? { ...prev, gifts: next } : prev));
  }

  function toggle(gift: string) {
    setGifts(gifts.includes(gift) ? gifts.filter((g) => g !== gift) : [...gifts, gift]);
  }

  async function handleNext() {
    if (!answers) return;
    setSaving(true);
    setError(null);
    try {
      await save({ data: answers });
      void navigate({ to: "/shape", search: { step: "gifts-lean" } });
    } catch {
      setError("We couldn't save your picks. Try again.");
      setSaving(false);
    }
  }

  return (
    <div className="flex min-h-dvh flex-col bg-ink font-body text-sand antialiased">
      <header className="border-b border-ink-soft bg-ink-soft/70">
        <div className="mx-auto flex w-full max-w-lg items-center gap-3 px-4 py-4">
          <Link
            to="/gifts"
            className="grid size-10 shrink-0 place-items-center rounded-full bg-ink text-lemon ring-1 ring-mist/20 transition hover:bg-ink-soft"
            aria-label="Back"
          >
            <ArrowLeft className="size-4" aria-hidden="true" />
          </Link>
          <div className="min-w-0 flex-1">
            <h1 className="truncate font-display text-xl font-semibold leading-tight sm:text-2xl">
              Your Spiritual Gifts
            </h1>
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-lg flex-1 px-4 py-8">
        <p className="text-xl leading-relaxed text-mist/85 sm:text-2xl">
          Tap every gift you believe applies to you. There are no wrong answers — you can change
          these later.
        </p>

        {answers === null ? (
          <p className="mt-8 flex items-center gap-2 text-lg text-mist/70">
            <Loader2 className="size-5 animate-spin" aria-hidden="true" /> Loading your answers…
          </p>
        ) : (
          <>
            <div className="mt-6 flex flex-wrap gap-2.5">
              {BIBLICAL_GIFTS.map((gift) => {
                const on = gifts.includes(gift);
                return (
                  <button
                    key={gift}
                    type="button"
                    aria-pressed={on}
                    onClick={() => toggle(gift)}
                    className={`inline-flex items-center gap-2 rounded-full px-4 py-3 text-lg font-semibold transition ${
                      on
                        ? "bg-lemon text-ink"
                        : "bg-ink-soft text-sand ring-1 ring-mist/20 hover:bg-ink-soft/70"
                    }`}
                  >
                    {on && <Check className="size-4" aria-hidden="true" />}
                    {gift}
                  </button>
                );
              })}
            </div>

            {error && (
              <p className="mt-6 rounded-xl bg-rose/15 px-4 py-3 text-base text-rose ring-1 ring-rose/30">
                {error}
              </p>
            )}

            <button
              type="button"
              onClick={() => void handleNext()}
              disabled={saving}
              className="mt-8 inline-flex w-full items-center justify-center gap-2 rounded-full bg-lemon px-6 py-4 text-lg font-semibold text-ink transition active:translate-y-0.5 disabled:opacity-60"
            >
              {saving ? (
                <Loader2 className="size-5 animate-spin" aria-hidden="true" />
              ) : (
                <ArrowRight className="size-5" aria-hidden="true" />
              )}
              Next
            </button>
          </>
        )}
      </main>
    </div>
  );
}
