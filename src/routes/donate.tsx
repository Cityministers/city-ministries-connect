import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, Heart } from "lucide-react";

export const Route = createFileRoute("/donate")({
  head: () => ({
    meta: [
      { title: "Donate — City Ministers" },
      {
        name: "description",
        content:
          "Support City Ministers. Your gift helps us keep the platform running and reach more neighbors with kindness.",
      },
      { property: "og:title", content: "Donate — City Ministers" },
      {
        property: "og:description",
        content:
          "Give to City Ministers and help us connect more neighbors through local ministries and compassion.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: DonatePage,
});

function DonatePage() {
  return (
    <div className="flex min-h-dvh flex-col bg-ink font-body text-sand antialiased">
      <header className="border-b border-ink-soft bg-ink-soft/70">
        <div className="mx-auto flex w-full max-w-3xl items-center gap-3 px-4 py-4 sm:px-6">
          <Link
            to="/map"
            className="grid size-10 shrink-0 place-items-center rounded-full bg-ink text-lemon ring-1 ring-mist/20 transition hover:bg-ink-soft"
            aria-label="Back to map"
          >
            <ArrowLeft className="size-4" aria-hidden="true" />
          </Link>
          <h1 className="font-display text-lg font-semibold sm:text-xl">Donate</h1>
        </div>
      </header>

      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-8 sm:px-6 sm:py-12">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 grid size-16 place-items-center rounded-2xl bg-emerald/15 text-emerald ring-1 ring-emerald/30">
            <Heart className="size-8" aria-hidden="true" />
          </div>
          <h2 className="font-display text-2xl font-semibold sm:text-3xl">
            Help us keep serving
          </h2>
          <p className="mt-3 text-base text-mist/80 sm:text-lg">
            City Ministers is built to connect neighbors for free. Your donation keeps the lights on and the map growing.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          {["$10", "$25", "$50"].map((amount) => (
            <button
              key={amount}
              type="button"
              className="rounded-2xl bg-ink-soft/40 p-5 text-center ring-1 ring-mist/15 transition hover:bg-ink-soft/70"
            >
              <span className="font-display text-2xl font-semibold text-sand">{amount}</span>
              <span className="mt-2 block text-xs text-mist/60">One-time gift</span>
            </button>
          ))}
        </div>

        <div className="mt-6 rounded-2xl bg-ink-soft/40 p-5 ring-1 ring-mist/15">
          <label htmlFor="custom" className="mb-2 block text-sm font-medium text-sand">
            Custom amount
          </label>
          <div className="flex items-center gap-2">
            <span className="text-lg text-mist/70">$</span>
            <input
              id="custom"
              type="number"
              min="1"
              className="flex-1 rounded-xl bg-ink px-4 py-3 text-base text-sand ring-1 ring-mist/20 placeholder:text-mist/50 focus:outline-none focus:ring-lemon/50"
              placeholder="Enter amount"
            />
          </div>
        </div>

        <button
          type="button"
          className="group relative mt-6 w-full overflow-hidden rounded-2xl px-6 py-3 text-base font-semibold text-sand transition active:scale-[0.98]"
        >
          <div className="absolute inset-0 bg-gradient-to-tr from-emerald-dark via-emerald to-emerald-light" />
          <div className="absolute inset-0 bg-gradient-to-b from-white/10 to-transparent pointer-events-none" />
          <div className="absolute inset-0 rounded-2xl shadow-[inset_0_0_12px_rgba(255,255,255,0.2)]" />
          <div className="absolute -inset-1 bg-emerald-light opacity-20 blur-xl transition-opacity group-hover:opacity-40" />
          <span className="relative z-10">Give now</span>
        </button>

        <p className="mt-6 text-center text-xs text-mist/60">
          This is a placeholder donation flow. Connect your preferred payment processor to start accepting gifts.
        </p>
      </main>
    </div>
  );
}
