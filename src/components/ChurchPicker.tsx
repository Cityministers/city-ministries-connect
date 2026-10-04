import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Check, Church } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { listChurchesNear, requestChurchPost } from "@/lib/churches.functions";

type Props = {
  kind: "ministry" | "need";
  postId: string;
  city: string;
  zip: string;
  country?: string;
  /** Church the poster came from — shown first in the list. */
  preferChurchId?: string | undefined;
};

/** Lets a poster ask a church to list their post on its page. */
export function ChurchPicker({ kind, postId, city, zip, country = "US", preferChurchId }: Props) {
  const { t } = useTranslation();
  const fetchChurches = useServerFn(listChurchesNear);
  const ask = useServerFn(requestChurchPost);
  const [sent, setSent] = useState<string | null>(null);
  const [listed, setListed] = useState(false);
  const [busy, setBusy] = useState(false);

  const { data: churches } = useQuery({
    queryKey: ["churches-near", city, zip, country],
    queryFn: () => fetchChurches({ data: { city, zip, country } }),
  });

  if (!churches || churches.length === 0) return null;

  const ordered = preferChurchId
    ? [...churches].sort((a, b) =>
        a.id === preferChurchId ? -1 : b.id === preferChurchId ? 1 : 0,
      )
    : churches;

  return (
    <div className="mt-4 rounded-xl bg-ink p-4 text-left ring-1 ring-mist/15">
      <p className="inline-flex items-center gap-2 font-semibold text-sand">
        <Church className="size-5 text-lemon" aria-hidden="true" />
        {t("Which church?")}
      </p>
      <p className="mt-1 text-sm text-mist/70">
        {t("Ask a church to list this on their page. They'll approve it first.")}
      </p>
      <ul className="mt-3 flex flex-col gap-2">
        {ordered.map((c) => (
          <li key={c.id}>
            <button
              type="button"
              disabled={busy || sent === c.id}
              onClick={() => {
                setBusy(true);
                void ask({ data: { churchId: c.id, kind, postId } })
                  .then((res) => {
                    setSent(c.id);
                    setListed(res?.status === "approved");
                  })
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
                <span className="inline-flex shrink-0 items-center gap-1.5 text-sm">
                  <Check className="size-5" aria-hidden="true" />
                  {listed ? t("Listed at {{name}}", { name: c.name }) : t("Sent for approval")}
                </span>
              ) : (
                <span className="shrink-0 text-sm">{t("Ask")}</span>
              )}
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
