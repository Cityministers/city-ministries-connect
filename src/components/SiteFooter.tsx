import { Link } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";

type FooterLink = { label: string; to: string } | { label: string; href: string };

const footerLinks: FooterLink[] = [
  { to: "/ministry-mindset", label: "Ministry Mindset" },
  { to: "/about", label: "About Us" },
  {
    href: "https://josephdraper-portfolio-showcase.lovable.app/",
    label: "About the Builder",
  },
  { to: "/contact", label: "Contact" },
  { to: "/add-church", label: "Add your Church" },
  { to: "/report-abuse", label: "Report Abuse" },
  { to: "/terms", label: "User Agreement" },
  { to: "/donate", label: "Donate" },
  { to: "/feedback", label: "Feedback" },
];

const linkClass =
  "rounded-full px-4 py-2.5 text-sm font-semibold text-sand ring-1 ring-mist/20 transition hover:bg-ink-soft sm:text-base";

export function SiteFooter() {
  const { t } = useTranslation();
  return (
    <footer className="border-t border-ink-soft bg-ink">
      <div className="mx-auto flex w-full max-w-6xl flex-col items-center gap-4 px-4 py-8 sm:px-6">
        <nav className="flex flex-wrap items-center justify-center gap-2 sm:gap-3">
          {footerLinks.map((link) =>
            "href" in link ? (
              <a
                key={link.href}
                href={link.href}
                target="_blank"
                rel="noopener noreferrer"
                className={linkClass}
              >
                {t(link.label)}
              </a>
            ) : (
              <Link key={link.to} to={link.to} className={linkClass}>
                {t(link.label)}
              </Link>
            ),
          )}
        </nav>
        <p className="text-xs text-mist/60 sm:text-sm">
          {t("City Ministers — neighbors serving neighbors.")}
        </p>
      </div>
    </footer>
  );
}
