import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import {
  ArrowLeft,
  Camera,
  Church,
  CreditCard,
  ImagePlus,
  Loader2,
  MapPin,
  PartyPopper,
  ShieldCheck,
  X,
} from "lucide-react";
import { useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { CHURCH_ICONS, churchIcon } from "@/lib/church-icons";
import { createChurch, mockSubscribe, updateChurch } from "@/lib/churches.functions";
import { iconMarkup } from "@/lib/map-icon";
import {
  MAX_PHOTOS,
  MAX_VIDEO_BYTES,
  toPreviews,
  uploadMedia,
  type MediaPreview,
} from "@/lib/media-upload";
import { placePinDataUrl } from "@/lib/place-pin";
import { checkImageFile, friendlyUploadError, shrinkImage } from "@/lib/photo";

export const Route = createFileRoute("/_authenticated/add-church")({
  head: () => ({
    meta: [
      { title: "Add your church — City Ministers" },
      {
        name: "description",
        content:
          "Put your church building and congregation on the City Ministers map, with your own page listing every ministry and need happening there.",
      },
      { property: "og:title", content: "Add your church — City Ministers" },
      {
        property: "og:description",
        content: "Feature your church on the map and gather your congregation's ministries in one place.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: AddChurchPage,
});

const inputClass =
  "w-full min-w-0 rounded-xl bg-ink-soft px-4 py-3.5 text-lg text-sand ring-1 ring-mist/20 focus:outline-none focus:ring-lemon/50 sm:text-xl";

function AddChurchPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const create = useServerFn(createChurch);
  const save = useServerFn(updateChurch);
  const pay = useServerFn(mockSubscribe);
  const fileRef = useRef<HTMLInputElement>(null);
  const mediaRef = useRef<HTMLInputElement>(null);

  const [step, setStep] = useState<"details" | "checkout">("details");
  const [churchId, setChurchId] = useState<string | null>(null);
  const [found, setFound] = useState<string | null>(null);

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [iconId, setIconId] = useState("chapel");
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");
  const [zip, setZip] = useState("");
  const [serviceTimes, setServiceTimes] = useState("");
  const [phone, setPhone] = useState("");
  const [website, setWebsite] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [media, setMedia] = useState<MediaPreview[]>([]);

  const [cardName, setCardName] = useState("");
  const [cardNumber, setCardNumber] = useState("");
  const [expiry, setExpiry] = useState("");
  const [cvc, setCvc] = useState("");

  const [busy, setBusy] = useState(false);
  const [live, setLive] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const photoCount = media.filter((m) => m.kind === "image").length;
  const hasVideo = media.some((m) => m.kind === "video");

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

  /** Extra photos and one short video for the church's own page. */
  function addMedia(files: File[]) {
    if (files.length === 0) return;
    let photos = photoCount;
    let video = hasVideo;
    const accepted: File[] = [];
    for (const f of files) {
      if (f.type.startsWith("video/")) {
        if (video) {
          setError(t("You can add one video."));
          continue;
        }
        if (f.size > MAX_VIDEO_BYTES) {
          setError(t("That video is too large — please keep it under 50MB."));
          continue;
        }
        video = true;
        accepted.push(f);
        continue;
      }
      if (photos >= MAX_PHOTOS) {
        setError(t("You can add up to {{count}} extra photos.", { count: MAX_PHOTOS }));
        continue;
      }
      photos += 1;
      accepted.push(f);
    }
    if (accepted.length > 0) setMedia((m) => [...m, ...toPreviews(accepted)]);
  }

  function removeMedia(url: string) {
    setMedia((m) => m.filter((item) => item.url !== url));
  }

  async function submitDetails(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (name.trim().length < 2) return setError(t("Add your church's name."));
    if (city.trim().length < 2) return setError(t("Add the city your church is in."));
    if (address.trim().length < 5)
      return setError(t("Add your street address — your icon sits on that exact spot."));

    setBusy(true);
    try {
      let avatarPath = "";
      if (file) {
        try {
          const { data: userData } = await supabase.auth.getUser();
          const uid = userData.user?.id;
          if (!uid) throw new Error(t("Please sign in again."));
          const upload = await shrinkImage(file);
          const path = `${uid}/church-${Date.now()}.jpg`;
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

      let gallery: { path: string; kind: "image" | "video" }[] = [];
      if (media.length > 0) {
        try {
          gallery = await uploadMedia(media, "church");
        } catch (err) {
          setError(friendlyUploadError(err));
          setBusy(false);
          return;
        }
      }

      const payload = {
        name: name.trim(),
        description: description.trim(),
        iconId: iconId as "chapel" | "cross" | "hall" | "orthodox" | "dome" | "cathedral",
        avatarPath,
        gallery,
        address: address.trim(),
        city: city.trim(),
        zip: zip.trim(),
        serviceTimes: serviceTimes.trim(),
        phone: phone.trim(),
        website: website.trim(),
      };

      // Saved once already? Then this is a corrected address, not a second church.
      const result = churchId
        ? { id: churchId, ...(await save({ data: { id: churchId, ...payload } })) }
        : await create({ data: payload });

      setChurchId(result.id);
      if (!result.located) {
        setFound(null);
        setError(
          t("We couldn't find that street address. Check the street, city and ZIP — your icon needs an exact address to sit on the map."),
        );
        return;
      }
      setFound([address.trim(), city.trim(), zip.trim()].filter(Boolean).join(", "));
      setStep("checkout");
      window.scrollTo({ top: 0 });
    } catch (err) {
      setError(err instanceof Error ? err.message : t("Something went wrong."));
    } finally {
      setBusy(false);
    }
  }

  async function submitPayment(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!churchId) return;
    if (cardName.trim().length < 2) return setError(t("Add the name on the card."));
    if (cardNumber.replace(/\s/g, "").length < 12) return setError(t("Add a card number."));

    setBusy(true);
    try {
      await pay({ data: { id: churchId, cardName: cardName.trim(), cardNumber: cardNumber.trim() } });
      setBusy(false);
      setLive(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : t("Something went wrong."));
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
          <h1 className="font-display text-2xl font-semibold leading-tight sm:text-3xl">
            {step === "details" ? t("Add your church") : t("Checkout")}
          </h1>
        </div>
      </header>

      <main className="mx-auto w-full max-w-lg flex-1 px-4 py-6 sm:py-8">
        {step === "details" ? (
          <form className="flex flex-col gap-4" onSubmit={(e) => void submitDetails(e)}>
            <div className="flex items-center gap-4 rounded-2xl bg-ink-soft/60 p-4 ring-1 ring-mist/15">
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                className="grid size-16 shrink-0 place-items-center overflow-hidden rounded-xl bg-ink text-mist/60 ring-1 ring-mist/25 transition hover:ring-lemon/50"
                aria-label={t("Add a photo of your church")}
              >
                {preview ? (
                  <img src={preview} alt={t("Your church")} className="size-full object-cover" />
                ) : (
                  <Camera className="size-6" aria-hidden="true" />
                )}
              </button>
              <div className="min-w-0">
                <p className="text-lg font-medium text-sand sm:text-xl">
                  {name.trim() || t("Your church")}
                </p>
                <p className="text-base text-mist/60 sm:text-lg">
                  {t("Add a photo of your building or congregation.")}
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

            <div className="flex flex-col gap-3 rounded-2xl bg-ink-soft/60 p-4 ring-1 ring-mist/15">
              <p className="text-base font-semibold text-sand sm:text-lg">
                {t("More photos and a video")}
              </p>
              <p className="text-base text-mist/60">
                {t("Add up to {{count}} more photos and one short video (under 50MB) for your church page.", { count: MAX_PHOTOS })}
              </p>
              {media.length > 0 && (
                <div className="grid grid-cols-3 gap-2">
                  {media.map((item) => (
                    <div
                      key={item.url}
                      className="relative aspect-square overflow-hidden rounded-xl bg-ink ring-1 ring-mist/20"
                    >
                      {item.kind === "video" ? (
                        <video src={item.url} className="size-full object-cover" muted />
                      ) : (
                        <img src={item.url} alt="" className="size-full object-cover" />
                      )}
                      <button
                        type="button"
                        onClick={() => removeMedia(item.url)}
                        aria-label={t("Remove this file")}
                        className="absolute right-1 top-1 grid size-7 place-items-center rounded-full bg-ink/80 text-sand ring-1 ring-mist/30"
                      >
                        <X className="size-4" aria-hidden="true" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
              <button
                type="button"
                onClick={() => mediaRef.current?.click()}
                className="inline-flex items-center justify-center gap-2 rounded-full bg-ink px-5 py-2.5 text-base font-semibold text-sand ring-1 ring-mist/25 transition hover:bg-ink-soft"
              >
                <ImagePlus className="size-5" aria-hidden="true" />
                {t("Add photos or a video")}
              </button>
              <input
                ref={mediaRef}
                type="file"
                accept="image/*,video/*"
                multiple
                className="hidden"
                onChange={(e) => {
                  addMedia(Array.from(e.target.files ?? []));
                  e.target.value = "";
                }}
              />
            </div>


            <label className="flex flex-col gap-2 text-base text-mist/80 sm:text-lg">
              {t("Church name (shows under your icon on the map)")}
              <input
                className={inputClass}
                value={name}
                onChange={(e) => setName(e.target.value)}
                maxLength={60}
                placeholder="Grace Fellowship"
                required
              />
            </label>

            <div className="flex flex-col gap-2 rounded-2xl bg-ink-soft/60 p-4 ring-1 ring-mist/15">
              <p className="text-base font-semibold text-sand sm:text-lg">{t("Choose your map icon")}</p>
              <div className="grid grid-cols-3 gap-2.5">
                {CHURCH_ICONS.map((choice) => {
                  const selected = choice.id === iconId;
                  return (
                    <button
                      key={choice.id}
                      type="button"
                      onClick={() => setIconId(choice.id)}
                      aria-pressed={selected}
                      className={`flex min-h-24 flex-col items-center justify-center gap-2 rounded-xl px-2 py-3 text-sm font-semibold transition active:scale-[0.98] ${
                        selected
                          ? "bg-ink text-lemon shadow-[0_0_0_2px_var(--color-lemon)] ring-1 ring-lemon"
                          : "bg-ink-soft/70 text-sand ring-1 ring-mist/40 hover:ring-mist/70"
                      }`}
                    >
                      <choice.icon className="size-7" aria-hidden="true" />
                      {t(choice.label)}
                    </button>
                  );
                })}
              </div>
              <div className="mt-2 flex flex-col items-center gap-1 rounded-xl bg-ink/70 px-3 py-4 ring-1 ring-mist/10">
                <img
                  src={placePinDataUrl(iconMarkup(churchIcon(iconId)), name.trim() || t("Your church"))}
                  alt={t("How your church will look on the map")}
                  className="h-24 w-auto"
                />
                <p className="text-sm text-mist/70">
                  {t("This sits on your exact street address.")}
                </p>
              </div>
            </div>

            <label className="flex flex-col gap-2 text-base text-mist/80 sm:text-lg">
              {t("About your church")}
              <textarea
                className="min-h-32 rounded-xl bg-ink-soft px-4 py-3.5 text-lg text-sand ring-1 ring-mist/20 focus:outline-none focus:ring-lemon/50 sm:text-xl"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                maxLength={600}
                placeholder="Who you are, who you serve, and what a visitor can expect."
              />
            </label>

            <label className="flex flex-col gap-2 text-base text-mist/80 sm:text-lg">
              {t("Street address")}
              <input
                className={inputClass}
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                maxLength={160}
                placeholder="1420 SW Oak St"
                required
              />
              <span className="text-sm text-mist/60">
                {t("Your icon is placed on this exact spot, so write it the way mail arrives.")}
              </span>
            </label>

            <div className="grid grid-cols-[minmax(0,1fr)_auto] gap-3">
              <label className="flex min-w-0 flex-col gap-2 text-base text-mist/80 sm:text-lg">
                {t("City")}
                <input
                  className={inputClass}
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  maxLength={80}
                  placeholder="Beaverton"
                  required
                />
              </label>
              <label className="flex w-24 shrink-0 flex-col gap-2 text-base text-mist/80 sm:w-32 sm:text-lg">
                {t("ZIP")}
                <input
                  className={inputClass}
                  value={zip}
                  onChange={(e) => setZip(e.target.value)}
                  maxLength={10}
                  inputMode="numeric"
                  placeholder="97006"
                />
              </label>
            </div>

            <label className="flex flex-col gap-2 text-base text-mist/80 sm:text-lg">
              {t("Service times")}
              <input
                className={inputClass}
                value={serviceTimes}
                onChange={(e) => setServiceTimes(e.target.value)}
                maxLength={200}
                placeholder="Sundays 9am & 11am · Wednesdays 7pm"
              />
            </label>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <label className="flex flex-col gap-2 text-base text-mist/80 sm:text-lg">
                {t("Phone")}
                <input
                  className={inputClass}
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  maxLength={40}
                  inputMode="tel"
                  placeholder="(503) 555-0142"
                />
              </label>
              <label className="flex flex-col gap-2 text-base text-mist/80 sm:text-lg">
                {t("Website")}
                <input
                  className={inputClass}
                  value={website}
                  onChange={(e) => setWebsite(e.target.value)}
                  maxLength={200}
                  placeholder="gracefellowship.org"
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
              disabled={busy}
              className="mt-1 inline-flex items-center justify-center gap-2 rounded-full bg-lemon px-6 py-4 text-xl font-semibold text-ink transition hover:opacity-90 disabled:opacity-60 sm:text-2xl"
            >
              {busy && <Loader2 className="size-5 animate-spin" aria-hidden="true" />}
              {churchId ? t("Try this address") : t("Continue to checkout")}
            </button>
            <p className="text-center text-base text-mist/60">
              {t("$49 per month keeps your church on the map.")}
            </p>
          </form>
        ) : (
          <form className="flex flex-col gap-4" onSubmit={(e) => void submitPayment(e)}>
            <div className="rounded-2xl bg-ink-soft/60 p-4 ring-1 ring-mist/15">
              <p className="font-display text-xl font-semibold text-sand">
                {name.trim() || t("Your church")}
              </p>
              <p className="mt-1 text-base text-mist/70 sm:text-lg">
                {t("Church listing — $49.00 per month, cancel any time.")}
              </p>
              {found && (
                <p className="mt-2 text-base text-sand/90">
                  {t("Found on the map:")} <span className="text-lemon">{found}</span>
                </p>
              )}
              <p className="mt-3 inline-flex items-center gap-2 rounded-full bg-lemon/10 px-3 py-1.5 text-sm font-semibold text-lemon ring-1 ring-lemon/30">
                <ShieldCheck className="size-4" aria-hidden="true" />
                {t("Test checkout — no card is charged")}
              </p>
            </div>

            <label className="flex flex-col gap-2 text-base text-mist/80 sm:text-lg">
              {t("Name on card")}
              <input
                className={inputClass}
                value={cardName}
                onChange={(e) => setCardName(e.target.value)}
                maxLength={80}
                placeholder="Pastor Joseph Rivera"
                required
              />
            </label>

            <label className="flex flex-col gap-2 text-base text-mist/80 sm:text-lg">
              {t("Card number")}
              <input
                className={inputClass}
                value={cardNumber}
                onChange={(e) => setCardNumber(e.target.value)}
                maxLength={24}
                inputMode="numeric"
                placeholder="4242 4242 4242 4242"
                required
              />
            </label>

            <div className="grid grid-cols-2 gap-3">
              <label className="flex flex-col gap-2 text-base text-mist/80 sm:text-lg">
                {t("Expiry")}
                <input
                  className={inputClass}
                  value={expiry}
                  onChange={(e) => setExpiry(e.target.value)}
                  maxLength={7}
                  placeholder="09/29"
                />
              </label>
              <label className="flex flex-col gap-2 text-base text-mist/80 sm:text-lg">
                {t("CVC")}
                <input
                  className={inputClass}
                  value={cvc}
                  onChange={(e) => setCvc(e.target.value)}
                  maxLength={4}
                  inputMode="numeric"
                  placeholder="123"
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
              disabled={busy}
              className="mt-1 inline-flex items-center justify-center gap-2 rounded-full bg-lemon px-6 py-4 text-xl font-semibold text-ink transition hover:opacity-90 disabled:opacity-60 sm:text-2xl"
            >
              {busy ? (
                <Loader2 className="size-5 animate-spin" aria-hidden="true" />
              ) : (
                <CreditCard className="size-5" aria-hidden="true" />
              )}
              {t("Pay $49 and go live")}
            </button>
            <button
              type="button"
              onClick={() => setStep("details")}
              className="text-center text-base text-mist/60 underline decoration-mist/30 underline-offset-2"
            >
              {t("Back to church details")}
            </button>
          </form>
        )}
      </main>

      <Dialog open={live} onOpenChange={() => {}}>
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
            <span className="font-semibold text-sand">“{name.trim()}”</span> {t("is on the map.")}
          </p>
          <p className="text-center text-sm text-mist/60">
            {t("Your church page collects every ministry and need at your church, and your QR code is waiting there.")}
          </p>
          <div className="mt-2 flex flex-col gap-3">
            <button
              type="button"
              onClick={() => {
                if (!churchId) return;
                void navigate({
                  to: "/map",
                  search: {
                    place: [city.trim(), zip.trim()].filter(Boolean).join(" "),
                    new: `church-${churchId}`,
                  },
                });
              }}
              className="inline-flex items-center justify-center gap-2 rounded-full bg-lemon px-6 py-3.5 text-lg font-semibold text-ink transition-transform hover:-translate-y-0.5"
            >
              <MapPin className="size-5" aria-hidden="true" />
              {t("View my church on the map")}
            </button>
            <button
              type="button"
              onClick={() => {
                if (!churchId) return;
                void navigate({ to: "/church/$id", params: { id: churchId } });
              }}
              className="inline-flex items-center justify-center gap-2 rounded-full bg-ink px-6 py-3.5 text-base font-semibold text-sand ring-1 ring-mist/20 transition hover:bg-ink-soft"
            >
              <Church className="size-5" aria-hidden="true" />
              {t("Go to my church page")}
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
