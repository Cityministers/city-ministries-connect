import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import {
  Check,
  HandHelping,
  MapPin,
  MoreVertical,
  QrCode,
  Share2,
  Trash2,
  X,
} from "lucide-react";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { leaveChurch, listChurchesIAttend } from "@/lib/churches.functions";
import { churchPrayerCounts, markChurchPrayersSeen } from "@/lib/prayers.functions";

/**
 * Scan codes for the churches this person attends, shown inline on the
 * profile. Tapping "Show code" opens the full-screen scannable popup.
 * Renders nothing while loading or when the person attends no church.
 */
export function ChurchCodeCards() {
  const { t } = useTranslation();
  const fetchChurches = useServerFn(listChurchesIAttend);
  const { data, isLoading } = useQuery({
    queryKey: ["churches-i-attend"],
    queryFn: () => fetchChurches(),
  });

  const [openId, setOpenId] = useState<string | null>(null);
  const [codes, setCodes] = useState<Record<string, string>>({});
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const shareChurch = async (id: string, name: string) => {
    const url = `${window.location.origin}/church/${id}`;
    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share({ title: name, url });
        return;
      } catch {
        // fall through to copying
      }
    }
    try {
      await navigator.clipboard.writeText(url);
      setCopiedId(id);
      window.setTimeout(() => setCopiedId((c) => (c === id ? null : c)), 2000);
    } catch {
      // clipboard unavailable
    }
  };

  const queryClient = useQueryClient();
  const leave = useServerFn(leaveChurch);
  const removeChurch = useMutation({
    mutationFn: (churchId: string) => leave({ data: { churchId } }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["churches-i-attend"] });
    },
  });

  useEffect(() => {
    if (typeof window === "undefined" || !data || data.length === 0) return;
    let alive = true;
    void import("qrcode").then(async (mod) => {
      const next: Record<string, string> = {};
      for (const c of data) {
        next[c.id] = await mod.default.toDataURL(`${window.location.origin}/church/${c.id}`, {
          width: 1024,
          margin: 2,
          errorCorrectionLevel: "M",
          color: { dark: "#171320", light: "#ffffff" },
        });
      }
      if (alive) setCodes(next);
    });
    return () => {
      alive = false;
    };
  }, [data]);

  if (isLoading || !data || data.length === 0) return null;

  const open = data.find((c) => c.id === openId) ?? null;

  return (
    <>
      <div className="flex flex-col gap-3">
        {data.map((c) => (
          <article
            key={c.id}
            className="rounded-2xl bg-ink-soft/60 p-4 ring-1 ring-mist/15"
          >
            <div className="flex items-center gap-3">
              <Link
                to="/church/$id"
                params={{ id: c.id }}
                className="flex min-w-0 flex-1 items-center gap-3 rounded-xl transition hover:opacity-90"
              >
                {c.photoUrl ? (
                  <img
                    src={c.photoUrl}
                    alt={c.name}
                    className="size-12 shrink-0 rounded-xl object-cover ring-1 ring-mist/20"
                  />
                ) : (
                  <span className="grid size-12 shrink-0 place-items-center rounded-xl bg-ink text-lemon ring-1 ring-mist/20">
                    <QrCode className="size-5" aria-hidden="true" />
                  </span>
                )}
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-display text-base font-semibold text-sand">
                    {c.name}
                  </span>
                  <span className="block truncate text-sm text-mist/60">
                    {c.address ? `${c.address}, ` : ""}
                    {c.city} {c.zip}
                  </span>
                </span>
              </Link>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button
                    type="button"
                    aria-label={t("More options")}
                    className="grid size-9 shrink-0 place-items-center rounded-full text-mist/70 transition hover:bg-ink hover:text-sand"
                  >
                    <MoreVertical className="size-5" aria-hidden="true" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem
                    onSelect={(e) => {
                      e.preventDefault();
                      void shareChurch(c.id, c.name);
                    }}
                  >
                    {copiedId === c.id ? (
                      <Check className="size-4" aria-hidden="true" />
                    ) : (
                      <Share2 className="size-4" aria-hidden="true" />
                    )}
                    {copiedId === c.id ? t("Link copied") : t("Share")}
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onSelect={() => removeChurch.mutate(c.id)}
                    className="text-rose-400 focus:text-rose-300"
                  >
                    <Trash2 className="size-4" aria-hidden="true" />
                    {t("Remove from my profile")}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
            <button
              type="button"
              onClick={() => setOpenId(c.id)}
              className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-full bg-lemon px-4 py-2.5 text-base font-semibold text-ink transition hover:opacity-90"
            >
              <QrCode className="size-5" aria-hidden="true" />
              {t("Show my church code")}
            </button>
          </article>
        ))}
      </div>

      {open && (
        <div className="fixed inset-0 z-50 flex flex-col items-center justify-center gap-4 bg-ink/95 p-6">
          <button
            type="button"
            onClick={() => setOpenId(null)}
            aria-label={t("Close")}
            className="absolute right-4 top-4 grid size-11 place-items-center rounded-full bg-ink-soft text-sand ring-1 ring-mist/25"
          >
            <X className="size-5" aria-hidden="true" />
          </button>
          <p className="text-center font-display text-2xl font-semibold text-sand">{open.name}</p>
          {codes[open.id] ? (
            <img
              src={codes[open.id]}
              alt={t("Scan code for {{name}}", { name: open.name })}
              className="w-full max-w-52 rounded-2xl bg-white p-2.5"
            />
          ) : (
            <p className="text-base text-mist/60">{t("Loading…")}</p>
          )}
          <p className="text-center text-base text-mist/70">
            {open.address ? `${open.address}, ` : ""}
            {open.city} {open.zip}
          </p>
          <Link
            to="/map"
            search={{ place: `${open.city} ${open.zip}`.trim(), new: `church-${open.id}` }}
            className="inline-flex items-center gap-2 rounded-full bg-ink-soft px-5 py-3 text-base font-semibold text-sand ring-1 ring-mist/25 transition hover:bg-ink-soft/70"
          >
            <MapPin className="size-5 text-lemon" aria-hidden="true" />
            {t("See it on the map")}
          </Link>
        </div>
      )}
    </>
  );
}
