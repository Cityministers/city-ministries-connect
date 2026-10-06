import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Star, UserRound } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { timeAgo } from "@/lib/time-ago";

const CATS = [
  { key: "punctuality", label: "Punctuality" },
  { key: "communication", label: "Communication" },
  { key: "kindness", label: "Kindness" },
  { key: "reliability", label: "Reliability" },
] as const;
type CatKey = (typeof CATS)[number]["key"];
type Ratings = Record<CatKey, number>;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const db = supabase as any;

function StarRow({ value, size = "size-5" }: { value: number; size?: string }) {
  const pct = Math.max(0, Math.min(100, (value / 5) * 100));
  const row = (cls: string) => (
    <div className={`flex gap-0.5 ${cls}`}>
      {[1, 2, 3, 4, 5].map((i) => (
        <Star key={i} className={`${size} shrink-0 ${cls ? "fill-lemon text-lemon" : "text-mist/40"}`} aria-hidden="true" />
      ))}
    </div>
  );
  return (
    <div className="relative inline-flex" aria-label={`${value.toFixed(1)} out of 5`}>
      {row("")}
      <div className="absolute inset-0 overflow-hidden" style={{ width: `${pct}%` }}>
        {row("fill")}
      </div>
    </div>
  );
}

// Deterministic 4.0–5.0 sample rating for demo profiles so the UI can be previewed.
function mockRatings(userId: string): Ratings & { count: number } {
  let h = 0;
  for (const ch of userId) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  const rnd = () => {
    h = (h * 1103515245 + 12345) >>> 0;
    return h / 4294967296;
  };
  const cat = () => Math.round((4 + rnd()) * 10) / 10;
  return { punctuality: cat(), communication: cat(), kindness: cat(), reliability: cat(), count: 3 + Math.floor(rnd() * 6) };
}

export function ReviewsSummary({ userId }: { userId: string }) {
  const { t } = useTranslation();
  const { data } = useQuery({
    queryKey: ["member-reviews", userId],
    queryFn: async () => {
      const { data: prof } = await supabase.from("profiles").select("is_demo").eq("id", userId).maybeSingle();
      const { data: rows } = await db
        .from("member_reviews")
        .select("id, reviewer_id, punctuality, communication, kindness, reliability, note, created_at")
        .eq("reviewee_id", userId)
        .eq("status", "visible")
        .order("created_at", { ascending: false });
      const list = (rows ?? []) as Array<Ratings & { id: string; reviewer_id: string; note: string; created_at: string }>;
      const ids = [...new Set(list.map((r) => r.reviewer_id))];
      const { data: profs } = ids.length
        ? await supabase.from("profiles").select("id, display_name, avatar_url").in("id", ids)
        : { data: [] };
      const map = new Map((profs ?? []).map((p) => [p.id, p]));
      return { reviews: list.map((r) => ({ ...r, reviewer: map.get(r.reviewer_id) })), isDemo: !!prof?.is_demo };
    },
  });
  if (!data) return null;
  const list = data.reviews;
  const mock = data.isDemo && list.length < 3 ? mockRatings(userId) : null;
  const n = mock ? mock.count : list.length;
  const avg = (k: CatKey) => (mock ? mock[k] : n ? list.reduce((s, r) => s + r[k], 0) / n : 0);
  const overall = n ? CATS.reduce((s, c) => s + avg(c.key), 0) / CATS.length : 0;

  return (
    <section className="w-full rounded-2xl bg-ink-soft p-5 ring-1 ring-mist/20">
      <h3 className="font-display text-xl font-semibold text-sand">{t("Reviews")}</h3>
      {n < 3 ? (
        <p className="mt-2 text-base text-mist">
          {t("New member")} · {t("{{count}} reviews", { count: n })}
        </p>
      ) : (
        <>
          <div className="mt-2 flex items-center gap-3">
            <span className="text-2xl font-semibold text-lemon">{overall.toFixed(1)}</span>
            <StarRow value={overall} />
            <span className="text-base font-normal text-mist">({t("{{count}} reviews", { count: n })})</span>
          </div>
          <div className="mt-4 space-y-2">
            {CATS.map((c) => (
              <div key={c.key} className="flex items-center gap-3 text-base">
                <span className="w-32 shrink-0 text-sand/90">{t(c.label)}</span>
                <div className="h-2 flex-1 overflow-hidden rounded-full bg-ink">
                  <div className="h-full rounded-full bg-lemon" style={{ width: `${(avg(c.key) / 5) * 100}%` }} />
                </div>
                <span className="w-8 text-right text-mist">{avg(c.key).toFixed(1)}</span>
              </div>
            ))}
          </div>
        </>
      )}
      {list.filter((r) => r.note).slice(0, 5).map((r) => (
        <div key={r.id} className="mt-4 flex gap-3 border-t border-mist/15 pt-4">
          {r.reviewer?.avatar_url ? (
            <img src={r.reviewer.avatar_url} alt="" className="size-10 rounded-full object-cover" />
          ) : (
            <span className="grid size-10 place-items-center rounded-full bg-ink text-lemon"><UserRound className="size-5" /></span>
          )}
          <div>
            <p className="text-base font-semibold text-sand">
              {r.reviewer?.display_name ?? t("Member")}{" "}
              <span className="text-sm font-normal text-mist">· {timeAgo(r.created_at)}</span>
            </p>
            <p className="text-base text-sand/85">{r.note}</p>
          </div>
        </div>
      ))}
    </section>
  );
}

