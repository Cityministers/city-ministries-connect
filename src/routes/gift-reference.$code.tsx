import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { Loader2, Send } from "lucide-react";
import { useEffect, useState } from "react";
import { BrandLogo } from "@/components/BrandLogo";
import { ministries } from "@/data/ministries";
import { BIBLICAL_GIFTS } from "@/data/shape";
import { getGiftReference, submitGiftReference } from "@/lib/gift-references.functions";

export const Route = createFileRoute("/gift-reference/$code")({
  head: () => ({
    meta: [
      { title: "Share how they're gifted — City Ministers" },
      {
        name: "description",
        content:
          "A friend on City Ministers asked for your eyes: tap the spiritual gifts you see in them and leave a short note.",
      },
      { property: "og:title", content: "Share how they're gifted — City Ministers" },
      {
        property: "og:description",
        content: "Help a friend discover their spiritual gifts on City Ministers.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: GiftReferencePage,
});

function GiftReferencePage() {
  const { code } = Route.useParams();
  const load = useServerFn(getGiftReference);
  const submit = useServerFn(submitGiftReference);

  const [state, setState] = useState<
    | { status: "loading" }
    | { status: "missing" }
    | {
        status: "ready";
        contactName: string;
        ownerFirstName: string;
        city: string;
        nearby: { title: string; city: string }[];
      }
    | { status: "answered"; ownerFirstName: string }
    | { status: "done"; ownerFirstName: string }
  >({ status: "loading" });
  const [picked, setPicked] = useState<string[]>([]);
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let live = true;
    load({ data: { code } })
      .then((res) => {
        if (!live) return;
        if (!res.found) setState({ status: "missing" });
        else if (res.answered)
          setState({ status: "answered", ownerFirstName: res.ownerFirstName });
        else
          setState({
            status: "ready",
            contactName: res.contactName,
            ownerFirstName: res.ownerFirstName,
            city: res.city ?? "",
            nearby: res.nearby ?? [],
          });
      })
      .catch(() => {
        if (live) setState({ status: "missing" });
      });
    return () => {
      live = false;
    };
  }, [code, load]);

  function toggleGift(gift: string) {
    setPicked((prev) =>
      prev.includes(gift) ? prev.filter((g) => g !== gift) : [...prev, gift],
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (picked.length === 0 && note.trim().length === 0) {
      setError("Tap at least one gift, or write a short note.");
      return;
    }
    setBusy(true);
    try {
      await submit({ data: { code, gifts: picked, note: note.trim() } });
      setState((s) =>
        s.status === "ready"
          ? { status: "done", ownerFirstName: s.ownerFirstName }
          : s,
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong. Try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex min-h-dvh flex-col bg-ink font-body text-sand antialiased">
      <header className="border-b border-ink-soft bg-ink-soft/70">
        <div className="mx-auto w-full max-w-lg px-4 py-4">
          <BrandLogo />
        </div>
      </header>

      <main className="mx-auto w-full max-w-lg flex-1 px-4 py-6 sm:py-10">
        {state.status === "loading" && (
          <p className="flex items-center gap-3 text-lg text-mist/80">
            <Loader2 className="size-5 animate-spin" aria-hidden="true" /> Loading…
          </p>
        )}

        {state.status === "missing" && (
          <div className="flex flex-col gap-4">
            <h1 className="font-display text-2xl font-semibold sm:text-3xl">
              This link doesn't work anymore
            </h1>
            <p className="text-lg text-mist/80">
              It may have been removed. Ask your friend to send a fresh one.
            </p>
            <Link to="/" className="text-lg text-lemon underline underline-offset-4">
              Visit City Ministers
            </Link>
          </div>
        )}

        {state.status === "answered" && (
          <div className="flex flex-col gap-4">
            <h1 className="font-display text-2xl font-semibold sm:text-3xl">
              Already answered
            </h1>
            <p className="text-lg text-mist/80">
              This link was already used to encourage {state.ownerFirstName}. Thank you!
            </p>
          </div>
        )}

        {state.status === "done" && (
          <div className="flex flex-col gap-4">
            <h1 className="font-display text-2xl font-semibold sm:text-3xl">
              Thank you!
            </h1>
            <p className="text-lg text-mist/80">
              Your words are on their way to {state.ownerFirstName}. Friends often see
              gifts in us that we can't see ourselves.
            </p>
            <Link to="/" className="text-lg text-lemon underline underline-offset-4">
              Discover your own gifts on City Ministers
            </Link>
          </div>
        )}

        {state.status === "ready" && (
          <form onSubmit={(e) => void handleSubmit(e)} className="flex flex-col gap-6">
            <div>
              <p className="text-base font-semibold uppercase tracking-widest text-lemon">
                Hi {state.contactName}!
              </p>
              <h1 className="mt-2 font-display text-2xl font-semibold leading-tight sm:text-3xl">
                How is {state.ownerFirstName} spiritually gifted or talented?
              </h1>
              <p className="mt-3 text-lg leading-relaxed text-mist/80">
                {state.ownerFirstName} is discovering how to serve their neighbors, and
                asked for your honest eyes. Tap every gift you see in them.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              {BIBLICAL_GIFTS.map((gift) => {
                const active = picked.includes(gift);
                return (
                  <button
                    key={gift}
                    type="button"
                    aria-pressed={active}
                    onClick={() => toggleGift(gift)}
                    className={`rounded-2xl px-4 py-4 text-left text-lg font-medium transition-all active:scale-[0.98] ${
                      active
                        ? "bg-ink-soft text-sand shadow-[0_0_0_2px_var(--color-lemon)] ring-1 ring-lemon"
                        : "bg-ink-soft/50 text-mist/80 ring-1 ring-mist/40 hover:bg-ink-soft hover:text-sand hover:ring-mist/60"
                    }`}
                  >
                    {gift}
                  </button>
                );
              })}
            </div>

            <label className="flex flex-col gap-2">
              <span className="text-base text-mist/80">
                Anything else about how God uses {state.ownerFirstName}? (optional)
              </span>
              <textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                maxLength={600}
                rows={4}
                placeholder="I've seen the way you…"
                className="rounded-xl bg-ink-soft px-4 py-3.5 text-lg text-sand ring-1 ring-mist/20 focus:outline-none focus:ring-lemon/50"
              />
            </label>

            <section className="rounded-2xl bg-ink-soft/50 p-4 ring-1 ring-mist/15">
              <h2 className="text-lg font-semibold text-sand">
                Ministry ideas{state.city ? ` around ${state.city}` : " nearby"}
              </h2>
              <p className="mt-1 text-base text-mist/80">
                Here's how neighbors are already serving. If one fits{" "}
                {state.ownerFirstName}, mention it in your note above.
              </p>
              <ul className="mt-3 flex flex-wrap gap-2">
                {(state.nearby.length > 0
                  ? state.nearby.map((n) => n.title)
                  : ministries.slice(0, 6).map((m) => m.label)
                ).map((title) => (
                  <li
                    key={title}
                    className="rounded-full bg-ink-soft px-3 py-1.5 text-base text-sand ring-1 ring-mist/20"
                  >
                    {title}
                  </li>
                ))}
              </ul>
            </section>

            {error && (
              <p className="rounded-xl bg-rose/15 px-4 py-3 text-base text-rose ring-1 ring-rose/30">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={busy}
              className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-lemon px-6 py-4 text-lg font-semibold text-ink transition-transform hover:-translate-y-0.5 disabled:opacity-60"
            >
              {busy ? (
                <Loader2 className="size-5 animate-spin" aria-hidden="true" />
              ) : (
                <Send className="size-5" aria-hidden="true" />
              )}
              Send to {state.ownerFirstName}
            </button>
          </form>
        )}
      </main>
    </div>
  );
}
