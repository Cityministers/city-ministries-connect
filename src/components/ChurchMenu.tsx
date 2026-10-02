"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { Church, LogOut, Search } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";

import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useSession } from "@/hooks/useSession";
import { leaveChurch, listChurchesIAttend } from "@/lib/churches.functions";
import { ROOMS } from "@/lib/rooms";

export function ChurchMenu() {
  const { t } = useTranslation();
  const session = useSession();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const [open, setOpen] = useState(false);
  const fetchChurches = useServerFn(listChurchesIAttend);
  const leave = useServerFn(leaveChurch);

  const { data: churches = [] } = useQuery({
    queryKey: ["my-churches-menu", session?.user?.id ?? "none"],
    queryFn: async () => {
      try {
        return await fetchChurches();
      } catch {
        return [];
      }
    },
    enabled: Boolean(session?.user?.id),
    retry: false,
  });

  if (!session) return null;

  const home = churches[0];
  const churchMatch = pathname.match(/^\/church\/([^/]+)/);
  const onChurchId = churchMatch?.[1];
  const onMyChurch = onChurchId ? churches.find((c) => c.id === onChurchId) : undefined;
  const onRoom = pathname.startsWith("/rooms/");

  const close = () => setOpen(false);

  const onLeave = async () => {
    if (onRoom) {
      close();
      if (home) navigate({ to: "/church/$id", params: { id: home.id } });
      else navigate({ to: "/" });
      return;
    }
    if (!onMyChurch) return;
    if (!window.confirm(t("Leave this church? It will be removed from your profile."))) return;
    try {
      await leave({ data: { churchId: onMyChurch.id } });
      await qc.invalidateQueries();
      toast.success(t("You left this church."));
      close();
      navigate({ to: "/explore" });
    } catch {
      toast.error(t("Something went wrong. Please try again."));
    }
  };

  const showContext = Boolean(onMyChurch) || onRoom;

  const actions = (
    <div className="flex flex-col gap-1">
      <Link
        to="/explore"
        onClick={close}
        className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold text-sand hover:bg-ink"
      >
        <Search className="size-4" aria-hidden="true" />
        {t("Search other churches & rooms")}
      </Link>
      {showContext && (
        <button
          type="button"
          onClick={onLeave}
          className="flex items-center gap-2 rounded-lg px-3 py-2 text-left text-sm font-semibold text-rose hover:bg-ink"
        >
          <LogOut className="size-4" aria-hidden="true" />
          {onRoom ? t("Leave this room") : t("Leave this church")}
        </button>
      )}
    </div>
  );

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          className="grid size-10 place-items-center rounded-full bg-ink text-lemon ring-1 ring-mist/25 transition hover:bg-ink-soft"
          aria-label={t("Church and rooms")}
        >
          <Church className="size-5" aria-hidden="true" />
        </button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-72 border-mist/30 bg-ink-soft p-2 text-sand">
        {showContext && <div className="mb-2 border-b border-mist/20 pb-2">{actions}</div>}

        <p className="px-3 pt-1 text-xs font-bold uppercase tracking-wide text-mist">
          {t("Your home")}
        </p>
        {home ? (
          <Link
            to="/church/$id"
            params={{ id: home.id }}
            onClick={close}
            className="mt-1 flex items-center gap-3 rounded-lg px-3 py-2 hover:bg-ink"
          >
            {home.avatarUrl ? (
              <img src={home.avatarUrl} alt="" className="size-9 rounded-md object-cover" />
            ) : (
              <span className="grid size-9 place-items-center rounded-md bg-ink">
                <Church className="size-4 text-lemon" aria-hidden="true" />
              </span>
            )}
            <span className="truncate font-semibold">{home.name}</span>
          </Link>
        ) : (
          <Link
            to="/explore"
            onClick={close}
            className="mt-1 block rounded-lg px-3 py-2 text-sm font-semibold hover:bg-ink"
          >
            {t("Find a church")}
          </Link>
        )}

        <p className="mt-2 px-3 pt-1 text-xs font-bold uppercase tracking-wide text-mist">
          {t("Explore rooms")}
        </p>
        <div className="mt-1 flex flex-col">
          {ROOMS.map((r) => (
            <Link
              key={r.slug}
              to="/rooms/$slug"
              params={{ slug: r.slug }}
              onClick={close}
              className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm hover:bg-ink"
            >
              <r.icon className="size-4 text-lemon" aria-hidden="true" />
              {t(r.title)}
            </Link>
          ))}
        </div>

        {!showContext && <div className="mt-2 border-t border-mist/20 pt-2">{actions}</div>}
      </PopoverContent>
    </Popover>
  );
}
