import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, Mail, MessageSquare } from "lucide-react";
import { useState } from "react";

export const Route = createFileRoute("/contact")({
  head: () => ({
    meta: [
      { title: "Contact — City Ministers" },
      {
        name: "description",
        content:
          "Get in touch with City Ministers. We'd love to hear your story, answer your questions, or pray with you.",
      },
      { property: "og:title", content: "Contact — City Ministers" },
      {
        property: "og:description",
        content: "Reach out to the City Ministers team with questions, feedback, or prayer requests.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: ContactPage,
});

function ContactPage() {
  const [sent, setSent] = useState(false);

  return (
    <div className="flex min-h-dvh flex-col bg-ink font-body text-sand antialiased">
      <header className="border-b border-ink-soft bg-ink-soft/70">
        <div className="mx-auto flex w-full max-w-3xl items-center gap-3 px-4 py-4 sm:px-6">
          <Link
            to="/map"
            className="grid size-10 shrink-0 place-items-center rounded-full bg-ink text-lemon ring-1 ring-mist/20 transition hover:bg-ink-soft"
            aria-label="Back to map"
          >
            <ArrowLeft className="size-4" aria-hidden="true" />
          </Link>
          <h1 className="font-display text-lg font-semibold sm:text-xl">Contact</h1>
        </div>
      </header>

      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-8 sm:px-6 sm:py-12">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 grid size-16 place-items-center rounded-2xl bg-lemon/10 text-lemon ring-1 ring-lemon/30">
            <Mail className="size-8" aria-hidden="true" />
          </div>
          <h2 className="font-display text-2xl font-semibold sm:text-3xl">We'd love to hear from you</h2>
          <p className="mt-3 text-lg text-mist/80 sm:text-xl">
            Questions, ideas, or prayer requests — send them our way.
          </p>
        </div>

        {sent ? (
          <div className="rounded-2xl bg-ink-soft/40 p-6 text-center ring-1 ring-mist/15">
            <MessageSquare className="mx-auto mb-3 size-8 text-lemon" aria-hidden="true" />
            <h3 className="font-display text-xl font-semibold sm:text-2xl">Message sent</h3>
            <p className="mt-2 text-base text-mist/70 sm:text-lg">
              Thank you for reaching out. We'll get back to you as soon as we can.
            </p>
            <button
              type="button"
              onClick={() => setSent(false)}
              className="mt-4 inline-flex items-center justify-center rounded-full bg-lemon px-5 py-2 text-base font-semibold text-ink transition hover:bg-lemon/90 sm:text-lg"
            >
              Send another message
            </button>
          </div>
        ) : (
          <form
            className="space-y-4"
            onSubmit={(e) => {
              e.preventDefault();
              setSent(true);
            }}
          >
            <div>
              <label htmlFor="name" className="mb-1.5 block text-base font-medium text-sand sm:text-lg">
                Name
              </label>
              <input
                id="name"
                type="text"
                required
                className="w-full rounded-xl bg-ink px-4 py-3 text-lg text-sand ring-1 ring-mist/20 placeholder:text-mist/50 focus:outline-none focus:ring-lemon/50 sm:text-xl"
                placeholder="Your name"
              />
            </div>
            <div>
              <label htmlFor="email" className="mb-1.5 block text-base font-medium text-sand sm:text-lg">
                Email
              </label>
              <input
                id="email"
                type="email"
                required
                className="w-full rounded-xl bg-ink px-4 py-3 text-lg text-sand ring-1 ring-mist/20 placeholder:text-mist/50 focus:outline-none focus:ring-lemon/50 sm:text-xl"
                placeholder="you@example.com"
              />
            </div>
            <div>
              <label htmlFor="message" className="mb-1.5 block text-base font-medium text-sand sm:text-lg">
                Message
              </label>
              <textarea
                id="message"
                rows={5}
                required
                className="w-full rounded-xl bg-ink px-4 py-3 text-lg text-sand ring-1 ring-mist/20 placeholder:text-mist/50 focus:outline-none focus:ring-lemon/50 sm:text-xl"
                placeholder="How can we help?"
              />
            </div>
            <button
              type="submit"
              className="w-full rounded-full bg-lemon px-6 py-3 text-lg font-semibold text-ink transition hover:bg-lemon/90 sm:text-xl"
            >
              Send message
            </button>
          </form>
        )}
      </main>
    </div>
  );
}
