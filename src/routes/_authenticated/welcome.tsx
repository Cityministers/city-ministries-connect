import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { Loader2 } from "lucide-react";
import { useState } from "react";
import { BrandLogo } from "@/components/BrandLogo";
import { supabase } from "@/integrations/supabase/client";
import {
  checkImageFile,
  friendlyUploadError,
  MAX_IMAGE_LABEL,
  shrinkImage,
} from "@/lib/photo";
import { completeOnboarding } from "@/lib/profile.functions";

export const Route = createFileRoute("/_authenticated/welcome")({
  validateSearch: (search: Record<string, unknown>): { next?: string } => {
    const rawNext = search["next"];
    const next =
      typeof rawNext === "string" && rawNext.startsWith("/") ? rawNext : undefined;
    return next ? { next } : {};
  },
  head: () => ({
    meta: [
      { title: "Set up your profile — City Ministers" },
      {
        name: "description",
        content:
          "Tell your neighbors who you are and where you serve so your posts land in the right city.",
      },
      { property: "og:title", content: "Set up your profile — City Ministers" },
      {
        property: "og:description",
        content: "A quick first step before you post on the City Ministers map.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: WelcomePage,
});

function WelcomePage() {
  const navigate = useNavigate();
  const { next } = Route.useSearch();
  const save = useServerFn(completeOnboarding);

  const [name, setName] = useState("");
  const [city, setCity] = useState("");
  const [zip, setZip] = useState("");
  const [photo, setPhoto] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [cropping, setCropping] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [photoFailed, setPhotoFailed] = useState(false);

  function choosePhoto(file: File | null) {
    setPhotoFailed(false);
    setError(null);
    if (!file) return;
    const problem = checkImageFile(file);
    if (problem) {
      setError(problem);
      return;
    }
    setCropping(file);
  }

  function acceptCrop(file: File) {
    if (preview) URL.revokeObjectURL(preview);
    setPhoto(file);
    setPreview(URL.createObjectURL(file));
    setCropping(null);
  }

  function clearPhoto() {
    if (preview) URL.revokeObjectURL(preview);
    setPhoto(null);
    setPreview(null);
    setCropping(null);
    setPhotoFailed(false);
    setError(null);
  }

  async function finish(withPhoto: boolean) {
    setError(null);
    if (name.trim().length < 2) {
      setError("Please add the name your neighbors will see.");
      return;
    }
    if (city.trim().length < 2 && zip.trim().length < 4) {
      setError("Add the city or ZIP where you live so your posts land in the right place.");
      return;
    }
    setBusy(true);
    try {
      let avatarPath: string | undefined;
      if (photo && withPhoto) {
        try {
          const { data: userData } = await supabase.auth.getUser();
          const uid = userData.user?.id;
          if (!uid) throw new Error("Please sign in again.");
          const upload = await shrinkImage(photo);
          const ext = upload.type === "image/jpeg" ? "jpg" : (upload.name.split(".").pop()?.toLowerCase() ?? "jpg");
          const path = `${uid}/avatar-${crypto.randomUUID()}.${ext}`;
          const { error: upErr } = await supabase.storage
            .from("ministry-avatars")
            .upload(path, upload, { upsert: true, contentType: upload.type });
          if (upErr) throw new Error(upErr.message);
          avatarPath = path;
        } catch (err) {
          setPhotoFailed(true);
          setError(friendlyUploadError(err));
          setBusy(false);
          return;
        }
      }
      await save({
        data: {
          displayName: name.trim(),
          city: city.trim(),
          zip: zip.trim(),
          ...(avatarPath ? { avatarPath } : {}),
        },
      });
      const destination = next && !next.startsWith("/welcome") ? next : "/map";
      void navigate({ to: destination });

    } catch (err) {
      setError(
        err instanceof Error && err.message
          ? err.message
          : "We couldn't save your details. Check your connection and try again.",
      );
    } finally {
      setBusy(false);
    }
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    void finish(true);
  }

  return (
    <div className="flex min-h-dvh flex-col bg-ink font-body text-sand antialiased">
      <header className="border-b border-ink-soft bg-ink-soft/70">
        <div className="mx-auto w-full max-w-md px-4 py-4">
          <BrandLogo />
        </div>
      </header>

      <main className="mx-auto w-full max-w-md flex-1 px-4 py-8">
        <h1 className="font-display text-2xl font-semibold sm:text-3xl">
          Welcome — let's set you up
        </h1>
        <p className="mt-2 text-base text-mist/80 sm:text-lg">
          Just three quick things so neighbors know who you are and where you serve.
        </p>

        <form className="mt-6 flex flex-col gap-4" onSubmit={handleSubmit}>
          <label className="flex flex-col gap-1.5 text-base text-mist/80">
            Your name
            <input
              className="rounded-xl bg-ink px-4 py-3 text-base text-sand ring-1 ring-mist/20 focus:outline-none focus:ring-lemon/50"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Apostle Paul"
            />
          </label>

          <div className="flex gap-3">
            <label className="flex flex-1 flex-col gap-1.5 text-base text-mist/80">
              City
              <input
                className="rounded-xl bg-ink px-4 py-3 text-base text-sand ring-1 ring-mist/20 focus:outline-none focus:ring-lemon/50"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                placeholder="Portland, OR"
              />
            </label>
            <label className="flex w-32 flex-col gap-1.5 text-base text-mist/80">
              ZIP
              <input
                className="rounded-xl bg-ink px-4 py-3 text-base text-sand ring-1 ring-mist/20 focus:outline-none focus:ring-lemon/50"
                value={zip}
                onChange={(e) => setZip(e.target.value)}
                placeholder="97006"
              />
            </label>
          </div>

          <div className="flex flex-col gap-2 text-base text-mist/80">
            <span>Photo (optional)</span>
            <div className="flex flex-col items-center gap-4 rounded-2xl bg-ink-soft/40 p-5 ring-1 ring-mist/15">
              {cropping ? (
                <PhotoCropper
                  file={cropping}
                  onCancel={() => setCropping(null)}
                  onDone={acceptCrop}
                />
              ) : preview ? (
                <>
                  <img
                    src={preview}
                    alt="Your photo preview"
                    className="size-44 rounded-full object-cover ring-2 ring-mist/25 sm:size-52"
                  />
                  <div className="flex w-full flex-col gap-2 sm:flex-row">
                    <label className="inline-flex flex-1 cursor-pointer items-center justify-center rounded-full bg-ink px-5 py-3 text-base font-semibold text-sand ring-1 ring-mist/25 transition hover:bg-ink-soft">
                      Change photo
                      <input
                        type="file"
                        accept="image/*"
                        className="sr-only"
                        onChange={(e) => choosePhoto(e.target.files?.[0] ?? null)}
                      />
                    </label>
                    <button
                      type="button"
                      onClick={clearPhoto}
                      className="inline-flex flex-1 items-center justify-center rounded-full px-5 py-3 text-base font-semibold text-rose-300 ring-1 ring-rose-300/30 transition hover:bg-rose-300/10"
                    >
                      Remove photo
                    </button>
                  </div>
                </>
              ) : (
                <label className="flex w-full cursor-pointer flex-col items-center gap-2 rounded-xl border-2 border-dashed border-mist/30 px-4 py-8 text-center transition hover:border-mist/50 hover:bg-ink-soft/40">
                  <span className="text-lg font-semibold text-sand">Choose a photo</span>
                  <span className="text-sm text-mist/60">
                    Tap to upload from your device — up to {MAX_IMAGE_LABEL}
                  </span>
                  <input
                    type="file"
                    accept="image/*"
                    className="sr-only"
                    onChange={(e) => choosePhoto(e.target.files?.[0] ?? null)}
                  />
                </label>
              )}
            </div>
          </div>

          {error && (
            <div
              role="alert"
              className="rounded-xl bg-rose-500/10 px-4 py-3 text-base text-rose-200 ring-1 ring-rose-400/40"
            >
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={busy}
            className="mt-2 inline-flex items-center justify-center gap-2 rounded-full bg-lemon px-8 py-3.5 text-lg font-bold text-ink transition-transform hover:-translate-y-0.5 disabled:opacity-60"
          >
            {busy && <Loader2 className="size-5 animate-spin" aria-hidden="true" />}
            Finish setup
          </button>

          {photoFailed && (
            <button
              type="button"
              disabled={busy}
              onClick={() => void finish(false)}
              className="inline-flex items-center justify-center rounded-full px-6 py-3 text-base font-semibold text-sand ring-1 ring-mist/30 transition hover:bg-ink-soft disabled:opacity-60"
            >
              Finish without a photo
            </button>
          )}
        </form>
      </main>
    </div>
  );
}
