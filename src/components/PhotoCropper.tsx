import { useCallback, useState } from "react";
import Cropper from "react-easy-crop";
import type { Area } from "react-easy-crop";
import { Loader2 } from "lucide-react";
import { Slider } from "@/components/ui/slider";
import { cropImageFile } from "@/lib/photo";

type Props = {
  file: File;
  onCancel: () => void;
  onDone: (cropped: File) => void;
};

/** Lets someone drag and zoom their photo into a round profile frame. */
export function PhotoCropper({ file, onCancel, onDone }: Props) {
  const [url] = useState(() => URL.createObjectURL(file));
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [area, setArea] = useState<Area | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onCropComplete = useCallback((_: Area, pixels: Area) => {
    setArea(pixels);
  }, []);

  async function apply() {
    if (!area) return;
    setBusy(true);
    setError(null);
    try {
      const cropped = await cropImageFile(file, area);
      URL.revokeObjectURL(url);
      onDone(cropped);
    } catch {
      setError("We couldn't trim that photo. Please try another one.");
      setBusy(false);
    }
  }

  function cancel() {
    URL.revokeObjectURL(url);
    onCancel();
  }

  return (
    <div className="flex w-full flex-col gap-4">
      <div className="relative h-72 w-full overflow-hidden rounded-2xl bg-ink">
        <Cropper
          image={url}
          crop={crop}
          zoom={zoom}
          aspect={1}
          cropShape="round"
          showGrid={false}
          onCropChange={setCrop}
          onZoomChange={setZoom}
          onCropComplete={onCropComplete}
        />
      </div>

      <div className="flex flex-col gap-2">
        <span className="text-sm text-mist/70">Drag the photo, then zoom to fit</span>
        <Slider
          value={[zoom]}
          min={1}
          max={3}
          step={0.01}
          onValueChange={(v) => setZoom(v[0] ?? 1)}
          aria-label="Zoom"
        />
      </div>

      {error && (
        <p role="alert" className="text-sm text-rose-200">
          {error}
        </p>
      )}

      <div className="flex w-full flex-col gap-2 sm:flex-row">
        <button
          type="button"
          onClick={() => void apply()}
          disabled={busy || !area}
          className="inline-flex flex-1 items-center justify-center gap-2 rounded-full bg-lemon px-5 py-3 text-base font-bold text-ink transition hover:-translate-y-0.5 disabled:opacity-60"
        >
          {busy && <Loader2 className="size-5 animate-spin" aria-hidden="true" />}
          Use this photo
        </button>
        <button
          type="button"
          onClick={cancel}
          disabled={busy}
          className="inline-flex flex-1 items-center justify-center rounded-full px-5 py-3 text-base font-semibold text-sand ring-1 ring-mist/25 transition hover:bg-ink-soft disabled:opacity-60"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}

export default PhotoCropper;
