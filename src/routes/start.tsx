import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, Loader2 } from "lucide-react";
import { useState } from "react";
import { ministries, toneStyles } from "@/data/ministries";
import { getShapeAccess } from "@/lib/shape.functions";
import { useSession } from "@/hooks/useSession";

export const Route = createFileRoute("/start")({
  head: () => ({
    meta: [
      { title: "Choose your ministry type — City Ministers" },
      {
        name: "description",
        content:
          "Pick the kind of ministry you want to offer — a coffee chat, a local ride, prayer, handyman help, and more — then post it to your city's map.",
      },
      { property: "og:title", content: "Choose your ministry type — City Ministers" },
      {
        property: "og:description",
        content:
          "Pick from every City Ministers category and post your gift to the neighborhood map.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: StartPage,
});

function StartPage() {
  const session = useSession();
  const checkShapeAccess = useServerFn(getShapeAccess);
  const { data: shapeAccessData } = useQuery({
    queryKey: ["shape-access"],
    queryFn: () => checkShapeAccess(),
    staleTime: 60_000,
    enabled: !!session,
  });
  const shapeAccess = shapeAccessData?.access;
  const [selected, setSelected] = useState<string | null>(null);
  const chosen = ministries.find((m) => m.id === selected);

  return (
    <div className="flex min-h-dvh flex-col bg-ink font-body text-sand antialiased">
      <header className="border-b border-ink-soft bg-ink-soft/70">
        <div className="mx-auto flex w-full max-w-6xl items-center gap-3 px-4 py-4 sm:px-6">
          <Link
            to="/map"
            className="grid size-10 shrink-0 place-items-center rounded-full bg-ink text-lemon ring-1 ring-mist/20 transition hover:bg-ink-soft"
            aria-label="Back to map"
          >
            <ArrowLeft className="size-4" aria-hidden="true" />
          </Link>
          <div>
            <h1 className="font-display text-lg font-semibold leading-tight sm:text-xl">
              Start Your Ministry
            </h1>
            <p className="text-xs text-mist/70">Choose the type you want to post</p>
          </div>
        </div>
      </header>

      {session === undefined ? (
        <main className="mx-auto flex w-full max-w-6xl flex-1 items-center justify-center px-4 py-16">
          <Loader2 className="size-8 animate-spin text-mist/50" aria-label="Loading" />
        </main>
      ) : session === null ? (
        <main className="mx-auto flex w-full max-w-md flex-1 flex-col items-center justify-center px-4 py-16 text-center">
          <div className="w-full rounded-2xl bg-ink-soft/60 p-6 ring-1 ring-mist/15 sm:p-8">
            <h2 className="font-display text-2xl font-semibold sm:text-3xl">
              One quick step first
            </h2>
            <p className="mt-3 text-base leading-relaxed text-mist/80 sm:text-lg">
              Create a free account to post your ministry on your city's map.
            </p>
            <div className="mt-6 flex flex-col gap-3">
              <Link
                to="/auth"
                search={{ mode: "signup", next: "/start" }}
                className="rounded-full bg-lemon px-6 py-4 text-lg font-bold text-ink transition-transform hover:-translate-y-0.5"
              >
                Create Account
              </Link>
              <Link
                to="/auth"
                search={{ next: "/start" }}
                className="rounded-full bg-ink px-6 py-4 text-lg font-semibold text-sand ring-1 ring-mist/25 transition hover:bg-ink-soft"
              >
                Sign in
              </Link>
            </div>
          </div>
        </main>
      ) : (
        <>
          <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-6 pb-28 sm:px-6 sm:py-8">
            <div className="mb-6 grid gap-3 sm:grid-cols-2">
              <Link
                to="/create-ministry"
                className="rounded-2xl bg-lemon px-5 py-4 text-center text-base font-semibold text-ink transition-transform hover:-translate-y-0.5"
              >
                Create a unique ministry
              </Link>
              {shapeAccess === "full" ? (
                <Link
                  to="/shape"
                  className="rounded-2xl bg-ink-soft px-5 py-4 text-center text-base font-semibold text-sand ring-1 ring-mist/25 transition hover:bg-ink-soft/70"
                >
                  Help me create a Ministry
                </Link>
              ) : (
                <div
                  aria-disabled="true"
                  className="flex flex-col items-center gap-1 rounded-2xl bg-ink-soft/40 px-5 py-4 text-center ring-1 ring-mist/15"
                >
                  <span className="text-base font-semibold text-mist/60">
                    Help me create a Ministry
                  </span>
                  <span className="text-xs font-semibold uppercase tracking-wider text-mist/50">
                    Coming soon
                  </span>
                </div>
              )}
            </div>

            <p className="mb-4 text-sm font-semibold uppercase tracking-wider text-sand/90">
              Or choose a pre-made ministry
            </p>

            <ul className="flex flex-col gap-3">
              {ministries.map((m) => {
                const isSelected = m.id === selected;
                return (
                  <li key={m.id}>
                    <button
                      type="button"
                      onClick={() => setSelected(isSelected ? null : m.id)}
                      aria-pressed={isSelected}
                      className={`flex w-full items-start gap-4 rounded-2xl p-4 text-left transition ${
                        isSelected
                          ? "bg-ink-soft ring-2 ring-lemon"
                          : "bg-ink-soft/40 ring-1 ring-mist/15 hover:bg-ink-soft/70"
                      }`}
                    >
                      <span
                        className={`grid size-14 shrink-0 place-items-center rounded-xl ring-1 sm:size-16 ${toneStyles[m.tone]}`}
                      >
                        <m.icon className="size-6 sm:size-7" aria-hidden="true" />
                      </span>
                      <span className="flex min-w-0 flex-1 flex-col gap-1 py-0.5">
                        <span className="font-display text-base font-semibold text-sand sm:text-lg">
                          {m.label}
                        </span>
                        <span className="line-clamp-2 text-sm leading-relaxed text-mist/70 sm:text-base">
                          {m.description}
                        </span>
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          </main>

          <div className="sticky bottom-0 border-t border-ink-soft bg-ink/95 backdrop-blur">
            <div className="mx-auto flex w-full max-w-6xl flex-col items-center gap-2 px-4 py-4 sm:flex-row sm:justify-between sm:px-6">
              <p className="text-xs text-mist/70">
                {chosen ? (
                  <>
                    Selected: <span className="text-sand">{chosen.label}</span>
                  </>
                ) : (
                  "Tap a ministry type to select it"
                )}
              </p>
              <Link
                to="/create-ministry"
                search={{
                  short: chosen?.label,
                  desc: chosen?.description,
                  icon: chosen?.id,
                }}
                className={`inline-flex w-full items-center justify-center rounded-full px-8 py-3 text-base font-semibold transition sm:w-auto ${
                  chosen
                    ? "bg-lemon text-ink hover:-translate-y-0.5"
                    : "pointer-events-none bg-ink-soft text-mist/40"
                }`}
              >
                Continue
              </Link>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
