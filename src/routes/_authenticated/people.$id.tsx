import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { ArrowLeft, UserRound } from "lucide-react";
import { useTranslation } from "react-i18next";
import { FollowButton } from "@/components/FollowButton";
import { getMemberPosts, getMemberProfile, type MemberPostItem } from "@/lib/profile.functions";
import { timeAgo } from "@/lib/time-ago";

export const Route = createFileRoute("/_authenticated/people/$id")({
  head: () => ({
    meta: [
      { title: "Member profile — City Ministers" },
      { name: "description", content: "Meet a neighbor serving through City Ministers." },
      { property: "og:title", content: "Member profile — City Ministers" },
      { property: "og:description", content: "Meet a neighbor serving through City Ministers." },
      { property: "og:type", content: "profile" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: MemberProfilePage,
});

function MemberProfilePage() {
  const { id } = Route.useParams();
  const { t } = useTranslation();
  const fetchProfile = useServerFn(getMemberProfile);
  const { data: profile, isPending, isError } = useQuery({
    queryKey: ["member-profile", id],
    queryFn: () => fetchProfile({ data: { id } }),
    retry: false,
  });
  const fetchPosts = useServerFn(getMemberPosts);
  const { data: posts } = useQuery({
    queryKey: ["member-posts", id],
    queryFn: () => fetchPosts({ data: { id } }),
    retry: false,
  });

  return (
    <div className="min-h-dvh bg-ink font-body text-sand">
      <header className="border-b border-mist/15 bg-ink-soft/70">
        <div className="mx-auto flex max-w-xl items-center gap-3 px-4 py-4">
          <Link to="/map" className="grid size-10 place-items-center rounded-full bg-ink text-lemon ring-1 ring-mist/30" aria-label={t("Back to map")}>
            <ArrowLeft className="size-5" aria-hidden="true" />
          </Link>
          <h1 className="font-display text-xl font-semibold">{t("Profile")}</h1>
        </div>
      </header>
      <main className="mx-auto max-w-xl px-5 py-8">
        {isPending ? (
          <p className="text-mist">{t("Loading…")}</p>
        ) : isError || !profile ? (
          <p className="text-mist">{t("This profile is unavailable.")}</p>
        ) : (
          <div className="flex flex-col items-start gap-5">
            {profile.avatarUrl ? (
              <img src={profile.avatarUrl} alt={t("Profile photo of {{name}}", { name: profile.displayName })} className="size-28 rounded-full object-cover ring-2 ring-lemon/40" />
            ) : (
              <span className="grid size-28 place-items-center rounded-full bg-ink-soft text-lemon ring-2 ring-lemon/40"><UserRound className="size-12" aria-hidden="true" /></span>
            )}
            <div>
              <h2 className="font-display text-3xl font-semibold text-sand">{profile.displayName}</h2>
              {profile.city && <p className="mt-1 text-base text-mist">{profile.city}</p>}
            </div>
            <FollowButton targetType="user" targetId={id} />
            {profile.bio && <p className="text-lg leading-relaxed text-sand/85">{profile.bio}</p>}
            {posts && <PostSection title="Ministries" items={posts.ministries} tone="text-tone-cyan" />}
            {posts && <PostSection title="Needs" items={posts.needs} tone="text-tone-indigo" />}
            {posts && <PostSection title="Prayers" items={posts.prayers} tone="text-prayer" />}
          </div>
        )}
      </main>
    </div>
  );
}
function PostSection({ title, items, tone }: { title: string; items: MemberPostItem[]; tone: string }) {
  if (items.length === 0) return null;
  return (
    <section className="w-full">
      <h3 className={`font-display text-xl font-semibold ${tone}`}>{title}</h3>
      <ul className="mt-2 flex flex-col gap-2">
        {items.map((it) => (
          <li key={it.id}>
            <PostLink item={it} />
          </li>
        ))}
      </ul>
    </section>
  );
}

function PostLink({ item }: { item: MemberPostItem }) {
  const cls = "flex items-center justify-between gap-3 rounded-xl bg-ink-soft/60 px-4 py-3 text-base text-sand ring-1 ring-mist/20 hover:ring-lemon/40";
  const body = (
    <>
      <span className="min-w-0 truncate font-semibold">{item.title}</span>
      <span className="flex shrink-0 items-center gap-2 text-sm text-mist">
        {item.met && <span className="font-semibold text-lemon">Need met</span>}
        {timeAgo(item.createdAt)}
      </span>
    </>
  );
  if (item.kind === "need") return <Link to="/needs" search={{ new: item.id }} className={cls}>{body}</Link>;
  if (item.kind === "prayer" && item.churchId) return <Link to="/church/$id" params={{ id: item.churchId }} className={cls}>{body}</Link>;
  if (item.kind === "prayer") return <Link to="/map" search={{ mode: "prayer", new: item.id }} className={cls}>{body}</Link>;
  return <Link to="/map" search={{ new: item.id }} className={cls}>{body}</Link>;
}