function Stars({ value, onChange, label }: { value: number; onChange: (v: number) => void; label: string }) {
  return (
    <div className="flex items-center justify-between gap-2">
      <span className="text-base text-sand">{label}</span>
      <div className="flex gap-1" role="radiogroup" aria-label={label}>
        {[1, 2, 3, 4, 5].map((i) => (
          <button key={i} type="button" aria-label={`${i}`} onClick={() => onChange(i)} className="p-0.5">
            <Star className={`size-7 ${i <= value ? "fill-lemon text-lemon" : "text-mist/50"}`} />
          </button>
        ))}
      </div>
    </div>
  );
}

export function LeaveReviewButton({ meetupId, meetAt, otherName }: { meetupId: string; meetAt: string; otherName: string }) {
  const { t } = useTranslation();
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [r, setR] = useState<Ratings>({ punctuality: 0, communication: 0, kindness: 0, reliability: 0 });
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const past = new Date(meetAt).getTime() < Date.now();

  const { data: ctx } = useQuery({
    queryKey: ["my-review", meetupId],
    enabled: past,
    queryFn: async () => {
      const { data: u } = await supabase.auth.getUser();
      const me = u.user?.id;
      const { data: m } = await supabase.from("meetup_requests").select("requester_id, recipient_id").eq("id", meetupId).maybeSingle();
      const { data: existing } = await db.from("member_reviews").select("*").eq("meetup_id", meetupId).eq("reviewer_id", me).maybeSingle();
      return { me, other: m ? (m.requester_id === me ? m.recipient_id : m.requester_id) : null, existing };
    },
  });
  if (!past || !ctx?.other) return null;

  function start() {
    if (ctx?.existing) {
      const e = ctx.existing;
      setR({ punctuality: e.punctuality, communication: e.communication, kindness: e.kindness, reliability: e.reliability });
      setNote(e.note);
    }
    setOpen(true);
  }

  async function submit() {
    if (Object.values(r).some((v) => v === 0)) {
      toast.error(t("Please rate all four categories."));
      return;
    }
    setBusy(true);
    const payload = { ...r, note: note.trim().slice(0, 500) };
    const { error } = ctx!.existing
      ? await db.from("member_reviews").update(payload).eq("id", ctx!.existing.id)
      : await db.from("member_reviews").insert({ ...payload, meetup_id: meetupId, reviewer_id: ctx!.me, reviewee_id: ctx!.other });
    setBusy(false);
    if (error) { toast.error(error.message); return; }
    toast.success(t("Thank you for your review!"));
    setOpen(false);
    qc.invalidateQueries({ queryKey: ["my-review", meetupId] });
    qc.invalidateQueries({ queryKey: ["member-reviews", ctx!.other] });
  }

  return (
    <>
      <button type="button" onClick={start} className="mt-3 inline-flex w-full items-center justify-center gap-2 whitespace-nowrap rounded-full bg-lemon/15 px-4 py-3 text-base font-semibold text-sand ring-1 ring-lemon/45">
        <Star className="size-5" />
        {ctx.existing ? t("Edit your review") : t("Leave a review")}
      </button>
      {open && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-ink/80 p-4" onClick={() => setOpen(false)}>
          <div className="w-full max-w-md space-y-4 rounded-2xl bg-ink-soft p-5 ring-1 ring-mist/25" onClick={(e) => e.stopPropagation()}>
            <h3 className="font-display text-xl font-semibold text-sand">{t("Review {{name}}", { name: otherName })}</h3>
            {CATS.map((c) => (
              <Stars key={c.key} label={t(c.label)} value={r[c.key]} onChange={(v) => setR({ ...r, [c.key]: v })} />
            ))}
            <textarea value={note} onChange={(e) => setNote(e.target.value)} maxLength={500} rows={4} placeholder={t("Add a note (optional)")} className="w-full rounded-xl bg-ink p-3 text-base text-sand ring-1 ring-mist/25" />
            <div className="flex gap-2">
              <button type="button" onClick={() => setOpen(false)} className="flex-1 rounded-full bg-ink px-4 py-3 text-base text-sand ring-1 ring-mist/30">{t("Cancel")}</button>
              <button type="button" disabled={busy} onClick={submit} className="flex-1 rounded-full bg-ember px-4 py-3 text-base font-semibold text-ink">{t("Submit")}</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
