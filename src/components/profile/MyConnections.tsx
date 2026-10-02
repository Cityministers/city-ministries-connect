import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { Church, HandHeart, MoreVertical, Plus, User } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { listMyFollows, toggleFollow, type FollowItem } from "@/lib/follows.functions";

const GROUPS: { title: string; types: FollowItem["targetType"][] }[] = [
  { title: "Churches", types: ["church"] },
  { title: "Ministries & needs", types: ["ministry", "need"] },
  { title: "People", types: ["user"] },
];

function linkFor(i: FollowItem): string {
  if (i.targetType === "church") return `/church/${i.targetId}`;
  if (i.targetType === "need") return `/needs?new=${i.targetId}`;
  if (i.targetType === "ministry") return `/map?new=${i.targetId}`;
  return `/people/${i.targetId}`;
}

export function MyConnections() {
  const { t } = useTranslation();
  const qc = useQueryClient();
  const fetchFollows = useServerFn(listMyFollows);
  const toggle = useServerFn(toggleFollow);
  const [menu, setMenu] = useState<string | null>(null);
  const { data = [] } = useQuery({ queryKey: ["my-follows"], queryFn: () => fetchFollows(), retry: false });

  const remove = async (i: FollowItem) => {
    setMenu(null);
    try {
      await toggle({ data: { targetType: i.targetType, targetId: i.targetId } });
      await qc.invalidateQueries({ queryKey: ["my-follows"] });
      qc.removeQueries({ queryKey: ["follow", i.targetType, i.targetId] });
      toast.success(t("Removed."));
    } catch {
      toast.error(t("Something went wrong. Please try again."));
    }
  };

  return (
    <section className="rounded-2xl bg-ink-soft p-4 ring-1 ring-mist/35">
      <h2 className="font-display text-xl font-bold text-sand">{t("My churches & ministries")}</h2>
      <p className="mt-1 text-sm text-mist">{t("What you follow sends updates to your notifications.")}</p>
      <div className="mt-3 grid grid-cols-2 gap-2">
        <Link to="/explore" className="inline-flex items-center justify-center gap-1.5 rounded-full bg-ink px-3 py-2.5 text-sm font-bold text-sand ring-2 ring-lemon/45 active:scale-95">
          <Plus className="size-4" aria-hidden="true" /> {t("Add a church")}
        </Link>
        <Link to="/ministries" className="inline-flex items-center justify-center gap-1.5 rounded-full bg-tone-cyan/25 px-3 py-2.5 text-sm font-bold text-sand ring-2 ring-tone-cyan/55 active:scale-95">
          <Plus className="size-4" aria-hidden="true" /> {t("Add a ministry")}
        </Link>
      </div>

      {data.length === 0 ? (
        <p className="mt-3 text-sm text-mist">{t("Tap Follow on a church, ministry or person to see them here.")}</p>
      ) : (
        GROUPS.map((g) => {
          const items = data.filter((i) => g.types.includes(i.targetType));
          if (!items.length) return null;
          return (
            <div key={g.title} className="mt-4">
              <p className="text-xs font-bold uppercase tracking-wide text-mist">{t(g.title)}</p>
              <ul className="mt-2 flex flex-col gap-2">
                {items.map((i) => {
                  const href = linkFor(i);
                  const Icon = i.targetType === "church" ? Church : i.targetType === "user" ? User : HandHeart;
                  const inner = (
                    <>
                      {i.photo ? (
                        <img src={i.photo} alt="" className="size-10 rounded-lg object-cover" />
                      ) : (
                        <span className="grid size-10 place-items-center rounded-lg bg-ink-soft">
                          <Icon className="size-5 text-lemon" aria-hidden="true" />
                        </span>
                      )}
                      <span className="truncate font-semibold text-sand">{i.name}</span>
                    </>
                  );
                  const k = `${i.targetType}-${i.targetId}`;
                  return (
                    <li key={k} className="relative flex items-center gap-2 rounded-xl bg-ink p-2 ring-1 ring-mist/35">
                      {href ? (
                        <a href={href} className="flex min-w-0 flex-1 items-center gap-3">{inner}</a>
                      ) : (
                        <div className="flex min-w-0 flex-1 items-center gap-3">{inner}</div>
                      )}
                      <button type="button" aria-label={t("More options")} onClick={() => setMenu(menu === k ? null : k)} className="grid size-9 place-items-center rounded-full text-mist hover:bg-ink-soft">
                        <MoreVertical className="size-5" aria-hidden="true" />
                      </button>
                      {menu === k && (
                        <div className="absolute right-2 top-12 z-10 rounded-lg bg-ink-soft p-1 ring-1 ring-mist/35">
                          <button type="button" onClick={() => void remove(i)} className="rounded-md px-3 py-2 text-sm font-semibold text-rose hover:bg-ink">
                            {t("Remove")}
                          </button>
                        </div>
                      )}
                    </li>
                  );
                })}
              </ul>
            </div>
          );
        })
      )}
    </section>
  );
}
