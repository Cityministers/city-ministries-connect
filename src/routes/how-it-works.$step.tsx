import {
  createFileRoute,
  Link,
  notFound,
  redirect,
} from "@tanstack/react-router";
import {
  ArrowLeft,
  ArrowRight,
  Gift,
  MapPin,
  MessageCircle,
} from "lucide-react";

import { BrandLogo } from "@/components/BrandLogo";

const steps = [
  {
    icon: Gift,
    color: "text-lemon",
    ring: "ring-lemon/40",
    bg: "bg-lemon/10",
    title: "Post your gift",
    body: "Share what you have to offer — a cup of coffee and a listening ear, a ride across town, a closet of clean clothes. Add a short note and drop your pin on the map so neighbors know you're here.",
  },
  {
    icon: MapPin,
    color: "text-teal",
    ring: "ring-teal/40",
    bg: "bg-teal/10",
    title: "See who's nearby",
    body: "Browse the map around your city or ZIP code. Each square icon is a real person offering a real ministry — coffee chats, ride shares, free clothes, and more — sorted by how close they are to you.",
  },
  {
    icon: MessageCircle,
    color: "text-rose",
    ring: "ring-rose/40",
    bg: "bg-rose/10",
    title: "Send a note",
    body: "Found a ministry that fits your need? Tap the pin and message the person directly. Say hello, arrange a time, and begin a conversation with a neighbor who wants to help.",
  },
] as const;

export const Route = createFileRoute("/how-it-works/$step")({
  beforeLoad: ({ params }) => {
    const n = Number(params.step);
    if (!Number.isInteger(n) || n < 1 || n > steps.length) {
      if (params.step !== "1") {
        throw redirect({ to: "/how-it-works/$step", params: { step: "1" } });
      }
      throw notFound();
    }
    return { stepIndex: n - 1 };
  },
  head: ({ match }) => {
    const n = Number(match.params.step);
    const step = steps[n - 1];
    const title = step
      ? `${step.title} — How City Ministers works`
      : "How City Ministers works";
    const description = step
      ? step.body
      : "Three simple steps to share your spiritual gifts with your city.";
    return {
      meta: [
        { title },
        { name: "description", content: description },
        { property: "og:title", content: title },
        { property: "og:description", content: description },
        { property: "og:type", content: "website" },
        { name: "twitter:card", content: "summary" },
      ],
    };
  },
  component: TutorialPage,
});

function TutorialPage() {
  const { stepIndex } = Route.useRouteContext();
  const n = stepIndex + 1;
  // beforeLoad guarantees stepIndex is 0..steps.length-1
  const current = steps[stepIndex]!;
  const Icon = current.icon;
  const isLast = stepIndex === steps.length - 1;

  return (
    <div className="flex min-h-screen flex-col bg-ink font-body text-sand antialiased">
      <header className="border-b border-ink-soft bg-ink">
        <div className="mx-auto grid w-full max-w-6xl grid-cols-[auto_1fr_auto] items-center gap-2 px-4 py-4 sm:px-6">
          <Link
            to="/"
            className="inline-flex items-center gap-2 rounded-full px-3 py-2 text-sm font-medium text-mist/80 ring-1 ring-mist/20 transition hover:text-sand hover:ring-mist/40"
          >
            <ArrowLeft className="size-4" aria-hidden="true" />
            Back
          </Link>
          <div className="flex items-center justify-center">
            <BrandLogo />
          </div>
          <div aria-hidden="true" className="w-[72px] sm:w-[88px]" />
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col items-center justify-center px-6 py-12 text-center">
        <p className="text-[11px] font-semibold uppercase tracking-[0.25em] text-mist/50">
          How it works · Step {n} of {steps.length}
        </p>

        <div
          className={`mt-8 grid size-24 place-items-center rounded-2xl ${current.bg} ${current.color} ring-1 ${current.ring}`}
        >
          <Icon className="size-12" aria-hidden="true" />
        </div>

        <h1 className="mt-8 font-display text-4xl font-semibold leading-tight text-balance sm:text-5xl">
          {current.title}
        </h1>
        <p className="mt-5 max-w-[52ch] text-pretty text-xl leading-relaxed text-sand/90 sm:text-2xl">
          {current.body}
        </p>

        {/* progress dots */}
        <div className="mt-10 flex items-center gap-2">
          {steps.map((s, i) => (
            <span
              key={s.title}
              className={`size-1.5 rounded-full transition-colors ${
                i === stepIndex ? "bg-lemon" : "bg-mist/30"
              }`}
            />
          ))}
        </div>

        <div className="mt-8 flex items-center gap-3">
          {stepIndex > 0 && (
            <Link
              to="/how-it-works/$step"
              params={{ step: String(n - 1) }}
              className="inline-flex items-center gap-2 rounded-full px-6 py-3 text-sm font-semibold text-sand ring-1 ring-mist/25 transition-colors hover:ring-mist/50"
            >
              <ArrowLeft className="size-4" aria-hidden="true" />
              Back
            </Link>
          )}
          {isLast ? (
            <Link
              to="/"
              className="group inline-flex items-center gap-2 rounded-full bg-tone-cyan/25 px-8 py-3.5 text-sm font-semibold text-sand ring-1 ring-tone-cyan/55 transition hover:bg-tone-cyan/35"
            >
              Start Your Ministry
              <ArrowRight
                className="size-4 transition-transform group-hover:translate-x-0.5"
                aria-hidden="true"
              />
            </Link>
          ) : (
            <Link
              to="/how-it-works/$step"
              params={{ step: String(n + 1) }}
              className="group inline-flex items-center gap-2 rounded-full bg-lemon px-8 py-3 text-sm font-semibold text-ink ring-1 ring-lemon/60 transition-transform hover:-translate-y-0.5"
            >
              Next
              <ArrowRight
                className="size-4 transition-transform group-hover:translate-x-0.5"
                aria-hidden="true"
              />
            </Link>
          )}
        </div>
      </main>
    </div>
  );
}
