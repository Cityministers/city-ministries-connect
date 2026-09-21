import { Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { HandHelping, Loader2, Trash2, X } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { deletePrayer, type PrayerDTO } from "@/lib/prayers.functions";

/**
 * A prayer opens in the same card shape as a ministry or a need: the poster's
 * block at the top, their own words below.
 */
export function PrayerPost({
  prayer,
  canRemove = false,
  onClose,
  onRemoved,
}: {
  prayer: PrayerDTO;
  canRemove?: boolean;
  onClose: () => void;
  onRemoved?: () => void;
}) {
  const { t } = useTranslation();
  const remove = useServerFn(deletePrayer);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleRemove() {
    setBusy(true);
    setError(null);
    try {
      await remove({ data: { id: prayer.id } });
      onRemoved?.();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : t("Could not remove that prayer."));
      setBusy(false);
    }
  }

  const place = [prayer.city, prayer.zip].filter(Boolean).join(" ");

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center bg-ink/80 backdrop-blur-sm sm:items-center sm:p-4"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label={prayer.shortTitle}
    >
      <div
        className="flex max-h-[92dvh] w-full max-w-md flex-col overflow-y-auto rounded-b-2xl bg-ink-soft shadow-[0_20px_50px_-20px_rgba(0,0,0,.9)] ring-1 ring-mist/20 sm:rounded-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="relative grid h-40 w-full place-items-center bg-tone-purple/15 text-tone-purple sm:h-44">
          <HandHelping className="size-16 opacity-80" aria-hidden="true" />
          <button
            type="button"
            onClick={onClose}
            className="absolute right-3 top-3 grid size-9 place-items-center rounded-full bg-ink/80 text-sand ring-1 ring-mist/20 transition hover:bg-ink"
            aria-label={t("Close post")}
          >
            <X className="size-4" aria-hidden="true" />
          </button>
          {prayer.posterPhotoUrl ? (
            <img
              src={prayer.posterPhotoUrl}
              alt=""
              className="absolute bottom-3 left-3 size-11 rounded-xl object-cover ring-1 ring-mist/30"
            />
          ) : (
            <span className="absolute bottom-3 left-3 grid size-11 place-items-center rounded-xl bg-tone-purple/20 text-lg font-bold text-tone-purple ring-1 ring-tone-purple/40">
              {prayer.anonymous ? "?" : prayer.posterName.slice(0, 1).toUpperCase()}
            </span>
          )}
        </div>

        <div className="flex flex-col gap-4 p-5">
          <div>
            <p className="text-sm font-medium uppercase tracking-[0.2em] text-mist/50 sm:text-base">
              {t("Prayer")}
              {place ? ` · ${place}` : ""}
            </p>
            <h2 className="font-display text-3xl font-semibold text-sand sm:text-4xl">
              {prayer.anonymous ? t("Anonymous") : prayer.posterName}
            </h2>
          </div>

          <h3 className="font-heading text-xl text-sand">{prayer.shortTitle}</h3>
          <p className="whitespace-pre-line text-base leading-relaxed text-mist/90">{prayer.body}</p>

          {prayer.churchId && (
            <Link
              to="/church/$id"
              params={{ id: prayer.churchId }}
              className="text-sm text-lemon underline decoration-lemon/40 underline-offset-2"
            >
              {t("See this church")}
            </Link>
          )}

          {error && (
            <p className="rounded-lg bg-rose/15 px-3 py-2 text-sm text-rose ring-1 ring-rose/30">
              {error}
            </p>
          )}

          {canRemove && (
            <button
              type="button"
              onClick={() => void handleRemove()}
              disabled={busy}
              className="inline-flex w-fit items-center gap-2 rounded-full bg-ink px-4 py-2 text-sm font-semibold text-rose ring-1 ring-rose/30 transition hover:bg-ink/70 disabled:opacity-60"
            >
              {busy ? (
                <Loader2 className="size-4 animate-spin" aria-hidden="true" />
              ) : (
                <Trash2 className="size-4" aria-hidden="true" />
              )}
              {t("Remove this prayer")}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
