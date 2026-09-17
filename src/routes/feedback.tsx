import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, MessageSquare, Star } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/feedback")({
  head: () => ({
    meta: [
      { title: "Share your feedback — City Ministers" },
      {
        name: "description",
        content:
          "Rate how City Ministers looks, feels and performs, and tell us what you would change or add.",
      },
      { property: "og:title", content: "Share your feedback — City Ministers" },
      {
        property: "og:description",
        content:
          "Rate the app and tell the City Ministers team what to improve, change or add.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: FeedbackPage,
});

const ratingQuestions = [
  { key: "overall", label: "Overall, how would you rate City Ministers?" },
  { key: "ease", label: "How easy was it to find your way around?" },
  { key: "design", label: "How do you like the look and colors?" },
  { key: "speed", label: "How fast did pages and the map load?" },
] as const;

type RatingKey = (typeof ratingQuestions)[number]["key"];

function Stars({
  value,
  onChange,
  label,
}: {
  value: number;
  onChange: (n: number) => void;
  label: string;
}) {
  const { t } = useTranslation();
  return (
    <div role="group" aria-label={label} className="flex items-center gap-2">
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          onClick={() => onChange(n)}
          aria-label={t("{{n}} of 5 stars", { n })}
          aria-pressed={value === n}
          className={`grid size-11 place-items-center rounded-full ring-1 transition active:scale-95 ${
            n <= value
              ? "bg-lemon/15 text-lemon ring-lemon/50"
              : "bg-ink-soft/70 text-mist/50 ring-mist/25 hover:ring-mist/50"
          }`}
        >
          <Star className="size-5" fill={n <= value ? "currentColor" : "none"} aria-hidden="true" />
        </button>
      ))}
    </div>
  );
}

function FeedbackPage() {
  const { t } = useTranslation();
  const [ratings, setRatings] = useState<Record<RatingKey, number>>({
    overall: 0,
    ease: 0,
    design: 0,
    speed: 0,
  });
  const [likes, setLikes] = useState("");
  const [changes, setChanges] = useState("");
  const [additions, setAdditions] = useState("");
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);

  const inputClass =
    "w-full rounded-xl bg-ink px-4 py-3 text-lg text-sand ring-1 ring-mist/20 placeholder:text-mist/50 focus:outline-none focus:ring-lemon/50 sm:text-xl";

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (ratings.overall === 0) {
      setError(t("Please give an overall star rating first."));
      return;
    }
    setBusy(true);
    const { data: auth } = await supabase.auth.getUser();
    const { error: insertError } = await supabase.from("app_feedback").insert({
      user_id: auth.user?.id ?? null,
      overall_rating: ratings.overall,
      ease_rating: ratings.ease || null,
      design_rating: ratings.design || null,
      speed_rating: ratings.speed || null,
      likes: likes.trim().slice(0, 1000),
      changes: changes.trim().slice(0, 1000),
      additions: additions.trim().slice(0, 1000),
      email: email.trim().slice(0, 255),
    });
    setBusy(false);
    if (insertError) {
      setError(t("Sorry, that didn't send. Please try again in a moment."));
      return;
    }
    setSent(true);
  }

  return (
    <div className="flex min-h-dvh flex-col bg-ink font-body text-sand antialiased">
      <header className="border-b border-ink-soft bg-ink-soft/70">
        <div className="mx-auto flex w-full max-w-3xl items-center gap-3 px-4 py-4 sm:px-6">
          <Link
            to="/"
            className="grid size-10 shrink-0 place-items-center rounded-full bg-ink text-lemon ring-1 ring-mist/20 transition hover:bg-ink-soft"
            aria-label={t("Back home")}
          >
            <ArrowLeft className="size-4" aria-hidden="true" />
          </Link>
          <h1 className="font-display text-lg font-semibold sm:text-xl">{t("Feedback")}</h1>
        </div>
      </header>

      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-8 sm:px-6 sm:py-12">
        {sent ? (
          <div className="rounded-2xl bg-ink-soft/40 p-6 text-center ring-1 ring-mist/15">
            <MessageSquare className="mx-auto mb-3 size-8 text-lemon" aria-hidden="true" />
            <h2 className="font-display text-xl font-semibold sm:text-2xl">{t("Thank you")}</h2>
            <p className="mt-2 text-base text-mist/70 sm:text-lg">
              {t("Your feedback helps us make City Ministers better for everyone.")}
            </p>
            <Link
              to="/"
              className="mt-5 inline-flex items-center justify-center rounded-full bg-lemon px-6 py-3 text-lg font-semibold text-ink transition hover:bg-lemon/90"
            >
              {t("Back home")}
            </Link>
          </div>
        ) : (
          <>
            <div className="mb-8 text-center">
              <h2 className="font-display text-2xl font-semibold sm:text-3xl">
                {t("How is City Ministers working for you?")}
              </h2>
              <p className="mt-3 text-lg text-mist/80 sm:text-xl">
                {t("Tap the stars, then tell us anything you'd change or add.")}
              </p>
            </div>

            <form className="space-y-6" onSubmit={submit}>
              {ratingQuestions.map((q) => (
                <div key={q.key}>
                  <p className="mb-2 text-base font-medium text-sand sm:text-lg">{t(q.label)}</p>
                  <Stars
                    label={t(q.label)}
                    value={ratings[q.key]}
                    onChange={(n) => setRatings((r) => ({ ...r, [q.key]: n }))}
                  />
                </div>
              ))}

              <div>
                <label htmlFor="likes" className="mb-1.5 block text-base font-medium text-sand sm:text-lg">
                  {t("What do you like most?")}
                </label>
                <textarea
                  id="likes"
                  rows={3}
                  maxLength={1000}
                  value={likes}
                  onChange={(e) => setLikes(e.target.value)}
                  className={inputClass}
                  placeholder={t("The part that works well for you")}
                />
              </div>

              <div>
                <label htmlFor="changes" className="mb-1.5 block text-base font-medium text-sand sm:text-lg">
                  {t("What would you change?")}
                </label>
                <textarea
                  id="changes"
                  rows={3}
                  maxLength={1000}
                  value={changes}
                  onChange={(e) => setChanges(e.target.value)}
                  className={inputClass}
                  placeholder={t("Anything confusing, slow, or hard to read")}
                />
              </div>

              <div>
                <label
                  htmlFor="additions"
                  className="mb-1.5 block text-base font-medium text-sand sm:text-lg"
                >
                  {t("What should we add?")}
                </label>
                <textarea
                  id="additions"
                  rows={3}
                  maxLength={1000}
                  value={additions}
                  onChange={(e) => setAdditions(e.target.value)}
                  className={inputClass}
                  placeholder={t("A feature or page you wish existed")}
                />
              </div>

              <div>
                <label htmlFor="email" className="mb-1.5 block text-base font-medium text-sand sm:text-lg">
                  {t("Email (optional, if you'd like a reply)")}
                </label>
                <input
                  id="email"
                  type="email"
                  maxLength={255}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className={inputClass}
                  placeholder={t("you@example.com")}
                />
              </div>

              {error && (
                <p className="rounded-xl bg-rose-500/10 px-4 py-3 text-base text-rose-300 ring-1 ring-rose-400/30">
                  {error}
                </p>
              )}

              <button
                type="submit"
                disabled={busy}
                className="w-full rounded-full bg-lemon px-6 py-3 text-lg font-semibold text-ink transition hover:bg-lemon/90 disabled:opacity-60 sm:text-xl"
              >
                {busy ? t("Sending…") : t("Send feedback")}
              </button>
            </form>
          </>
        )}
      </main>
    </div>
  );
}
