import { ChevronLeft, ChevronRight } from "lucide-react";
import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import type { MyMeetupDTO } from "@/lib/meetups.functions";

const key = (d: Date) => `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;

/** Month calendar with dots: gold = accepted commitment, cyan = pending invitation. */
export function MeetupsCalendar({
  meetups,
  selected,
  onSelect,
}: {
  meetups: MyMeetupDTO[];
  selected: string | null;
  onSelect: (k: string | null) => void;
}) {
  const { t, i18n } = useTranslation();
  const today = new Date();
  const [view, setView] = useState(() => new Date(today.getFullYear(), today.getMonth(), 1));

  const byDay = useMemo(() => {
    const m = new Map<string, { accepted: boolean; pending: boolean }>();
    for (const x of meetups) {
      const k = key(new Date(x.meetAt));
      const v = m.get(k) ?? { accepted: false, pending: false };
      if (x.status === "accepted") v.accepted = true;
      else v.pending = true;
      m.set(k, v);
    }
    return m;
  }, [meetups]);

  const cells = useMemo(() => {
    const start = new Date(view.getFullYear(), view.getMonth(), 1).getDay();
    const days = new Date(view.getFullYear(), view.getMonth() + 1, 0).getDate();
    const out: (Date | null)[] = Array.from({ length: start }, () => null);
    for (let i = 1; i <= days; i++) out.push(new Date(view.getFullYear(), view.getMonth(), i));
    return out;
  }, [view]);

  const weekdays = Array.from({ length: 7 }, (_, i) =>
    new Date(2024, 0, 7 + i).toLocaleDateString(i18n.language, { weekday: "narrow" }),
  );

  return (
    <div className="rounded-2xl bg-ink-soft p-4 ring-1 ring-mist/35">
      <div className="mb-3 flex items-center justify-between">
        <button
          type="button"
          onClick={() => setView(new Date(view.getFullYear(), view.getMonth() - 1, 1))}
          aria-label={t("Previous month")}
          className="grid size-11 place-items-center rounded-full bg-ink text-sand ring-1 ring-mist/25"
        >
          <ChevronLeft className="size-6" />
        </button>
        <p className="font-display text-xl text-sand">
          {view.toLocaleDateString(i18n.language, { month: "long", year: "numeric" })}
        </p>
        <button
          type="button"
          onClick={() => setView(new Date(view.getFullYear(), view.getMonth() + 1, 1))}
          aria-label={t("Next month")}
          className="grid size-11 place-items-center rounded-full bg-ink text-sand ring-1 ring-mist/25"
        >
          <ChevronRight className="size-6" />
        </button>
      </div>
      <div className="grid grid-cols-7 gap-1 text-center">
        {weekdays.map((w, i) => (
          <span key={i} className="pb-1 text-sm font-semibold text-mist/60">{w}</span>
        ))}
        {cells.map((d, i) => {
          if (!d) return <span key={i} />;
          const k = key(d);
          const info = byDay.get(k);
          const isToday = k === key(today);
          const sel = selected === k;
          return (
            <button
              key={i}
              type="button"
              disabled={!info}
              onClick={() => onSelect(sel ? null : k)}
              className={`relative flex aspect-square flex-col items-center justify-center rounded-xl text-base font-semibold transition active:scale-95 ${
                sel
                  ? "bg-lemon text-ink"
                  : isToday
                    ? "bg-ink text-lemon ring-2 ring-lemon/60"
                    : info
                      ? "bg-ink text-sand ring-1 ring-mist/30"
                      : "text-mist/60"
              }`}
            >
              {d.getDate()}
              {info && (
                <span className="absolute bottom-1 flex gap-0.5">
                  {info.accepted && <span className="size-1.5 rounded-full bg-tone-emerald" />}
                  {info.pending && <span className="size-1.5 rounded-full bg-tone-cyan" />}
                </span>
              )}
            </button>
          );
        })}
      </div>
      <div className="mt-3 flex justify-center gap-4 text-sm text-mist/80">
        <span className="flex items-center gap-1.5"><span className="size-2 rounded-full bg-tone-emerald" />{t("Accepted")}</span>
        <span className="flex items-center gap-1.5"><span className="size-2 rounded-full bg-tone-cyan" />{t("Invitation")}</span>
      </div>
    </div>
  );
}

export const dayKey = key;
