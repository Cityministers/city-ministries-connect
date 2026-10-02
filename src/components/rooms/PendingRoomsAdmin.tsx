import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Check, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { listPendingRooms, moderateRoom } from "@/lib/rooms.functions";

export function PendingRoomsAdmin() {
  const qc = useQueryClient();
  const fetchRooms = useServerFn(listPendingRooms);
  const moderate = useServerFn(moderateRoom);
  const rooms = useQuery({ queryKey: ["admin", "pending-rooms"], queryFn: () => fetchRooms() });
  const m = useMutation({
    mutationFn: (v: { id: string; action: "approve" | "decline" }) => moderate({ data: v }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin", "pending-rooms"] }); toast.success("Saved"); },
    onError: (e: Error) => toast.error(e.message),
  });
  if (!rooms.data?.length) return null;
  return (
    <div className="space-y-3">
      <h3 className="text-sm font-bold uppercase tracking-wide text-mist">New rooms ({rooms.data.length})</h3>
      {rooms.data.map((r) => (
        <article key={r.id} className="rounded-2xl border border-lemon/40 bg-ink-soft p-4">
          <p className="text-lg font-bold text-sand">{r.title}</p>
          {r.description && <p className="mt-1 text-base text-sand/85">{r.description}</p>}
          <div className="mt-3 flex gap-2">
            <button type="button" disabled={m.isPending} onClick={() => m.mutate({ id: r.id, action: "approve" })} className="inline-flex items-center gap-1 rounded-full bg-tone-cyan/25 px-4 py-1.5 text-sm font-bold ring-1 ring-tone-cyan/55">
              <Check className="size-4" aria-hidden="true" />Approve
            </button>
            <button type="button" disabled={m.isPending} onClick={() => m.mutate({ id: r.id, action: "decline" })} className="inline-flex items-center gap-1 rounded-full px-4 py-1.5 text-sm font-bold ring-1 ring-mist/40">
              <Trash2 className="size-4" aria-hidden="true" />Decline
            </button>
          </div>
        </article>
      ))}
    </div>
  );
}
