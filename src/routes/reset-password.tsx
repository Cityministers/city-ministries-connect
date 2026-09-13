import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { ArrowLeft, Loader2 } from "lucide-react";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/reset-password")({
  head: () => ({
    meta: [
      { title: "Choose a new password — City Ministers" },
      {
        name: "description",
        content:
          "Set a new password for your City Ministers account so you can get back to serving your neighbors.",
      },
      { property: "og:title", content: "Choose a new password — City Ministers" },
      {
        property: "og:description",
        content: "Set a new password for your City Ministers account.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: ResetPasswordPage,
});

function ResetPasswordPage() {
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (password.length < 6) {
      setError("Use at least 6 characters.");
      return;
    }
    if (password !== confirm) {
      setError("The two passwords don't match.");
      return;
    }
    setBusy(true);
    try {
      const { error: updateError } = await supabase.auth.updateUser({ password });
      if (updateError) throw updateError;
      setDone(true);
      setTimeout(() => void navigate({ to: "/profile", search: { tab: "account" } }), 1200);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "That link may have expired. Ask for a new email and try again.",
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex min-h-dvh flex-col bg-ink font-body text-sand antialiased">
      <header className="border-b border-ink-soft bg-ink-soft/70">
        <div className="mx-auto flex w-full max-w-md items-center gap-3 px-4 py-4">
          <Link
            to="/map"
            className="grid size-10 shrink-0 place-items-center rounded-full bg-ink text-lemon ring-1 ring-mist/20 transition hover:bg-ink-soft"
            aria-label="Back to map"
          >
            <ArrowLeft className="size-4" aria-hidden="true" />
          </Link>
          <h1 className="font-display text-lg font-semibold sm:text-xl">
            Choose a new password
          </h1>
        </div>
      </header>

      <main className="mx-auto w-full max-w-md flex-1 px-4 py-8">
        {done ? (
          <p className="rounded-xl bg-lemon/10 px-4 py-3 text-sm text-lemon ring-1 ring-lemon/30">
            Your password is updated. Taking you to your profile…
          </p>
        ) : (
          <form className="flex flex-col gap-3" onSubmit={(e) => void handleSubmit(e)}>
            <p className="mb-1 text-sm text-mist/70">
              Open this page from the email link, then pick a new password.
            </p>
            <label className="flex flex-col gap-1.5 text-xs text-mist/70">
              New password
              <input
                className="rounded-xl bg-ink-soft px-4 py-3 text-sm text-sand ring-1 ring-mist/20 focus:outline-none focus:ring-lemon/50"
                type="password"
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="new-password"
              />
            </label>
            <label className="flex flex-col gap-1.5 text-xs text-mist/70">
              Confirm new password
              <input
                className="rounded-xl bg-ink-soft px-4 py-3 text-sm text-sand ring-1 ring-mist/20 focus:outline-none focus:ring-lemon/50"
                type="password"
                required
                minLength={6}
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                autoComplete="new-password"
              />
            </label>

            {error && (
              <p className="rounded-lg bg-rose/15 px-3 py-2 text-xs text-rose ring-1 ring-rose/30">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={busy}
              className="mt-1 inline-flex items-center justify-center gap-2 rounded-full bg-lemon px-6 py-3 text-base font-semibold text-ink transition-transform hover:-translate-y-0.5 disabled:opacity-60"
            >
              {busy && <Loader2 className="size-4 animate-spin" aria-hidden="true" />}
              Save new password
            </button>
          </form>
        )}
      </main>
    </div>
  );
}
