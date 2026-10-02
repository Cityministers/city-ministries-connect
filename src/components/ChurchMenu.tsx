"use client";

import { Link } from "@tanstack/react-router";
import { Church } from "lucide-react";
import { useTranslation } from "react-i18next";

import { useSession } from "@/hooks/useSession";

export function ChurchMenu() {
  const { t } = useTranslation();
  const session = useSession();

  if (!session) return null;

  return (
    <Link
      to="/explore"
      className="grid size-10 place-items-center rounded-full bg-ink text-lemon ring-1 ring-mist/25 transition hover:bg-ink-soft"
      aria-label={t("Church and rooms")}
    >
      <Church className="size-5" aria-hidden="true" />
    </Link>
  );
}
