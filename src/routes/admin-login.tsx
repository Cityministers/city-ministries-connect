import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { ArrowLeft, Loader2, ShieldCheck } from "lucide-react";
import { useState } from "react";

import { supabase } from "@/integrations/supabase/client";
import { amIAdmin } from "@/lib/moderation.functions";

export const Route = createFileRoute("/admin-login")({
  head: () => ({
    meta: [
      { title: "Admin sign in — City Ministers" },
      {
        name: "description",
        content:
          "Sign in with your City Ministers admin account to open the Review Center and approve or remove posted needs.",
      },
      { property: "og:title", content: "Admin sign in — City Ministers" },
      {
        property: "og:description",
        content: "Admin access to the City Ministers Review Center.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: AdminLoginPage,
});

function AdminLoginPage() {
  const navigate = useNavigate();
  const checkAdmin = useServerFn(amIAdmin);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });
      if (signInError) {
        setError(signInError.message);
        return;
      }
      const isAdmin = await checkAdmin();
      if (!isAdmin) {
        setError("This account does not have admin access.");
        return;
      }
      void navigate({ to: "/cms" });
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex min-h-dvh flex-col bg-ink font-body text-sand antialiased">
      <header className="border-b border-ink-soft bg-ink-soft/70">
        <div className="mx-auto flex w-full max-w-2xl items-center gap-3 px-4 py-4">
          <Link
            to="/"
            className="inline-flex items-center gap-2 rounded-xl border border-ink-soft px-3 py-2 text-sm text-mist hover:text-sand"
          >
            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
            Home
          </Link>
        </div>
      </header>

      <main className="mx-auto w-full max-w-md flex-1 px-4 py-10">
        <div className="mb-6 flex items-center gap-3">
          <span className="grid h-12 w-12 place-items-center rounded-2xl bg-ink-soft ring-1 ring-ink-soft">
            <ShieldCheck className="h-6 w-6 text-lemon" aria-hidden="true" />
          </span>
          <div>
            <h1 className="font-display text-2xl text-sand">Admin sign in</h1>
            <p className="text-sm text-mist">Opens the Review Center directly.</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="admin-email" className="mb-1 block text-sm text-mist">
              Email
            </label>
            <input
              id="admin-email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-xl border border-ink-soft bg-ink-soft/50 px-4 py-3 text-base text-sand outline-none focus:border-lemon/60"
            />
          </div>
          <div>
            <label htmlFor="admin-password" className="mb-1 block text-sm text-mist">
              Password
            </label>
            <input
              id="admin-password"
              type="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-xl border border-ink-soft bg-ink-soft/50 px-4 py-3 text-base text-sand outline-none focus:border-lemon/60"
            />
          </div>

          {error ? (
            <p role="alert" className="text-sm text-rose">
              {error}
            </p>
          ) : null}

          <button
            type="submit"
            disabled={busy}
            className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-lemon px-4 py-3 text-base font-semibold text-ink disabled:opacity-60"
          >
            {busy ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : null}
            Sign in to Review Center
          </button>
        </form>

        <p className="mt-6 text-sm text-mist">
          Not an admin?{" "}
          <Link to="/auth" search={{}} className="text-sand underline">
            Use the regular sign in
          </Link>
          .
        </p>
      </main>
    </div>
  );
}
