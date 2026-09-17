import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { ArrowLeft, ArrowRight, BookOpen, Check, Loader2, Plus, X } from "lucide-react";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
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
  const { t } = useTranslation();
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
  const customGifts = answers?.customGifts ?? [];
  const [customInput, setCustomInput] = useState("");

  function setGifts(next: string[]) {
    setAnswers((prev) => (prev ? { ...prev, gifts: next } : prev));
  }

  function toggle(gift: string) {
    setGifts(gifts.includes(gift) ? gifts.filter((g) => g !== gift) : [...gifts, gift]);
  }

  function addCustomGift() {
    const trimmed = customInput.trim();
    if (!trimmed || customGifts.length >= 3) return;
    if (customGifts.includes(trimmed) || gifts.includes(trimmed)) {
      setCustomInput("");
      return;
    }
    setAnswers((prev) =>
      prev ? { ...prev, customGifts: [...prev.customGifts, trimmed] } : prev,
    );
    setCustomInput("");
  }

  function removeCustomGift(gift: string) {
    setAnswers((prev) =>
      prev ? { ...prev, customGifts: prev.customGifts.filter((g) => g !== gift) } : prev,
    );
  }

  async function handleNext() {
    if (!answers) return;
    setSaving(true);
    setError(null);
    try {
      await save({ data: answers });
      void navigate({ to: "/shape", search: {} });
    } catch {
      setError(t("We couldn't save your picks. Try again."));
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
            aria-label={t("Back")}
          >
            <ArrowLeft className="size-4" aria-hidden="true" />
          </Link>
          <div className="min-w-0 flex-1">
            <h1 className="truncate font-display text-xl font-semibold leading-tight sm:text-2xl">
              {t("Your Spiritual Gifts")}
            </h1>
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-lg flex-1 px-4 py-8">
        <a
          href="https://www.bible.com/reading-plans/16766-what-are-spiritual-gifts"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-youversion px-6 py-3.5 text-lg font-semibold text-white transition active:translate-y-0.5 hover:bg-youversion/90"
        >
          <BookOpen className="size-5" aria-hidden="true" />
          {t("What are spiritual gifts?")}
        </a>

        <p className="mt-6 text-xl leading-relaxed text-mist/85 sm:text-2xl">
          {t("Tap every gift you believe applies to you. There are no wrong answers — you can change these later.")}
        </p>

        {answers === null ? (
          <p className="mt-8 flex items-center gap-2 text-lg text-mist/70">
            <Loader2 className="size-5 animate-spin" aria-hidden="true" /> {t("Loading your answers…")}
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
                    {t(gift)}
                  </button>
                );
              })}
            </div>

            <div className="mt-8">
              <h2 className="font-display text-lg font-semibold text-sand">
                {customGifts.length > 0
                  ? t("Add your own gifts ({{count}}/3)", { count: customGifts.length })
                  : t("Add your own gifts (up to 3)")}
              </h2>

              {customGifts.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-2.5">
                  {customGifts.map((gift) => (
                    <button
                      key={gift}
                      type="button"
                      onClick={() => removeCustomGift(gift)}
                      className="inline-flex items-center gap-2 rounded-full bg-lemon px-4 py-3 text-lg font-semibold text-ink transition hover:bg-lemon/90"
                      aria-label={t("Remove {{gift}}", { gift })}
                    >
                      {t(gift)}
                      <X className="size-4" aria-hidden="true" />
                    </button>
                  ))}
                </div>
              )}

              {customGifts.length < 3 && (
                <div className="mt-3 flex items-center gap-2">
                  <input
                    type="text"
                    value={customInput}
                    onChange={(e) => setCustomInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        addCustomGift();
                      }
                    }}
                    placeholder={t("Type a gift and tap Add")}
                    maxLength={60}
                    className="flex-1 rounded-full bg-ink-soft px-5 py-3 text-base text-sand placeholder:text-mist/50 ring-1 ring-mist/20 focus:outline-none focus:ring-2 focus:ring-lemon"
                  />
                  <button
                    type="button"
                    onClick={addCustomGift}
                    disabled={!customInput.trim() || customGifts.length >= 3}
                    className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-ink-soft px-4 py-3 text-base font-semibold text-sand ring-1 ring-mist/20 transition hover:bg-ink-soft/70 disabled:opacity-60"
                  >
                    <Plus className="size-4" aria-hidden="true" />
                    {t("Add")}
                  </button>
                </div>
              )}
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
              {t("Next")}
            </button>
          </>
        )}
      </main>
    </div>
  );
}
