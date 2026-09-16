import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { ArrowLeft, Camera, CreditCard, Loader2, ShieldCheck } from "lucide-react";
import { useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { CHURCH_ICONS, churchIcon } from "@/lib/church-icons";
import { createChurch, mockSubscribe, updateChurch } from "@/lib/churches.functions";
import { iconMarkup } from "@/lib/map-icon";
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
  const navigate = useNavigate();
  const create = useServerFn(createChurch);
  const save = useServerFn(updateChurch);
  const pay = useServerFn(mockSubscribe);
  const fileRef = useRef<HTMLInputElement>(null);

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

  const [cardName, setCardName] = useState("");
  const [cardNumber, setCardNumber] = useState("");
  const [expiry, setExpiry] = useState("");
  const [cvc, setCvc] = useState("");

  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

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

  async function submitDetails(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (name.trim().length < 2) return setError("Add your church's name.");
    if (city.trim().length < 2) return setError("Add the city your church is in.");
    if (address.trim().length < 5)
      return setError("Add your street address — your icon sits on that exact spot.");

    setBusy(true);
    try {
      let avatarPath = "";
      if (file) {
        try {
          const { data: userData } = await supabase.auth.getUser();
          const uid = userData.user?.id;
          if (!uid) throw new Error("Please sign in again.");
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

      const payload = {
        name: name.trim(),
        description: description.trim(),
        iconId: iconId as "chapel" | "cross" | "hall",
        avatarPath,
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
          "We couldn't find that street address. Check the street, city and ZIP — your icon needs an exact address to sit on the map.",
        );
        return;
      }
      setFound([address.trim(), city.trim(), zip.trim()].filter(Boolean).join(", "));
      setStep("checkout");
      window.scrollTo({ top: 0 });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setBusy(false);
    }
  }

  async function submitPayment(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!churchId) return;
    if (cardName.trim().length < 2) return setError("Add the name on the card.");
    if (cardNumber.replace(/\s/g, "").length < 12) return setError("Add a card number.");

    setBusy(true);
    try {
      await pay({ data: { id: churchId, cardName: cardName.trim(), cardNumber: cardNumber.trim() } });
      void navigate({ to: "/church/$id", params: { id: churchId } });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
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
            aria-label="Back to map"
          >
            <ArrowLeft className="size-4" aria-hidden="true" />
          </Link>
          <h1 className="font-display text-2xl font-semibold leading-tight sm:text-3xl">
            {step === "details" ? "Add your church" : "Checkout"}
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
                aria-label="Add a photo of your church"
              >
                {preview ? (
                  <img src={preview} alt="Your church" className="size-full object-cover" />
                ) : (
                  <Camera className="size-6" aria-hidden="true" />
                )}
              </button>
              <div className="min-w-0">
                <p className="text-lg font-medium text-sand sm:text-xl">
                  {name.trim() || "Your church"}
                </p>
                <p className="text-base text-mist/60 sm:text-lg">
                  Add a photo of your building or congregation.
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

            <label className="flex flex-col gap-2 text-base text-mist/80 sm:text-lg">
              Church name (shows under your icon on the map)
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
              <p className="text-base font-semibold text-sand sm:text-lg">Choose your map icon</p>
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
                      {choice.label}
                    </button>
                  );
                })}
              </div>
              <div className="mt-2 flex flex-col items-center gap-1 rounded-xl bg-ink/70 px-3 py-4 ring-1 ring-mist/10">
                <img
                  src={placePinDataUrl(iconMarkup(churchIcon(iconId)), name.trim() || "Your church")}
                  alt="How your church will look on the map"
                  className="h-24 w-auto"
                />
                <p className="text-sm text-mist/70">
                  This sits on your exact street address.
                </p>
              </div>
            </div>

            <label className="flex flex-col gap-2 text-base text-mist/80 sm:text-lg">
              About your church
              <textarea
                className="min-h-32 rounded-xl bg-ink-soft px-4 py-3.5 text-lg text-sand ring-1 ring-mist/20 focus:outline-none focus:ring-lemon/50 sm:text-xl"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                maxLength={600}
                placeholder="Who you are, who you serve, and what a visitor can expect."
              />
            </label>

            <label className="flex flex-col gap-2 text-base text-mist/80 sm:text-lg">
              Street address
              <input
                className={inputClass}
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                maxLength={160}
                placeholder="1420 SW Oak St"
                required
              />
              <span className="text-sm text-mist/60">
                Your icon is placed on this exact spot, so write it the way mail arrives.
              </span>
            </label>

            <div className="grid grid-cols-[minmax(0,1fr)_auto] gap-3">
              <label className="flex min-w-0 flex-col gap-2 text-base text-mist/80 sm:text-lg">
                City
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
                ZIP
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
              Service times
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
                Phone
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
                Website
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
              {churchId ? "Try this address" : "Continue to checkout"}
            </button>
            <p className="text-center text-base text-mist/60">
              $49 per month keeps your church on the map.
            </p>
          </form>
        ) : (
          <form className="flex flex-col gap-4" onSubmit={(e) => void submitPayment(e)}>
            <div className="rounded-2xl bg-ink-soft/60 p-4 ring-1 ring-mist/15">
              <p className="font-display text-xl font-semibold text-sand">
                {name.trim() || "Your church"}
              </p>
              <p className="mt-1 text-base text-mist/70 sm:text-lg">
                Church listing — $49.00 per month, cancel any time.
              </p>
              {found && (
                <p className="mt-2 text-base text-sand/90">
                  Found on the map: <span className="text-lemon">{found}</span>
                </p>
              )}
              <p className="mt-3 inline-flex items-center gap-2 rounded-full bg-lemon/10 px-3 py-1.5 text-sm font-semibold text-lemon ring-1 ring-lemon/30">
                <ShieldCheck className="size-4" aria-hidden="true" />
                Test checkout — no card is charged
              </p>
            </div>

            <label className="flex flex-col gap-2 text-base text-mist/80 sm:text-lg">
              Name on card
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
              Card number
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
                Expiry
                <input
                  className={inputClass}
                  value={expiry}
                  onChange={(e) => setExpiry(e.target.value)}
                  maxLength={7}
                  placeholder="09/29"
                />
              </label>
              <label className="flex flex-col gap-2 text-base text-mist/80 sm:text-lg">
                CVC
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
              Pay $49 and go live
            </button>
            <button
              type="button"
              onClick={() => setStep("details")}
              className="text-center text-base text-mist/60 underline decoration-mist/30 underline-offset-2"
            >
              Back to church details
            </button>
          </form>
        )}
      </main>
    </div>
  );
}
