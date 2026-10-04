import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { ArrowLeft, Camera, ImagePlus, Loader2, MapPin, PartyPopper, UserCircle, X } from "lucide-react";
import { useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { CountrySelect } from "@/components/CountrySelect";
import { validLocation, placeLabel } from "@/lib/country";
import { ChurchPicker } from "@/components/ChurchPicker";
import { createUserMinistry } from "@/lib/ministries.functions";
import { ministries, toneStyles } from "@/data/ministries";
import { supabase } from "@/integrations/supabase/client";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  MAX_PHOTOS,
  MAX_VIDEO_BYTES,
  toPreviews,
  uploadMedia,
  type MediaPreview,
} from "@/lib/media-upload";
import { checkImageFile, friendlyUploadError, shrinkImage } from "@/lib/photo";

type CreateSearch = {
  short?: string | undefined;
  title?: string | undefined;
  desc?: string | undefined;
  city?: string | undefined;
  zip?: string | undefined;
  country?: string | undefined;
  icon?: string | undefined;
  church?: string | undefined;
};

export const Route = createFileRoute("/_authenticated/create-ministry")({
  validateSearch: (search: Record<string, unknown>): CreateSearch => ({
    short: typeof search["short"] === "string" ? search["short"] : undefined,
    title: typeof search["title"] === "string" ? search["title"] : undefined,
    desc: typeof search["desc"] === "string" ? search["desc"] : undefined,
    city: typeof search["city"] === "string" ? search["city"] : undefined,
    zip: typeof search["zip"] === "string" ? search["zip"] : undefined,
    country: typeof search["country"] === "string" ? search["country"] : undefined,
    icon: typeof search["icon"] === "string" ? search["icon"] : undefined,
    church: typeof search["church"] === "string" ? search["church"] : undefined,
  }),
  head: () => ({
    meta: [
      { title: "Create a unique ministry — City Ministers" },
      {
        name: "description",
        content:
          "Describe the ministry only you can offer, add your photo, and post it to your city's map so neighbors can find you.",
      },
      { property: "og:title", content: "Create a unique ministry — City Ministers" },
      {
        property: "og:description",
        content: "Post your own ministry to the City Ministers map.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: CreateMinistryPage,
});

function CreateMinistryPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const create = useServerFn(createUserMinistry);
  const fileRef = useRef<HTMLInputElement>(null);
  const prefill = Route.useSearch();

  const [shortTitle, setShortTitle] = useState(prefill.short ?? "");
  const [title, setTitle] = useState(prefill.title ?? "");
  const [description, setDescription] = useState(prefill.desc ?? "");
  const [city, setCity] = useState(prefill.city ?? "");
  const [zip, setZip] = useState(prefill.zip ?? "");
  const [country, setCountry] = useState(prefill.country ?? "US");
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [media, setMedia] = useState<MediaPreview[]>([]);
  const mediaRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [posted, setPosted] = useState<{ id: string; shortTitle: string; place: string } | null>(
    null,
  );

  // When the ministry was picked from our pre-made list, its icon is the map pin automatically.
  const preset = prefill.icon ? ministries.find((m) => m.id === prefill.icon) : undefined;

  function pickPhoto(next: File | null) {
    if (next) {
      const problem = checkImageFile(next);
      if (problem) {
        setError(problem);
        return;
      }
    }
    setError(null);
    setFile(next);
    setPreview(next ? URL.createObjectURL(next) : null);
  }

  function addMedia(list: FileList | null) {
    if (!list || list.length === 0) return;
    const next = [...media, ...toPreviews([...list])];
    const photos = next.filter((m) => m.kind === "image").slice(0, MAX_PHOTOS);
    const video = next.filter((m) => m.kind === "video").slice(0, 1);
    if (video[0] && video[0].file.size > MAX_VIDEO_BYTES) {
      setError(t("Videos need to be under 50 MB."));
      return;
    }
    setError(null);
    setMedia([...photos, ...video]);
  }

  function removeMedia(url: string) {
    setMedia((prev) => prev.filter((m) => m.url !== url));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (shortTitle.trim().length < 2) return setError(t("Add a short title."));
    if (description.trim().length < 10)
      return setError(t("Add a little more to your description."));
    if (!validLocation(city, zip))
      return setError(t("Enter the city or ZIP where you serve so your pin lands in the right place."));

    setBusy(true);
    try {
      let avatarPath = "";
      if (file && !preset) {
        try {
          const { data: userData } = await supabase.auth.getUser();
          const uid = userData.user?.id;
          if (!uid) throw new Error(t("Please sign in again."));
          const upload = await shrinkImage(file);
          const ext =
            upload.type === "image/jpeg" ? "jpg" : (upload.name.split(".").pop()?.toLowerCase() ?? "jpg");
          const path = `${uid}/${crypto.randomUUID()}.${ext}`;
          const { error: uploadError } = await supabase.storage
            .from("ministry-avatars")
            .upload(path, upload, { upsert: false, contentType: upload.type });
          if (uploadError) throw new Error(uploadError.message);
          avatarPath = path;
        } catch (err) {
          setError(friendlyUploadError(err));
          setBusy(false);
          return;
        }
      }

      const gallery = await uploadMedia(media, "ministry");

      const result = await create({
        data: {
          shortTitle: shortTitle.trim(),
          title: title.trim(),
          description: description.trim(),
          city: city.trim(),
          zip: zip.trim(),
          country,
          avatarPath,
          iconId: preset?.id ?? "",
          gallery,
        },
      });

      const place = placeLabel(city.trim(), zip.trim(), country);
      setPosted({ id: result.id, shortTitle: shortTitle.trim(), place });
    } catch (err) {
      setError(err instanceof Error ? err.message : t("Couldn't post your ministry."));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex min-h-dvh flex-col bg-ink font-body text-sand antialiased">
      <header className="border-b border-ink-soft bg-ink-soft/70">
        <div className="mx-auto flex w-full max-w-lg items-center gap-3 px-4 py-4">
          <Link
            to="/start"
            className="grid size-10 shrink-0 place-items-center rounded-full bg-ink text-lemon ring-1 ring-mist/20 transition hover:bg-ink-soft"
            aria-label={t("Back")}
          >
            <ArrowLeft className="size-4" aria-hidden="true" />
          </Link>
          <div>
            <h1 className="font-display text-xl font-semibold leading-tight sm:text-2xl">
              {t("Create a unique ministry")}
            </h1>
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-lg flex-1 px-4 py-6 sm:py-8">
        <form className="flex flex-col gap-4" onSubmit={(e) => void handleSubmit(e)}>
          <div className="flex items-center gap-4 rounded-2xl bg-ink-soft/60 p-4 ring-1 ring-mist/15">
            {preset ? (
              <span
                className={`grid size-16 shrink-0 place-items-center rounded-xl ring-1 ${toneStyles[preset.tone]}`}
              >
                <preset.icon className="size-7" aria-hidden="true" />
              </span>
            ) : (
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                className="grid size-16 shrink-0 place-items-center overflow-hidden rounded-xl bg-ink text-mist/60 ring-1 ring-mist/25 transition hover:ring-lemon/50"
                aria-label={t("Add your profile photo")}
              >
                {preview ? (
                  <img src={preview} alt={t("Your ministry photo")} className="size-full object-cover" />
                ) : (
                  <Camera className="size-6" aria-hidden="true" />
                )}
              </button>
            )}
            <div className="min-w-0">
              <p className="text-base font-medium text-sand">
                {shortTitle.trim() || t("Short title")}
              </p>
              <p className="text-sm text-mist/60">
                {t("This is how your pin looks on the map and in the list.")}
              </p>
            </div>
            {!preset && (
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => pickPhoto(e.target.files?.[0] ?? null)}
              />
            )}
          </div>

          <div className="flex flex-col gap-3 rounded-2xl bg-ink-soft/60 p-4 ring-1 ring-mist/15">
            <div>
              <p className="text-base font-semibold text-sand">{t("Photos and video")}</p>
              <p className="text-sm text-mist/70">
                {t("Add up to {{count}} photos and one video (50 MB max).", { count: MAX_PHOTOS })}
              </p>
            </div>
            {media.length > 0 && (
              <ul className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
                {media.map((m) => (
                  <li key={m.url} className="relative shrink-0">
                    {m.kind === "video" ? (
                      <video src={m.url} className="size-20 rounded-xl object-cover" />
                    ) : (
                      <img src={m.url} alt="" className="size-20 rounded-xl object-cover" />
                    )}
                    <button
                      type="button"
                      onClick={() => removeMedia(m.url)}
                      className="absolute -right-1 -top-1 grid size-6 place-items-center rounded-full bg-ink text-sand ring-1 ring-mist/30"
                      aria-label={t("Remove this file")}
                    >
                      <X className="size-3" aria-hidden="true" />
                    </button>
                  </li>
                ))}
              </ul>
            )}
            <button
              type="button"
              onClick={() => mediaRef.current?.click()}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-ink px-4 py-3 text-base font-semibold text-sand ring-1 ring-mist/20 transition hover:bg-ink-soft"
            >
              <ImagePlus className="size-5" aria-hidden="true" />
              {t("Add photos or video")}
            </button>
            <input
              ref={mediaRef}
              type="file"
              accept="image/*,video/*"
              multiple
              className="hidden"
              onChange={(e) => {
                addMedia(e.target.files);
                e.target.value = "";
              }}
            />
          </div>

          <label className="flex flex-col gap-2 text-sm text-mist/80 sm:text-base">
            {t("Short title (shows under your icon)")}
            <input
              className="rounded-xl bg-ink-soft px-4 py-3.5 text-base text-sand ring-1 ring-mist/20 focus:outline-none focus:ring-lemon/50"
              value={shortTitle}
              onChange={(e) => setShortTitle(e.target.value)}
              maxLength={24}
              placeholder="Free haircut, walk your dog, marry your son."
              required
            />
            <span className="self-end text-xs text-mist/40">{shortTitle.length}/24</span>
          </label>

          <label className="flex flex-col gap-2 text-sm text-mist/80 sm:text-base">
            {t("Quote or passage about your mission")}
            <input
              className="rounded-xl bg-ink-soft px-4 py-3.5 text-base text-sand ring-1 ring-mist/20 focus:outline-none focus:ring-lemon/50"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              maxLength={100}
              placeholder="Love your neighbor as yourself — I'm here to help."
            />
          </label>

          <label className="flex flex-col gap-2 text-sm text-mist/80 sm:text-base">
            {t("Description")}
            <textarea
              className="min-h-36 rounded-xl bg-ink-soft px-4 py-3.5 text-base text-sand ring-1 ring-mist/20 focus:outline-none focus:ring-lemon/50"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              maxLength={400}
              placeholder="What are you offering, who is it for, and when are you available?"
              required
            />
          </label>

          <CountrySelect value={country} onChange={setCountry} className="w-full rounded-xl bg-ink-soft px-4 py-3.5 text-base text-sand ring-1 ring-mist/20" />
          <div className="grid grid-cols-[minmax(0,1fr)_auto] gap-3">
            <label className="flex min-w-0 flex-col gap-2 text-sm text-mist/80 sm:text-base">
              {t("City")}
              <input
                className="w-full min-w-0 rounded-xl bg-ink-soft px-4 py-3.5 text-base text-sand ring-1 ring-mist/20 focus:outline-none focus:ring-lemon/50"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                maxLength={80}
                placeholder="Portland"
              />
            </label>
            <label className="flex w-24 shrink-0 flex-col gap-2 text-sm text-mist/80 sm:w-32 sm:text-base">
              {t("Postal code / ZIP")}
              <input
                className="w-full min-w-0 rounded-xl bg-ink-soft px-4 py-3.5 text-base text-sand ring-1 ring-mist/20 focus:outline-none focus:ring-lemon/50"
                value={zip}
                onChange={(e) => setZip(e.target.value)}
                maxLength={20}
                inputMode="text"
                placeholder="97006"
              />
            </label>
          </div>

          {error && (
            <p className="rounded-lg bg-rose/15 px-3 py-2.5 text-sm text-rose ring-1 ring-rose/30">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={busy}
            className="mt-1 inline-flex items-center justify-center gap-2 rounded-full bg-lemon px-6 py-4 text-lg font-semibold text-ink transition-transform hover:-translate-y-0.5 disabled:opacity-60"
          >
            {busy && <Loader2 className="size-5 animate-spin" aria-hidden="true" />}
            {t("Post my ministry")}
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
            {t("Your ministry")} <span className="font-semibold text-sand">“{posted?.shortTitle}”</span> {t("is live.")}
          </p>
          <p className="text-center text-sm text-mist/60">
            {t("You can visit your profile page anytime to edit, pause, or delete your post.")}
          </p>
          {posted && (
            <ChurchPicker
              kind="ministry"
              postId={posted.id}
              city={city.trim()}
              zip={zip.trim()}
              country={country}
              preferChurchId={prefill.church}
            />
          )}
          <div className="mt-2 flex flex-col gap-3">
            <button
              type="button"
              onClick={() => {
                if (!posted) return;
                void navigate({ to: "/map", search: { place: posted.place, country, new: posted.id } });
              }}
              className="inline-flex items-center justify-center gap-2 rounded-full bg-lemon px-6 py-3.5 text-lg font-semibold text-ink transition-transform hover:-translate-y-0.5"
            >
              <MapPin className="size-5" aria-hidden="true" />
              {t("View my ministry on the map")}
            </button>
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
