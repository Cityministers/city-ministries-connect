import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Check, Church } from "lucide-react";
import { useState } from "react";
import { listChurchesNear, requestChurchPost } from "@/lib/churches.functions";

type Props = {
  kind: "ministry" | "need";
  postId: string;
  city: string;
  zip: string;
};

/** Lets a poster ask a church to list their post on its page. */
export function ChurchPicker({ kind, postId, city, zip }: Props) {
  const fetchChurches = useServerFn(listChurchesNear);
  const ask = useServerFn(requestChurchPost);
  const [sent, setSent] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const { data: churches } = useQuery({
    queryKey: ["churches-near", city, zip],
    queryFn: () => fetchChurches({ data: { city, zip } }),
  });

  if (!churches || churches.length === 0) return null;

  return (
    <div className="mt-4 rounded-xl bg-ink p-4 text-left ring-1 ring-mist/15">
      <p className="inline-flex items-center gap-2 font-semibold text-sand">
        <Church className="size-5 text-lemon" aria-hidden="true" />
        Which church?
      </p>
      <p className="mt-1 text-sm text-mist/70">
        Ask a church to list this on their page. They'll approve it first.
      </p>
      <ul className="mt-3 flex flex-col gap-2">
        {churches.map((c) => (
          <li key={c.id}>
            <button
              type="button"
              disabled={busy || sent === c.id}
              onClick={() => {
                setBusy(true);
                void ask({ data: { churchId: c.id, kind, postId } })
                  .then(() => setSent(c.id))
                  .finally(() => setBusy(false));
              }}
              className={`flex w-full items-center justify-between gap-3 rounded-xl px-4 py-3 text-left text-base font-semibold transition disabled:opacity-70 ${
                sent === c.id
                  ? "bg-tone-emerald/15 text-tone-emerald ring-1 ring-tone-emerald/45"
                  : "bg-ink-soft text-sand ring-1 ring-mist/25 hover:ring-mist/50"
              }`}
            >
              <span className="min-w-0">
                <span className="block truncate">{c.name}</span>
                <span className="block truncate text-xs font-normal text-mist/60">
                  {c.city}
                  {c.zip ? ` ${c.zip}` : ""}
                </span>
              </span>
              {sent === c.id ? (
                <Check className="size-5 shrink-0" aria-hidden="true" />
              ) : (
                <span className="shrink-0 text-sm">Ask</span>
              )}
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
