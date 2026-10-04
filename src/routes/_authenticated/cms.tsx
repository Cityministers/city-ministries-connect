import { createFileRoute, Link } from "@tanstack/react-router";
import { listPendingRoomPosts, moderateRoomPost } from "@/lib/room-posts.functions";
import { PendingRoomsAdmin } from "@/components/rooms/PendingRoomsAdmin";
import { NeighborhoodVideoReview } from "@/components/NeighborhoodVideoReview";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import {
  ArrowLeft,
  Check,
  Church,
  EyeOff,
  HandHeart,
  HandHelping,
  MessageCircle,
  ShieldCheck,
  Sparkles,
  Trash2,
} from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";

import {
  adminListNeeds,
  adminListReports,
  adminSetNeedStatus,
  adminUpdateReport,
  adminListFeedback,
  type AdminReportDTO,
  type ReportStatus,
} from "@/lib/moderation.functions";
import {
  adminListChurches,
  adminRecordChurchPayment,
  adminSetChurchStatus,
  adminDeleteChurch,
  type AdminChurchDTO,
} from "@/lib/church-admin.functions";
import {
  listFeedbackReplies,
  replyToFeedback,
  type FeedbackReplyDTO,
} from "@/lib/feedback-reply.functions";
import { getSiteStats, type RecentItem } from "@/lib/admin-stats.functions";
import { timeAgo } from "@/lib/time-ago";
import { CmsChurchEdit, CmsPostsPanel, CmsRoomsPanel, CmsSiteTextPanel, CmsUsersPanel } from "@/components/cms/CmsPanels";

