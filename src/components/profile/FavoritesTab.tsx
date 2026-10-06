import { useQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { HandHeart, Heart, HeartHandshake, Newspaper, Sparkles } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { supabase } from "@/integrations/supabase/client";
import { listMyFavorites, toggleFavorite, type SavedPostDTO } from "@/lib/favorites.functions";

const SECTIONS: { type: SavedPostDTO["postType"]; label: string }[] = [
  { type: "ministry", label: "Ministries" },
  { type: "need", label: "Needs" },
  { type: "prayer", label: "Prayers" },
  { type: "room", label: "Room stories" },
];

export function FavoritesTab() {
  const { t } = useTranslation();
  const fetchFavorites = useServerFn(listMyFavorites);
  const unsave = useServerFn(toggleFavorite);
  const { data: saved, refetch, isLoading } = useQuery({
    queryKey: ["my-favorites"],
    queryFn: () => fetchFavorites(),
  });
  const [openId, setOpenId] = useState<string | null>(null);

  if (isLoading) return <p className="py-10 text-center text-base text-mist/60">{t("Loading…")}</p>;

  if (!saved || saved.length === 0) {
    return (
      <p className="rounded-2xl bg-ink-soft/60 p-6 text-center text-base text-mist/70 ring-1 ring-mist/15">
        {t("Tap the heart on any post to save it here.")}
      </p>
    );
  }

  async function remove(item: SavedPostDTO) {
    if (item.postType === "room") {
      const { data: u } = await supabase.auth.getUser();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (supabase as any).from("room_post_saves").delete().eq("post_id", item.postId).eq("user_id", u.user?.id);
    } else {
      await unsave({ data: { postType: item.postType, postId: item.postId } });
    }
    await refetch();
  }

  return (
    <div className="flex flex-col gap-6">
      <p className="text-base text-mist">{t("{{count}} saved posts", { count: saved.length })}</p>
      {SECTIONS.map((sec) => {
        const items = saved.filter((s) => s.postType === sec.type);
        if (!items.length) return null;
        return (
          <section key={sec.type} className="flex flex-col gap-3">
            <h3 className="font-display text-xl font-semibold text-sand">
              {t(sec.label)} <span className="text-base font-normal text-mist">({items.length})</span>
            </h3>
            {items.map((item) => {
              const Icon =
                item.postType === "need" ? HandHeart : item.postType === "room" ? Newspaper : item.postType === "prayer" ? Sparkles : HeartHandshake;
              const open = openId === item.postId;
              return (
                <div key={`${item.postType}-${item.postId}`} className="flex flex-col gap-3 rounded-2xl bg-ink-soft/60 p-4 ring-1 ring-mist/35">
                  <button type="button" onClick={() => setOpenId(open ? null : item.postId)} className="flex items-start gap-3 text-left" aria-expanded={open}>
                    {item.photoUrl ? (
                      <img src={item.photoUrl} alt="" className="size-14 shrink-0 rounded-xl object-cover ring-1 ring-mist/25" />
                    ) : (
                      <span className="grid size-14 shrink-0 place-items-center rounded-xl bg-ink-soft text-sand ring-1 ring-mist/25">
                        <Icon className="size-6" aria-hidden="true" />
                      </span>
                    )}
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-xl font-semibold text-sand">{item.shortTitle}</p>
                      <p className="truncate text-base text-mist/70">{[item.city, item.zip].filter(Boolean).join(" ")}</p>
                    </div>
                  </button>
                  {open && <p className="whitespace-pre-line text-base leading-relaxed text-mist/85">{item.description}</p>}
                  <div className="flex flex-wrap gap-2">
                    {item.postType === "room" && item.roomSlug && (
                      <Link to="/rooms/$slug" params={{ slug: item.roomSlug }} className="inline-flex items-center rounded-full bg-ink px-4 py-2.5 text-base font-medium text-sand ring-1 ring-mist/30">
                        {t("Open room")}
                      </Link>
                    )}
                    <button type="button" onClick={() => void remove(item)} className="inline-flex items-center gap-1.5 rounded-full bg-ink px-4 py-2.5 text-base font-medium text-rose ring-1 ring-rose/30 transition hover:bg-rose/10">
                      <Heart className="size-4 fill-current" aria-hidden="true" />
                      {t("Remove")}
                    </button>
                  </div>
                </div>
              );
            })}
          </section>
        );
      })}
    </div>
  );
}
