import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { ArrowLeft, Search, ShieldAlert } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";

import {
  listReportTargets,
  submitAbuseReport,
  trackAbuseReport,
  type TrackedReport,
} from "@/lib/moderation.functions";

export const Route = createFileRoute("/report-abuse")({
  head: () => ({
    meta: [
      { title: "Report Abuse — City Ministers" },
      {
        name: "description",
        content:
          "Report inappropriate content or behavior on City Ministers and track the response with your report code.",
      },
      { property: "og:title", content: "Report Abuse — City Ministers" },
      {
        property: "og:description",
        content:
          "Report a ministry, need, message, or member on City Ministers. Every report gets a tracking code.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: ReportAbusePage,
});

const reasons = [
  "Spam or misleading content",
  "Harassment or harmful behavior",
  "Inappropriate content",
  "Fraud or scam",
  "Safety concern",
  "Something else",
];

const statusCopy: Record<string, string> = {
  new: "Received — waiting for review",
  reviewing: "A reviewer is looking into it",
  resolved: "Reviewed and acted on",
  dismissed: "Reviewed — no action needed",
};

function ReportAbusePage() {
  const { t } = useTranslation();
  const send = useServerFn(submitAbuseReport);
  const track = useServerFn(trackAbuseReport);

  const targets = useQuery({
    queryKey: ["report-targets"],
    queryFn: () => listReportTargets(),
  });

  const [reason, setReason] = useState("");
  const [target, setTarget] = useState("");
  const [email, setEmail] = useState("");
  const [details, setDetails] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [code, setCode] = useState<string | null>(null);

  const [lookup, setLookup] = useState("");
  const [looking, setLooking] = useState(false);
  const [tracked, setTracked] = useState<TrackedReport | null>(null);
  const [trackError, setTrackError] = useState("");

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setBusy(true);
    try {
      const [targetType, targetId] = target ? target.split(":") : ["other", ""];
      const res = await send({
        data: {
          reason,
          details,
          email,
          targetType: targetType as "need" | "ministry" | "other",
          targetId: targetId || null,
        },
      });
      setCode(res.trackingCode);
      setReason("");
      setTarget("");
      setEmail("");
      setDetails("");
    } catch (err) {
      setError(err instanceof Error ? err.message : t("Something went wrong. Please try again."));
    } finally {
      setBusy(false);
    }
  }

  async function onTrack(e: React.FormEvent) {
    e.preventDefault();
    setTrackError("");
    setTracked(null);
    setLooking(true);
    try {
      const res = await track({ data: { code: lookup } });
      if (!res) setTrackError(t("We couldn't find a report with that code."));
      else setTracked(res);
    } catch {
      setTrackError(t("We couldn't check that code right now. Please try again."));
    } finally {
      setLooking(false);
    }
  }

  return (
    <div className="flex min-h-dvh flex-col bg-ink font-body text-sand antialiased">
      <header className="border-b border-ink-soft bg-ink-soft/70">
        <div className="mx-auto flex w-full max-w-3xl items-center gap-3 px-4 py-4 sm:px-6">
          <Link
            to="/map"
            className="grid size-10 shrink-0 place-items-center rounded-full bg-ink text-lemon ring-1 ring-mist/20 transition hover:bg-ink-soft"
            aria-label={t("Back to map")}
          >
            <ArrowLeft className="size-4" aria-hidden="true" />
          </Link>
          <h1 className="font-display text-lg font-semibold sm:text-xl">{t("Report Abuse")}</h1>
        </div>
      </header>

      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-8 sm:px-6 sm:py-12">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 grid size-16 place-items-center rounded-2xl bg-rose/10 text-rose ring-1 ring-rose/30">
            <ShieldAlert className="size-8" aria-hidden="true" />
          </div>
          <h2 className="font-display text-2xl font-semibold sm:text-3xl">{t("Keep our community safe")}</h2>
          <p className="mt-3 text-base text-mist/80 sm:text-lg">
            {t("Tell us what happened. If you point to a specific need or ministry, it is hidden from the map right away while a reviewer looks at it.")}
          </p>
        </div>

        {code ? (
          <div className="rounded-2xl bg-ink-soft/40 p-6 text-center ring-1 ring-mist/15">
            <ShieldAlert className="mx-auto mb-3 size-8 text-lemon" aria-hidden="true" />
            <h3 className="font-display text-lg font-semibold">{t("Report received")}</h3>
            <p className="mt-2 text-sm text-mist/70">
              {t("Save this code to check the response later.")}
            </p>
            <p className="mt-3 font-mono text-2xl font-semibold text-lemon">{code}</p>
            <button
              type="button"
              onClick={() => setCode(null)}
              className="mt-5 inline-flex items-center justify-center rounded-full bg-lemon px-5 py-2 text-sm font-semibold text-ink transition hover:bg-lemon/90"
            >
              {t("Submit another report")}
            </button>
          </div>
        ) : (
          <form className="space-y-4" onSubmit={onSubmit}>
            <div>
              <label htmlFor="reason" className="mb-1.5 block text-sm font-medium text-sand">
                {t("Reason")}
              </label>
              <select
                id="reason"
                required
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                className="w-full rounded-xl bg-ink px-4 py-3 text-base text-sand ring-1 ring-mist/20 focus:outline-none focus:ring-lemon/50"
              >
                <option value="">{t("Select a reason")}</option>
                {reasons.map((r) => (
                  <option key={r} value={r}>
                    {t(r)}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="target" className="mb-1.5 block text-sm font-medium text-sand">
                {t("What are you reporting?")} <span className="text-mist/60">{t("(optional)")}</span>
              </label>
              <select
                id="target"
                value={target}
                onChange={(e) => setTarget(e.target.value)}
                className="w-full rounded-xl bg-ink px-4 py-3 text-base text-sand ring-1 ring-mist/20 focus:outline-none focus:ring-lemon/50"
              >
                <option value="">{t("Not about a specific post")}</option>
                {(targets.data ?? []).map((tg) => (
                  <option key={`${tg.type}:${tg.id}`} value={`${tg.type}:${tg.id}`}>
                    {t(tg.label)}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="email" className="mb-1.5 block text-sm font-medium text-sand">
                {t("Your email")} <span className="text-mist/60">{t("(optional, so we can reply)")}</span>
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-xl bg-ink px-4 py-3 text-base text-sand ring-1 ring-mist/20 placeholder:text-mist/50 focus:outline-none focus:ring-lemon/50"
                placeholder="you@example.com"
              />
            </div>

            <div>
              <label htmlFor="details" className="mb-1.5 block text-sm font-medium text-sand">
                {t("Details")}
              </label>
              <textarea
                id="details"
                rows={5}
                required
                value={details}
                onChange={(e) => setDetails(e.target.value)}
                className="w-full rounded-xl bg-ink px-4 py-3 text-base text-sand ring-1 ring-mist/20 placeholder:text-mist/50 focus:outline-none focus:ring-lemon/50"
                placeholder={t("Describe what happened. Include names or places if you know them.")}
              />
            </div>

            {error ? <p className="text-sm text-rose">{error}</p> : null}

            <button
              type="submit"
              disabled={busy}
              className="w-full rounded-full bg-rose px-6 py-3 text-base font-semibold text-white transition hover:bg-rose/90 disabled:opacity-60"
            >
              {busy ? t("Sending…") : t("Submit report")}
            </button>
          </form>
        )}

        <section className="mt-12 rounded-2xl bg-ink-soft/40 p-5 ring-1 ring-mist/15 sm:p-6">
          <h3 className="font-display text-xl font-semibold">{t("Check on a report")}</h3>
          <p className="mt-1 text-sm text-mist/70">
            {t("Enter the code you were given to see where your report stands.")}
          </p>
          <form className="mt-4 flex gap-2" onSubmit={onTrack}>
            <input
              value={lookup}
              onChange={(e) => setLookup(e.target.value)}
              required
              placeholder={t("CM-XXXXXX")}
              className="min-w-0 flex-1 rounded-xl bg-ink px-4 py-3 text-base uppercase text-sand ring-1 ring-mist/20 placeholder:text-mist/50 focus:outline-none focus:ring-lemon/50"
              aria-label={t("Report code")}
            />
            <button
              type="submit"
              disabled={looking}
              className="inline-flex items-center gap-1.5 rounded-full bg-lemon px-5 py-3 text-sm font-semibold text-ink transition hover:bg-lemon/90 disabled:opacity-60"
            >
              <Search className="size-4" aria-hidden="true" /> {t("Check")}
            </button>
          </form>

          {trackError ? <p className="mt-3 text-sm text-rose">{trackError}</p> : null}

          {tracked ? (
            <div className="mt-4 rounded-xl bg-ink p-4 ring-1 ring-mist/15">
              <p className="font-mono text-sm text-lemon">{tracked.trackingCode}</p>
              <p className="mt-2 font-display text-lg font-semibold">
                {statusCopy[tracked.status] ? t(statusCopy[tracked.status]) : tracked.status}
              </p>
              <p className="mt-1 text-sm text-mist/70">
                {t("Reported for {{reason}} on {{createdDate}} · last update {{updatedDate}}", {
                  reason: tracked.reason,
                  createdDate: new Date(tracked.createdAt).toLocaleDateString(),
                  updatedDate: new Date(tracked.updatedAt).toLocaleDateString(),
                })}
              </p>
              {tracked.adminNotes ? (
                <p className="mt-3 text-sm leading-relaxed text-mist/80">{t(tracked.adminNotes)}</p>
              ) : null}
            </div>
          ) : null}
        </section>
      </main>
    </div>
  );
}
