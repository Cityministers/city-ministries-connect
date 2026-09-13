import { useQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { Loader2, Sparkles } from "lucide-react";
import { listGiftReferences } from "@/lib/gift-references.functions";

export function GiftRepliesTab() {
  const list = useServerFn(listGiftReferences);
  const query = useQuery({
    queryKey: ["gift-references"],
    queryFn: () => list({}),
  });

  if (query.isPending) {
    return (
      <p className="flex items-center gap-2 py-8 text-base text-mist/80">
        <Loader2 className="size-5 animate-spin" aria-hidden="true" />
        Loading replies…
      </p>
    );
  }

  const references = query.data?.references ?? [];
  const answered = references.filter((r) => r.respondedAt);
  const waiting = references.filter((r) => !r.respondedAt);

  if (references.length === 0) {
    return (
      <div className="py-8">
        <p className="text-lg text-mist/85">
          You haven't asked anyone about your gifts yet.
        </p>
        <Link
          to="/shape"
          className="mt-4 inline-flex items-center gap-2 rounded-full bg-lemon px-5 py-3 text-lg font-semibold text-ink"
        >
          <Sparkles className="size-5" aria-hidden="true" />
          Ask friends and family
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6 py-6">
      <section className="space-y-3">
        <h2 className="text-xl font-semibold text-sand">
          Replies ({answered.length})
        </h2>
        {answered.length === 0 ? (
          <p className="text-lg text-mist/85">
            No replies yet. They'll show up here with an alert as soon as someone answers.
          </p>
        ) : (
          answered.map((r) => (
            <article
              key={r.id}
              className="rounded-2xl bg-ink-soft p-4 ring-1 ring-mist/15"
            >
              <div className="flex items-baseline justify-between gap-3">
                <h3 className="text-xl font-semibold text-sand">{r.contactName}</h3>
                <span className="text-base text-mist/70">
                  {r.respondedAt
                    ? new Date(r.respondedAt).toLocaleDateString()
                    : ""}
                </span>
              </div>
              {r.gifts.length > 0 && (
                <ul className="mt-3 flex flex-wrap gap-2">
                  {r.gifts.map((g) => (
                    <li
                      key={g}
                      className="rounded-full bg-lemon/15 px-3.5 py-1.5 text-base font-semibold text-lemon"
                    >
                      {g}
                    </li>
                  ))}
                </ul>
              )}
              {r.note && (
                <p className="mt-3 border-l-2 border-lemon/50 bg-lemon/5 py-2 pl-3 text-lg italic text-sand">
                  “{r.note}”
                </p>
              )}
            </article>
          ))
        )}
      </section>

      {waiting.length > 0 && (
        <section className="space-y-2">
          <h2 className="text-xl font-semibold text-sand">
            Waiting on ({waiting.length})
          </h2>
          <ul className="flex flex-wrap gap-2">
            {waiting.map((r) => (
              <li
                key={r.id}
                className="rounded-full bg-ink-soft px-3.5 py-1.5 text-base text-mist/85 ring-1 ring-mist/15"
              >
                {r.contactName}
              </li>
            ))}
          </ul>
          <Link to="/shape" className="inline-block text-lg font-semibold text-lemon">
            Manage invites on your Spiritual Gift Test page
          </Link>
        </section>
      )}
    </div>
  );
}
