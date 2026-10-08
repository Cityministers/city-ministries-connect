import { ScriptureTextarea } from "@/components/ScriptureTextarea";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import {
  ArrowLeft,
  Camera,
  ImagePlus,
  Loader2,
  MailCheck,
  MapPin,
  PartyPopper,
  UserCircle,
  X,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { CountrySelect } from "@/components/CountrySelect";
import { validLocation, placeLabel } from "@/lib/country";
import { ChurchPicker } from "@/components/ChurchPicker";
import { createUserNeed } from "@/lib/needs.functions";
import { supabase } from "@/integrations/supabase/client";
import { ministries, toneStyles } from "@/data/ministries";
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

export const Route = createFileRoute("/_authenticated/post-need")({
  validateSearch: (
    search: Record<string, unknown>,
  ): {
    church?: string | undefined;
    short?: string | undefined;
    title?: string | undefined;
    description?: string | undefined;
  } => {
    const str = (k: string) => (typeof search[k] === "string" ? (search[k] as string) : undefined);
    return { church: str("church"), short: str("short"), title: str("title"), description: str("description") };
  },
  head: () => ({
    meta: [
      { title: "Post a need — City Ministers" },
      {
        name: "description",
        content:
          "Tell your neighbors what you need — a ride, a meal, a hand moving — and let the people nearby answer.",
      },
      { property: "og:title", content: "Post a need — City Ministers" },
      {
        property: "og:description",
        content: "Share a need with the neighbors around you on City Ministers.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: PostNeedPage,
});

function PostNeedPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const search = Route.useSearch();
  const create = useServerFn(createUserNeed);
  const fileRef = useRef<HTMLInputElement>(null);

  const [confirmed, setConfirmed] = useState<boolean | null>(null);
  const [email, setEmail] = useState("");
  const [resent, setResent] = useState(false);

  const [shortTitle, setShortTitle] = useState((search.short ?? "").slice(0, 24));
  const [title, setTitle] = useState((search.title ?? "").slice(0, 90));
  const [description, setDescription] = useState((search.description ?? "").slice(0, 1000));
  const [city, setCity] = useState("");
  const [zip, setZip] = useState("");
  const [country, setCountry] = useState("US");
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [mode, setMode] = useState<"pick" | "custom">("custom");
  const [category, setCategory] = useState<string | null>(null);
  const picked = ministries.find((m) => m.id === category);
  const [media, setMedia] = useState<MediaPreview[]>([]);
  const mediaRef = useRef<HTMLInputElement>(null);
  const [agreed, setAgreed] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [posted, setPosted] = useState<{ id: string; shortTitle: string; place: string } | null>(
    null,
  );

  useEffect(() => {
    void supabase.auth.getUser().then(({ data }) => {
      setEmail(data.user?.email ?? "");
      setConfirmed(Boolean(data.user?.email_confirmed_at));
    });
  }, []);

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
    if (next) setCategory(null);
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

  function pickCategory(id: string) {
    const isSame = id === category;
    setCategory(isSame ? null : id);
    if (!isSame) {
      setFile(null);
      setPreview(null);
      const found = ministries.find((m) => m.id === id);
      if (found) setShortTitle(found.label.slice(0, 24));
    }
  }

  async function resend() {
    if (!email) return;
    await supabase.auth.resend({
      type: "signup",
      email,
      options: { emailRedirectTo: window.location.origin },
    });
    setResent(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (shortTitle.trim().length < 2) return setError(t("Add a short title."));
    if (description.trim().length < 10)
      return setError(t("Add a little more about what you need."));
    if (!validLocation(city, zip))
      return setError(t("Enter the city or postal code where you need help."));
    if (!agreed)
      return setError(t("Please read and accept the User & Privacy Agreement first."));

    setBusy(true);
    try {
      let avatarPath = "";
      if (file) {
        try {
          const { data: userData } = await supabase.auth.getUser();
          const uid = userData.user?.id;
          if (!uid) throw new Error(t("Please sign in again."));
          const upload = await shrinkImage(file);
          const ext =
            upload.type === "image/jpeg" ? "jpg" : (upload.name.split(".").pop()?.toLowerCase() ?? "jpg");
          const path = `${uid}/need-${Date.now()}.${ext}`;
          const { error: upErr } = await supabase.storage
            .from("ministry-avatars")
            .upload(path, upload, { upsert: true, contentType: upload.type });
          if (upErr) throw new Error(upErr.message);
          avatarPath = path;
        } catch (err) {
          setError(friendlyUploadError(err));
          setBusy(false);
          return;
        }
      }

      const gallery = await uploadMedia(media, "need");

      const result = await create({
        data: {
          shortTitle: shortTitle.trim(),
          title: title.trim(),
          description: description.trim(),
          city: city.trim(),
          zip: zip.trim(),
          country,
          avatarPath,
          category: category ?? "",
          gallery,
        },
      });

      const place = placeLabel(city.trim(), zip.trim(), country);
      setPosted({ id: result.id, shortTitle: shortTitle.trim(), place });
    } catch (err) {
      setError(err instanceof Error ? err.message : t("Something went wrong."));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex min-h-dvh flex-col bg-ink font-body text-sand antialiased">
      <header className="border-b border-ink-soft bg-ink-soft/70">
        <div className="mx-auto flex w-full max-w-lg items-center gap-3 px-4 py-4">
          <Link
            to="/map"
            className="grid size-10 shrink-0 place-items-center rounded-full bg-ink text-lemon ring-1 ring-mist/20 transition hover:bg-ink-soft"
            aria-label={t("Back to map")}
          >
            <ArrowLeft className="size-4" aria-hidden="true" />
          </Link>
          <div>
            <h1 className="font-display text-2xl font-semibold leading-tight sm:text-3xl">
              {t("Post a need")}
            </h1>
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-lg flex-1 px-4 py-6 sm:py-8">
        {confirmed === false ? (
          <div className="flex flex-col items-start gap-4 rounded-2xl bg-ink-soft/60 p-5 ring-1 ring-lemon/30">
            <MailCheck className="size-8 text-lemon" aria-hidden="true" />
            <h2 className="font-display text-lg font-semibold">{t("Confirm your email to post a need")}</h2>
            <p className="text-sm leading-relaxed text-mist/75">
              {t("We sent a confirmation link to {{email}}. Tap the link, then come back here to share your need.", { email: email || t("your email address") })}
            </p>
            <button
              type="button"
              onClick={() => void resend()}
              className="rounded-full bg-lemon px-5 py-3 text-base font-semibold text-ink transition hover:opacity-90"
            >
              {resent ? t("Sent again — check your inbox") : t("Resend confirmation email")}
            </button>
          </div>
        ) : confirmed === null ? (
          <p className="py-16 text-center text-sm text-mist/60">{t("Loading…")}</p>
        ) : (
          <form className="flex flex-col gap-4" onSubmit={(e) => void handleSubmit(e)}>
            <div className="flex flex-col gap-4 rounded-2xl bg-ink-soft/60 p-4 ring-1 ring-mist/15">
              <div className="flex items-center gap-4">
                <button
                  type="button"
                  onClick={() => {
                    if (picked) return;
                    fileRef.current?.click();
                  }}
                  className={`grid size-16 shrink-0 place-items-center overflow-hidden rounded-xl ring-1 transition ${
                    picked
                      ? toneStyles[picked.tone]
                      : "bg-ink text-mist/60 ring-mist/25 hover:ring-lemon/50"
                  }`}
                  aria-label={picked ? picked.label : t("Add your profile photo")}
                >
                  {picked ? (
                    <picked.icon className="size-7" aria-hidden="true" />
                  ) : preview ? (
                    <img src={preview} alt={t("Your profile")} className="size-full object-cover" />
                  ) : (
                    <Camera className="size-6" aria-hidden="true" />
                  )}
                </button>
                <div className="min-w-0">
                  <p className="text-lg font-medium text-sand sm:text-xl">
                    {shortTitle.trim() || t("Short title")}
                  </p>
                  <p className="text-base text-mist/60 sm:text-lg">
                    {t("This is how your need looks on the map and in the list.")}
                  </p>
                </div>
                <input
                  ref={fileRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => pickPhoto(e.target.files?.[0] ?? null)}
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setMode("pick")}
                  aria-pressed={mode === "pick"}
                  className={`rounded-xl px-3 py-3 text-sm font-semibold leading-tight transition sm:text-base ${
                    mode === "pick"
                      ? "bg-lemon text-ink"
                      : "bg-ink text-sand ring-1 ring-mist/20 hover:bg-ink-soft"
                  }`}
                >
                  <span className="block">{t("Choose from")}</span>
                  <span className="block">{t("ministry list")}</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setMode("custom");
                    setCategory(null);
                  }}
                  aria-pressed={mode === "custom"}
                  className={`rounded-xl px-3 py-3 text-sm font-semibold leading-tight transition sm:text-base ${
                    mode === "custom"
                      ? "bg-lemon text-ink"
                      : "bg-ink text-sand ring-1 ring-mist/20 hover:bg-ink-soft"
                  }`}
                >
                  {t("Customize my own")}
                </button>
              </div>

              {mode === "pick" && (
                <ul className="flex max-h-96 flex-col gap-2 overflow-y-auto pr-1 scrollbar-hide">
                  {ministries.map((m) => {
                    const isSelected = m.id === category;
                    return (
                      <li key={m.id}>
                        <button
                          type="button"
                          onClick={() => pickCategory(m.id)}
                          aria-pressed={isSelected}
                          className={`flex w-full items-start gap-3 rounded-xl p-3 text-left transition ${
                            isSelected
                              ? "bg-ink-soft ring-2 ring-lemon"
                              : "bg-ink/60 ring-1 ring-mist/15 hover:bg-ink-soft/70"
                          }`}
                        >
                          <span
                            className={`grid size-12 shrink-0 place-items-center rounded-xl ring-1 ${toneStyles[m.tone]}`}
                          >
                            <m.icon className="size-5" aria-hidden="true" />
                          </span>
                          <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                            <span className="font-display text-lg font-semibold text-sand sm:text-xl">
                              {t(m.label)}
                            </span>
                            <span className="line-clamp-2 text-base leading-relaxed text-mist/70 sm:text-lg">
                              {t(m.description)}
                            </span>
                          </span>
                        </button>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>


            <div className="flex flex-col gap-3 rounded-2xl bg-ink-soft/60 p-4 ring-1 ring-mist/15">
              <div>
                <p className="text-lg font-semibold text-sand sm:text-xl">{t("Photos and video")}</p>
                <p className="text-base text-mist/70 sm:text-lg">
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
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-ink px-4 py-3 text-lg font-semibold text-sand ring-1 ring-mist/20 transition hover:bg-ink-soft sm:text-xl"
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

            <label className="flex flex-col gap-2 text-base text-mist/80 sm:text-lg">
              {t("Short title (shows under your icon)")}
              <input
                className="rounded-xl bg-ink-soft px-4 py-3.5 text-lg text-sand ring-1 ring-mist/20 focus:outline-none focus:ring-lemon/50 sm:text-xl"
                value={shortTitle}
                onChange={(e) => setShortTitle(e.target.value)}
                maxLength={24}
                placeholder="Ride to clinic, groceries, help moving"
                required
              />
              <span className="self-end text-sm text-mist/40 sm:text-base">{shortTitle.length}/24</span>
            </label>

            <label className="flex flex-col gap-2 text-base text-mist/80 sm:text-lg">
              {t("Personal message, passage or quote")}
              <input
                className="rounded-xl bg-ink-soft px-4 py-3.5 text-lg text-sand ring-1 ring-mist/20 focus:outline-none focus:ring-lemon/50 sm:text-xl"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                maxLength={80}
                placeholder="Need a ride to a Tuesday morning appointment"
              />
            </label>

            <label className="flex flex-col gap-2 text-base text-mist/80 sm:text-lg">
              {t("Describe your need")}
              <ScriptureTextarea
                className="min-h-36 text-lg sm:text-xl"
                value={description}
                onValueChange={setDescription}
                maxLength={400}
                placeholder="What do you need, when do you need it, and anything a neighbor should know?"
                required
              />
            </label>

            <CountrySelect value={country} onChange={setCountry} className="w-full rounded-xl bg-ink-soft px-4 py-3.5 text-base text-sand ring-1 ring-mist/20" />
          <div className="grid grid-cols-[minmax(0,1fr)_auto] gap-3">
              <label className="flex min-w-0 flex-col gap-2 text-base text-mist/80 sm:text-lg">
                {t("City")}
                <input
                  className="w-full min-w-0 rounded-xl bg-ink-soft px-4 py-3.5 text-lg text-sand ring-1 ring-mist/20 focus:outline-none focus:ring-lemon/50 sm:text-xl"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  maxLength={80}
                  placeholder="Portland"
                />
              </label>
              <label className="flex w-24 shrink-0 flex-col gap-2 text-base text-mist/80 sm:w-32 sm:text-lg">
                {t("Postal code / ZIP")}
                <input
                  className="w-full min-w-0 rounded-xl bg-ink-soft px-4 py-3.5 text-lg text-sand ring-1 ring-mist/20 focus:outline-none focus:ring-lemon/50 sm:text-xl"
                  value={zip}
                  onChange={(e) => setZip(e.target.value)}
                  maxLength={20}
                  inputMode="text"
                  placeholder="97006"
                />
              </label>
            </div>

            {error && (
              <p className="rounded-lg bg-rose/15 px-3 py-2.5 text-base text-rose ring-1 ring-rose/30 sm:text-lg">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={busy || !agreed}
              className="mt-1 inline-flex items-center justify-center gap-2 rounded-full bg-lemon px-6 py-4 text-xl font-semibold text-ink transition hover:opacity-90 disabled:opacity-60 sm:text-2xl"
            >
              {busy && <Loader2 className="size-5 animate-spin" aria-hidden="true" />}
              {t("Post my need")}
            </button>

            <label className="flex items-start gap-3 rounded-xl bg-ink-soft/60 px-4 py-3.5 text-base text-mist/80 ring-1 ring-mist/15 sm:text-lg">
              <input
                type="checkbox"
                checked={agreed}
                onChange={(e) => setAgreed(e.target.checked)}
                className="mt-0.5 size-5 shrink-0 rounded-full accent-lemon"
              />
              <span>
                {t("I have read and agree to the")}{" "}
                <Link
                  to="/terms"
                  className="text-sand underline decoration-mist/40 underline-offset-2"
                >
                  {t("User & Privacy Agreement")}
                </Link>
                .
              </span>
            </label>
          </form>
        )}
      </main>

      <Dialog
        open={!!posted}
        onOpenChange={(open) => {
          if (open) return;
          const place = posted?.place ?? [city.trim(), zip.trim()].filter(Boolean).join(", ");
          setPosted(null);
          void navigate({ to: "/map", search: { ...(place ? { place } : {}), country } });
        }}
      >
        <DialogContent className="max-h-[90dvh] w-[calc(100vw-1.5rem)] max-w-lg overflow-y-auto overscroll-contain border-ink-soft bg-ink-soft p-4 text-sand sm:rounded-2xl sm:p-6 [&>*]:min-w-0">
          <DialogHeader className="text-center">
            <div className="mx-auto mb-3 grid size-14 place-items-center rounded-full bg-lemon/15 text-lemon">
              <PartyPopper className="size-7" aria-hidden="true" />
            </div>
            <DialogTitle className="font-display text-2xl font-semibold sm:text-3xl">
              {t("Congratulations!")}
            </DialogTitle>
          </DialogHeader>
          <p className="text-center text-base text-mist/80 sm:text-lg">
            {t("Your need")} <span className="font-semibold text-sand">“{posted?.shortTitle}”</span> {t("is live.")}
          </p>
          <p className="text-center text-sm text-mist/60">
            {t("You can visit your profile page anytime to edit, pause, or delete your post.")}
          </p>
          {posted && (
            <ChurchPicker
              kind="need"
              postId={posted.id}
              city={city.trim()}
              zip={zip.trim()}
              country={country}
              preferChurchId={search.church}
            />
          )}
          <div className="mt-2 flex flex-col gap-3">
            <button
              type="button"
              onClick={() => {
                if (!posted) return;
                void navigate({ to: "/needs", search: { place: posted.place, country, new: posted.id } });
              }}
              className="inline-flex items-center justify-center gap-2 rounded-full bg-lemon px-6 py-3.5 text-lg font-semibold text-ink transition-transform hover:-translate-y-0.5"
            >
              <MapPin className="size-5" aria-hidden="true" />
              {t("View my need on the map")}
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
