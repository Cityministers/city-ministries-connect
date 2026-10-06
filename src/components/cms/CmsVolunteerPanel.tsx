import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

type Row = { id: string; title: string; description: string; starts_at: string; location: string; city: string; zip: string; status: string; owner_id: string };

export function CmsVolunteerPanel() {
  const qc = useQueryClient();
  const q = useQuery({
    queryKey: ["cms", "volunteer"],
    queryFn: async () => {
      const { data, error } = await supabase.from("volunteer_projects")
        .select("id,title,description,starts_at,location,city,zip,status,owner_id").order("created_at", { ascending: false }).limit(100);
      if (error) throw error;
      const rows = (data ?? []) as Row[];
      const ids = [...new Set(rows.map((r) => r.owner_id))];
      const { data: profs } = ids.length ? await supabase.from("profiles").select("id,display_name").in("id", ids) : { data: [] };
      const names = Object.fromEntries((profs ?? []).map((p) => [p.id, p.display_name]));
      return rows.map((r) => ({ ...r, owner: names[r.owner_id] ?? "Member" }));
    },
  });

  async function act(id: string, action: "approved" | "rejected" | "delete") {
    const { error } = action === "delete"
      ? await supabase.from("volunteer_projects").delete().eq("id", id)
      : await supabase.from("volunteer_projects").update({ status: action }).eq("id", id);
    if (error) { toast.error(error.message); return; }
    toast.success(action === "approved" ? "Approved — volunteers in that city are alerted" : action === "delete" ? "Deleted" : "Declined");
    void qc.invalidateQueries({ queryKey: ["cms", "volunteer"] });
  }

  const rows = q.data ?? [];
  const pending = rows.filter((r) => r.status === "pending");
  const others = rows.filter((r) => r.status !== "pending");
  const btn = "rounded-full px-4 py-1.5 text-sm font-bold ring-1";

  const card = (r: (typeof rows)[number]) => (
    <li key={r.id} className="rounded-2xl border border-mist/30 bg-ink-soft p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h4 className="text-lg font-bold text-sand">{r.title}</h4>
        <span className="rounded-full bg-ink px-3 py-1 text-xs font-bold uppercase text-mist ring-1 ring-mist/30">{r.status}</span>
      </div>
      <p className="mt-1 text-sm text-lemon">{new Date(r.starts_at).toLocaleString()} · {r.location} · {r.city} {r.zip}</p>
      <p className="mt-2 text-base text-mist/90">{r.description}</p>
      <p className="mt-1 text-sm text-mist/70">Posted by {r.owner}</p>
      <div className="mt-3 flex flex-wrap gap-2">
        {r.status !== "approved" && <button type="button" onClick={() => act(r.id, "approved")} className={`${btn} bg-tone-emerald/25 text-sand ring-tone-emerald/60`}>Approve</button>}
        {r.status !== "rejected" && <button type="button" onClick={() => act(r.id, "rejected")} className={`${btn} text-mist ring-mist/40`}>Decline</button>}
        <button type="button" onClick={() => act(r.id, "delete")} className={`${btn} text-destructive ring-destructive/50`}>Delete</button>
      </div>
    </li>
  );

  return (
    <section className="space-y-3">
      <h3 className="text-sm font-bold uppercase tracking-wide text-mist">Waiting for approval ({pending.length})</h3>
      {q.isLoading ? <p className="text-mist/70">Loading…</p> : pending.length === 0 ? <p className="text-mist/70">Nothing waiting.</p> : <ul className="space-y-3">{pending.map(card)}</ul>}
      <h3 className="pt-4 text-sm font-bold uppercase tracking-wide text-mist">All projects</h3>
      <ul className="space-y-3">{others.map(card)}</ul>
    </section>
  );
}
