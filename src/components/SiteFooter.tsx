import { Link } from "@tanstack/react-router";

const footerLinks = [
  { to: "/ministry-mindset", label: "Ministry Mindset" },
  { to: "/about", label: "About Us" },
  { to: "/contact", label: "Contact" },
  { to: "/report-abuse", label: "Report Abuse" },
  { to: "/terms", label: "User Agreement" },
  { to: "/donate", label: "Donate" },
  { to: "/feedback", label: "Feedback" },
] as const;

export function SiteFooter() {
  return (
    <footer className="border-t border-ink-soft bg-ink">
      <div className="mx-auto flex w-full max-w-6xl flex-col items-center gap-4 px-4 py-8 sm:px-6">
        <nav className="flex flex-wrap items-center justify-center gap-2 sm:gap-3">
          {footerLinks.map((link) => (
            <Link
              key={link.to}
              to={link.to}
              className="rounded-full px-4 py-2.5 text-sm font-semibold text-sand ring-1 ring-mist/20 transition hover:bg-ink-soft sm:text-base"
            >
              {link.label}
            </Link>
          ))}
        </nav>
        <p className="text-xs text-mist/60 sm:text-sm">
          City Ministers — neighbors serving neighbors.
        </p>
      </div>
    </footer>
  );
}
