import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { ArrowLeft, Check, EyeOff, ShieldCheck, Trash2 } from "lucide-react";
import { useState } from "react";

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

export const Route = createFileRoute("/_authenticated/admin")({
  head: () => ({
    meta: [
      { title: "Review Center — City Ministers" },
      {
        name: "description",
        content:
          "Admin review center for City Ministers: approve or remove posted needs and work through abuse reports.",
      },
      { property: "og:title", content: "Review Center — City Ministers" },
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
  return (
    <span
      className={`rounded-full px-2.5 py-1 text-xs font-semibold uppercase tracking-wide ring-1 ${
        statusStyles[value] ?? "bg-mist/15 text-mist ring-mist/30"
      }`}
    >
      {value}
    </span>
  );
}

function AdminPage() {
  const [tab, setTab] = useState<"needs" | "churches" | "reports" | "feedback">("needs");
  const qc = useQueryClient();

  const fetchNeeds = useServerFn(adminListNeeds);
  const fetchReports = useServerFn(adminListReports);
  const setNeedStatus = useServerFn(adminSetNeedStatus);
  const updateReport = useServerFn(adminUpdateReport);
  const fetchFeedback = useServerFn(adminListFeedback);

  const needs = useQuery({ queryKey: ["admin", "needs"], queryFn: () => fetchNeeds() });
  const reports = useQuery({ queryKey: ["admin", "reports"], queryFn: () => fetchReports() });
  const feedback = useQuery({ queryKey: ["admin", "feedback"], queryFn: () => fetchFeedback() });

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
      ? "This page is only for site admins."
      : null;

  return (
    <div className="flex min-h-dvh flex-col bg-ink font-body text-sand antialiased">
      <header className="border-b border-ink-soft bg-ink-soft/70">
        <div className="mx-auto flex w-full max-w-4xl items-center gap-3 px-4 py-4 sm:px-6">
          <Link
            to="/map"
            className="grid size-10 shrink-0 place-items-center rounded-full bg-ink text-lemon ring-1 ring-mist/20 transition hover:bg-ink-soft"
            aria-label="Back to map"
          >
            <ArrowLeft className="size-4" aria-hidden="true" />
          </Link>
          <h1 className="font-display text-lg font-semibold sm:text-xl">Review Center</h1>
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
              {(["needs", "churches", "reports", "feedback"] as const).map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setTab(t)}
                  className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                    tab === t
                      ? "bg-lemon text-ink"
                      : "bg-ink-soft/50 text-mist ring-1 ring-mist/20 hover:bg-ink-soft"
                  }`}
                >
                  {t === "needs"
                    ? "Posted needs"
                    : t === "churches"
                      ? "Churches"
                      : t === "reports"
                        ? "Abuse reports"
                        : "Feedback"}
                  {t === "reports" && (reports.data?.filter((r) => r.status === "new").length ?? 0) > 0
                    ? ` (${reports.data?.filter((r) => r.status === "new").length})`
                    : ""}
                </button>
              ))}
            </div>

            {tab === "needs" ? (
              <section className="space-y-3">
                {needs.isLoading ? (
                  <p className="text-mist/70">Loading…</p>
                ) : (needs.data?.length ?? 0) === 0 ? (
                  <p className="text-mist/70">No needs have been posted yet.</p>
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
                            {n.reportCount} report{n.reportCount === 1 ? "" : "s"}
                          </span>
                        ) : null}
                      </div>
                      <p className="mt-1 text-sm text-mist/70">
                        {n.posterName} · {[n.city, n.zip].filter(Boolean).join(" ") || "No location"} ·{" "}
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
                          <Check className="size-4" aria-hidden="true" /> Approve
                        </button>
                        <button
                          type="button"
                          disabled={needMutation.isPending || n.status === "hidden"}
                          onClick={() => needMutation.mutate({ id: n.id, status: "hidden" })}
                          className="inline-flex items-center gap-1.5 rounded-full bg-amber-500/15 px-4 py-2 text-sm font-semibold text-amber-300 ring-1 ring-amber-400/30 transition hover:bg-amber-500/25 disabled:opacity-40"
                        >
                          <EyeOff className="size-4" aria-hidden="true" /> Hide
                        </button>
                        <button
                          type="button"
                          disabled={needMutation.isPending || n.status === "removed"}
                          onClick={() => needMutation.mutate({ id: n.id, status: "removed" })}
                          className="inline-flex items-center gap-1.5 rounded-full bg-rose/15 px-4 py-2 text-sm font-semibold text-rose ring-1 ring-rose/30 transition hover:bg-rose/25 disabled:opacity-40"
                        >
                          <Trash2 className="size-4" aria-hidden="true" /> Remove
                        </button>
                      </div>
                    </article>
                  ))
                )}
              </section>
            ) : tab === "feedback" ? (
              <section className="space-y-3">
                {feedback.isLoading ? (
                  <p className="text-mist/70">Loading…</p>
                ) : (feedback.data?.length ?? 0) === 0 ? (
                  <p className="text-mist/70">No feedback has been sent yet.</p>
                ) : (
                  feedback.data!.map((f) => (
                    <article
                      key={f.id}
                      className="rounded-2xl bg-ink-soft/40 p-4 ring-1 ring-mist/15 sm:p-5"
                    >
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="rounded-full bg-lemon/15 px-2.5 py-1 text-xs font-semibold text-lemon ring-1 ring-lemon/30">
                          {f.overall}/5 overall
                        </span>
                        <span className="text-sm text-mist/70">
                          {new Date(f.createdAt).toLocaleString()}
                        </span>
                      </div>
                      <p className="mt-2 text-sm text-mist/70">
                        Ease {f.ease ?? "—"}/5 · Look {f.design ?? "—"}/5 · Speed {f.speed ?? "—"}/5
                        {f.email ? ` · ${f.email}` : ""}
                      </p>
                      {f.likes ? (
                        <p className="mt-3 text-sm leading-relaxed text-mist/80">
                          <span className="font-semibold text-sand">Likes: </span>
                          {f.likes}
                        </p>
                      ) : null}
                      {f.changes ? (
                        <p className="mt-2 text-sm leading-relaxed text-mist/80">
                          <span className="font-semibold text-sand">Would change: </span>
                          {f.changes}
                        </p>
                      ) : null}
                      {f.additions ? (
                        <p className="mt-2 text-sm leading-relaxed text-mist/80">
                          <span className="font-semibold text-sand">Should add: </span>
                          {f.additions}
                        </p>
                      ) : null}
                    </article>
                  ))
                )}
              </section>
            ) : (
              <section className="space-y-3">
                {reports.isLoading ? (
                  <p className="text-mist/70">Loading…</p>
                ) : (reports.data?.length ?? 0) === 0 ? (
                  <p className="text-mist/70">No reports yet. That's good news.</p>
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
          aria-label="Report status"
        >
          <option value="new">New</option>
          <option value="reviewing">Reviewing</option>
          <option value="resolved">Resolved</option>
          <option value="dismissed">Dismissed</option>
        </select>
        <input
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Note for the person who reported this"
          className="rounded-xl bg-ink px-3 py-2 text-sm text-sand ring-1 ring-mist/20 placeholder:text-mist/50 focus:outline-none focus:ring-lemon/50"
        />
        <button
          type="button"
          disabled={pending}
          onClick={() => onSave(status, notes)}
          className="rounded-full bg-lemon px-4 py-2 text-sm font-semibold text-ink transition hover:bg-lemon/90 disabled:opacity-50"
        >
          Save
        </button>
      </div>
    </article>
  );
}
