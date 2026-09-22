import { Camera, ChevronLeft, ChevronRight, MapPin, X } from "lucide-react";
import { lazy, Suspense, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";

const MeetupPinPicker = lazy(() => import("./MeetupPinPicker"));

export type LatLng = { lat: number; lng: number };

type Props = {
  date: Date | undefined;
  onDate: (d: Date) => void;
  time: string; // "HH:MM" 24h
  onTime: (t: string) => void;
  location: string;
  onLocation: (v: string) => void;
  pin: LatLng | null;
  onPin: (p: LatLng | null) => void;
  photo?: File | null;
  onPhoto?: (f: File | null) => void;
};

const sameDay = (a: Date, b: Date) =>
  a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();

/** Large dark calendar, big time buttons, place name and optional exact pin. */
export function MeetupScheduler(p: Props) {
  const { t, i18n } = useTranslation();
  const today = useMemo(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  }, []);
  const [view, setView] = useState(() => new Date(today.getFullYear(), today.getMonth(), 1));
  const [picking, setPicking] = useState(false);

  const cells = useMemo(() => {
    const first = new Date(view.getFullYear(), view.getMonth(), 1);
    const start = first.getDay();
    const days = new Date(view.getFullYear(), view.getMonth() + 1, 0).getDate();
    const out: (Date | null)[] = Array.from({ length: start }, () => null);
    for (let i = 1; i <= days; i++) out.push(new Date(view.getFullYear(), view.getMonth(), i));
    return out;
  }, [view]);

  const weekdays = useMemo(
    () =>
      Array.from({ length: 7 }, (_, i) =>
        new Date(2024, 0, 7 + i).toLocaleDateString(i18n.language, { weekday: "narrow" }),
      ),
    [i18n.language],
  );

  const [hh, mm] = p.time.split(":").map(Number);
  const pm = (hh ?? 0) >= 12;
  const hour12 = ((hh ?? 0) % 12) || 12;
  const setParts = (h12: number, min: number, isPm: boolean) => {
    const h24 = (h12 % 12) + (isPm ? 12 : 0);
    p.onTime(`${String(h24).padStart(2, "0")}:${String(min).padStart(2, "0")}`);
  };
  const canPrev = view > new Date(today.getFullYear(), today.getMonth(), 1);

  const chip = "grid h-12 place-items-center rounded-xl text-lg font-semibold ring-1 transition active:scale-95";

  return (
    <div className="flex flex-col gap-4 rounded-2xl bg-ink p-4 ring-1 ring-lemon/30">
      {/* Calendar */}
      <div>
        <div className="mb-3 flex items-center justify-between">
          <button
            type="button"
            disabled={!canPrev}
            onClick={() => setView(new Date(view.getFullYear(), view.getMonth() - 1, 1))}
            aria-label={t("Previous month")}
            className="grid size-12 place-items-center rounded-full bg-ink-soft text-sand ring-1 ring-mist/25 disabled:opacity-30"
          >
            <ChevronLeft className="size-6" />
          </button>
          <p className="font-display text-2xl text-sand">
            {view.toLocaleDateString(i18n.language, { month: "long", year: "numeric" })}
          </p>
          <button
            type="button"
            onClick={() => setView(new Date(view.getFullYear(), view.getMonth() + 1, 1))}
            aria-label={t("Next month")}
            className="grid size-12 place-items-center rounded-full bg-ink-soft text-sand ring-1 ring-mist/25"
          >
            <ChevronRight className="size-6" />
          </button>
        </div>
        <div className="grid grid-cols-7 gap-1.5 text-center">
          {weekdays.map((w, i) => (
            <span key={i} className="pb-1 text-sm font-semibold uppercase text-mist/60">
              {w}
            </span>
          ))}
          {cells.map((d, i) => {
            if (!d) return <span key={i} />;
            const past = d < today;
            const sel = p.date && sameDay(d, p.date);
            const isToday = sameDay(d, today);
            return (
              <button
                key={i}
                type="button"
                disabled={past}
                onClick={() => p.onDate(d)}
                aria-pressed={!!sel}
                className={`grid aspect-square min-h-11 place-items-center rounded-xl text-lg font-semibold transition active:scale-95 disabled:opacity-25 ${
                  sel
                    ? "bg-lemon text-ink shadow-[0_0_18px_-2px] shadow-lemon/60"
                    : isToday
                      ? "bg-ink-soft text-lemon ring-2 ring-lemon/60"
                      : "bg-ink-soft text-sand ring-1 ring-mist/15 hover:ring-lemon/40"
                }`}
              >
                {d.getDate()}
              </button>
            );
          })}
        </div>
      </div>

      {/* Time */}
      <div>
        <p className="mb-2 text-sm uppercase tracking-[0.15em] text-lemon/80">{t("Time")}</p>
        <div className="grid grid-cols-6 gap-1.5">
          {Array.from({ length: 12 }, (_, i) => i + 1).map((h) => (
            <button
              key={h}
              type="button"
              onClick={() => setParts(h, mm ?? 0, pm)}
              className={`${chip} ${hour12 === h ? "bg-lemon text-ink ring-lemon" : "bg-ink-soft text-sand ring-mist/20"}`}
            >
              {h}
            </button>
          ))}
        </div>
        <div className="mt-2 grid grid-cols-6 gap-1.5">
          {[0, 15, 30, 45].map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => setParts(hour12, m, pm)}
              className={`${chip} ${mm === m ? "bg-lemon text-ink ring-lemon" : "bg-ink-soft text-sand ring-mist/20"}`}
            >
              :{String(m).padStart(2, "0")}
            </button>
          ))}
          {(["AM", "PM"] as const).map((ap) => (
            <button
              key={ap}
              type="button"
              onClick={() => setParts(hour12, mm ?? 0, ap === "PM")}
              className={`${chip} ${pm === (ap === "PM") ? "bg-tone-cyan/30 text-sand ring-tone-cyan/60" : "bg-ink-soft text-sand ring-mist/20"}`}
            >
              {ap}
            </button>
          ))}
        </div>
      </div>

      {/* Place */}
      <input
        value={p.location}
        onChange={(e) => p.onLocation(e.target.value)}
        maxLength={200}
        placeholder={t("Where? e.g. coffee shop on Main St")}
        aria-label={t("Location")}
        className="rounded-xl bg-ink-soft px-4 py-3.5 text-lg text-sand ring-1 ring-mist/25 focus:outline-none focus:ring-lemon/50"
      />

      {/* Exact pin */}
      {picking ? (
        <Suspense fallback={<div className="h-64 animate-pulse rounded-xl bg-ink-soft" />}>
          <MeetupPinPicker
            initialQuery={p.location}
            value={p.pin}
            onChange={p.onPin}
            onDone={() => setPicking(false)}
          />
        </Suspense>
      ) : p.pin ? (
        <div className="flex items-center gap-2 rounded-xl bg-tone-emerald/15 px-4 py-3 text-base text-sand ring-1 ring-tone-emerald/45">
          <MapPin className="size-5 text-tone-emerald" />
          <span className="flex-1">{t("Exact location pinned")}</span>
          <button type="button" onClick={() => setPicking(true)} className="font-semibold text-lemon">
            {t("Edit")}
          </button>
          <button type="button" onClick={() => p.onPin(null)} aria-label={t("Remove")}>
            <X className="size-5 text-mist/70" />
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setPicking(true)}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-ink-soft px-4 py-3.5 text-lg font-semibold text-sand ring-1 ring-lemon/40"
        >
          <MapPin className="size-5 text-lemon" />
          {t("Pin exact location (optional)")}
        </button>
      )}
    </div>
  );
}
