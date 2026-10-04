import { Link } from "@tanstack/react-router";
import { CountrySelect } from "@/components/CountrySelect";
import { validLocation } from "@/lib/country";
import { useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Film, Play, Trash2, Upload, Video, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { removeMyNeighborhoodVideo, submitNeighborhoodVideo, type NeighborhoodVideo } from "@/lib/neighborhood-videos.functions";
import { timeAgo } from "@/lib/time-ago";

const maxSize = 50 * 1024 * 1024;
const videoTypes = ["video/mp4", "video/quicktime", "video/webm", "video/x-m4v"];

function VideoArtwork({ video }: { video: NeighborhoodVideo }) {
  return video.thumbnailUrl ? <img src={video.thumbnailUrl} alt="" loading="lazy" className="h-full w-full object-cover" /> : (
    video.videoUrl ? <video src={`${video.videoUrl}#t=0.5`} muted playsInline preload="auto" className="pointer-events-none h-full w-full bg-ink-soft object-cover" /> :
    <span className="grid h-full w-full place-items-center bg-ink-soft"><Film className="size-12 text-lemon/70" aria-hidden="true" /></span>
  );
}

export function NeighborhoodVideoFeed({ videos, pending, onSelect, onRemoved }: {
  videos: NeighborhoodVideo[]; pending: NeighborhoodVideo[]; onSelect: (id: string) => void; onRemoved: () => void;
}) {
  const remove = useServerFn(removeMyNeighborhoodVideo);
  const [removing, setRemoving] = useState<string | null>(null);
  const all = [...pending, ...videos];
  if (!all.length) return <p className="py-8 text-center text-mist">No neighborhood videos yet.</p>;
  return <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
    {all.map((v) => <article key={v.id} className="overflow-hidden rounded-md border border-mist/20 bg-ink-soft">
      <Button variant="ghost" onClick={() => onSelect(v.id)} className="group relative block h-auto w-full rounded-none p-0 text-left hover:bg-ink-soft" aria-label={`Watch ${v.title}`}>
        <span className="block aspect-[3/4] w-full overflow-hidden"><VideoArtwork video={v} /></span>
        <span className="absolute bottom-2 left-2 grid size-8 place-items-center rounded-full bg-ink/85 text-sand"><Play className="size-4 fill-current" aria-hidden="true" /></span>
        <span className="absolute bottom-2 right-2 rounded bg-ink/85 px-1.5 py-0.5 text-xs text-sand">{Math.floor(v.duration / 60)}:{String(v.duration % 60).padStart(2, "0")}</span>
      </Button>
      <div className="p-3">
        <p className="line-clamp-2 min-h-10 text-sm font-bold leading-5 text-sand">{v.title}</p>
        <p className="mt-1 text-xs text-mist">{v.kind === "tour" ? "Neighborhood tour" : "Community concern"} · {v.city || v.zip}</p>
        {v.status !== "approved" && <div className="mt-2 flex items-center justify-between gap-1">
          <span className="text-xs font-semibold text-lemon">{v.status === "pending" ? "Waiting for approval" : "Hidden"}</span>
          <Button variant="ghost" size="icon" title="Remove video" aria-label="Remove video" disabled={removing === v.id} onClick={async () => {
            setRemoving(v.id);
            try { await remove({ data: { id: v.id } }); onRemoved(); } catch (e) { toast.error(e instanceof Error ? e.message : "Could not remove video."); }
            finally { setRemoving(null); }
          }} className="size-8 text-mist hover:text-sand"><Trash2 className="size-4" /></Button>
        </div>}
      </div>
    </article>)}
  </div>;
}

export function NeighborhoodVideoViewer({ video, onClose }: { video: NeighborhoodVideo | null; onClose: () => void }) {
  return <Dialog open={!!video} onOpenChange={(open) => { if (!open) onClose(); }}>
    <DialogContent className="max-h-[90dvh] w-[calc(100%-1.5rem)] max-w-lg overflow-y-auto border-mist/30 bg-ink text-sand">
      <DialogHeader><DialogTitle className="pr-6 font-display text-xl">{video?.title}</DialogTitle></DialogHeader>
      {video && <>
        {video.videoUrl ? <video key={video.id} src={video.videoUrl} poster={video.thumbnailUrl ?? undefined} controls playsInline preload="metadata" className="max-h-[55dvh] w-full bg-ink-soft object-contain" /> : <p className="text-mist">Video is temporarily unavailable.</p>}
        <p className="text-sm text-lemon">{video.kind === "tour" ? "Neighborhood tour" : "Community concern"} · {video.city}{video.zip ? ` ${video.zip}` : ""}</p>
        <p className="text-sm text-mist">{video.author} · {timeAgo(video.createdAt)}</p>
        {video.description && <p className="whitespace-pre-wrap text-base leading-relaxed text-sand/90">{video.description}</p>}
        {video.status !== "approved" && <p className="text-sm text-lemon">{video.status === "pending" ? "Waiting for approval" : "Hidden"}</p>}
      </>}
    </DialogContent>
  </Dialog>;
}

async function inspectVideo(file: File): Promise<{ duration: number; thumbnail: Blob | null }> {
  const url = URL.createObjectURL(file);
  try {
    const element = document.createElement("video");
    element.preload = "auto";
    element.muted = true;
    element.playsInline = true;
    element.src = url;
    await new Promise<void>((resolve, reject) => {
      element.onloadedmetadata = () => resolve();
      element.onerror = () => reject(new Error("This video could not be opened."));
    });
    const duration = Math.round(element.duration);
    if (!Number.isFinite(duration) || element.duration < 60 || element.duration > 180) throw new Error("Choose a video between 1 and 3 minutes long.");
    let thumbnail: Blob | null = null;
    try {
      element.currentTime = Math.min(1, element.duration / 2);
      await Promise.race([
        new Promise<void>((resolve) => { element.onseeked = () => resolve(); }),
        new Promise<void>((resolve) => setTimeout(resolve, 1500)),
      ]);
      if (element.videoWidth && element.videoHeight) {
        const canvas = document.createElement("canvas");
        canvas.width = 360;
        canvas.height = Math.round(360 * element.videoHeight / element.videoWidth);
        canvas.getContext("2d")?.drawImage(element, 0, 0, canvas.width, canvas.height);
        thumbnail = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/jpeg", 0.78));
      }
    } catch { /* A video still works without a poster frame. */ }
    element.removeAttribute("src"); element.load();
    return { duration, thumbnail };
  } finally { URL.revokeObjectURL(url); }
}

export function NeighborhoodVideoForm({ userId, defaultPlace, defaultCountry = "US", onPosted }: { userId: string | null; defaultPlace: string; defaultCountry?: string; onPosted: () => void }) {
  const submit = useServerFn(submitNeighborhoodVideo);
  const qc = useQueryClient();
  const fileInput = useRef<HTMLInputElement>(null);
  const [open, setOpen] = useState(false);
  const [thanks, setThanks] = useState(false);
  const [kind, setKind] = useState<"tour" | "concern">("tour");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [city, setCity] = useState(defaultPlace.replace(/\b\d{4,6}\b/g, "").replace(/,?\s*(?:United States|US)$/i, "").replace(/,?\s*$/, "").trim());
  const [zip, setZip] = useState(defaultPlace.match(/\b\d{4,6}\b/)?.[0] ?? "");
  const [country, setCountry] = useState(defaultCountry);
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [duration, setDuration] = useState(0);
  const [poster, setPoster] = useState<Blob | null>(null);
  const [busy, setBusy] = useState(false);
  useEffect(() => () => { if (preview) URL.revokeObjectURL(preview); }, [preview]);
  const clear = () => { setFile(null); setDuration(0); setPoster(null); setPreview(null); if (fileInput.current) fileInput.current.value = ""; };
  const choose = async (picked?: File) => {
    if (!picked) return;
    if (!videoTypes.includes(picked.type) || picked.size > maxSize) { toast.error("Choose an MP4, MOV, or WebM video under 50 MB."); return; }
    try {
      const result = await inspectVideo(picked);
      setDuration(result.duration); setPoster(result.thumbnail); setFile(picked); setPreview(URL.createObjectURL(picked));
    } catch (e) { toast.error(e instanceof Error ? e.message : "Could not read video."); }
  };
  const post = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!file || !userId || !duration || busy) return;
    setBusy(true);
    const uploaded: string[] = [];
    try {
      if (!validLocation(city, zip)) throw new Error("Enter a city or postal code.");
      const ext = file.type === "video/quicktime" ? "mov" : file.type === "video/webm" ? "webm" : file.type === "video/x-m4v" ? "m4v" : "mp4";
      const base = `${userId}/${crypto.randomUUID()}`;
      const videoPath = `${base}.${ext}`;
      const result = await supabase.storage.from("neighborhood-videos").upload(videoPath, file, { contentType: file.type });
      if (result.error) throw result.error;
      uploaded.push(videoPath);
      let thumbnailPath: string | null = null;
      if (poster) {
        const path = `${base}.jpg`;
        const image = await supabase.storage.from("neighborhood-videos").upload(path, poster, { contentType: "image/jpeg" });
        if (!image.error) { thumbnailPath = path; uploaded.push(path); }
      }
      await submit({ data: { kind, title, description, city: city.trim(), zip: zip.trim(), country, duration, videoPath, thumbnailPath } });
      clear(); setTitle(""); setDescription(""); setOpen(false); setThanks(true);
      onPosted(); void qc.invalidateQueries({ queryKey: ["neighborhood-videos"] });
    } catch (e) {
      if (uploaded.length) await supabase.storage.from("neighborhood-videos").remove(uploaded);
      toast.error(e instanceof Error ? e.message : "Could not submit your video.");
    } finally { setBusy(false); }
  };
  return <>
    {userId ? <Button onClick={() => setOpen(true)} className="mt-4 h-11 self-start bg-lemon px-5 text-ink hover:bg-lemon/90"><Video className="size-5" />Post a video</Button> : <Button asChild className="mt-4 h-11 self-start bg-lemon px-5 text-ink hover:bg-lemon/90"><Link to="/auth" search={{ mode: "signup" }}><Video className="size-5" />Post a video</Link></Button>}
    <Dialog open={open} onOpenChange={(value) => { if (!busy) setOpen(value); }}>
      <DialogContent className="max-h-[90dvh] w-[calc(100%-1.5rem)] max-w-lg overflow-y-auto border-mist/30 bg-ink text-sand">
        <DialogHeader><DialogTitle className="font-display text-2xl">Post a video</DialogTitle></DialogHeader>
        <form onSubmit={post} className="space-y-4">
          <div className="grid grid-cols-2 gap-2" role="group" aria-label="Video type">
            {(["tour", "concern"] as const).map((type) => <Button key={type} type="button" aria-pressed={kind === type} onClick={() => setKind(type)} className={`h-auto min-h-12 whitespace-normal px-2 py-2 text-sm ${kind === type ? "bg-lemon text-ink hover:bg-lemon/90" : "bg-ink-soft text-sand ring-1 ring-mist/30 hover:bg-ink-soft/80"}`}>{type === "tour" ? "Neighborhood tour" : "Community concern"}</Button>)}
          </div>
          <label className="block text-sm font-semibold text-sand">Title<input required minLength={3} maxLength={120} value={title} onChange={(e) => setTitle(e.target.value)} className="mt-1 w-full rounded-md border border-mist/30 bg-ink-soft p-3 text-base text-sand outline-none focus:border-lemon" /></label>
          <label className="block text-sm font-semibold text-sand">Description<textarea maxLength={1200} rows={3} value={description} onChange={(e) => setDescription(e.target.value)} className="mt-1 w-full resize-none rounded-md border border-mist/30 bg-ink-soft p-3 text-base text-sand outline-none focus:border-lemon" /></label>
          <CountrySelect value={country} onChange={setCountry} className="w-full rounded-md border border-mist/30 bg-ink-soft p-3 text-base text-sand" />
          <label className="block text-sm font-semibold text-sand">City<input maxLength={120} value={city} onChange={(e) => setCity(e.target.value)} className="mt-1 w-full rounded-md border border-mist/30 bg-ink-soft p-3 text-base text-sand" /></label>
          <label className="block text-sm font-semibold text-sand">Postal code / ZIP<input maxLength={20} value={zip} onChange={(e) => setZip(e.target.value)} className="mt-1 w-full rounded-md border border-mist/30 bg-ink-soft p-3 text-base text-sand" /></label>
          <input ref={fileInput} type="file" accept="video/mp4,video/quicktime,video/webm,video/x-m4v" className="hidden" onChange={(e) => void choose(e.target.files?.[0])} />
          {preview ? <div className="relative"><video src={preview} controls playsInline preload="metadata" className="max-h-64 w-full rounded-md bg-ink-soft object-contain" /><Button type="button" size="icon" variant="secondary" title="Remove video" aria-label="Remove video" onClick={clear} className="absolute right-2 top-2 bg-ink text-sand"><X /></Button><p className="mt-1 text-sm text-mist">{Math.floor(duration / 60)}:{String(duration % 60).padStart(2, "0")} · {file?.name}</p></div> : <Button type="button" variant="outline" onClick={() => fileInput.current?.click()} className="w-full border-mist/30 bg-ink-soft text-sand hover:bg-ink"><Upload />Choose a 1–3 minute video</Button>}
          <Button type="submit" disabled={!file || !title.trim() || !validLocation(city, zip) || busy} className="h-11 w-full bg-lemon text-ink hover:bg-lemon/90">{busy ? "Uploading…" : "Send for approval"}</Button>
        </form>
      </DialogContent>
    </Dialog>
    <Dialog open={thanks} onOpenChange={setThanks}><DialogContent className="w-[calc(100%-1.5rem)] max-w-sm border-lemon/30 bg-ink-soft text-center text-sand"><DialogHeader><DialogTitle className="font-display text-2xl">Congratulations!</DialogTitle></DialogHeader><p>Your video was sent for approval. You'll get a notification when it's live.</p><Button onClick={() => setThanks(false)} className="bg-lemon text-ink hover:bg-lemon/90">OK</Button></DialogContent></Dialog>
  </>;
}
