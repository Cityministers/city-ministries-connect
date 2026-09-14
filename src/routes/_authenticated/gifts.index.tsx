import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  HandHeart,
  HeartHandshake,
  MailPlus,
  Sparkles,
  Users,
} from "lucide-react";

export const Route = createFileRoute("/_authenticated/gifts/")({
  head: () => ({
    meta: [
      { title: "Explore Your Spiritual Gifts — City Ministers" },
      {
        name: "description",
        content:
          "Five simple steps to discover the spiritual gifts God gave you, with help from the people who know you best.",
      },
      { property: "og:title", content: "Explore Your Spiritual Gifts — City Ministers" },
      {
        property: "og:description",
        content: "Understand, ask, pray, and serve — a simple path to finding your gifts.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: GiftsIntroPage,
});

const STEPS = [
  {
    icon: BookOpen,
    title: "Understand what spiritual gifts are",
    body: "Gifts are abilities God gives His people to build up others — not trophies, but tools for love.",
  },
  {
    icon: Users,
    title: "Ask the people who know you best",
    body: "Your church family often sees your gifts before you do. Invite them to tell you what they see in you.",
  },
  {
    icon: HandHeart,
    title: "Ask your church to pray over you",
    body: "Ask your community and leaders to pray that you'd receive gifts, or confirmation of the ones you already have.",
  },
  {
    icon: Sparkles,
    title: "Pray to God for wisdom",
    body: "Ask Him plainly. He gives wisdom generously to anyone who asks.",
  },
  {
    icon: HeartHandshake,
    title: "Use your gifts — even your guesses",
    body: "Try serving in a few different ways. Nothing confirms a calling like using it for someone else.",
  },
];

function GiftsIntroPage() {
  return (
    <div className="flex min-h-dvh flex-col bg-ink font-body text-sand antialiased">
      <header className="border-b border-ink-soft bg-ink-soft/70">
        <div className="mx-auto flex w-full max-w-lg items-center gap-3 px-4 py-4">
          <Link
            to="/"
            className="grid size-10 shrink-0 place-items-center rounded-full bg-ink text-lemon ring-1 ring-mist/20 transition hover:bg-ink-soft"
            aria-label="Back to home"
          >
            <ArrowLeft className="size-4" aria-hidden="true" />
          </Link>
          <div className="min-w-0 flex-1">
            <h1 className="truncate font-display text-xl font-semibold leading-tight sm:text-2xl">
              Explore Your Spiritual Gifts
            </h1>
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-lg flex-1 px-4 py-8">
        <p className="text-xl leading-relaxed text-mist/85 sm:text-2xl">
          Here's how we'll help you discover the gifts God gave you.
        </p>

        <ol className="mt-8 flex flex-col gap-4">
          {STEPS.map((step, i) => {
            const Icon = step.icon;
            return (
              <li
                key={step.title}
                className="flex gap-4 rounded-2xl bg-ink-soft/50 p-4 ring-1 ring-mist/15"
              >
                <div className="grid size-12 shrink-0 place-items-center rounded-xl bg-ink ring-1 ring-mist/15">
                  <Icon className="size-6 text-lemon" aria-hidden="true" />
                </div>
                <div className="min-w-0">
                  <h2 className="font-display text-xl font-semibold leading-snug text-sand">
                    {i + 1}. {step.title}
                  </h2>
                  <p className="mt-1.5 text-lg leading-relaxed text-mist/80">{step.body}</p>
                  {i === 1 && (
                    <Link
                      to="/gifts/invite"
                      className="mt-4 inline-flex items-center justify-center gap-2 rounded-full bg-lemon px-5 py-3 text-base font-semibold text-ink transition active:translate-y-0.5"
                    >
                      <MailPlus className="size-5" aria-hidden="true" />
                      Invite someone
                    </Link>
                  )}
                </div>
              </li>
            );
          })}
        </ol>

        <Link
          to="/gifts/invite"
          className="mt-8 inline-flex w-full items-center justify-center gap-2 rounded-full bg-lemon px-6 py-4 text-lg font-semibold text-ink transition active:translate-y-0.5"
        >
          Next
          <ArrowRight className="size-5" aria-hidden="true" />
        </Link>
      </main>
    </div>
  );
}
