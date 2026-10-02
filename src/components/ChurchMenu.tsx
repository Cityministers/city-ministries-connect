"use client";

import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { Church } from "lucide-react";
import { useTranslation } from "react-i18next";

import { useSession } from "@/hooks/useSession";

const RETURN_KEY = "cm-rooms-return";
const className =
  "grid size-10 place-items-center rounded-full bg-ink text-lemon ring-1 ring-mist/25 transition hover:bg-ink-soft";

function isRoomsPath(path: string) {
  return path === "/explore" || path.startsWith("/rooms");
}

export function ChurchMenu() {
  const { t } = useTranslation();
  const session = useSession();
  const navigate = useNavigate();
  const location = useRouterState({ select: (s) => s.location });

  if (!session) return null;

  // Inside the rooms area the button works like Back: return to where you came from.
  if (isRoomsPath(location.pathname)) {
    return (
      <button
        type="button"
        className={className}
        aria-label={t("Church and rooms")}
        onClick={() => {
          const saved = sessionStorage.getItem(RETURN_KEY);
          sessionStorage.removeItem(RETURN_KEY);
          navigate({ href: saved && !isRoomsPath(saved.split("?")[0]) ? saved : "/map" });
        }}
      >
        <Church className="size-5" aria-hidden="true" />
      </button>
    );
  }

  return (
    <Link
      to="/explore"
      onClick={() => sessionStorage.setItem(RETURN_KEY, location.href)}
      className={className}
      aria-label={t("Church and rooms")}
    >
      <Church className="size-5" aria-hidden="true" />
    </Link>
  );
}
