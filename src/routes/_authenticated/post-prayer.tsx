import { ScriptureDetectorPill } from "@/components/ScriptureDetectorPill";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { ArrowLeft, HandHelping, ImagePlus, Loader2, MapPin, PartyPopper, UserCircle, X } from "lucide-react";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { CountrySelect } from "@/components/CountrySelect";
import { validLocation, placeLabel } from "@/lib/country";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { listChurchesIAttend } from "@/lib/churches.functions";
import { toPreviews, uploadMedia, type MediaPreview } from "@/lib/media-upload";
import { createPrayer } from "@/lib/prayers.functions";

export const Route = createFileRoute("/_authenticated/post-prayer")({
  validateSearch: (search: Record<string, unknown>): { church?: string | undefined } => ({
    church: typeof search["church"] === "string" ? search["church"] : undefined,
  }),
  head: () => ({
    meta: [
      { title: "Post a prayer — City Ministers" },
      {
        name: "description",
        content:
          "Share a prayer with your neighbors or with your church's prayer wall on City Ministers.",
      },
      { property: "og:title", content: "Post a prayer — City Ministers" },
      {
        property: "og:description",
        content: "Ask your neighbors to pray with you on City Ministers.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: PostPrayerPage,
});

function PostPrayerPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const search = Route.useSearch();
  const create = useServerFn(createPrayer);
  const myChurches = useServerFn(listChurchesIAttend);

  const { data: churches } = useQuery({
    queryKey: ["churches-i-attend"],
    queryFn: () => myChurches({ data: undefined }),
  });

  const [place, setPlace] = useState<"map" | "church">(search.church ? "church" : "map");
  const [churchId, setChurchId] = useState<string>(search.church ?? "");
  const [shortTitle, setShortTitle] = useState("");
  const [body, setBody] = useState("");
  const [city, setCity] = useState("");
  const [zip, setZip] = useState("");
  const [country, setCountry] = useState("US");
  const [anonymous, setAnonymous] = useState(false);
  const [photo, setPhoto] = useState<MediaPreview | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [posted, setPosted] = useState<{ id: string; shortTitle: string; churchId: string | null } | null>(
    null,
  );

  useEffect(() => {
    if (place === "church" && !churchId && churches && churches.length > 0) {
      setChurchId(churches[0]!.id);
    }
  }, [place, churchId, churches]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (shortTitle.trim().length < 2) return setError(t("Add a short title."));
    if (body.trim().length < 5) return setError(t("Write your prayer."));
    if (place === "church" && !churchId) return setError(t("Choose the church for this prayer."));
    if (place === "map" && !validLocation(city, zip))
      return setError(t("Enter the city or postal code where this prayer belongs."));

    setBusy(true);
    try {
      const uploaded = photo ? await uploadMedia([photo], "prayer") : [];
      const result = await create({
        data: {
          shortTitle: shortTitle.trim(),
          body: body.trim(),
          city: place === "map" ? city.trim() : "",
          zip: place === "map" ? zip.trim() : "",
          country,
          churchId: place === "church" ? churchId : null,
          anonymous,
          imagePath: uploaded[0]?.path ?? null,
        },
      });
      setPosted({
        id: result.id,
        shortTitle: shortTitle.trim(),
        churchId: place === "church" ? churchId : null,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : t("Could not post that prayer."));
    } finally {
      setBusy(false);
    }
  }

  const field =
    "w-full rounded-xl bg-ink px-4 py-3 text-base text-sand ring-1 ring-mist/20 outline-none placeholder:text-mist/40 focus:ring-lemon/60";

  return (
    <div className="flex min-h-dvh flex-col bg-ink text-sand">
      <header className="border-b border-mist/10 px-4 py-4">
        <div className="mx-auto flex w-full max-w-lg items-center gap-3">
          <Link
            to="/map"
            className="grid size-9 place-items-center rounded-full bg-ink-soft text-sand ring-1 ring-mist/20"
            aria-label={t("Back to map")}
          >
            <ArrowLeft className="size-4" aria-hidden="true" />
          </Link>
          <h1 className="font-display text-2xl font-semibold leading-tight sm:text-3xl">
            {t("Post a prayer")}
          </h1>
        </div>
      </header>

      <main className="mx-auto w-full max-w-lg flex-1 px-4 py-6 sm:py-8">
        <form className="flex flex-col gap-4" onSubmit={(e) => void handleSubmit(e)}>
          <div className="flex flex-col gap-3 rounded-2xl bg-ink-soft/60 p-4 ring-1 ring-mist/15">
            <p className="text-base font-semibold text-sand">{t("Where should this prayer go?")}</p>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              <button
                type="button"
                onClick={() => setPlace("map")}
                aria-pressed={place === "map"}
                className={`rounded-xl px-4 py-3 text-base font-semibold ring-1 transition ${
                  place === "map"
                    ? "bg-prayer-deep text-parchment ring-prayer/50"
                    : "bg-ink text-sand ring-mist/25 hover:ring-prayer/50"
                }`}
              >
                {t("Anywhere on the map")}
              </button>
              <button
                type="button"
                onClick={() => setPlace("church")}
                aria-pressed={place === "church"}
                className={`rounded-xl px-4 py-3 text-base font-semibold ring-1 transition ${
                  place === "church"
                    ? "bg-lemon text-ink ring-lemon"
                    : "bg-ink text-sand ring-mist/25 hover:ring-lemon/50"
                }`}
              >
                {t("At my church")}
              </button>
            </div>

            {place === "church" &&
              (churches && churches.length > 0 ? (
                <select
                  value={churchId}
                  onChange={(e) => setChurchId(e.target.value)}
                  className={field}
                  aria-label={t("Choose the church for this prayer.")}
                >
                  {churches.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              ) : (
                <p className="text-sm text-mist/70">
                  {t("You're not listed at a church yet. Open a church page and tap attend first.")}
                </p>
              ))}
            <p className="text-sm text-mist/60">
              {place === "church"
                ? t("Church prayers stay on that church's prayer wall — they never go on the map.")
                : t("Map prayers are different from church prayers: they glow on the map for anyone who taps Prayers, and don't go on any church wall.")}
            </p>
          </div>

          <label className="flex flex-col gap-1.5">
            <span className="text-base font-semibold text-sand">{t("Short title")}</span>
            <input
              value={shortTitle}
              onChange={(e) => setShortTitle(e.target.value)}
              maxLength={60}
              className={field}
              placeholder={t("Healing for my mom")}
            />
          </label>

          <label className="flex flex-col gap-1.5">
            <span className="text-base font-semibold text-sand">{t("Your prayer")}</span>
            <textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              maxLength={1000}
              rows={6}
              className={field}
              placeholder={t("Share what you'd like prayer for.")}
            />
            <span className="self-end text-xs text-mist/60">{body.length}/1000</span>
          </label>
          <ScriptureDetectorPill text={body} onInsert={setBody} maxLength={1000} />

          <div className="flex flex-col gap-2">
            <span className="text-base font-semibold text-sand">{t("Add a photo (optional)")}</span>
            {photo ? (
              <div className="relative w-fit">
                <img
                  src={photo.url}
                  alt=""
                  className="size-32 rounded-xl object-cover ring-1 ring-mist/20"
                />
                <button
                  type="button"
                  onClick={() => setPhoto(null)}
                  aria-label={t("Remove photo")}
                  className="absolute -right-2 -top-2 grid size-8 place-items-center rounded-full bg-ink text-sand ring-1 ring-mist/30"
                >
                  <X className="size-4" aria-hidden="true" />
                </button>
              </div>
            ) : (
              <label className="inline-flex w-fit cursor-pointer items-center gap-2 rounded-full bg-ink px-4 py-2.5 text-base font-semibold text-sand ring-1 ring-mist/25 transition hover:ring-lemon/50">
                <ImagePlus className="size-5" aria-hidden="true" />
                {t("Choose a photo")}
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) setPhoto(toPreviews([file])[0] ?? null);
                  }}
                />
              </label>
            )}
          </div>

          {place === "map" && (
            <div className="flex flex-col gap-3">
            <CountrySelect value={country} onChange={setCountry} className={field} />
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <label className="flex flex-col gap-1.5">
                <span className="text-base font-semibold text-sand">{t("City")}</span>
                <input value={city} onChange={(e) => setCity(e.target.value)} className={field} />
              </label>
              <label className="flex flex-col gap-1.5">
                <span className="text-base font-semibold text-sand">{t("Postal code / ZIP")}</span>
                <input value={zip} onChange={(e) => setZip(e.target.value)} className={field} />
              </label>
            </div>
            </div>
          )}

          <label className="flex items-center gap-3 text-base text-mist/80">
            <input
              type="checkbox"
              checked={anonymous}
              onChange={(e) => setAnonymous(e.target.checked)}
              className="size-5 accent-[var(--color-lemon)]"
            />
            {t("Post anonymously")}
          </label>

          {error && (
            <p className="rounded-lg bg-rose/15 px-3 py-2 text-sm text-rose ring-1 ring-rose/30">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={busy}
            className="inline-flex items-center justify-center gap-2 rounded-full bg-ember px-6 py-3.5 text-lg font-semibold text-ink shadow-[0_0_18px_-4px_var(--color-ember)] transition hover:opacity-90 disabled:opacity-60"
          >
            {busy ? (
              <Loader2 className="size-5 animate-spin" aria-hidden="true" />
            ) : (
              <HandHelping className="size-5" aria-hidden="true" />
            )}
            {t("Post this prayer")}
          </button>
        </form>
      </main>

      <Dialog open={!!posted} onOpenChange={() => {}}>
        <DialogContent className="border-ink-soft bg-ink-soft text-sand sm:rounded-2xl">
          <DialogHeader className="text-center">
            <div className="mx-auto mb-3 grid size-14 place-items-center rounded-full bg-lemon/15 text-lemon">
              <PartyPopper className="size-7" aria-hidden="true" />
            </div>
            <DialogTitle className="font-display text-2xl font-semibold sm:text-3xl">
              {t("Congratulations!")}
            </DialogTitle>
          </DialogHeader>
          <p className="text-center text-base text-mist/80 sm:text-lg">
            {t("Your prayer")} <span className="font-semibold text-sand">“{posted?.shortTitle}”</span>{" "}
            {posted?.churchId
              ? t("was sent to the church. It goes on the wall once they approve it.")
              : t("is live.")}
          </p>
          <div className="mt-2 flex flex-col gap-3">
            {posted?.churchId ? (
              <Link
                to="/church/$id"
                params={{ id: posted.churchId }}
                className="inline-flex items-center justify-center gap-2 rounded-full bg-lemon px-6 py-3.5 text-lg font-semibold text-ink transition-transform hover:-translate-y-0.5"
              >
                <HandHelping className="size-5" aria-hidden="true" />
                {t("See the prayer wall")}
              </Link>
            ) : (
              <button
                type="button"
                onClick={() => {
                  if (!posted) return;
                  void navigate({ to: "/map", search: { mode: "prayer", new: posted.id } });
                }}
                className="inline-flex items-center justify-center gap-2 rounded-full bg-lemon px-6 py-3.5 text-lg font-semibold text-ink transition-transform hover:-translate-y-0.5"
              >
                <MapPin className="size-5" aria-hidden="true" />
                {t("View my prayer on the map")}
              </button>
            )}
            <Link
              to="/profile"
              search={{ tab: "posts" }}
              className="inline-flex items-center justify-center gap-2 rounded-full bg-ink px-6 py-3.5 text-base font-semibold text-sand ring-1 ring-mist/20 transition hover:bg-ink-soft"
            >
              <UserCircle className="size-5" aria-hidden="true" />
              {t("Go to my profile")}
            </Link>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
