import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { ArrowLeft, Check, ShieldCheck, UserPlus, Users, X } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";

import {
  addChurchMember,
  decideChurchMember,
  listChurchBoard,
  listChurchMembers,
  removeChurchMember,
  setChurchPostStatus,
} from "@/lib/churches.functions";

export const Route = createFileRoute("/_authenticated/church-board/$id")({
  head: () => ({
    meta: [
      { title: "Church board — City Ministers" },
      {
        name: "description",
        content:
          "Approve the ministries and needs neighbors want listed at your church, and choose who can post without waiting.",
      },
      { property: "og:title", content: "Church board — City Ministers" },
      {
        property: "og:description",
        content: "Approve posts at your church and pick who can post any time.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: ChurchBoardPage,
});

function ChurchBoardPage() {
  const { t } = useTranslation();
  const { id } = Route.useParams();
  const qc = useQueryClient();
  const [tab, setTab] = useState<"waiting" | "people">("waiting");

  const fetchBoard = useServerFn(listChurchBoard);
  const fetchMembers = useServerFn(listChurchMembers);
  const decide = useServerFn(setChurchPostStatus);
  const trust = useServerFn(addChurchMember);
  const untrust = useServerFn(removeChurchMember);

  const board = useQuery({
    queryKey: ["church-board", id],
    queryFn: () => fetchBoard({ data: { churchId: id } }),
  });
  const members = useQuery({
    queryKey: ["church-members", id],
    queryFn: () => fetchMembers({ data: { churchId: id } }),
  });
  const decideMember = useServerFn(decideChurchMember);
  const attendees = useQuery({
    queryKey: ["church-attendees-pending", id],
    queryFn: () => fetchMembers({ data: { churchId: id, status: "pending" } }),
  });

  const refresh = () =>
    Promise.all([
      qc.invalidateQueries({ queryKey: ["church-board", id] }),
      qc.invalidateQueries({ queryKey: ["church-members", id] }),
      qc.invalidateQueries({ queryKey: ["church", id] }),
      qc.invalidateQueries({ queryKey: ["church-requests", id] }),
    ]);

  const decideMutation = useMutation({
    mutationFn: (input: { linkId: string; status: "approved" | "declined" }) =>
      decide({ data: input }),
    onSuccess: refresh,
  });
  const trustMutation = useMutation({
    mutationFn: (input: { linkId?: string; userId?: string }) =>
      trust({ data: { churchId: id, ...input } }),
    onSuccess: refresh,
  });
  const untrustMutation = useMutation({
    mutationFn: (memberId: string) => untrust({ data: { churchId: id, memberId } }),
    onSuccess: refresh,
  });

  const busy =
    decideMutation.isPending || trustMutation.isPending || untrustMutation.isPending;
  const blocked = board.isError
    ? t("This page is only for the church that owns this listing.")
    : null;
  const pending = board.data?.pending ?? [];
  const approved = board.data?.approved ?? [];

  return (
    <div className="flex min-h-dvh flex-col bg-ink font-body text-sand antialiased">
      <header className="border-b border-ink-soft bg-ink-soft/70">
        <div className="mx-auto flex w-full max-w-3xl items-center gap-3 px-4 py-4 sm:px-6">
          <Link
            to="/church/$id"
            params={{ id }}
            className="grid size-10 shrink-0 place-items-center rounded-full bg-ink text-lemon ring-1 ring-mist/20 transition hover:bg-ink-soft"
            aria-label={t("Back to the church page")}
          >
            <ArrowLeft className="size-4" aria-hidden="true" />
          </Link>
          <div>
            <h1 className="font-display text-lg font-semibold sm:text-xl">{t("Church board")}</h1>
            {board.data?.churchName ? (
              <p className="text-sm text-mist/70">{board.data.churchName}</p>
            ) : null}
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-6 sm:px-6 sm:py-10">
        {blocked ? (
          <div className="rounded-2xl bg-ink-soft/40 p-6 text-center ring-1 ring-mist/15">
            <ShieldCheck className="mx-auto mb-3 size-8 text-lemon" aria-hidden="true" />
            <p className="text-base text-mist/80">{blocked}</p>
          </div>
        ) : (
          <>
            <div className="mb-6 flex flex-wrap gap-2">
              {(["waiting", "people"] as const).map((tabKey) => (
                <button
                  key={tabKey}
                  type="button"
                  onClick={() => setTab(tabKey)}
                  className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                    tab === tabKey
                      ? "bg-lemon text-ink"
                      : "bg-ink-soft/50 text-mist ring-1 ring-mist/20 hover:bg-ink-soft"
                  }`}
                >
                  {tabKey === "waiting"
                    ? pending.length > 0
                      ? t("Waiting for you ({{count}})", { count: pending.length })
                      : t("Waiting for you")
                    : t("Who can post")}
                </button>
              ))}
            </div>

            {tab === "waiting" ? (
              <section className="space-y-6">
                <div className="space-y-3">
                  {board.isLoading ? (
                    <p className="text-mist/70">{t("Loading…")}</p>
                  ) : pending.length === 0 ? (
                    <p className="text-mist/70">{t("No one is waiting right now.")}</p>
                  ) : (
                    pending.map((p) => (
                      <article
                        key={p.linkId}
                        className="rounded-2xl bg-ink-soft/40 p-4 ring-1 ring-mist/15 sm:p-5"
                      >
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="rounded-full bg-lemon/15 px-2.5 py-1 text-xs font-semibold uppercase tracking-wide text-lemon ring-1 ring-lemon/30">
                            {p.kind === "ministry" ? t("Ministry") : t("Need")}
                          </span>
                          <h2 className="font-display text-lg font-semibold">{p.title}</h2>
                        </div>
                        <p className="mt-1 text-sm text-mist/70">
                          {p.posterName} · {[p.city, p.zip].filter(Boolean).join(" ") || t("No town")}
                        </p>
                        <p className="mt-3 text-sm leading-relaxed text-mist/80">{p.description}</p>
                        <div className="mt-4 flex flex-wrap gap-2">
                          <button
                            type="button"
                            disabled={busy}
                            onClick={() =>
                              decideMutation.mutate({ linkId: p.linkId, status: "approved" })
                            }
                            className="inline-flex items-center gap-1.5 rounded-full bg-tone-emerald/15 px-4 py-2 text-sm font-semibold text-tone-emerald ring-1 ring-tone-emerald/45 transition hover:bg-tone-emerald/25 disabled:opacity-40"
                          >
                            <Check className="size-4" aria-hidden="true" /> {t("Approve")}
                          </button>
                          <button
                            type="button"
                            disabled={busy}
                            onClick={() =>
                              decideMutation.mutate({ linkId: p.linkId, status: "declined" })
                            }
                            className="inline-flex items-center gap-1.5 rounded-full bg-ink px-4 py-2 text-sm font-semibold text-rose ring-1 ring-rose/35 transition hover:bg-rose/10 disabled:opacity-40"
                          >
                            <X className="size-4" aria-hidden="true" /> {t("Decline")}
                          </button>
                          <button
                            type="button"
                            disabled={busy}
                            onClick={() => trustMutation.mutate({ linkId: p.linkId })}
                            className="inline-flex items-center gap-1.5 rounded-full bg-lemon/15 px-4 py-2 text-sm font-semibold text-lemon ring-1 ring-lemon/30 transition hover:bg-lemon/25 disabled:opacity-40"
                          >
                            <UserPlus className="size-4" aria-hidden="true" /> {t("Always allow this person")}
                          </button>
                        </div>
                      </article>
                    ))
                  )}
                </div>

                <div className="space-y-3">
                  <h2 className="font-display text-lg font-semibold">{t("Already on your board")}</h2>
                  {approved.length === 0 ? (
                    <p className="text-mist/70">{t("Nothing is listed at your church yet.")}</p>
                  ) : (
                    approved.map((p) => (
                      <article
                        key={p.linkId}
                        className="flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-ink-soft/40 p-4 ring-1 ring-mist/15"
                      >
                        <div className="min-w-0">
                          <p className="font-heading text-base text-sand">{p.title}</p>
                          <p className="text-sm text-mist/70">
                            {p.kind === "ministry" ? t("Ministry") : t("Need")} · {p.posterName}
                          </p>
                        </div>
                        <button
                          type="button"
                          disabled={busy}
                          onClick={() =>
                            decideMutation.mutate({ linkId: p.linkId, status: "declined" })
                          }
                          className="rounded-full bg-ink px-4 py-2 text-sm font-semibold text-rose ring-1 ring-rose/35 transition hover:bg-rose/10 disabled:opacity-40"
                        >
                          {t("Take off the board")}
                        </button>
                      </article>
                    ))
                  )}
                </div>
              </section>
            ) : (
              <section className="space-y-3">
                <p className="text-sm text-mist/70">
                  {t("Posts from these people go straight onto your board. Everyone else waits for your approval.")}
                </p>
                {members.isLoading ? (
                  <p className="text-mist/70">{t("Loading…")}</p>
                ) : (members.data?.length ?? 0) === 0 ? (
                  <p className="text-mist/70">
                    {t("No one yet. Use “Always allow this person” on a request to add them.")}
                  </p>
                ) : (
                  members.data!.map((m) => (
                    <article
                      key={m.id}
                      className="flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-ink-soft/40 p-4 ring-1 ring-mist/15"
                    >
                      <div className="flex min-w-0 items-center gap-3">
                        {m.photoUrl ? (
                          <img
                            src={m.photoUrl}
                            alt={m.name}
                            className="size-10 rounded-full object-cover ring-1 ring-mist/20"
                          />
                        ) : (
                          <span className="grid size-10 place-items-center rounded-full bg-ink text-mist ring-1 ring-mist/20">
                            <Users className="size-4" aria-hidden="true" />
                          </span>
                        )}
                        <div className="min-w-0">
                          <p className="font-heading text-base text-sand">{m.name}</p>
                          <p className="text-sm text-mist/60">
                            {t("Trusted {{date}}", { date: new Date(m.createdAt).toLocaleDateString() })}
                          </p>
                        </div>
                      </div>
                      <button
                        type="button"
                        disabled={busy}
                        onClick={() => untrustMutation.mutate(m.id)}
                        className="rounded-full bg-ink px-4 py-2 text-sm font-semibold text-rose ring-1 ring-rose/35 transition hover:bg-rose/10 disabled:opacity-40"
                      >
                        {t("Remove")}
                      </button>
                    </article>
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
