import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { ArrowLeft, Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { BrandLogo } from "@/components/BrandLogo";
import { lovable } from "@/integrations/lovable/index";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/auth")({
  validateSearch: (search: Record<string, unknown>): { mode?: string; next?: string } => {
    const mode = search["mode"] === "signup" ? "signup" : undefined;
    const rawNext = search["next"];
    const next =
      typeof rawNext === "string" && rawNext.startsWith("/") ? rawNext : undefined;
    return { ...(mode ? { mode } : {}), ...(next ? { next } : {}) };
  },
  head: () => ({
    meta: [
      { title: "Sign in or create an account — City Ministers" },
      {
        name: "description",
        content:
          "Sign in to City Ministers to post your own ministry, message neighbors, and keep track of the people you serve.",
      },
      { property: "og:title", content: "Sign in — City Ministers" },
      {
        property: "og:description",
        content: "Create an account to post a ministry on your city's map.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const { t } = useTranslation();
  const { mode, next } = Route.useSearch();
  const navigate = useNavigate();
  const [isSignUp, setIsSignUp] = useState(mode === "signup");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const destination = next ?? null;

  useEffect(() => {
    let active = true;

    async function land(userId: string) {
      if (destination) {
        void navigate({ to: destination });
        return;
      }
      const { data } = await supabase
        .from("profiles")
        .select("onboarded_at")
        .eq("id", userId)
        .maybeSingle();
      if (!active) return;
      void navigate({ to: data?.onboarded_at ? "/map" : "/welcome" });
    }

    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) void land(session.user.id);
    });
    void supabase.auth.getSession().then(({ data }) => {
      if (data.session) void land(data.session.user.id);
    });
    return () => {
      active = false;
      sub.subscription.unsubscribe();
    };
  }, [destination, navigate]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setMessage(null);
    setBusy(true);
    try {
      if (isSignUp) {
        const { data, error: signUpError } = await supabase.auth.signUp({
          email: email.trim(),
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/auth${
              destination ? `?next=${encodeURIComponent(destination)}` : ""
            }`,
            data: { display_name: name.trim() },
          },
        });
        if (signUpError) throw signUpError;
        if (!data.session) {
          setMessage(t("Check your email to confirm your account, then sign in."));
        }
      } else {
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password,
        });
        if (signInError) throw signInError;
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : t("Something went wrong."));
    } finally {
      setBusy(false);
    }
  }

  async function handleForgot() {
    setError(null);
    setMessage(null);
    const target = email.trim();
    if (target.length < 5 || !target.includes("@")) {
      setError(t("Type your email above first, then tap Forgot password."));
      return;
    }
    setBusy(true);
    try {
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(target, {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      if (resetError) throw resetError;
      setMessage(t("Check your email for a link to choose a new password."));
    } catch (err) {
      setError(err instanceof Error ? err.message : t("Couldn't send that email."));
    } finally {
      setBusy(false);
    }
  }

  async function handleGoogle() {
    setError(null);
    const result = await lovable.auth.signInWithOAuth("google", {
      redirect_uri: `${window.location.origin}/auth${
        destination ? `?next=${encodeURIComponent(destination)}` : ""
      }`,
    });
    if (result.error) {
      setError(t("Google sign-in didn't work. Try again or use your email."));
      return;
    }
    if (result.redirected) return;
    void navigate({ to: destination ?? "/map" });
  }

  return (
    <div className="flex min-h-dvh flex-col bg-ink font-body text-sand antialiased">
      <header className="border-b border-ink-soft bg-ink-soft/70">
        <div className="mx-auto flex w-full max-w-md items-center gap-3 px-4 py-4">
          <Link
            to="/map"
            className="grid size-12 shrink-0 place-items-center rounded-full bg-ink text-lemon ring-1 ring-mist/20 transition hover:bg-ink-soft"
            aria-label={t("Back to map")}
          >
            <ArrowLeft className="size-6" aria-hidden="true" />
          </Link>
          <BrandLogo />
        </div>
      </header>

      <main className="mx-auto w-full max-w-md flex-1 px-4 py-8">
        <h1 className="mb-6 text-center text-2xl font-semibold text-sand sm:text-3xl">
          {isSignUp ? t("Create your account") : t("Sign in")}
        </h1>

        <button
          type="button"
          onClick={() => void handleGoogle()}
          className="mb-6 inline-flex w-full items-center justify-center gap-3 rounded-full bg-ink-soft px-6 py-4 text-lg font-semibold text-sand ring-1 ring-mist/20 transition hover:bg-ink-soft/80 hover:ring-mist/30 sm:text-xl"
        >
          {t("Continue with Google")}
        </button>

        <div className="mb-6 flex items-center gap-3 text-base uppercase tracking-[0.2em] text-mist/80 sm:text-lg">
          <span className="h-px flex-1 bg-mist/25" />
          {t("or use email")}
          <span className="h-px flex-1 bg-mist/25" />
        </div>

        <form className="flex flex-col gap-4" onSubmit={(e) => void handleSubmit(e)}>
          <label className="flex flex-col gap-2 text-lg text-sand sm:text-xl">
            {t("Email")}
            <input
              className="rounded-xl bg-ink-soft px-5 py-4 text-xl text-sand ring-1 ring-mist/20 focus:outline-none focus:ring-lemon/50 sm:text-2xl"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              maxLength={255}
              autoComplete="off"
            />
          </label>
          <label className="flex flex-col gap-2 text-lg text-sand sm:text-xl">
            {t("Password")}
            <input
              className="rounded-xl bg-ink-soft px-5 py-4 text-xl text-sand ring-1 ring-mist/20 focus:outline-none focus:ring-lemon/50 sm:text-2xl"
              type="password"
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="off"
            />
          </label>

          {isSignUp && (
            <p className="mt-1 text-base text-mist/80 sm:text-lg">
              <Link
                to="/terms"
                className="text-sand underline decoration-mist/40 underline-offset-2"
              >
                {t("User & Privacy Agreement")}
              </Link>
            </p>
          )}

          {error && (
            <p className="rounded-lg bg-rose/15 px-4 py-3 text-base text-rose ring-1 ring-rose/30 sm:text-lg">
              {error}
            </p>
          )}
          {message && (
            <p className="rounded-lg bg-lemon/10 px-4 py-3 text-base text-lemon ring-1 ring-lemon/30 sm:text-lg">
              {message}
            </p>
          )}

          <button
            type="submit"
            disabled={busy}
            className="mt-2 inline-flex items-center justify-center gap-3 rounded-full bg-lemon px-6 py-4 text-xl font-semibold text-ink transition-transform hover:-translate-y-0.5 disabled:opacity-60"
          >
            {busy && <Loader2 className="size-7 animate-spin" aria-hidden="true" />}
            {isSignUp ? t("Create account") : t("Sign in")}
          </button>
        </form>

        {!isSignUp && (
          <p className="mt-6 text-center text-base text-mist/70 sm:text-lg">
            <button
              type="button"
              onClick={() => void handleForgot()}
              disabled={busy}
              className="text-sand underline decoration-mist/30 underline-offset-2 disabled:opacity-60"
            >
              {t("Forgot password?")}
            </button>
          </p>
        )}


        <p className="mt-8 text-center text-base text-mist/70 sm:text-lg">
          {isSignUp ? t("Already have an account?") : t("New here?")}{" "}
          <button
            type="button"
            onClick={() => {
              setIsSignUp((v) => !v);
              setError(null);
              setMessage(null);
            }}
            className="text-sand underline decoration-mist/30 underline-offset-2"
          >
            {isSignUp ? t("Sign in") : t("Create an account")}
          </button>
        </p>
      </main>
    </div>
  );
}
