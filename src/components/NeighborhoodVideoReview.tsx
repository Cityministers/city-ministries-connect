import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Check, EyeOff, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { listPendingNeighborhoodVideos, moderateNeighborhoodVideo } from "@/lib/neighborhood-videos.functions";

export function NeighborhoodVideoReview() {
  const list = useServerFn(listPendingNeighborhoodVideos);
  const moderate = useServerFn(moderateNeighborhoodVideo);
  const qc = useQueryClient();
  const { data, isLoading, error } = useQuery({ queryKey: ["admin", "neighborhood-videos"], queryFn: () => list(), retry: false });
  async function act(id: string, action: "approve" | "decline" | "hide" | "delete") {
    try {
      await moderate({ data: { id, action } });
      void qc.invalidateQueries({ queryKey: ["admin", "neighborhood-videos"] });
      void qc.invalidateQueries({ queryKey: ["neighborhood-videos"] });
      toast.success("Saved");
    } catch (e) { toast.error(e instanceof Error ? e.message : "Could not review video."); }
  }
  if (isLoading) return <p className="text-mist">Loading…</p>;
  if (error) return <p className="text-mist">Unable to load videos.</p>;
  if (!data?.length) return <p className="text-mist">No videos have been posted yet.</p>;
  return <section className="space-y-4">
    {[...data].sort((a, b) => Number(b.status === "pending") - Number(a.status === "pending")).map((v) => <article key={v.id} className="rounded-md border border-mist/30 bg-ink-soft p-4">
      <h2 className="font-display text-xl text-sand">{v.title}</h2>
      <p className="mt-1 text-sm text-mist">{v.author} · {v.kind === "tour" ? "Neighborhood tour" : "Community concern"} · {v.city} {v.zip} · <span className="capitalize text-lemon">{v.status}</span></p>
      <p className="mt-2 whitespace-pre-wrap text-base text-sand/90">{v.description}</p>
      {v.videoUrl && <video src={v.videoUrl} poster={v.thumbnailUrl ?? undefined} controls playsInline preload="metadata" className="mt-3 max-h-80 w-full bg-ink object-contain" />}
      <div className="mt-3 flex flex-wrap gap-2">
        {v.status !== "approved" && <Button onClick={() => void act(v.id, "approve")} className="bg-tone-cyan/25 text-sand ring-1 ring-tone-cyan/55 hover:bg-tone-cyan/35"><Check />Approve</Button>}
        {v.status === "pending" ? <Button variant="outline" onClick={() => void act(v.id, "decline")} className="border-mist/40 bg-ink text-sand hover:bg-ink-soft"><Trash2 />Decline</Button> : <>
          {v.status === "approved" && <Button variant="outline" onClick={() => void act(v.id, "hide")} className="border-mist/40 bg-ink text-sand hover:bg-ink-soft"><EyeOff />Hide</Button>}
          <Button variant="outline" onClick={() => void act(v.id, "delete")} className="border-mist/40 bg-ink text-sand hover:bg-ink-soft"><Trash2 />Delete</Button>
        </>}
      </div>
    </article>)}
  </section>;
}