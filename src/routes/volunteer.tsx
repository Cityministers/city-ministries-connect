import { createFileRoute, Link } from "@tanstack/react-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import { ArrowLeft, BellRing, CalendarDays, MapPin, Users, UsersRound } from "lucide-react";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";
import { supabase } from "@/integrations/supabase/client";
import { useSession } from "@/hooks/useSession";
import { BrandLogo } from "@/components/BrandLogo";
import { SiteNav } from "@/components/SiteNav";
import { AccountMenu } from "@/components/AccountMenu";
import { PostProjectForm } from "@/components/volunteer/PostProjectForm";

type Signup = { id: string; user_id: string | null; display_name: string; city: string; zip: string };
type Project = {
  id: string; title: string; description: string; starts_at: string; location: string; city: string; zip: string;
};
type Rsvp = { project_id: string; signup_id: string };

export const Route = createFileRoute("/volunteer")({
  validateSearch: (s: Record<string, unknown>) => ({
    city: typeof s["city"] === "string" ? s["city"] : undefined,
    project: typeof s["project"] === "string" ? s["project"] : undefined,
  }),
  head: () => ({
    meta: [
      { title: "Community Volunteer — City Ministers" },
      { name: "description", content: "Join your city's volunteer list, get alerted to group service projects, and RSVP to serve together." },
      { property: "og:title", content: "Community Volunteer — City Ministers" },
      { property: "og:description", content: "Group volunteer projects near you. Join the list and RSVP." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: VolunteerPage,
});

function VolunteerPage() {
  const { t } = useTranslation();
  const { city: cityParam, project: focus } = Route.useSearch();
  const city = cityParam || "Portland";
  const session = useSession();
  const userId = session?.user.id ?? null;
  const [signups, setSignups] = useState<Signup[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [rsvps, setRsvps] = useState<Rsvp[]>([]);
  const [avatars, setAvatars] = useState<Record<string, string | null>>({});
  const [tab, setTab] = useState<"rsvp" | "waiting">("rsvp");
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    const [s, p] = await Promise.all([
      supabase.from("volunteer_signups").select("id,user_id,display_name,city,zip").ilike("city", city),
      supabase.from("volunteer_projects").select("id,title,description,starts_at,location,city,zip")
        .eq("status", "approved").ilike("city", city).gte("starts_at", new Date().toISOString()).order("starts_at"),
    ]);
    const sl = (s.data ?? []) as Signup[];
    const pl = (p.data ?? []) as Project[];
    setSignups(sl);
    setProjects(pl);
    if (pl.length) {
      const r = await supabase.from("volunteer_rsvps").select("project_id,signup_id").in("project_id", pl.map((x) => x.id));
      setRsvps((r.data ?? []) as Rsvp[]);
    } else setRsvps([]);
    const ids = sl.map((x) => x.user_id).filter(Boolean) as string[];
    if (ids.length) {
      const pr = await supabase.from("profiles").select("id,avatar_url").in("id", ids);
      setAvatars(Object.fromEntries((pr.data ?? []).map((x) => [x.id, x.avatar_url])));
    }
  }, [city]);

  useEffect(() => { void load(); }, [load]);

  const mine = signups.find((s) => userId && s.user_id === userId);
  const rsvpSet = useMemo(() => new Set(rsvps.map((r) => r.signup_id)), [rsvps]);
  const rsvpd = signups.filter((s) => rsvpSet.has(s.id));
  const waiting = signups.filter((s) => !rsvpSet.has(s.id));

  async function join() {
    if (!userId) return;
    setBusy(true);
    const { data: prof } = await supabase.from("profiles").select("display_name,zip").eq("id", userId).maybeSingle();
    const { error } = await supabase.from("volunteer_signups").insert({
      user_id: userId, display_name: prof?.display_name || "Neighbor", city, zip: prof?.zip ?? "",
    });
    setBusy(false);
    if (error) { toast.error(t("Could not join the list.")); return; }
    toast.success(t("You're on the volunteer list! We'll alert you when a project is posted."));
    void load();
  }

  async function leave() {
    if (!userId) return;
    await supabase.from("volunteer_signups").delete().eq("user_id", userId);
    void load();
  }

  async function toggleRsvp(projectId: string) {
    if (!mine || !userId) return;
    const has = rsvps.some((r) => r.project_id === projectId && r.signup_id === mine.id);
    const { error } = has
      ? await supabase.from("volunteer_rsvps").delete().eq("project_id", projectId).eq("signup_id", mine.id)
      : await supabase.from("volunteer_rsvps").insert({ project_id: projectId, signup_id: mine.id, user_id: userId });
    if (error) { toast.error(t("Something went wrong.")); return; }
    toast.success(has ? t("RSVP cancelled.") : t("You're going! See you there."));
    void load();
  }

  const list = tab === "rsvp" ? rsvpd : waiting;

  return (
    <div className="min-h-dvh bg-ink font-body text-sand antialiased">
      <header className="border-b border-ink-soft">
        <div className="mx-auto flex max-w-3xl items-center justify-between gap-3 px-4 py-4">
          <div className="flex items-center gap-2">
            <Link to="/map" search={{ q: cityParam }} className="grid size-9 shrink-0 place-items-center rounded-full bg-ink text-sand ring-1 ring-mist/20 transition hover:bg-ink-soft" aria-label={t("Back to the map")}>
              <ArrowLeft className="size-4" aria-hidden="true" />
            </Link>
            <SiteNav />
            <BrandLogo />
          </div>
          <AccountMenu />
        </div>
      </header>
      <main className="mx-auto max-w-3xl px-4 py-8">
        <div className="flex items-center gap-4">
          <span className="grid size-20 shrink-0 place-items-center rounded-2xl bg-tone-emerald/20 text-sand ring-1 ring-tone-emerald/55">
            <UsersRound className="size-11" aria-hidden="true" />
          </span>
          <div>
            <h1 className="font-display text-3xl font-semibold sm:text-4xl">{t("Community Volunteer")}</h1>
            <p className="mt-1 flex items-center gap-1 text-lg text-mist/85"><MapPin className="size-4" />{city}</p>
          </div>
        </div>

        {/* Option 1 */}
        <section className="mt-8 rounded-2xl bg-ink-soft/50 p-5 ring-1 ring-mist/20">
          <h2 className="flex items-center gap-2 font-display text-2xl font-semibold"><BellRing className="size-6 text-lemon" />{t("Sign up for group volunteer projects")}</h2>
          <p className="mt-2 text-lg text-mist/85">{t("Join the list and we'll send you an RSVP alert whenever a group project is posted in your area.")}</p>
          {session === undefined ? null : !userId ? (
            <Link to="/auth" className="mt-4 inline-flex rounded-full bg-lemon px-6 py-3 text-lg font-bold text-ink">{t("Create an account to join")}</Link>
          ) : mine ? (
            <div className="mt-4 flex flex-wrap items-center gap-3">
              <span className="rounded-full bg-tone-emerald/20 px-4 py-2 text-lg font-semibold ring-1 ring-tone-emerald/55">✓ {t("You're on the list")}</span>
              <button type="button" onClick={leave} className="text-base text-mist/80 underline">{t("Leave list")}</button>
            </div>
          ) : (
            <button type="button" disabled={busy} onClick={join} className="mt-4 rounded-full bg-lemon px-6 py-3 text-lg font-bold text-ink disabled:opacity-60">{t("Join the volunteer list")}</button>
          )}
        </section>

        {/* Option 3 */}
        <section className="mt-6">
          <h2 className="flex items-center gap-2 font-display text-2xl font-semibold"><CalendarDays className="size-6 text-lemon" />{t("Upcoming group projects")}</h2>
          {userId ? (
            <PostProjectForm userId={userId} city={city} onPosted={() => void load()} />
          ) : session !== undefined ? (
            <Link to="/auth" className="mt-4 inline-flex rounded-full bg-tone-emerald/25 px-6 py-3 text-lg font-bold text-sand ring-1 ring-tone-emerald/60">{t("Sign in to post a group project")}</Link>
          ) : null}
          <ul className="mt-3 flex flex-col gap-3">
            {projects.length === 0 && <li className="text-lg text-mist/80">{t("No projects posted yet.")}</li>}
            {projects.map((p) => {
              const going = rsvps.filter((r) => r.project_id === p.id).length;
              const iGo = !!mine && rsvps.some((r) => r.project_id === p.id && r.signup_id === mine.id);
              return (
                <li key={p.id} className={`rounded-2xl bg-ink-soft/50 p-5 ring-1 ${focus === p.id ? "ring-2 ring-gold/80" : "ring-mist/20"}`}>
                  <h3 className="text-xl font-bold">{p.title}</h3>
                  <p className="mt-1 text-base font-semibold text-lemon">
                    {new Date(p.starts_at).toLocaleString(undefined, { weekday: "short", month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })}
                  </p>
                  <p className="mt-1 flex items-start gap-1 text-base text-mist/85"><MapPin className="mt-1 size-4 shrink-0" />{p.location}</p>
                  <p className="mt-2 text-lg text-mist/90">{p.description}</p>
                  <div className="mt-3 flex flex-wrap items-center gap-3">
                    <span className="flex items-center gap-1 text-base text-mist/85"><Users className="size-4" />{going} {t("going")}</span>
                    {!userId ? (
                      <Link to="/auth" className="rounded-full bg-lemon px-5 py-2 text-base font-bold text-ink">{t("Sign in to attend")}</Link>
                    ) : !mine ? (
                      <button type="button" onClick={join} className="rounded-full bg-lemon px-5 py-2 text-base font-bold text-ink">{t("Join list & attend")}</button>
                    ) : (
                      <button type="button" onClick={() => toggleRsvp(p.id)} className={iGo ? "rounded-full bg-tone-emerald/25 px-5 py-2 text-base font-bold ring-1 ring-tone-emerald/60" : "rounded-full bg-lemon px-5 py-2 text-base font-bold text-ink"}>
                        {iGo ? `✓ ${t("Going — cancel")}` : t("I'll attend")}
                      </button>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        </section>

        {/* Option 2 */}
        <section className="mt-8">
          <h2 className="font-display text-2xl font-semibold">{t("Volunteer list")}</h2>
          <div className="mt-3 flex gap-2">
            {(["rsvp", "waiting"] as const).map((k) => (
              <button key={k} type="button" onClick={() => setTab(k)}
                className={`rounded-full px-4 py-2 text-base font-semibold ring-1 ${tab === k ? "bg-tone-emerald/25 ring-tone-emerald/60" : "bg-ink-soft/50 ring-mist/25 text-mist/85"}`}>
                {k === "rsvp" ? `${t("RSVP'd")} (${rsvpd.length})` : `${t("Not yet RSVP'd")} (${waiting.length})`}
              </button>
            ))}
          </div>
          <ul className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
            {list.map((s) => {
              const av = s.user_id ? avatars[s.user_id] : null;
              const inner = (
                <>
                  {av ? <img src={av} alt="" className="size-11 rounded-full object-cover" /> : (
                    <span className="grid size-11 place-items-center rounded-full bg-ink text-lg font-bold ring-1 ring-mist/30">{s.display_name.slice(0, 1)}</span>
                  )}
                  <span className="min-w-0">
                    <span className="block truncate text-lg font-semibold">{s.display_name}</span>
                    <span className="block text-sm text-mist/75">{s.city} {s.zip}</span>
                  </span>
                </>
              );
              const cls = "flex items-center gap-3 rounded-xl bg-ink-soft/50 px-3 py-2 ring-1 ring-mist/20";
              return (
                <li key={s.id}>
                  {s.user_id ? <Link to="/people/$id" params={{ id: s.user_id }} className={cls}>{inner}</Link> : <div className={cls}>{inner}</div>}
                </li>
              );
            })}
            {list.length === 0 && <li className="text-lg text-mist/80">{t("No one here yet.")}</li>}
          </ul>
        </section>
      </main>
    </div>
  );
}