export const Route = createFileRoute("/_authenticated/cms")({
  head: () => ({
    meta: [
      { title: "CMS — City Ministers" },
      {
        name: "description",
        content:
          "Admin review center for City Ministers: approve or remove posted needs and work through abuse reports.",
      },
      { property: "og:title", content: "CMS — City Ministers" },
      {
        property: "og:description",
        content: "Approve or remove posted needs and handle abuse reports.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: AdminPage,
});

const statusStyles: Record<string, string> = {
  active: "bg-emerald-500/15 text-emerald-300 ring-emerald-400/30",
  hidden: "bg-amber-500/15 text-amber-300 ring-amber-400/30",
  removed: "bg-rose/15 text-rose ring-rose/30",
  new: "bg-lemon/15 text-lemon ring-lemon/30",
  reviewing: "bg-amber-500/15 text-amber-300 ring-amber-400/30",
  resolved: "bg-emerald-500/15 text-emerald-300 ring-emerald-400/30",
  dismissed: "bg-mist/15 text-mist ring-mist/30",
};

function Pill({ value }: { value: string }) {
  const { t } = useTranslation();
  return (
    <span
      className={`rounded-full px-2.5 py-1 text-xs font-semibold uppercase tracking-wide ring-1 ${
        statusStyles[value] ?? "bg-mist/15 text-mist ring-mist/30"
      }`}
    >
      {t(value)}
    </span>
  );
}

type CmsTab = "stats" | "users" | "posts" | "needs" | "rooms" | "videos" | "churches" | "content" | "reports" | "feedback";
const CMS_TABS: CmsTab[] = ["stats", "users", "posts", "needs", "rooms", "videos", "churches", "content", "reports", "feedback"];
const TAB_LABELS: Record<CmsTab, string> = {
  stats: "Dashboard",
  users: "Users & roles",
  posts: "All posts",
  needs: "Posted needs",
  rooms: "Rooms",
  videos: "Videos",
  churches: "Churches",
  content: "Site text",
  reports: "Abuse reports",
  feedback: "Feedback",
};

function AdminPage() {
  const { t } = useTranslation();
  const [tab, setTab] = useState<CmsTab>("stats");
  const qc = useQueryClient();
  const fetchRoomPosts = useServerFn(listPendingRoomPosts);
  const moderateRoom = useServerFn(moderateRoomPost);
  const roomPosts = useQuery({ queryKey: ["admin", "room-posts"], queryFn: () => fetchRoomPosts() });
  const roomMutation = useMutation({
    mutationFn: (input: { id: string; action: "approve" | "decline" }) => moderateRoom({ data: input }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin", "room-posts"] }),
  });

  const fetchNeeds = useServerFn(adminListNeeds);
  const fetchReports = useServerFn(adminListReports);
  const setNeedStatus = useServerFn(adminSetNeedStatus);
  const updateReport = useServerFn(adminUpdateReport);
  const fetchFeedback = useServerFn(adminListFeedback);

  const needs = useQuery({ queryKey: ["admin", "needs"], queryFn: () => fetchNeeds() });
  const reports = useQuery({ queryKey: ["admin", "reports"], queryFn: () => fetchReports() });
  const feedback = useQuery({ queryKey: ["admin", "feedback"], queryFn: () => fetchFeedback() });

  const fetchStats = useServerFn(getSiteStats);
  const siteStats = useQuery({ queryKey: ["admin", "stats"], queryFn: () => fetchStats() });

  const fetchReplies = useServerFn(listFeedbackReplies);
  const sendReply = useServerFn(replyToFeedback);
  const replies = useQuery({
    queryKey: ["admin", "feedback-replies"],
    queryFn: () => fetchReplies(),
  });
  const replyMutation = useMutation({
    mutationFn: (input: { feedbackId: string; subject: string; message: string }) =>
      sendReply({ data: input }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin", "feedback-replies"] }),
  });

  const needMutation = useMutation({
    mutationFn: (input: { id: string; status: "active" | "hidden" | "removed" }) =>
      setNeedStatus({ data: input }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin", "needs"] }),
  });

  const reportMutation = useMutation({
    mutationFn: (input: { id: string; status: ReportStatus; adminNotes: string }) =>
      updateReport({ data: input }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin", "reports"] }),
  });

  const fetchChurches = useServerFn(adminListChurches);
  const recordPayment = useServerFn(adminRecordChurchPayment);
  const setChurchStatus = useServerFn(adminSetChurchStatus);
  const removeChurch = useServerFn(adminDeleteChurch);
  const churches = useQuery({ queryKey: ["admin", "churches"], queryFn: () => fetchChurches() });
  const refreshChurches = () => qc.invalidateQueries({ queryKey: ["admin", "churches"] });

  const payMutation = useMutation({
    mutationFn: (input: { churchId: string; months: number }) => recordPayment({ data: input }),
    onSuccess: refreshChurches,
  });
  const churchStatusMutation = useMutation({
    mutationFn: (input: { churchId: string; status: "active" | "inactive" }) =>
      setChurchStatus({ data: input }),
    onSuccess: refreshChurches,
  });
  const churchDeleteMutation = useMutation({
    mutationFn: (input: { churchId: string }) => removeChurch({ data: input }),
    onSuccess: refreshChurches,
  });

  const blocked =
    needs.isError || reports.isError
      ? t("This page is only for site admins.")
      : null;

  return (
    <div className="flex min-h-dvh flex-col bg-ink font-body text-sand antialiased">
      <header className="border-b border-ink-soft bg-ink-soft/70">
        <div className="mx-auto flex w-full max-w-4xl items-center gap-3 px-4 py-4 sm:px-6">
          <Link
            to="/map"
            className="grid size-10 shrink-0 place-items-center rounded-full bg-ink text-lemon ring-1 ring-mist/20 transition hover:bg-ink-soft"
            aria-label={t("Back to map")}
          >
            <ArrowLeft className="size-4" aria-hidden="true" />
          </Link>
          <h1 className="font-display text-lg font-semibold sm:text-xl">{t("CMS")}</h1>
        </div>
      </header>

      <main className="mx-auto w-full max-w-4xl flex-1 px-4 py-6 sm:px-6 sm:py-10">
        {blocked ? (
          <div className="rounded-2xl bg-ink-soft/40 p-6 text-center ring-1 ring-mist/15">
            <ShieldCheck className="mx-auto mb-3 size-8 text-lemon" aria-hidden="true" />
            <p className="text-base text-mist/80">{blocked}</p>
          </div>
        ) : (
          <>
            <div className="mb-6 flex flex-wrap gap-2">
              {CMS_TABS.map((tabItem) => (
                <button
                  key={tabItem}
                  type="button"
                  onClick={() => setTab(tabItem)}
                  className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                    tab === tabItem
                      ? "bg-lemon text-ink"
                      : "bg-ink-soft/50 text-mist ring-1 ring-mist/20 hover:bg-ink-soft"
                  }`}
                >
                  {t(TAB_LABELS[tabItem])}
                  {tabItem === "reports" && (reports.data?.filter((r) => r.status === "new").length ?? 0) > 0
                    ? ` (${reports.data?.filter((r) => r.status === "new").length})`
                    : ""}
                  {tabItem === "rooms" && (roomPosts.data?.length ?? 0) > 0 ? ` (${roomPosts.data?.length})` : ""}
                </button>
              ))}
            </div>

            {tab === "users" ? (
              <CmsUsersPanel />
            ) : tab === "posts" ? (
              <CmsPostsPanel />
            ) : tab === "content" ? (
              <CmsSiteTextPanel />
            ) : tab === "stats" ? (
              <StatsTab
                data={siteStats.data}
                loading={siteStats.isLoading}
                error={siteStats.isError}
              />
            ) : tab === "needs" ? (
              <section className="space-y-3">
                {needs.isLoading ? (
                  <p className="text-mist/70">{t("Loading…")}</p>
                ) : (needs.data?.length ?? 0) === 0 ? (
                  <p className="text-mist/70">{t("No needs have been posted yet.")}</p>
                ) : (
                  needs.data!.map((n) => (
                    <article
                      key={n.id}
                      className="rounded-2xl bg-ink-soft/40 p-4 ring-1 ring-mist/15 sm:p-5"
                    >
                      <div className="flex flex-wrap items-center gap-2">
                        <h2 className="font-display text-lg font-semibold">{n.shortTitle}</h2>
                        <Pill value={n.status} />
                        {n.reportCount > 0 ? (
                          <span className="rounded-full bg-rose/15 px-2.5 py-1 text-xs font-semibold text-rose ring-1 ring-rose/30">
                            {n.reportCount === 1
                              ? t("{{count}} report", { count: n.reportCount })
                              : t("{{count}} reports", { count: n.reportCount })}
                          </span>
                        ) : null}
                      </div>
                      <p className="mt-1 text-sm text-mist/70">
                        {n.posterName} · {[n.city, n.zip].filter(Boolean).join(" ") || t("No location")} ·{" "}
                        {new Date(n.createdAt).toLocaleDateString()}
                      </p>
                      <p className="mt-3 text-sm leading-relaxed text-mist/80">{n.description}</p>

                      <div className="mt-4 flex flex-wrap gap-2">
                        <button
                          type="button"
                          disabled={needMutation.isPending || n.status === "active"}
                          onClick={() => needMutation.mutate({ id: n.id, status: "active" })}
                          className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/15 px-4 py-2 text-sm font-semibold text-emerald-300 ring-1 ring-emerald-400/30 transition hover:bg-emerald-500/25 disabled:opacity-40"
                        >
                          <Check className="size-4" aria-hidden="true" /> {t("Approve")}
                        </button>
                        <button
                          type="button"
                          disabled={needMutation.isPending || n.status === "hidden"}
                          onClick={() => needMutation.mutate({ id: n.id, status: "hidden" })}
                          className="inline-flex items-center gap-1.5 rounded-full bg-amber-500/15 px-4 py-2 text-sm font-semibold text-amber-300 ring-1 ring-amber-400/30 transition hover:bg-amber-500/25 disabled:opacity-40"
                        >
                          <EyeOff className="size-4" aria-hidden="true" /> {t("Hide")}
                        </button>
                        <button
                          type="button"
                          disabled={needMutation.isPending || n.status === "removed"}
                          onClick={() => needMutation.mutate({ id: n.id, status: "removed" })}
                          className="inline-flex items-center gap-1.5 rounded-full bg-rose/15 px-4 py-2 text-sm font-semibold text-rose ring-1 ring-rose/30 transition hover:bg-rose/25 disabled:opacity-40"
                        >
                          <Trash2 className="size-4" aria-hidden="true" /> {t("Remove")}
                        </button>
                      </div>
                    </article>
                  ))
                )}
              </section>
            ) : tab === "rooms" ? (
              <section className="space-y-3">
                <PendingRoomsAdmin />
                <CmsRoomsPanel />
                <h3 className="pt-4 text-sm font-bold uppercase tracking-wide text-mist">{t("Room posts waiting")}</h3>
                {roomPosts.isLoading ? (
                  <p className="text-mist/70">{t("Loading…")}</p>
                ) : (roomPosts.data?.length ?? 0) === 0 ? (
                  <p className="text-mist/70">{t("No room posts are waiting for approval.")}</p>
                ) : (
                  roomPosts.data!.map((p) => (
                    <article key={p.id} className="rounded-2xl border border-mist/35 bg-ink-soft p-4">
                      <div className="text-sm text-mist">
                        <span className="font-semibold text-sand">{p.authorName}</span> · {t(p.roomTitle)} · {new Date(p.createdAt).toLocaleString()}
                      </div>
                      <p className="mt-2 whitespace-pre-wrap text-base">{p.body}</p>
                      {p.mediaUrl && (p.mediaType === "video" ? (
                        <video src={p.mediaUrl} controls playsInline className="mt-3 max-h-80 w-full rounded-xl bg-ink object-contain" />
                      ) : (
                        <img src={p.mediaUrl} alt="" className="mt-3 max-h-80 w-full rounded-xl bg-ink object-contain" />
                      ))}
                      <div className="mt-3 flex gap-2">
                        <button type="button" disabled={roomMutation.isPending} onClick={() => roomMutation.mutate({ id: p.id, action: "approve" })} className="inline-flex items-center gap-1 rounded-full bg-tone-cyan/25 px-4 py-1.5 text-sm font-bold ring-1 ring-tone-cyan/55">
                          <Check className="size-4" aria-hidden="true" />{t("Approve")}
                        </button>
                        <button type="button" disabled={roomMutation.isPending} onClick={() => { if (window.confirm(t("Remove this post?"))) roomMutation.mutate({ id: p.id, action: "decline" }); }} className="inline-flex items-center gap-1 rounded-full px-4 py-1.5 text-sm font-bold ring-1 ring-mist/40">
                          <Trash2 className="size-4" aria-hidden="true" />{t("Decline")}
                        </button>
                        <Link to="/rooms/$slug" params={{ slug: p.roomSlug }} className="ml-auto self-center text-sm font-semibold text-lemon">{t("Open room")}</Link>
                      </div>
                    </article>
                  ))
                )}
              </section>
            ) : tab === "videos" ? (
              <NeighborhoodVideoReview />
            ) : tab === "churches" ? (
              <section className="space-y-3">
                {churches.isLoading ? (
                  <p className="text-mist/70">{t("Loading…")}</p>
                ) : (churches.data?.length ?? 0) === 0 ? (
                  <p className="text-mist/70">{t("No churches have signed up yet.")}</p>
                ) : (
                  churches.data!.map((c) => (
                    <div key={c.id} className="space-y-2">
                    <ChurchCard
                      church={c}
                      pending={
                        payMutation.isPending ||
                        churchStatusMutation.isPending ||
                        churchDeleteMutation.isPending
                      }
                      onPay={(months) => payMutation.mutate({ churchId: c.id, months })}
                      onStatus={(status) => churchStatusMutation.mutate({ churchId: c.id, status })}
                      onDelete={() => churchDeleteMutation.mutate({ churchId: c.id })}
                    />
                    <CmsChurchEdit church={c} />
                    </div>
                  ))
                )}
              </section>
            ) : tab === "feedback" ? (
              <section className="space-y-3">
                {feedback.isLoading ? (
                  <p className="text-mist/70">{t("Loading…")}</p>
                ) : (feedback.data?.length ?? 0) === 0 ? (
                  <p className="text-mist/70">{t("No feedback has been sent yet.")}</p>
                ) : (
                  feedback.data!.map((f) => (
                    <article
                      key={f.id}
                      className="rounded-2xl bg-ink-soft/40 p-4 ring-1 ring-mist/15 sm:p-5"
                    >
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="rounded-full bg-lemon/15 px-2.5 py-1 text-xs font-semibold text-lemon ring-1 ring-lemon/30">
                          {t("{{n}}/5 overall", { n: f.overall })}
                        </span>
                        <span className="text-sm text-mist/70">
                          {new Date(f.createdAt).toLocaleString()}
                        </span>
                      </div>
                      <p className="mt-2 text-sm text-mist/70">
                        {t("Ease {{ease}}/5 · Look {{design}}/5 · Speed {{speed}}/5", { ease: f.ease ?? "—", design: f.design ?? "—", speed: f.speed ?? "—" })}
                        {f.email ? ` · ${f.email}` : ""}
                      </p>
                      {f.likes ? (
                        <p className="mt-3 text-sm leading-relaxed text-mist/80">
                          <span className="font-semibold text-sand">{t("Likes: ")}</span>
                          {f.likes}
                        </p>
                      ) : null}
                      {f.changes ? (
                        <p className="mt-2 text-sm leading-relaxed text-mist/80">
                          <span className="font-semibold text-sand">{t("Would change: ")}</span>
                          {f.changes}
                        </p>
                      ) : null}
                      {f.additions ? (
                        <p className="mt-2 text-sm leading-relaxed text-mist/80">
                          <span className="font-semibold text-sand">{t("Should add: ")}</span>
                          {f.additions}
                        </p>
                      ) : null}
                      <FeedbackReply
                        email={f.email}
                        replies={(replies.data ?? []).filter((r) => r.feedbackId === f.id)}
                        pending={replyMutation.isPending}
                        onSend={(subject, message) =>
                          replyMutation.mutateAsync({ feedbackId: f.id, subject, message })
                        }
                      />
                    </article>
                  ))
                )}
              </section>
            ) : (
              <section className="space-y-3">
                {reports.isLoading ? (
                  <p className="text-mist/70">{t("Loading…")}</p>
                ) : (reports.data?.length ?? 0) === 0 ? (
                  <p className="text-mist/70">{t("No reports yet. That's good news.")}</p>
                ) : (
                  reports.data!.map((r) => (
                    <ReportCard
                      key={r.id}
                      report={r}
                      pending={reportMutation.isPending}
                      onSave={(status, adminNotes) =>
                        reportMutation.mutate({ id: r.id, status, adminNotes })
                      }
                    />
                  ))
                )}
              </section>
            )}
          </>
        )}
      </main>
    </div>
  );
}

function ReportCard({
  report,
  pending,
  onSave,
}: {
  report: AdminReportDTO;
  pending: boolean;
  onSave: (status: ReportStatus, notes: string) => void;
}) {
  const { t } = useTranslation();
  const [status, setStatus] = useState<ReportStatus>(report.status);
  const [notes, setNotes] = useState(report.adminNotes);

  return (
    <article className="rounded-2xl bg-ink-soft/40 p-4 ring-1 ring-mist/15 sm:p-5">
      <div className="flex flex-wrap items-center gap-2">
        <span className="font-mono text-sm text-lemon">{report.trackingCode}</span>
        <Pill value={report.status} />
      </div>
      <h2 className="mt-2 font-display text-lg font-semibold">{report.reason}</h2>
      <p className="mt-1 text-sm text-mist/70">
        {report.targetLabel} · {new Date(report.createdAt).toLocaleString()}
        {report.reporterEmail ? ` · ${report.reporterEmail}` : ""}
      </p>
      <p className="mt-3 text-sm leading-relaxed text-mist/80">{report.details}</p>

      <div className="mt-4 grid gap-3 sm:grid-cols-[auto_1fr_auto] sm:items-center">
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value as ReportStatus)}
          className="rounded-xl bg-ink px-3 py-2 text-sm text-sand ring-1 ring-mist/20 focus:outline-none focus:ring-lemon/50"
          aria-label={t("Report status")}
        >
          <option value="new">{t("New")}</option>
          <option value="reviewing">{t("Reviewing")}</option>
          <option value="resolved">{t("Resolved")}</option>
          <option value="dismissed">{t("Dismissed")}</option>
        </select>
        <input
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder={t("Note for the person who reported this")}
          className="rounded-xl bg-ink px-3 py-2 text-sm text-sand ring-1 ring-mist/20 placeholder:text-mist/50 focus:outline-none focus:ring-lemon/50"
        />
        <button
          type="button"
          disabled={pending}
          onClick={() => onSave(status, notes)}
          className="rounded-full bg-lemon px-4 py-2 text-sm font-semibold text-ink transition hover:bg-lemon/90 disabled:opacity-50"
        >
          {t("Save")}
        </button>
      </div>
    </article>
  );
}

function money(cents: number) {
  return `$${(cents / 100).toFixed(2)}`;
}

function ChurchCard({
  church,
  pending,
  onPay,
  onStatus,
  onDelete,
}: {
  church: AdminChurchDTO;
  pending: boolean;
  onPay: (months: number) => void;
  onStatus: (status: "active" | "inactive") => void;
  onDelete: () => void;
}) {
  const { t } = useTranslation();
  const [months, setMonths] = useState(1);
  const [confirming, setConfirming] = useState(false);

  const end = church.currentPeriodEnd ? new Date(church.currentPeriodEnd) : null;
  const overdue = !end || end.getTime() < Date.now();
  const state = church.status === "active" ? (overdue ? "past due" : "on the map") : "off the map";

  return (
    <article className="rounded-2xl bg-ink-soft/40 p-4 ring-1 ring-mist/15 sm:p-5">
      <div className="flex flex-wrap items-center gap-2">
        <h2 className="font-display text-lg font-semibold">{church.name}</h2>
        <Pill value={state === "on the map" ? "active" : state === "past due" ? "hidden" : "removed"} />
        {!church.located ? (
          <span className="rounded-full bg-amber-500/15 px-2.5 py-1 text-xs font-semibold text-amber-300 ring-1 ring-amber-400/30">
            {t("address not found")}
          </span>
        ) : null}
      </div>
      <p className="mt-1 text-sm text-mist/70">
        {church.ownerName}
        {church.ownerEmail ? ` · ${church.ownerEmail}` : ""} ·{" "}
        {[church.address, church.city, church.zip].filter(Boolean).join(", ") || t("No address")}
      </p>
      <p className="mt-2 text-sm text-mist/80">
        {t("Paid through:")}{" "}
        <span className={overdue ? "font-semibold text-rose" : "font-semibold text-sand"}>
          {end ? end.toLocaleDateString() : t("never paid")}
        </span>{" "}
        · {t("Total paid {{amount}}", { amount: money(church.paidCents) })} · {t("Joined")}{" "}
        {new Date(church.createdAt).toLocaleDateString()}
      </p>

      <div className="mt-4 flex flex-wrap items-center gap-2">
        <select
          value={months}
          onChange={(e) => setMonths(Number(e.target.value))}
          aria-label={t("Months to add")}
          className="rounded-xl bg-ink px-3 py-2 text-sm text-sand ring-1 ring-mist/20 focus:outline-none focus:ring-lemon/50"
        >
          {[1, 3, 6, 12].map((m) => (
            <option key={m} value={m}>
              {m === 1
                ? t("{{count}} month · {{price}}", { count: m, price: money(4900 * m) })
                : t("{{count}} months · {{price}}", { count: m, price: money(4900 * m) })}
            </option>
          ))}
        </select>
        <button
          type="button"
          disabled={pending}
          onClick={() => onPay(months)}
          className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/15 px-4 py-2 text-sm font-semibold text-emerald-300 ring-1 ring-emerald-400/30 transition hover:bg-emerald-500/25 disabled:opacity-40"
        >
          <Check className="size-4" aria-hidden="true" /> {t("Record payment")}
        </button>
        {church.status === "active" ? (
          <button
            type="button"
            disabled={pending}
            onClick={() => onStatus("inactive")}
            className="inline-flex items-center gap-1.5 rounded-full bg-amber-500/15 px-4 py-2 text-sm font-semibold text-amber-300 ring-1 ring-amber-400/30 transition hover:bg-amber-500/25 disabled:opacity-40"
          >
            <EyeOff className="size-4" aria-hidden="true" /> {t("Take off the map")}
          </button>
        ) : (
          <button
            type="button"
            disabled={pending}
            onClick={() => onStatus("active")}
            className="inline-flex items-center gap-1.5 rounded-full bg-lemon/15 px-4 py-2 text-sm font-semibold text-lemon ring-1 ring-lemon/30 transition hover:bg-lemon/25 disabled:opacity-40"
          >
            <Check className="size-4" aria-hidden="true" /> {t("Put on the map")}
          </button>
        )}
        <Link
          to="/church/$id"
          params={{ id: church.id }}
          className="rounded-full bg-ink-soft/60 px-4 py-2 text-sm font-semibold text-mist ring-1 ring-mist/20 transition hover:bg-ink-soft"
        >
          {t("Open page")}
        </Link>
      </div>

      {confirming ? (
        <div className="mt-4 rounded-2xl bg-rose/10 p-4 ring-1 ring-rose/30">
          <p className="text-sm text-sand">
            {t("Delete this church for good? Its page, posts links and payment records go with it.")}
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            <button
              type="button"
              disabled={pending}
              onClick={onDelete}
              className="rounded-full bg-rose/20 px-4 py-2 text-sm font-semibold text-rose ring-1 ring-rose/40 transition hover:bg-rose/30 disabled:opacity-40"
            >
              {t("Yes, delete it")}
            </button>
            <button
              type="button"
              onClick={() => setConfirming(false)}
              className="rounded-full bg-ink-soft/60 px-4 py-2 text-sm font-semibold text-mist ring-1 ring-mist/20 transition hover:bg-ink-soft"
            >
              {t("Keep it")}
            </button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setConfirming(true)}
          className="mt-3 inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-rose/80 transition hover:text-rose"
        >
          <Trash2 className="size-3.5" aria-hidden="true" /> {t("Delete church")}
        </button>
      )}

      {church.payments.length > 0 ? (
        <ul className="mt-4 space-y-1 border-t border-mist/10 pt-3 text-xs text-mist/70">
          {church.payments.map((p) => (
            <li key={p.id}>
              {new Date(p.createdAt).toLocaleDateString()} · {money(p.amountCents)} ·{" "}
              {p.isMock ? t("test checkout") : t("recorded by admin")}
            </li>
          ))}
        </ul>
      ) : null}
    </article>
  );
}

/** Send a real email reply to someone who left feedback, and show past replies. */
function FeedbackReply({
  email,
  replies,
  pending,
  onSend,
}: {
  email: string;
  replies: FeedbackReplyDTO[];
  pending: boolean;
  onSend: (subject: string, message: string) => Promise<{ sent: boolean; reason?: string }>;
}) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const [subject, setSubject] = useState("Thank you for your feedback");
  const [message, setMessage] = useState("");
  const [result, setResult] = useState<string | null>(null);

  if (!email) {
    return (
      <p className="mt-3 text-sm text-mist/60">
        {t("No email address was given, so this one can't be answered.")}
      </p>
    );
  }

  return (
    <div className="mt-4 border-t border-mist/15 pt-3">
      {replies.length > 0 ? (
        <ul className="mb-3 space-y-2">
          {replies.map((r) => (
            <li key={r.id} className="rounded-xl bg-ink/50 p-3 text-sm text-mist/75">
              <p className="text-xs text-mist/55">
                {new Date(r.createdAt).toLocaleString()} ·{" "}
                {r.delivered ? t("Sent") : t("Not sent")}
                {r.error ? ` · ${r.error}` : ""}
              </p>
              <p className="mt-1 font-semibold text-sand">{r.subject}</p>
              <p className="mt-1 whitespace-pre-wrap">{r.body}</p>
            </li>
          ))}
        </ul>
      ) : null}

      {open ? (
        <div className="space-y-2">
          <input
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            placeholder={t("Subject")}
            className="w-full rounded-xl bg-ink px-3 py-2 text-sm text-sand ring-1 ring-mist/20"
          />
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            rows={5}
            placeholder={t("Write your reply to {{email}}", { email })}
            className="w-full rounded-xl bg-ink px-3 py-2 text-sm text-sand ring-1 ring-mist/20"
          />
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              disabled={pending || !message.trim() || !subject.trim()}
              onClick={async () => {
                setResult(null);
                try {
                  const res = await onSend(subject.trim(), message.trim());
                  if (res.sent) {
                    setMessage("");
                    setOpen(false);
                    setResult(t("Reply sent to {{email}}.", { email }));
                  } else {
                    setResult(t("It couldn't be sent: {{reason}}", { reason: res.reason ?? "" }));
                  }
                } catch (e) {
                  setResult(e instanceof Error ? e.message : t("It couldn't be sent."));
                }
              }}
              className="rounded-full bg-ember px-4 py-2 text-sm font-semibold text-ink transition hover:opacity-90 disabled:opacity-50"
            >
              {pending ? t("Sending…") : t("Send reply")}
            </button>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="rounded-full px-3 py-2 text-sm text-mist/70 hover:text-sand"
            >
              {t("Cancel")}
            </button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="rounded-full bg-ink px-4 py-2 text-sm font-semibold text-sand ring-1 ring-mist/25 transition hover:bg-ink-soft"
        >
          {replies.length > 0 ? t("Reply again") : t("Reply by email")}
        </button>
      )}
      {result ? <p className="mt-2 text-sm text-mist/70">{result}</p> : null}
    </div>
  );
}

const recentIcons: Record<RecentItem["type"], typeof Church> = {
  ministry: HandHelping,
  need: HandHeart,
  prayer: Sparkles,
  room: MessageCircle,
  church: Church,
};

function StatsTab({
  data,
  loading,
  error,
}: {
  data:
    | {
        stats: { key: string; label: string; today: number; week: number; month: number; total: number }[];
        recent: RecentItem[];
      }
    | undefined;
  loading: boolean;
  error: boolean;
}) {
  const { t } = useTranslation();

  if (error) {
    return (
      <div className="rounded-2xl bg-ink-soft/40 p-6 text-center ring-1 ring-mist/15">
        <ShieldCheck className="mx-auto mb-3 size-8 text-lemon" aria-hidden="true" />
        <p className="text-base text-mist/80">{t("This page is only for site admins.")}</p>
      </div>
    );
  }

  if (loading || !data) {
    return <p className="text-mist/70">{t("Loading…")}</p>;
  }

  return (
    <div className="space-y-6">
      <section className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {data.stats.map((s) => (
          <article key={s.key} className="rounded-2xl bg-ink-soft/40 p-4 ring-1 ring-mist/15">
            <h2 className="font-display text-base font-semibold leading-tight">{t(s.label)}</h2>
            <p className="mt-2 font-display text-3xl font-semibold text-lemon">{s.total}</p>
            <dl className="mt-3 space-y-1 text-xs text-mist/80">
              <div className="flex justify-between gap-2">
                <dt>{t("Today")}</dt>
                <dd className="font-semibold text-sand">{s.today}</dd>
              </div>
              <div className="flex justify-between gap-2">
                <dt>{t("Last 7 days")}</dt>
                <dd className="font-semibold text-sand">{s.week}</dd>
              </div>
              <div className="flex justify-between gap-2">
                <dt>{t("Last 30 days")}</dt>
                <dd className="font-semibold text-sand">{s.month}</dd>
              </div>
            </dl>
          </article>
        ))}
      </section>

      <section>
        <h2 className="mb-3 font-display text-lg font-semibold">{t("Latest activity")}</h2>
        {data.recent.length === 0 ? (
          <p className="text-mist/70">{t("Nothing has been posted yet.")}</p>
        ) : (
          <ul className="space-y-2">
            {data.recent.map((item, i) => {
              const Icon = recentIcons[item.type] ?? MessageCircle;
              return (
                <li
                  key={`${item.type}-${item.at}-${i}`}
                  className="flex items-start gap-3 rounded-2xl bg-ink-soft/40 p-4 ring-1 ring-mist/15"
                >
                  <span className="mt-0.5 grid size-8 shrink-0 place-items-center rounded-full bg-ink text-lemon ring-1 ring-mist/20">
                    <Icon className="size-4" aria-hidden="true" />
                  </span>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-sand">{item.title}</p>
                    <p className="mt-0.5 text-xs text-mist/70">
                      {item.author} · {timeAgo(item.at)}
                    </p>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
}
