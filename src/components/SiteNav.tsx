"use client";

import { Link } from "@tanstack/react-router";
import { ArrowLeft, Heart, Menu } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";

import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

const menuLinks = [
  { to: "/about", label: "About Us" },
  { to: "/contact", label: "Contact" },
  { to: "/report-abuse", label: "Report Abuse" },
  { to: "/terms", label: "User & Privacy Agreement" },
] as const;

export function SiteNav() {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <button
          type="button"
          className="grid size-10 place-items-center rounded-full bg-ink text-sand ring-1 ring-mist/20 transition hover:bg-ink-soft"
          aria-label={t("Open menu")}
        >
          <Menu className="size-5" aria-hidden="true" />
        </button>
      </SheetTrigger>
      <SheetContent side="left" className="w-3/4 border-ink-soft bg-ink-soft/95 backdrop-blur sm:max-w-sm">
        <SheetHeader>
          <SheetTitle className="text-left font-display text-xl text-sand">
            {t("Menu")}
          </SheetTitle>
        </SheetHeader>
        <Link
          to="/"
          onClick={() => setOpen(false)}
          className="mt-4 inline-flex items-center gap-2 rounded-xl border border-ink-soft px-3 py-2 text-sm text-mist transition hover:text-sand"
          aria-label={t("Back to home")}
        >
          <ArrowLeft className="size-4" aria-hidden="true" />
          {t("Back to home")}
        </Link>
        <nav className="mt-6 flex flex-col gap-2">
          <Link
            to="/donate"
            onClick={() => setOpen(false)}
            className="group relative flex items-center gap-3 overflow-hidden rounded-xl px-4 py-3 text-lg font-semibold text-sand ring-1 ring-emerald/30 transition active:scale-[0.98]"
          >
            <div className="absolute inset-0 bg-gradient-to-tr from-emerald-dark via-emerald to-emerald-light" />
            <div className="absolute inset-0 bg-gradient-to-b from-white/10 to-transparent pointer-events-none" />
            <div className="absolute inset-0 rounded-xl shadow-[inset_0_0_12px_rgba(255,255,255,0.2)]" />
            <Heart className="relative z-10 size-5" aria-hidden="true" />
            <span className="relative z-10">{t("Donate")}</span>
          </Link>
          {menuLinks.map((link) => (
            <Link
              key={link.to}
              to={link.to}
              onClick={() => setOpen(false)}
              className="rounded-xl px-4 py-3 text-lg font-medium text-sand transition hover:bg-ink"
            >
              {t(link.label)}
            </Link>
          ))}
        </nav>
      </SheetContent>
    </Sheet>
  );
}
