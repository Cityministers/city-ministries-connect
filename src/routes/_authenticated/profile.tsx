import { useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import {
  ArrowLeft,
  Bell,
  Camera,
  Heart,
  Loader2,
  LogOut,
  Pencil,
  QrCode,
  ShieldCheck,
  TriangleAlert,
} from "lucide-react";
import { useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { supabase } from "@/integrations/supabase/client";
import { ChurchCodeCards } from "@/components/profile/ChurchQrTab";
import { FavoritesTab } from "@/components/profile/FavoritesTab";
import { MailboxTab } from "@/components/profile/MailboxTab";
import { GiftRepliesTab } from "@/components/profile/GiftRepliesTab";
import { MyPostsTab } from "@/components/profile/MyPostsTab";
import { NotificationsTab } from "@/components/profile/NotificationsTab";
import { amIAdmin } from "@/lib/moderation.functions";
import {
  getUnreadCount,
  listMyNotifications,
} from "@/lib/notifications.functions";
import {
  deleteMyAccount,
  getMyProfile,
  updateMyProfile,
} from "@/lib/profile.functions";

const TABS = [
  { key: "mailbox", label: "Inbox" },
  { key: "posts", label: "Posts" },
  { key: "favorites", label: "Saved" },
  { key: "gifts", label: "Gifts" },
  { key: "account", label: "Account" },
] as const;

type TabKey = (typeof TABS)[number]["key"] | "notifications" | "qr";

export const Route = createFileRoute("/_authenticated/profile")({
  validateSearch: (search: Record<string, unknown>): { tab: TabKey } => {
    const raw = String(search["tab"] ?? "notifications");
    if (raw === "notifications") return { tab: "notifications" };
    if (raw === "qr") return { tab: "qr" };
    const match = TABS.find((t) => t.key === raw);
    return { tab: match ? match.key : "notifications" };
  },
  head: () => ({
    meta: [
      { title: "Your profile — City Ministers" },
      {
        name: "description",
        content: "Manage your City Ministers profile, photo, and account.",
      },
      { property: "og:title", content: "Your profile — City Ministers" },
      {
        property: "og:description",
        content: "Manage your City Ministers profile, photo, and account.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  loader: async ({ context }) => {
    await context.queryClient.ensureQueryData({
      queryKey: ["my-notifications"],
      queryFn: () => listMyNotifications(),
    });
  },
  component: ProfilePage,
});

function ProfilePage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { tab } = Route.useSearch();
  const queryClient = useQueryClient();
  const fetchProfile = useServerFn(getMyProfile);
  const saveProfile = useServerFn(updateMyProfile);
  const removeAccount = useServerFn(deleteMyAccount);
  const fileRef = useRef<HTMLInputElement>(null);

  const { data: profile, refetch } = useQuery({
    queryKey: ["my-profile"],
    queryFn: () => fetchProfile(),
  });

  const checkAdmin = useServerFn(amIAdmin);
  const isAdmin = useQuery({ queryKey: ["am-i-admin"], queryFn: () => checkAdmin() });

  const fetchUnread = useServerFn(getUnreadCount);
  const unreadQuery = useQuery({ queryKey: ["unread-count"], queryFn: () => fetchUnread() });
  const unread = unreadQuery.data?.unread ?? 0;


  const [name, setName] = useState<string | null>(null);
  const [editing, setEditing] = useState(false);
  const [busy, setBusy] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmText, setConfirmText] = useState("");
  const [deleting, setDeleting] = useState(false);

  const displayName = name ?? profile?.displayName ?? "";

  async function uploadPhoto(file: File) {
    setError(null);
    setBusy(true);
    try {
      const { data: userData } = await supabase.auth.getUser();
      const uid = userData.user?.id;
      if (!uid) throw new Error("Please sign in again.");
      const ext = file.name.split(".").pop()?.toLowerCase() ?? "jpg";
      const path = `${uid}/profile-${Date.now()}.${ext}`;
      const { error: upErr } = await supabase.storage
        .from("ministry-avatars")
        .upload(path, file, { upsert: true });
      if (upErr) throw new Error(upErr.message);
      await saveProfile({ data: { avatarPath: path } });
      await refetch();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setBusy(false);
    }
  }

  async function handleSaveName(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSaved(false);
    setBusy(true);
    try {
      await saveProfile({ data: { displayName: displayName.trim() } });
      setName(null);
      await refetch();
      setSaved(true);
      setEditing(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setBusy(false);
    }
  }

  async function handleSignOut() {
    await queryClient.cancelQueries();
    queryClient.clear();
    await supabase.auth.signOut();
    void navigate({ to: "/auth", replace: true });
  }

  async function handleDelete() {
    if (confirmText.trim().toUpperCase() !== "DELETE") return;
    setError(null);
    setDeleting(true);
    try {
      await removeAccount({});
      await queryClient.cancelQueries();
      queryClient.clear();
      await supabase.auth.signOut();
      void navigate({ to: "/", replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
      setDeleting(false);
    }
  }

  return (
    <div className="flex min-h-dvh flex-col bg-ink font-body text-sand antialiased">
      <header className="border-b border-ink-soft bg-ink-soft/70">
        <div className="mx-auto flex w-full max-w-lg items-center gap-3 px-4 py-4">
          <Link
            to="/map"
            className="grid size-10 shrink-0 place-items-center rounded-full bg-ink text-lemon ring-1 ring-mist/20 transition hover:bg-ink-soft"
            aria-label={t("Back to map")}
          >
            <ArrowLeft className="size-4" aria-hidden="true" />
          </Link>
          <h1 className="font-display text-xl font-semibold leading-tight sm:text-2xl">
            {t("Your profile")}
          </h1>
        </div>
      </header>

        <main className="mx-auto flex w-full max-w-lg flex-1 flex-col gap-5 px-4 py-6 sm:py-8">
        {!profile ? (
          <p className="py-16 text-center text-base text-mist/60">{t("Loading…")}</p>
        ) : (
          <>
            {/* Identity card */}
            <section className="rounded-2xl bg-ink-soft/60 p-4 ring-1 ring-mist/15">
              <div className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setEditing(true);
                    fileRef.current?.click();
                  }}
                  aria-label={t("Change your profile photo")}
                  className="relative grid size-16 shrink-0 place-items-center overflow-hidden rounded-full bg-ink text-mist/60 ring-1 ring-mist/25 transition hover:ring-lemon/60"
                >
                  {profile.avatarUrl ? (
                    <img
                      src={profile.avatarUrl}
                      alt={t("Your profile")}
                      className="size-full object-cover"
                    />
                  ) : (
                    <Camera className="size-7" aria-hidden="true" />
                  )}
                  <span className="absolute inset-x-0 bottom-0 grid place-items-center bg-ink/75 py-0.5">
                    <Camera className="size-3.5 text-sand" aria-hidden="true" />
                  </span>
                </button>

                <div className="min-w-0">
                  <p className="truncate font-display text-xl font-semibold text-sand">
                    {profile.displayName || t("Your name")}
                  </p>
                  <p className="truncate text-base text-mist/60">{profile.email}</p>
                </div>
                {!editing && (
                  <button
                    type="button"
                    onClick={() => setEditing(true)}
                    className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-ink px-4 py-2.5 text-base font-semibold text-sand ring-1 ring-mist/25 transition hover:bg-ink/70"
                  >
                    <Pencil className="size-4" aria-hidden="true" />
                    {t("Edit")}
                  </button>
                )}
              </div>

              {editing && (
                <form
                  className="mt-4 flex flex-col gap-3 border-t border-mist/15 pt-4"
                  onSubmit={(e) => void handleSaveName(e)}
                >
                  <label className="flex flex-col gap-2 text-base text-mist/80">
                    {t("Display name")}
                    <input
                      className="rounded-xl bg-ink px-4 py-3.5 text-lg text-sand ring-1 ring-mist/20 focus:outline-none focus:ring-lemon/50"
                      value={displayName}
                      onChange={(e) => setName(e.target.value)}
                      maxLength={60}
                      placeholder={t("How neighbors see you")}
                    />
                  </label>
                  <button
                    type="button"
                    onClick={() => fileRef.current?.click()}
                    disabled={busy}
                    className="inline-flex items-center justify-center gap-2 rounded-full bg-ink px-4 py-3 text-base font-semibold text-lemon ring-1 ring-mist/25 transition hover:bg-ink/70"
                  >
                    <Camera className="size-5" aria-hidden="true" />
                    {t("Change photo")}
                  </button>
                  <div className="flex gap-3">
                    <button
                      type="submit"
                      disabled={busy}
                      className="inline-flex flex-1 items-center justify-center gap-2 rounded-full bg-lemon px-5 py-3 text-lg font-semibold text-ink transition hover:opacity-90 disabled:opacity-60"
                    >
                      {busy && <Loader2 className="size-5 animate-spin" aria-hidden="true" />}
                      {saved ? t("Saved") : t("Save")}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setName(null);
                        setEditing(false);
                        setError(null);
                      }}
                      className="inline-flex flex-1 items-center justify-center rounded-full bg-ink px-5 py-3 text-lg font-semibold text-sand ring-1 ring-mist/25 transition hover:bg-ink/70"
                    >
                      {t("Cancel")}
                    </button>
                  </div>
                </form>
              )}

              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) void uploadPhoto(f);
                }}
              />
            </section>

            {error && (
              <p className="rounded-lg bg-rose/15 px-3 py-2.5 text-base text-rose ring-1 ring-rose/30">
                {error}
              </p>
            )}

            {/* Church scan codes */}
            <Link
              to="/profile"
              search={{ tab: "qr" }}
              className={`flex items-center justify-center gap-3 rounded-2xl px-5 py-4 text-xl font-bold transition ${
                tab === "qr"
                  ? "bg-lemon text-ink"
                  : "bg-ink-soft text-sand ring-1 ring-mist/20 hover:bg-ink-soft/70"
              }`}
            >
              <QrCode className="size-6" aria-hidden="true" />
              {t("My church code")}
            </Link>

            {/* Notifications */}
            <Link
              to="/profile"
              search={{ tab: "notifications" }}
              className={`flex items-center justify-center gap-3 rounded-2xl px-5 py-4 text-xl font-bold transition ${
                tab === "notifications"
                  ? "bg-lemon text-ink"
                  : "bg-ink-soft text-sand ring-1 ring-mist/20 hover:bg-ink-soft/70"
              }`}
            >
              <Bell className="size-6" aria-hidden="true" />
              {t("Notifications")}
              {unread > 0 && (
                <span className="grid min-w-8 place-items-center rounded-full bg-rose px-2 py-0.5 text-base font-bold text-white">
                  {unread > 99 ? "99+" : unread}
                </span>
              )}
            </Link>

            {/* Tabs */}
            <nav
              className="-mt-1 grid grid-cols-5 border-b border-mist/15"
              aria-label={t("Profile sections")}
            >
              {TABS.map((t) => (
                <Link
                  key={t.key}
                  to="/profile"
                  search={{ tab: t.key }}
                  className={`-mb-px border-b-2 px-1 py-3 text-center text-base font-semibold transition ${
                    tab === t.key
                      ? "border-lemon text-lemon"
                      : "border-transparent text-mist/60 hover:text-sand"
                  }`}
                >
                  {t.label}
                </Link>
              ))}
            </nav>

            {tab === "posts" && <MyPostsTab />}
            {tab === "mailbox" && <MailboxTab />}
            {tab === "favorites" && <FavoritesTab />}
            {tab === "gifts" && <GiftRepliesTab />}
            {tab === "notifications" && <NotificationsTab />}
            {tab === "qr" && <ChurchQrTab />}

            {tab === "account" && (
              <>
            {/* Donate + sign out */}
            <div className="flex flex-col gap-3">
              {isAdmin.data ? (
                <Link
                  to="/admin"
                  className="inline-flex items-center justify-center gap-2 rounded-full bg-lemon px-5 py-3 text-base font-semibold text-ink transition hover:bg-lemon/90"
                >
                  <ShieldCheck className="size-4" aria-hidden="true" />
                  {t("Review Center")}
                </Link>
              ) : null}

              <Link
                to="/donate"
                className="group relative inline-flex items-center justify-center gap-2 overflow-hidden rounded-2xl px-5 py-3 text-base font-semibold text-sand transition active:scale-[0.98]"
              >
                <div className="absolute inset-0 bg-gradient-to-tr from-emerald-dark via-emerald to-emerald-light" />
                <div className="absolute inset-0 bg-gradient-to-b from-white/10 to-transparent pointer-events-none" />
                <div className="absolute inset-0 rounded-2xl shadow-[inset_0_0_12px_rgba(255,255,255,0.2)]" />
                <div className="absolute -inset-1 bg-emerald-light opacity-20 blur-xl transition-opacity group-hover:opacity-40" />
                <Heart className="relative z-10 size-4" aria-hidden="true" />
                <span className="relative z-10">{t("Donate")}</span>
              </Link>
              <button
                type="button"
                onClick={() => void handleSignOut()}
                className="inline-flex items-center justify-center gap-2 rounded-full bg-ink-soft px-5 py-3 text-base font-semibold text-sand ring-1 ring-mist/25 transition hover:bg-ink-soft/70"
              >
                <LogOut className="size-4" aria-hidden="true" />
                {t("Sign out")}
              </button>
            </div>

            {/* Delete account */}
            <div className="mt-4 flex flex-col gap-3 rounded-2xl bg-rose/10 p-4 ring-1 ring-rose/30">
              <div className="flex items-center gap-2">
                <TriangleAlert className="size-6 text-rose" aria-hidden="true" />
                <h2 className="font-display text-xl font-semibold text-rose">
                  {t("Delete account")}
                </h2>
              </div>
              <p className="text-base leading-relaxed text-mist/75">
                {t("This permanently removes your account, your ministries, needs, and profile. This can't be undone. Type DELETE to confirm.")}
              </p>
              <input
                className="rounded-xl bg-ink px-4 py-3.5 text-lg text-sand ring-1 ring-rose/30 focus:outline-none focus:ring-rose/60"
                value={confirmText}
                onChange={(e) => setConfirmText(e.target.value)}
                placeholder={t("Type DELETE")}
                aria-label={t("Type DELETE to confirm account deletion")}
              />
              <button
                type="button"
                disabled={deleting || confirmText.trim().toUpperCase() !== "DELETE"}
                onClick={() => void handleDelete()}
                className="inline-flex items-center justify-center gap-2 rounded-full bg-rose px-5 py-3 text-lg font-semibold text-white transition hover:bg-rose/90 disabled:opacity-50"
              >
                {deleting && <Loader2 className="size-5 animate-spin" aria-hidden="true" />}
                {t("Permanently delete my account")}
              </button>
            </div>
              </>
            )}
          </>
        )}
      </main>
    </div>
  );
}
