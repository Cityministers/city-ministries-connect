import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";

export const Route = createFileRoute("/terms")({
  head: () => ({
    meta: [
      { title: "User & Privacy Agreement — City Ministers" },
      {
        name: "description",
        content:
          "How City Ministers members agree to treat each other, what we collect, how your information is used, and how to remove your account.",
      },
      { property: "og:title", content: "User & Privacy Agreement — City Ministers" },
      {
        property: "og:description",
        content:
          "The rules of the road for posting ministries and needs on City Ministers, plus how we handle your information.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: TermsPage,
});

const sections: { heading: string; body: string[] }[] = [
  {
    heading: "1. Who can use City Ministers",
    body: [
      "You must be 18 or older to create an account, post a ministry, or post a need. Families are welcome to serve together, but the account belongs to the adult who created it.",
      "You agree to give truthful information about yourself, your location, and what you are offering or asking for.",
    ],
  },
  {
    heading: "2. How we treat each other",
    body: [
      "City Ministers is a neighbor-to-neighbor space. No harassment, hate speech, threats, sexual content, scams, solicitation of money for personal gain, or attempts to pressure anyone into a belief, purchase, or relationship.",
      "Do not post other people's photos, addresses, or private details without their permission. Do not post anything involving a minor without that child's parent or guardian agreeing.",
      "Posts that break these rules can be hidden or removed at any time, and repeat accounts can be closed.",
    ],
  },
  {
    heading: "3. Meeting in person is your decision",
    body: [
      "City Ministers does not run background checks and does not verify anyone's identity, skills, insurance, or intentions. We are an introduction board, not an escort or vetting service.",
      "Meet in public places when you can, bring someone with you when you can, and stop any meeting that feels unsafe. You accept the risk of any meeting you choose to attend.",
    ],
  },
  {
    heading: "4. What you post stays yours",
    body: [
      "You keep ownership of your words, photos, and videos. By posting, you give City Ministers permission to display that content on the map, the lists, and in emails such as the weekly needs digest.",
      "You can edit or delete your own posts at any time from your profile.",
    ],
  },
  {
    heading: "5. Information we collect",
    body: [
      "Account details: your name, email address, password (stored encrypted, never visible to us), and profile photo if you add one.",
      "Post details: your short title, description, city or ZIP, any photo or video you attach, and the timestamps of your activity.",
      "Messages: the notes you send other members, so both sides can read the conversation.",
      "Optional profile answers: if you complete the S.H.A.P.E. walkthrough, your answers and any household details you enter are saved to your account so we can suggest ministries.",
    ],
  },
  {
    heading: "6. How your information is used",
    body: [
      "To show your ministry or need to neighbors searching your city or ZIP, to deliver your messages, to send the alerts and digests you opt into, and to review abuse reports.",
      "Your exact street address is never requested and never shown. Only the city or ZIP you type appears publicly, along with your display name and profile photo.",
      "We do not sell your information. We do not share it with advertisers.",
    ],
  },
  {
    heading: "7. Reports and moderation",
    body: [
      "Anyone can report a ministry or a need. A reported need is hidden right away while it is reviewed, and the person who reported it gets a tracking code to follow the outcome.",
      "We may keep a record of removed content and reports so the same abuse does not come back.",
    ],
  },
  {
    heading: "8. Deleting your account",
    body: [
      "You can delete your account from your profile page. That removes your posts, saved items, messages you sent, and profile details.",
      "Some records tied to abuse reports may be kept for safety purposes.",
    ],
  },
  {
    heading: "9. Changes to this agreement",
    body: [
      "If we change these terms in a meaningful way, we will show the updated agreement the next time you post. Continuing to use City Ministers means you accept the current version.",
    ],
  },
  {
    heading: "10. Questions",
    body: [
      "Use the Contact page in the menu and we will answer you directly.",
    ],
  },
];

function TermsPage() {
  return (
    <div className="flex min-h-dvh flex-col bg-ink font-body text-sand antialiased">
      <header className="border-b border-ink-soft bg-ink-soft/70">
        <div className="mx-auto flex w-full max-w-2xl items-center gap-3 px-4 py-4">
          <Link
            to="/map"
            className="grid size-10 shrink-0 place-items-center rounded-full bg-ink text-lemon ring-1 ring-mist/20 transition hover:bg-ink-soft"
            aria-label="Back to map"
          >
            <ArrowLeft className="size-4" aria-hidden="true" />
          </Link>
          <h1 className="font-display text-lg font-semibold sm:text-xl">
            User &amp; Privacy Agreement
          </h1>
        </div>
      </header>

      <main className="mx-auto w-full max-w-2xl flex-1 px-4 py-8">
        <p className="text-sm leading-relaxed text-mist/80 sm:text-base">
          This is the agreement between you and City Ministers. It covers how members
          treat each other and what happens to the information you share. Please read it
          before you create a profile or post a need.
        </p>

        <div className="mt-8 flex flex-col gap-7">
          {sections.map((section) => (
            <section key={section.heading}>
              <h2 className="font-display text-base font-semibold text-sand sm:text-lg">
                {section.heading}
              </h2>
              <div className="mt-2 flex flex-col gap-2">
                {section.body.map((paragraph) => (
                  <p
                    key={paragraph}
                    className="text-sm leading-relaxed text-mist/75 sm:text-base"
                  >
                    {paragraph}
                  </p>
                ))}
              </div>
            </section>
          ))}
        </div>

        <div className="mt-10 flex flex-wrap gap-3">
          <Link
            to="/auth"
            search={{ mode: "signup" }}
            className="inline-flex items-center justify-center rounded-full bg-lemon px-6 py-3 text-base font-semibold text-ink transition hover:opacity-90"
          >
            Create an account
          </Link>
          <Link
            to="/contact"
            className="inline-flex items-center justify-center rounded-full bg-ink-soft px-6 py-3 text-base font-semibold text-sand ring-1 ring-mist/20 transition hover:bg-ink"
          >
            Contact us
          </Link>
        </div>
      </main>
    </div>
  );
}
